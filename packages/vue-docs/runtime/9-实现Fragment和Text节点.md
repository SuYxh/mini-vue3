# 实现 Fragment 节点和 Text 节点

## Fragment 节点

### 渲染展示

之前我们实现了 slots，我们再向 slots 添加内容的时候，发现如果添加的内容超过了 1 个，最终要通过一个 `div` 包裹这两个元素的，导致了渲染的结果多了很多冗余的 `div`，接下来就来解决这个问题

![image-20240126223941983](https://qn.huat.xyz/mac/202401262239013.png)



### 原因分析

因为我们在 `renderSlots` 中，定义了一个 `div` 

```ts
export function renderSlots(slots, name, props) {
  const slot = slots[name];

  if (slot) {
    if (typeof slot === "function") {
      return createVNode("div", {}, slot(props));
    }
  }
}
```

### 实现

1、定义一个唯一标识

```ts
export function renderSlots(slots, name, props) {
  const slot = slots[name];

  if (slot) {
    if (typeof slot === "function") {
      return createVNode("Fragment", {}, slot(props));
    }
  }
}
```

2、在 patch 的时候进行判断

```js
// render.ts

export function patch(vnode, container) {
  const { type, shapeFlags } = vnode
  switch (type) {
    // 如果是 Fragement
    case 'Fragment':
      // 走 processFragment 的逻辑
      processFragment(vnode, container)
      break
    default:
      if (shapeFlags & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
      } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
      }
      break
  }
}


function processFragment(vnode, container) {
  // 因为 fragment 就是用来处理 children 的
  mountChildren(vnode, container)
}
```

### 优化

在 `vnode.ts` 中使用 `Symbol` 进行定义

```js
// vnode.ts
export const Fragment = Symbol('Fragment')
```

然后将刚刚用到的地方替换掉就好！

## Text 节点

我们的 slots 目前也不支持直接渲染一个 TextContent 节点

### 案例

```ts
const foo = h(
    Foo,
    {},
    {
        header: ({ count }) => h('div', {}, '123' + count),
        // 渲染一个节点是无法进行渲染的
        footer: () => 'hello TextNode',
    }
)
```

所以我们需要新增一个 API，用户创建纯 TextNode

```ts
footer: () => createTextVNode('hello TextNode'),
```

### 实现

我们在 VNode 中来实现这个 API

```ts
// vnode.ts

export const TextNode = Symbol('TextNode')

export function createTextVNode(text) {
  return createVNode(TextNode, {}, text)
}
```

在 render 中也要修改为对应的逻辑

```ts
export function patch(vnode, container) {
  const { type, shapeFlags } = vnode
  switch (type) {
    case Fragment:
      processFragment(vnode, container)
      break
    // 新增这个判断
    case TextNode:
      processTextNode(vnode, container)
      break
    default:
      if (shapeFlags & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
      } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
      }
      break
  }
}
```

```ts
function processTextNode(vnode, container) {
  // TextNode 本身就是纯 text
  const element = (vnode.el = document.createTextNode(vnode.children))
  container.appendChild(element)
}
```

