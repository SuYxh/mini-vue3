# 更新 children（一）

## children 更新分类

- 老的： text =>  新的： array
  - 把老的 text 删除掉
  - 然后渲染新的节点
- 老的： array =>  新的： array
  - diff算法
- 老的： array =>  新的： text
  - 把老的 children 清空
  - 设置新的 text
- 老的： text =>  新的： text
  - 判断一下新的 text 和老的 text 是否相等，然后决定是否需要进行更新



在本小节中，我们将会实现 `children` 更新第一部分逻辑，即

- `text` => `array`
- `text` => `newText`
- `array` => `text`

而最后一部分的逻辑：

- `array` => `array` 由于涉及到 diff 算法，将会在后面篇章中重点讲解



##  `array` => `text`

### 案例

```js
// 老的是 array
// 新的是 text

import { ref, h } from "../../lib/x-mini-vue.esm.js";
const nextChildren = "newChildren";
const prevChildren = [h("div", {}, "A"), h("div", {}, "B")];

export default {
  name: "ArrayToText",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return {
      isChange,
    };
  },
  render() {
    const self = this;

    return self.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};

```





### 实现

如果要从 array => text，需要做两件事情：

- 清空原有 `array_children`
- 挂载文本 `text_children`



```ts
function patchChildren(n1, n2, container, parentComponent) {
    const prevShapeFlag = n1.shapeFlag;
    const { shapeFlag } = n2;

    // 新的节点是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的节点是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 把老的 children 清空
        unmountChildren(n1.children);
        // 设置新的 text
        hostSetElementText(container, c2);
      }
    }
  }


// 清空原有元素
function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
        // 遍历 children，同时执行 remove 逻辑
        // 由于这里涉及到元素渲染的实际操作，所以我们要抽离出去作为一个API
        hostRemove(children[i].el)
    }
}
```



#### runtime-dom

```ts
// runtime-dom/index
function remove(child) {
  // 获取到父节点，【parentNode 是 DOM API】
  const parentElement = child.parentNode
  if (parentElement) {
    // 父节点存在，就从父节点中删除这个子节点
    parentElement.remove(child)
  }
}
```

由于挂载 textChildren 也涉及到了视图渲染，所以需要

```ts
// runtime-dom/index
function setElementText(el, text) {
  el.textContent = text
}
```

现在我们就已经实现了 `text` => `array` 了。

##  `text` => `newText`

### 实现

```ts
function patchChildren(n1, n2, container, parentComponent) {
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    // 新的节点是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的节点是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 把老的 children 清空
        unmountChildren(n1.children);
      }

      // 老的节点是文本 【老的节点是数组是数组的时候也会走这里哦】
      if (c1 !== c2) {
        // 设置新的 text
        hostSetElementText(container, c2);
      }
    }
  }
```



至此，我们也已经实现了 `text` => `newText` 的逻辑

## `text` => `array`

```ts
// n1 是老 vnode
// n2 是新 vnode
function patchChildren(n1, n2, container, parentComponent) {
  const prevShapeFlag = n1.shapeFlag;
  const c1 = n1.children;
  const { shapeFlag } = n2;
  const c2 = n2.children;
  // 新的节点是文本
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 老的节点是数组
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 把老的 children 清空
      unmountChildren(n1.children);
    }

    // 老的节点是文本 【老的节点是数组是数组的时候也会走这里哦】
    if (c1 !== c2) {
      // 设置新的 text
      hostSetElementText(container, c2);
    }
  } else {
    // 老的： text =>  新的： array
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 把老的 text 删除掉
      hostSetElementText(container, "");
      // 然后渲染新的节点
      mountChildren(c2, container, parentComponent);
    }
  }
}
```

