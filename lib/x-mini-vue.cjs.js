'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // 条件： 组件 + children 是一个对象
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name = 'default', props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            // 说明用户使用的是具名插槽或者作用域插槽
            return createVNode(Fragment, {}, slot(props));
        }
        else if (Array.isArray(slot)) {
            // 说明用户使用的是普通插槽
            return createVNode(Fragment, {}, slot);
        }
    }
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (value) => {
    return value !== null && typeof value === "object";
};
const hasChanged = (val, newValue) => {
    return !Object.is(val, newValue);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 调用 stop 后 this.active 变为了 false， shouldTrack 为 false，在 track 方法就不会在收集到依赖
        if (!this.active) {
            return this._fn();
        }
        // 应该收集
        shouldTrack = true;
        // 保存一下当前的 activeEffect
        activeEffect = this;
        const r = this._fn();
        // 重置
        shouldTrack = false;
        return r;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
// targetMap 为什么要是全局的？
// 如果 targetMap 不是全局的，只是在 track 方法中定义，那么在 trigger 中就无法获取到 targetMap
const targetMap = new Map();
function track(target, key) {
    // 如果没有这句话就会报错，为什么会有这句话呢？ activeEffect 什么时候不存在？
    // 当只有用户写了 effect 函数的时候，才会有
    // if (!activeEffect) return;
    // if (!shouldTrack) return
    // 将上面2 行代码进行优化
    if (!isTracking())
        return;
    // 我们在运行时，可能会创建多个 target，每个 target 还会可能有多个 key，每个 key 又关联着多个 effectFn
    // 而且 target -> key -> effectFn，这三者是树形的关系
    // 因此就可以创建一个 Map 用于保存 target，取出来就是每个 key 对应这一个 depsMap，而每个 depsMap 又是一个 Set
    // 使用 set 结构（避免保存重复的 effect）
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
// 抽离函数
function trackEffects(dep) {
    // 看看 dep 之前有没有添加过，添加过的话 那么就不添加了
    if (dep.has(activeEffect))
        return;
    activeEffect.deps.push(dep);
    dep.add(activeEffect);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    // trigger 的逻辑就更加简单了，我们只需要取出depsMap中 key 对应的 dep， 这个 dep 是 一个 set 结构，再遍历 set 执行每个 effect 就可以了
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(deps) {
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

// 
const get = createGetter();
const readonlyGet = createGetter(true);
const set = createSetter();
const shallowReadonlyGet = createGetter(true, true);
const shallowMutableGet = createGetter(false, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        else if (key === "__v_raw" /* RAW */) {
            // 判断一下，如果访问的 key 是 ReactiveFlag.RAW，就直接返回就可以了
            return target;
        }
        const res = Reflect.get(target, key, receiver);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // readonly 的对象不会被 track
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, val, receiver) {
        const res = Reflect.set(target, key, val, receiver);
        trigger(target, key);
        return res;
    };
}
// mutable 可变的
const mutableHandlers = {
    // 这里不需要每次都调用 createGetter 这个方法，所以缓存一下，初始化的时候调用一次就好
    // get: createGetter(),
    // set: createSetter(),
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    // readonly 的属性值不可更改，set 中直接返回 true 即可
    set(target, key, value) {
        // 在这里警告
        console.warn(`key: ${key} set value: ${value} fail, because the target is readonly`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});
extend({}, mutableHandlers, {
    get: shallowMutableGet,
});

function createReactiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
// 1、readonly 的对象不会被 track，
// 2、readonly 的属性值不可更改，set 中直接返回 true 即可
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initSlots(instance, children) {
    // 插槽的不同形式对应的 children 不同，如下：
    // 1、h(Foo, {}, h('p', {}, '123')); ==> children:  {"type":"p","props":{},"children":"123","shapeFlag":5,"el":null}
    // 2、h(Foo, {}, [h('p', {}, '123'), h('p', {}, '234')]); ==> children: [{"type":"p","props":{},"children":"123","shapeFlag":5,"el":null},{"type":"p","props":{},"children":"234","shapeFlag":5,"el":null}]
    // 3、 const foo = h(Foo, {}, { header: ({age}) => h('p', {}, 'header' + age), footer: () => h('p', {}, 'footer'), }); 其 children 形式如下：
    //    children: ==>
    //      {
    //        footer :  () => h('p', {}, 'footer')
    //        header :  ({age}) => h('p', {}, 'header' + age)
    //      } 
    const { vnode } = instance;
    // 是插槽的时候才需要处理
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        // 如果 children 存在 shapeFlag 属性，说明他是一个 vnode，此时用户应该是这样使用插槽的：
        // h(Foo, {}, h('p', {}, '123'));
        if (children.shapeFlag) {
            instance.slots.default = [children];
            return;
        }
        // 如果 children 是一个数组，此时用户应该是这样使用插槽的：
        // h(Foo, {}, [h('p', {}, '123'), h('p', {}, '234')]);
        // children 的形式为： [{"type":"p","props":{},"children":"123","shapeFlag":5,"el":null},{"type":"p","props":{},"children":"234","shapeFlag":5,"el":null}]
        if (Array.isArray(children)) {
            instance.slots.default = children;
            return;
        }
        // 到这里说明 children 是一个对象，用户应该是使用的 具名插槽或者是作用域插槽
        // 具体形式请看上方注释 《插槽的不同形式对应的 children 不同》
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // 具名插槽
        /**
         * 具名插槽 对应的使用方式
         * const foo = h(Foo, {}, {
            header:  h('p', {}, 'header'),
            footer:  h('p', {}, 'footer'),
          });
    
          其实 normalizeSlotValue(value); 中的 value 就是 h('p', {}, 'header')
         */
        // slots[key] = normalizeSlotValue(value);
        // 作用域插槽使用函数
        /**
        * 作用域插槽对应的使用方式
        * const foo = h(Foo, {}, {
           header: ({age}) => h('p', {}, 'header' + age),
           footer: () => h('p', {}, 'footer'),
         });
   
         其实 slots[key] = (props) => normalizeSlotValue(value(props)); 中的 value(props) 就是 header 或者 footer 对应的函数
        */
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 在这里对于 instance 的 this 进行拦截
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    // n1 - 之前的虚拟节点，如果不存在说明是初始化流程
    // n2 - 新的虚拟节点
    function patch(n1, n2, container, parentComponent, anchor) {
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // n1 不存在说明是初始化
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 这里需要传递 el，我们需要考虑一点，到这一层的时候
        // n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
        // 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    // n1 是老 vnode
    // n2 是新 vnode
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        // 新的节点是文本
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            // 老的节点是数组
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 把老的 children 清空
                unmountChildren(n1.children);
            }
            // 老的节点是文本 【老的节点是数组是数组的时候也会走这里哦】
            if (c1 !== c2) {
                // 设置新的 text
                hostSetElementText(container, c2);
            }
        }
        else {
            // 老的： text =>  新的： array
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 把老的 text 删除掉
                hostSetElementText(container, "");
                // 然后渲染新的节点
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        // 声明三个指针，e1 是老节点最后一个元素，e2 是新节点最后一个元素，i 是当前对比的元素
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧 -- 新旧节点头部对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            // 如果当前对比的 vnode 相同，就进入 patch 阶段，如果不相等，直接中断掉这个循环
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧 -- 新旧节点尾部对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的多，需要进行创建
        // 新节点比旧节点长，在尾部添加新节点 
        // 新节点比旧节点长，在头部插入新节点，此时循环判断条件一样，所以需要一个标识是在尾部添加还是在头部插入，同时还需要修改 runtime-dom 中的 insert 方法
        if (i > e1) {
            if (i <= e2) {
                // nextPos 就是需要追加元素的索引
                // 如果这个新元素的索引已经超过了新节点的长度，那么说明是追加到尾部
                // anchor = null，如果没有超过新节点的长度，那么就是插入到某个位置
                // 此时 anchor = c2[nextPos].el，也就是这个新加元素的下一个元素
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                // console.log('nextPos', nextPos);
                // console.log('c2', c2);
                // console.log('c2[nextPos]', c2[nextPos]);
                // console.log('c2[nextPos].el', c2[nextPos].el);
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        console.log('i', i, e1, e2);
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // foo 之前的值和现在的值不一样了 --> 修改
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                // 之前存在的属性在新的里面没有了 --> 删除
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, shapeFlag } = vnode;
        // children
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        effect(() => {
            if (!instance.isMounted) {
                console.log("init");
                const { proxy } = instance;
                // 将虚拟节点放在实例上，在更新的时候会拿出来对比
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el;
                // 更新之后打一个标识
                instance.isMounted = true;
            }
            else {
                console.log("update");
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                // 从实例上取出之前放置的虚拟节点 subTree，也就是在初始化时进行的赋值
                const prevSubTree = instance.subTree;
                // 更新组件实例上的 subTree
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        // null undefined --> 删除
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
// 将 parent.append 修改为 insertBefore，这样就可以传入一个锚点
// 将会在这个锚点之前插入元素
// 如果这个锚点是 null，那么将会和 append 的行为一样
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 保存一下 value，在 set 中用于对比
        this._rawValue = value;
        // 如果 value 是一个对象，调用 reactive 进行转换
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 在 get 中进行依赖收集
        // if (isTracking()) {
        //   trackEffects(this.dep);
        // }
        // 提取函数
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 判断下 newValue 和 this._value 是否相等
        // 如果 value 是一个 对象，那么 this._value 是经过 reactive 处理过的，会是一个 proxy 的对象，所以这里需要处理一下
        // 在 constructor 中 我们直接将值保存在 this._rawValue， 对比的时候对比这个值就行
        if (hasChanged(newValue, this._rawValue)) {
            // 一定先去修改了 value 
            this._rawValue = newValue;
            this._value = convert(newValue);
            // 在 set 中进行触发依赖
            triggerEffects(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // set 分为两种情况：
            // 如果原来的值是 ref，并且新的值不是 ref，那么就去更新原来的 ref.value = newValue
            // 第二种情况就是原来的值是 ref，newValue 也是一个 ref，那么就直接替换就 OK 了
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.ref = ref;
exports.renderSlots = renderSlots;
//# sourceMappingURL=x-mini-vue.cjs.js.map
