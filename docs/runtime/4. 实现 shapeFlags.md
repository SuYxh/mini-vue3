# 实现 shapeFlags

## `shapeFlags` 是什么？

在 Vue 3 中，`shapeFlags` 是用于优化虚拟 DOM 的性能的一种机制。每个虚拟 DOM 节点（VNode）都有一个与之关联的 `shapeFlags` 属性，这个属性通过位运算的方式标记了该节点的类型和特性。通过这些标记，Vue 可以更快地确定如何处理和渲染不同类型的节点。

`shapeFlags` 的值是一个整数，表示了不同的类型和状态，例如是否是组件、是否有子节点、子节点的类型等。这些信息帮助 Vue 在渲染过程中做出更有效的决策。

下面是一些常见的 `shapeFlags` 类型：

1. **ELEMENT**：表示这是一个普通的 DOM 元素。
2. **FUNCTIONAL_COMPONENT**：表示这是一个函数式组件。
3. **STATEFUL_COMPONENT**：表示这是一个有状态的组件。
4. **TEXT_CHILDREN**：表示节点包含文本子节点。
5. **ARRAY_CHILDREN**：表示节点包含数组形式的子节点。
6. **SLOTS_CHILDREN**：表示节点包含插槽形式的子节点。
7. **TELEPORT**：表示这是一个 Teleport 组件（用于将子节点渲染到不同的 DOM 位置）。
8. **SUSPENSE**：表示这是一个 Suspense 组件（用于异步组件的加载状态处理）。
9. **COMPONENT_SHOULD_KEEP_ALIVE**、**COMPONENT_KEPT_ALIVE**：用于 `<keep-alive>` 组件相关的标记。

通过组合这些标记，Vue 可以快速了解节点的结构和类型，从而更高效地更新 DOM。这是 Vue 3 的虚拟 DOM 实现中一个重要的性能优化手段。



## 什么是静态标记？

静态标记（或静态标记优化）是 Vue 在编译模板时用来标识那些在多次渲染中不会改变的节点的技术。这意味着 Vue 可以在首次渲染时生成这些节点的 DOM，并在后续的渲染过程中直接重用，而无需再次进行虚拟 DOM 的比较或 DOM 更新，从而提高性能。

例如，在 Vue 2 中，静态节点会被标记为 `_static`，而在 Vue 3 中，这种优化进一步发展，不仅包括静态节点的处理，还包括静态提升（static hoisting）和补丁标志（patch flag）等更高级的优化手段。这些优化帮助 Vue 在更新 DOM 时减少不必要的操作，提高了渲染效率。



## 对比

- `shapeFlags` 主要用于识别节点类型和特性，从而优化虚拟 DOM 的处理过程
- 静态标记则是针对模板编译过程中不变节点的优化

两者都是 Vue 内部用于提高性能的不同机制。





## 基础实现

### 分类

在之前的代码里，我们在 `render.ts` 中对于 vnode 的类型进行判断可以分为以下 4 种：

- element：`vnode.type === string`
- stateful_component：`isObject(vnode.type)`
- text_children：`vnode.type === string`
- array_children：`Array.isArray(children)`

相关代码如下：

```ts
export function patch(vnode, container) {
  if (typeof vnode.type === 'string') {
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container)
  }
}

function mountElement(vnode, container) {
  // ...
  if (typeof children === 'string') {
    domEl.textContent = children
  } else if (Array.isArray(children)) {
    mountChildren(vnode, domEl)
  }
}
```

### 实现

```ts
const ShapeFlags = {
  element: 0,
  stateful_component: 0,
  text_children: 0,
  array_children: 0,
}
```

```ts
// 修改判断
function mountElement(vnode, container) {
  // ...
  if (vnode.shapeFlags.text_children === ShapeFlags.text_children) {
    domEl.textContent = children
  } else if (vnode.shapeFlags.array_children === ShapeFlags.array_children) {
    mountChildren(vnode, domEl)
  }
}

// 更新
vnode.shapeFlags.text_children = 1
```



## 性能优化

### 原因

这里使用位运算来进行优化！位运算之所以在性能上通常优于算术运算，主要是因为以下几个原因：

