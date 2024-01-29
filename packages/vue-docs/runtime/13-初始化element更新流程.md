# 初始化 element 更新流程

## 核心



将两个vnode进行对比，找出变更的位置然后进行更新。本质上是对 2 个对象进行比较。



<img src="https://qn.huat.xyz/mac/202401272051749.png" alt="image-20240127205104702" style="zoom:50%;" />







## 案例

`App.js`

```ts
import { h, ref } from "../../lib/x-mini-vue.esm.js";

export const App = {
  name: "App",

  setup() {
    const count = ref(0);

    const onClick = () => {
      count.value++;
    };

    return {
      count,
      onClick,
    };
  },
  render() {
    return h(
      "div",
      {
        id: "root",
      },
      [
        h("div", {}, "count:" + this.count), // 依赖收集
        h(
          "button",
          {
            onClick: this.onClick,
          },
          "click"
        ),
      ]
    );
  },
};

```



`main.js`

```js
import { createApp } from "../../lib/x-mini-vue.esm.js";
import { App } from "./App.js";

const rootContainer = document.querySelector("#app");
createApp(App).mount(rootContainer);
```



`index.html`

```js
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="main.js" type="module"></script>
  </body>
</html>
```

期望我们点击按钮的时候，页面上的 count 可以更新。

也就是在 render 的时候会取值然后进行依赖收集，当依赖变更的时候进行派发更新，重新调用 render 函数进行更新。



先运行一下，看看

![image-20240127204411769](https://qn.huat.xyz/mac/202401272044845.png)

从页面上看，好像是渲染了一个 `object`，因为`count` 是用 `ref` 定义的，而 `ref`就是一个对象。解决这个问题也很简单，我们之前写到了一个方法 `proxyRefs` 方法的就可以解决这个问题，先回顾一下这个方法的实现：

```js
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },

    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
```

那么在哪里使用呢？

`this.count`在哪里取值呢？是在`setup`函数的返回值上进行取值，那么我们就在处理`setup`函数返回值的地方进行使用：

```js
function handleSetupResult(instance, setupResult: any) {
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}
```

再次运行:

![image-20240127204930200](https://qn.huat.xyz/mac/202401272049251.png)

就可以正常渲染了



## render 函数

render 函数是在哪里调用的呢？在 `setupRenderEffect` 方法中。

当数据变了，自动执行 redner 函数，这个怎么做到呢？ 直接把当前逻辑放入 effect 函数中不就好了么。

```js
function setupRenderEffect(instance: any, initialVNode, container) {
	effect(() => {
    const { proxy } = instance;
  	const subTree = instance.render.call(proxy);
  	patch(subTree, container, instance);
  	initialVNode.el = subTree.el;
  })
}
```

当我们去运行的时候，发现页面并不会变化，这是怎么回事呢？进行一个简单的分析：

页面没有变化，可能是依赖没有收集到，或者是更新的时候相关函数没有执行。经过相关的调试，发现依赖收集到了，但是触发更新的时候，`triggerEffects`函数也被调用了，函数中的`deps` 也是有值的，但是`for of`循环没有走进去。后来发现是一个编译问题，修改了 `tsconfig.ts `中`target`对应的值为： `es2016` 就好了。

修改后再次运行，并且点击按钮，我们可以看到会有多个，这是怎么回事呢？

因为我们每次都会走 `patch`，然后会进行初始化流程，会进行插入操作，所以会有多个，接下来我们就要进行区分初始化和更新。

![image-20240127210340950](https://qn.huat.xyz/mac/202401272103995.png)

## 区分初始化和更新

在之前我们提到了更新操作需要将两个vnode进行对比，找出变更的位置然后进行更新。

如何找到之前的vnode呢？初始化流程，之前的vnode肯定是空的，更新流程应该是有值，从这里我们也可以进行区分。

### 获取之前的vnode

在 `createComponentInstance` 方法中给组件实例增加 2 个属性：`subTree` 和 `isMounted`

```js
export function createComponentInstance(vnode, parent) {
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
    emit: () => {},
  };

  component.emit = emit.bind(null, component) as any;

  return component;
}
```

然后修改 `setupRenderEffect` 方法

```js
function setupRenderEffect(instance: any, initialVNode, container) {
    effect(() => {
     	if (!instance.isMounted) {
        console.log("init");
        const { proxy } = instance;
        // 将虚拟节点放在实例上，在更新的时候会拿出来对比
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance);
        initialVNode.el = subTree.el;
				// 更新之后打一个标识
        instance.isMounted = true;
      } else {
        console.log("update");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        // 从实例上取出之前放置的虚拟节点 subTree，也就是在初始化时进行的赋值
        const prevSubTree = instance.subTree;
        // 更新组件实例上的 subTree
        instance.subTree = subTree;
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }
```



### 更新 patch

在 `setupRenderEffect` 方法中，我们对 `patch`方法增加了一个，使其可以支持更新流程，所以我们要对其进行改动，如下：

```js
// n1 - 之前的虚拟节点，如果不存在说明是初始化流程
// n2 - 新的虚拟节点
function patch(n1, n2, container, parentComponent) {
  const { type, shapeFlag } = n2;

  switch (type) {
    case Fragment:
      processFragment(n1, n2, container, parentComponent);
      break;
    case Text:
      processText(n1, n2, container);
      break;

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(n1, n2, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(n1, n2, container, parentComponent);
      }
      break;
  }
}
```

修改后我们发现编辑器中会看到很多错误，都是函数参数传递不一致的问题，所以涉及到的我们都要进行调整。



### 增加对元素的更新判断

将 `processElemen`t 进行调整：

```js
function processElement(n1, n2: any, container: any, parentComponent) {
  // n1 不存在说明是初始化
  if (!n1) {
    mountElement(n2, container, parentComponent);
  } else {
    patchElement(n1, n2, container);
  }
}
```

新增 `patchElement` 方法：

```js
function patchElement(n1, n2, container) {
  console.log("patchElement");
  console.log("n1", n1);
  console.log("n2", n2);
}
```



## 总结

我们发现更新逻辑的核心就在于，将渲染视图部分放入 `effect` 中，因为数据是响应式的数据（例如 `ref`、`reactive`），那么当这个响应式数据更新的时候，就会重新触发视图渲染，然后进行更新。

在更新的时候，用我们保存之前的 `subTree`，与现在的 `subTree` 进行对比，从而实现新旧对比。
