# 实现组件的 slot 功能

## 使用 slot

我们先看看最简单的 h 函数中的 slot 是什么样子的

```ts
import { h } from "../../lib/x-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  render() {
    const app = h("div", {}, "App");
   	const foo = h(Foo, {}, h('p', {}, '123'));

    return h("div", {}, [app, foo]);
  },

  setup() {
    return {};
  },
};

```

```ts
import { h } from "../../lib/x-mini-vue.esm.js";

export const Foo = {
  
  render() {
    const foo = h("p", {}, "foo");
    // return h("div", {}, [foo]);
    return h("div", {}, [foo, this.$slots]);
    // return h("div", {}, [this.$slots]);
    // 直接这样写，以当前代码直接运行会有什么问题？ h函数第三个参数需要是一个数组
    // return h("div", {}, this.$slots);
  },
  setup() {
    return {};
  },
};

```

类似于模板中的这样

```html
<Foo>
  <div>123</div>
</Foo>
```

## 实现 slots

### 实现

通过对示例的研究，我们发现其实 slots 就是 component 的第三个参数

首先，我们在创建 `component` 实例的时候初始化一个 slots

```ts
export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    // 初始化 slots
    slots: {},
  }
  component.emit = emit.bind(null, component) as any
  return component
}
```

在 `setupComponent` 的时候进行处理 slots

```ts
export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  // 处理 slots
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}
```

```ts
// componentSlots.ts

export function initSlots(instance, children) {
  // 我们这里最粗暴的做法就是直接将 slots 挂载到 instance 上
  instance.slots = children
}
```

然后我们在拦截操作的时候加入对于 `$slots` 的处理

```ts
import { hasOwn } from '../shared/index'

const PublicProxyGetterMapping = {
  $el: i => i.vnode.el,
  // 加入对于 $slots 的处理
  $slots: i => i.slots,
}

// other code ...
```

现在我们就已经可以来实现挂载 slots 了。



### 优化

现在我们已经实现如何挂载 slots 了，但是如果我们传递多个 slots 呢？

模板中是这样

```ts
<Foo>
  <div>123</div>
  <div>456</div>
</Foo>
```

在 h 函数中是这样的：

```ts
render() {
    return h('div', {}, [
        // 可以传递一个数组
        h(Foo, {}, [h('div', {}, '123'), h('div', {}, '456')]),
    ])
}
```

我们再来看看接收 slots 的地方是怎么写的：

```ts
render() {
    const foo = h('p', {}, 'foo')  
    // foo： 是一个 vnode 由 h 函数创造的
    // this.$slots： 是一个数组，所以这里渲染会有问题
    // return h('p', {}, [foo, this.$slots])
  	// 修改如下
  	return h('p', {}, [foo, h('div', {}, this.$slots)])
},
```

我们可以将这里的渲染 slots 抽离出来，叫做 `renderSlots`

```ts
// runtime-core/helpers/renderSlots

import { createVNode } from "../vnode";

export function renderSlots(slots) {
  return createVNode('div', {}, slots)
}
```


上述的render 函数可以做如下修改：
```ts
return h('p', {}, [foo, renderSlots(this.$slots)])
```



现在我们已经满足了这种传递需求：

```js
 h(Foo, {}, [h('div', {}, '123'), h('div', {}, '456')]),
```

但是回顾：

```js
 h(Foo, {}, h('div', {}, '123')),
```

这种似乎会有些问题。所以需要在`initSlots` 的时候进行判断

```ts
export function initSlots(instance, slots) {
  // 进行类型判断
  slots = Array.isArray(slots) ? slots : [slots]
  instance.slots = slots
}
```



## 具名插槽

我们在给定 slots 时，还可以给定名字。

### 例子

我们来看看一个具名插槽的例子

在模板中是这样的：

```html
<Foo>
  <template v-slot:header></template>
  <template v-slot:bottom></template>
</Foo>
```

在 h 函数中是这样的

