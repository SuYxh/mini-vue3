# 实现组件的 emit 功能

## 使用emit

```ts
export const Foo = {
  setup(props, { emit }) {
    // setup 第二个参数是 ctx，里面有一个参数是 emit
    const handleClick = () => {
      // emit 是一个函数，第一个参数是触发的事件
      emit('add')
    }
    return {
      handleClick,
    }
  },
  render() {
    return h(
      'button',
      {
        onClick: this.handleClick,
      },
      '点击我'
    )
  },
}
```

```ts
export default {
  render() {
    // 这里在写组件的时候，第二个参数就可以传入 on + emit's Event
    return h('div', {}, [h('p', {}, 'hello'), h(Foo, { onAdd: this.onAdd })])
  },
  setup() {
    function onAdd() {
      console.log('onAdd')
    }
    return {
      onAdd,
    }
  },
}

```

## 实现 emit

首先，setup 的第二个参数是一个对象，传入 emit

```ts
// component.ts

// 在 setupStatefulComponent 时调用组件的 component
function setupStatefulComponent(instance) {
    // other code ...
     const setupResult = setup(shallowReadonly(instance.props), {
      // 传入的 emit 就可以直接使用 instance.emit
      emit: instance.emit,
    })
    handleSetupResult(instance, setupResult)
}
```

那么我们需要在初始化 emit 的时候去注册一下 emit 

```ts
export function createComponentInstance(vnode) {
  // 这里返回一个 component 结构的数据
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  }
  component.emit = emit as any
  return component
}
```

将 emit 的逻辑单独抽离出来，创建 `componentEmit.ts`

```ts
// componentEmit.ts

// 第一个参数接收一个 event 的值
export function emit(event) {
  console.log('event', event)
}
```

emit触发的函数在哪呢？我们在模板中一般会这样写：

```vue
<Fpp @add="onAdd" />
```

其实我们要触发的函数就是`props`中的`onAdd`函数。那么我们在`emit`函数中去调用这个`onAdd`函数就好。

那么这个函数该如何获取到呢？

`props` 在组件的`instance`中，那么拿到组件的`instance`就好。

```js
export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  }
  
  // 将组件实例传递给 emit
  component.emit = emit.bind(null, component) as any
  return component
}
```

然后我们在`emit`中就可以获取到了：

```js
export function emit(instance, event) {
  // 获取 props
  const { props } = instance
  const toUpperCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1)
  // 将 event 第一个字母大写，同时加上 on
  const handler = props[`on${toUpperCase(event)}`]
  // 如果 props 中存在这个 handler，那么就触发这个 handler
  handler && handler()
}
```

现在就已经实现 emit 

## 完善 emit

### emit 可以传递参数

```ts
export const Foo = {
  setup(props, { emit }) {
    const handleClick = () => {
      // emit 可以传递多个参数
      emit('add', 1, 2)
    }
    return {
      handleClick,
    }
  },
}
```

会在父组件监听的事件上进行接收。这个也是非常简单的，

```ts
// 接收参数
export function emit(instance, event, ...params) {
  const { props } = instance
  const toUpperCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1)
  const handler = props[`on${toUpperCase(event)}`]
  // 触发时传递参数
  handler && handler(...params)
}
```

### 事件名可以是短横线格式

```ts
// emit 的事件名称可以是短横线连接的
emit('add-count', 1)

// 在监听的时候需要换成驼峰的格式
h(Foo, { onAdd: this.onAdd, onAddCount: this.onAddCount })
```

那么这个还如何解决呢？使用 `camelize` 函数进行处理，先将短横连接的转换为大写格式

```ts
export function emit(instance, event, ...params) {
  const { props } = instance
  // 在这里进行正则匹配，将 横杠和第一个字母 -> 不要横杠，第一个字母大写
  const camelize = (str: string) => {
    return str.replace(/-(\w)/, (_, str: string) => {
      return str.toUpperCase()
    })
  }
  const capitalize = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
  // 在这里先处理横杠，在处理大小写
  const handler = props[`on${capitalize(camelize(event))}`]
  handler && handler(...params)
}
```

当我们传入的事件名称为 `add-foo`，经过`camelize(event)`之后变为 `addFoo`，在经过 ``on${capitalize(camelize(event))}`` 处理过后变为 `onAddFoo`。



## 重构

我们将 `emit` 中涉及到的转换方法进行封装。

```js
// shared/index.ts

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : "";
  });
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};

```

然后重写`emit`方法

```js
export function emit(instance, event, ...args) {
  const { props } = instance;
  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}
```

