# 实现 customRenderer

## 简介

`customRenderer`，也被称为自定义渲染器（Custom Renderer）。这个功能主要用于在Vue的响应式系统之上创建自定义的渲染逻辑，允许开发者使用Vue的响应式系统来驱动不同的平台或渲染目标，而不仅限于标准的DOM（文档对象模型）。在某些场景下，你可能希望将Vue的响应式能力应用于非DOM的目标。例如，Canvas、Three.js、Native Mobile界面，甚至是VR界面等。`customRenderer`正是为了这种需求而设计的，它允许你定义如何将Vue组件转换为任何特定平台或技术的输出。





## 当前渲染的缺点

如果想要实现`customRenderer`，渲染部分我们肯定是需要重构，因为目前的代码是写死了DOM。比如我们使用 API： `document.createElement();` ，如果想要在 Canvas 中进行渲染，目前是做不到的，所以，我们要对渲染逻辑进行抽象。

回到到 `render.ts`

```ts
function mountElement(vnode, container, parentInstance) {
  const { type: domElType, props, children, shapeFlags } = vnode
  // document.createElement(type) 强依赖 DOM API
  const domEl = (vnode.el = document.createElement(domElType))
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  for (const prop in props) {
    if (isOn(prop)) {
      const event = prop.slice(2).toLowerCase()
      // addEventListener，setAttribute 强依赖 DOM API
      domEl.addEventListener(event, props[prop])
    } else {
      domEl.setAttribute(prop, props[prop])
    }
  }
  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    domEl.textContent = children
  } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, domEl, parentInstance)
  }
  // appendChild 强依赖 DOM API
  container.appendChild(domEl)
}
```

通过对代码的观察，发现需要抽离出三个 API，通过函数参数的形式传入：

- `createElement`：用于创建元素
- `patchProp`：用于给元素添加属性
- `insert`：将于给父元素添加子元素



## 实现 customRenderer

### 抽离强绑定 API

```ts
// 默认给定面向 DOM 平台的渲染接口
// 写在 runtime-dom/index.ts 中
export function createElement(type) {
  return document.createElement(type)
}

const isOn = (key: string) => /^on[A-Z]/.test(key)

export function patchProp(el, prop, props) {
  if (isOn(prop)) {
    const event = prop.slice(2).toLowerCase()
    el.addEventListener(event, props[prop])
  } else {
    el.setAttribute(prop, props[prop])
  }
}

export function insert(el, parent) {
  parent.appendChild(el)
}

export function selector(container) {
  return document.querySelector(container)
}
```

```ts
function mountElement(vnode, container, parentInstance) {
  const { type: domElType, props, children, shapeFlags } = vnode
  // 将强绑定 API 抽离
  const domEl = (vnode.el = createElement(domElType))
  for (const prop in props) {
    patchProp(domEl, prop, props)
  }
  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    domEl.textContent = children
  } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, domEl, parentInstance)
  }
  insert(domEl, container)
}
```

### 继续抽象逻辑

可以整个 `render.ts` 的逻辑包裹在 `createRenderer` 函数中。在 `render.ts` 中使用到的 `createElement` 等等通过 `createRenderer` 的参数传递过来

```ts
// render.ts

export function createRenderer(options) {
  // 改名字是为了 debug 方便
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    patchProp: hostPatchProp,
    selector: hostSelector,
  } = options
  // other code ...
}
```

将 `createApp` 也包裹在 `createAppAPI` 中。

```ts
// 这里接收 renderer
export function createAppAPI(renderer, selector) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        const vnode = createVNode(rootComponent)
        // 如果传过来了 selector，我们就用 selector 方法来获取 rootContainer
        // 如果没有传 selector，就直接用 rootContainer
        renderer(vnode, selector ? selector(rootContainer) : rootContainer)
      },
    }
  }
}
```

在 `render.ts` 中的 `createRenderer` 返回一个

```ts
return {
    createApp: createAppAPI(render, selector),
}
```

然后在我们创建的 `runtime-dom/index` 中

```ts
// 首先根据我们的实现的 DOM API 传入 createRenderer 中
// 创建出一个渲染器
const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  selector,
})

// 然后暴露出 createApp
export const createApp = (...args) => {
  return renderer.createApp(...args)
}
```

所以现在我们的 `crateApp` 逻辑就抽离出来了。

在这一个阶段呢，我们主要是做了以下这几件事情：

- 将之前实现的 `createApp` 包裹一层为 `createAppAPI`，通过传递过来的 renderer，返回 `createApp`

- 创建函数 `createRenderer`，接收自定义渲染器接口，并调用 `createAppAPI` 返回 `createApp`
- 在 `runtime-dom/index` 中写 DOM 环境下的元素 API，并调用 `createRenderer`，传递写好的 API，获取到 `createApp`。

所以呢：

- 默认情况下，Vue 提供的 `createApp` 就是在 DOM 平台下的
- 我们也可以通过调用 `createRenderer` 来传入自己实现的元素 API
- 获取特定的 `createApp`

我们的层级就从原来的：

- mini-vue 入口  ---->  `runtime-core`
- mini-vue 入口  ---->  `runtime-dom`  ---->  `runtime-core`

最后，我们再来试试之前写的案例能不能跑通吧！



## 在canvas进行渲染

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>customRenderer</title>
    <!-- <script src="https://pixijs.download/release/pixi.js"></script> -->
    <script src="https://cdn.bootcdn.net/ajax/libs/pixi.js/7.2.4/pixi.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="main.js" type="module"></script>
  </body>
</html>

```





```js
// App.js
import { h } from "../../lib/x-mini-vue.esm.js";

export const App = {
  setup() {
    return {
      x: 100,
      y: 100,
    };
  },
  render() {
    return h("rect", { x: this.x, y: this.y });
  },
};

```



```js
// main.js

import { createRenderer } from "../../lib/x-mini-vue.esm.js";
import { App } from "./App.js";

const game = new PIXI.Application({
  width: 500,
  height: 500,
});

document.body.append(game.view);

const renderer = createRenderer({
  createElement(type) {
    if (type === "rect") {
      const rect = new PIXI.Graphics();
      rect.beginFill(0xff0000);
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();

      return rect;
    }
  },
  patchProp(el, key, val) {
    el[key] = val;
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});

renderer.createApp(App).mount(game.stage);
```



渲染结果

![image-20240127160855239](https://qn.huat.xyz/mac/202401271608285.png)