```ts
const foo = h(
    Foo,
    {},
    {
        header: h('div', {}, '123'),
        footer: h('div', {}, '456'),
    }
)
return h('div', {}, [app, foo])
```

我们在接收 slots 的时候是如何接收的呢？

`renderSlots` 用第二个参数指定 name

```ts
return h('p', {}, [
    renderSlots(this.$slots, 'header'),
    foo,
    renderSlots(this.$slots, 'footer'),
])
```

### 实现

首先，我们在挂载的时候就从数组变成了对象。但是在这里我们还是要进行两次判断，第一个判断如果传入的是简单的值，那么就视为这个是 `default`。如果传入的是对象，那么再具体判断

```ts
function initObjectSlots(instance, slots) {
  if(!slots) return
  // 单独传了一个 h
  if (slots.shapeFlag) {
    instance.slots.default = [slots]
    return
  }
  // 传了一个数组
  if (Array.isArray(slots)) {
    instance.slots.default = slots
    return
  }
  // 传了一个对象
  for (const slotName of Object.keys(slots)) {
    instance.slots[slotName] = normalizeSlots(slots[slotName])
  }
}

function normalizeSlots(slots) {
  return Array.isArray(slots) ? slots : [slots]
}
```

然后我们在渲染 `slots` 的时候，也要对多个类型进行判断

```ts
export function renderSlots(slots, name = 'default') {
  // 此时 slots 是一个 vnode
  const slot = slots[name]
  if (slot) {
    return createVNode('div', {}, slot)
  }
}
```



## 作用域插槽

### 例子

在 template 中，作用域插槽是这样的

注册方

```html
<slot :count="1"></slot>
```

使用方

```ts
<template #default="{count}">{{count}} 是 1</template>
```

在 h 函数中是这样的

注册方(`Foo.js`)

```ts
return h('p', {}, [
    // 第三个参数就是 props
    renderSlots(this.$slots, 'header', {
        count: 1,
    }),
    foo,
    renderSlots(this.$slots, 'footer'),
])
```

使用方(`App.js`)

```ts
const foo = h(
    Foo,
    {},
    {
      	// 获取到 foo 中定义的 count
        header: ({ count }) => h('div', {}, '123' + count),
        footer: () => h('div', {}, '456'),
    }
)
```

### 实现

首先，在注册的时候，第三个参数是 props，而我们的 slots 也变成了函数

```ts
import { createVNode } from "../vnode";

export function renderSlots(slots, name = 'default', props) {
  const slot = slots[name]

  if (slot) {
    if (typeof slot === "function") {
      // 说明用户使用的是具名插槽或者作用域插槽
      return createVNode("div", {}, slot(props));
    }else if (Array.isArray(slot)) {
      // 说明用户使用的是普通插槽
      return createVNode("div", {}, slot);
    }
  }
}

```

在初始化的时候

```ts
import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
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
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    console.log('处理插槽', children);

    // 如果 children 存在 shapeFlag 属性，说明他是一个 vnode，此时用户应该是这样使用插槽的：
    // h(Foo, {}, h('p', {}, '123'));
    if (children.shapeFlag) {
      instance.slots.default = [children]
      return
    }

    // 如果 children 是一个数组，此时用户应该是这样使用插槽的：
    // h(Foo, {}, [h('p', {}, '123'), h('p', {}, '234')]);
    // children 的形式为： [{"type":"p","props":{},"children":"123","shapeFlag":5,"el":null},{"type":"p","props":{},"children":"234","shapeFlag":5,"el":null}]
    if (Array.isArray(children)) {
      instance.slots.default = children
      return
    }

    // 到这里说明 children 是一个对象，用户应该是使用的 具名插槽或者是作用域插槽
    // 具体形式请看上方注释 《插槽的不同形式对应的 children 不同》
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key]
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

```



## 流程图

![插槽](https://qn.huat.xyz/mac/202401262000786.svg)



https://qn.huat.xyz/mac/202401262000786.svg