- **硬件层面的直接支持**：位运算是在数字的二进制表示上直接进行的，而这正是计算机内部处理数据的方式。这种操作可以直接由CPU的硬件电路高效执行，无需复杂的算术运算逻辑。

- **复杂度较低**：位运算（如AND、OR、XOR、NOT、位移等）的复杂度非常低，通常只需要一到几个CPU周期即可完成。而算术运算（如加、减、乘、除）则相对复杂，尤其是乘法和除法，需要更多的CPU周期来执行。

- **不涉及任何类型转换**：位运算通常在整数类型上进行，不需要像某些算术运算那样涉及类型转换（例如，浮点数与整数之间的转换），从而避免了额外的计算开销。

- **优化简便**：在某些情况下，位运算可以用来替代更复杂的算术运算，如使用左移运算(`<<`)代替乘以2的运算，使用右移运算(`>>`)代替除以2的运算。这些替代通常更快，因为它们只改变数字的位表示，而不涉及实际的算术计算。

- **编译器优化**：许多现代编译器能够识别可以用位运算优化的算术运算，并在编译时自动进行替换，以提高程序的执行效率。



### 知识回顾

#### &

&：按位与，用于对两个二进制操作数逐位进行比较，并根据下表所示的换算表返回结果。

| 第一个数的值 | 第二个数的值 | 运算结果 |
| ------------ | ------------ | -------- |
| 1            | 1            | 1        |
| 1            | 0            | 0        |
| 0            | 1            | 0        |
| 0            | 0            | 0        |

以 0 作为 false，以 1 作为 true，简单理解就是：两位都是 true 才是 true，反之所有的都是 false

```ts
console.log(12 & 5);  //返回值4
```

下图以算式的形式解析了 12 和 5 进行位与运算的过程。通过位与运算，只有第 3 位的值为全为 true，故返回 true，其他位均返回 false。

![按位与](https://qn.huat.xyz/mac/202401252248205.gif)

#### |

|：按位或，用于对两个二进制操作数逐位进行比较，并根据如表格所示的换算表返回结果。

| 第一个数的值 | 第二个数的值 | 运算结果 |
| ------------ | ------------ | -------- |
| 1            | 1            | 1        |
| 1            | 0            | 1        |
| 0            | 1            | 1        |
| 0            | 0            | 0        |

以 0 作为 false，以 1 作为 true，简单理解就是：两位都是 false 才是 false，反之所有的都是 true

```ts
console.log(12 | 5);  //返回值13
```

下图以算式的形式解析了 12 和 5 进行位或运算的过程。通过位或运算，除第 2 位的值为 false 外，其他位均返回 true。

![按位或](https://qn.huat.xyz/mac/202401252249216.gif)

### 左移操作符

**左移操作符 (`<<`)** 是将一个操作数按指定移动的位数向左移动，相当于将数字乘以2 

```ts
// 左移一位（乘以2）
const num = 4
let leftShifted = number << 1;
console.log("左移一位:", leftShifted); // 8
```



### 右移操作符

**右移操作符 (`>>`)** 是将一个操作数按指定移动的位数向右移动，相当于将数字除以2。

```ts
// 右移一位（除以2）
const num = 4
let rightShifted = number >> 1;
console.log("右移一位:", rightShifted); // 2
```





## 优化版实现

### 创建ShapeFlags

shared 中创建一个文件 `ShapeFlags`，通过对于按位与、按位或和左移操作符的理解，可以将一个 shapeFlag 修改为下面这样：

```ts
export const enum ShapeFlags {
  ELEMENT = 1, // 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2, // 0100
  ARRAY_CHILDREN = 1 << 3, // 1000
}

```



### 调整createVNode方法

```ts
import { ShapeFlags } from '../shared/ShapeFlags'

export function createVNode(type, props?, children?) {
  // 这里先直接返回一个 VNode 结构
  const vnode = {
    type,
    props,
    children,
    el: null,
    shapeFlags: getShapeFlags(type),
  }
  // 还要对于 children 进行处理
  if (typeof children === 'string') {
    vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN
  }
  return vnode
}

function getShapeFlags(type) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
```

代码解析：

####  当 `children` 是字符串

假设 `vnode.shapeFlags` 的初始值是 `ELEMENT`（`0001`）。如果 `children` 是字符串类型，我们希望添加 `TEXT_CHILDREN` 标志（`0100`）。

```js
// 初始值
vnode.shapeFlags = ShapeFlags.ELEMENT; // 0001

// 添加 TEXT_CHILDREN 标志
vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN; // 0001 | 0100
```

这里的操作是：

```tex
  0001 (ELEMENT)
| 0100 (TEXT_CHILDREN)
  ----
  0101 (结果)
```

所以，`vnode.shapeFlags` 现在是 `0101`，表示节点是一个元素且其子节点是文本。

> 为什么可以说 `0101`，表示节点是一个元素且其子节点是文本？
>
> 在 `ShapeFlags` 枚举中，每个标志占据一个位：
>
> - `ELEMENT` = `0001`
> - `STATEFUL_COMPONENT` = `0010`
> - `TEXT_CHILDREN` = `0100`
> - `ARRAY_CHILDREN` = `1000`
>
> 每个标志只有一个位是1，其他位都是0。
>
> 组合标志： 当我们通过“或”运算组合两个或更多标志时，每个标志中的1都会保留在最终结果中。例如：
>
> - 假设我们有 `ELEMENT` (`0001`) 和希望添加 `TEXT_CHILDREN` (`0100`)。
> - 通过“或”运算（`|`）将这两个值组合起来：`0001 | 0100`。
> - 结果是 `0101`。
>
> 这个结果 `0101` 的含义是：
>
> - 第一位（最右边的位）为1，表示 `ELEMENT`。
> - 第三位为1，表示 `TEXT_CHILDREN`。
> - 其他位为0，表示 `STATEFUL_COMPONENT` 和 `ARRAY_CHILDREN` 不适用。



#### 当 `children` 是数组

同样地，如果 `children` 是数组类型，我们希望添加 `ARRAY_CHILDREN` 标志（`1000`）。

```js
// 初始值
vnode.shapeFlags = ShapeFlags.ELEMENT; // 0001

// 添加 ARRAY_CHILDREN 标志
vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN; // 0001 | 1000
```

这里的操作是：

```
  0001 (ELEMENT)
| 1000 (ARRAY_CHILDREN)
  ----
  1001 (结果)
```

所以，`vnode.shapeFlags` 现在是 `1001`，表示节点是一个元素且其子节点是一个数组。





### 更新判断条件

```ts
// render.ts
export function patch(vnode, container) {
  const { shapeFlags } = vnode
  if (shapeFlags & ShapeFlags.ELEMENT) {
    // 如果这里的条件成立，说明 shapeFlag 包含 ELEMENT 标志
    processElement(vnode, container)
  } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container)
  }
}


function mountElement(vnode, container) {
  const el = document.createElement(vnode.type);
  vnode.el = el

  const { children, shapeFlag } = vnode;

  // children
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }

  // props
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }

  container.append(el);
}
```

#### 代码解释

检查 `vnode` 是否是 DOM 元素（`shapeFlags & ShapeFlags.ELEMENT`）:

假设我们有一个 `vnode`，它代表了一个有文本子节点的DOM元素。这意味着它的 `shapeFlag` 应该同时包含 `ELEMENT` 和 `TEXT_CHILDREN` 标志。

```js
let vnode = {
    // 其他 vnode 属性...
    shapeFlags: ShapeFlags.ELEMENT | ShapeFlags.TEXT_CHILDREN // 0001 | 0100 = 0101
};
```

```js
//  // 如果这里的条件成立，说明 shapeFlag 包含 ELEMENT 标志
if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container); // 处理元素节点
} 
```



#### 运算过程

在 `patch` 函数中的 `if` 语句里：

- `shapeFlag` 的值是 `0101`（`ELEMENT` | `TEXT_CHILDREN`）。
- `ShapeFlags.ELEMENT` 的值是 `0001`。
- 进行与运算：`0101 & 0001` 结果为 `0001`，它是非零值，表示 `vnode` 确实是一个DOM元素。

再看一下我们定义的：

```js
export const enum ShapeFlags {
  ELEMENT = 1, // 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2, // 0100
  ARRAY_CHILDREN = 1 << 3, // 1000
}
```

因此，`processElement` 函数将被调用来处理这个DOM元素。



## 总结

位运算虽好，但是对可读性造成了一定的影响，所以要选择平衡！
