# 实现 toRaw

## 场景

Vue 3中的`toRaw`函数是一个非常有用的工具，它用于获取Vue的响应式系统包装的对象的原始对象。这个函数通常在以下场景中使用：

1. **获取原始数据**：当你需要操作或读取原始数据而不想触发响应式系统时，`toRaw`非常有用。例如，当你需要将数据传递给不支持Vue响应性的第三方库时。

2. **性能优化**：在某些情况下，响应式系统的开销可能是不必要的，特别是在处理大量数据或复杂对象时。使用`toRaw`可以绕过这些开销。

3. **避免副作用**：在某些情况下，你可能想要读取数据但不希望触发任何响应式副作用，如计算属性或观察者。`toRaw`可以帮助你实现这一点。

4. **调试和日志记录**：当你需要在控制台打印或记录对象时，使用`toRaw`可以确保你看到的是未经响应式处理的原始数据。

使用`toRaw`时，需要记住的一点是，它返回的对象不再是响应式的。这意味着对这个对象的任何更改都不会触发视图更新或其他响应式效果。

## 案例

```javascript
import { reactive, toRaw } from 'vue';

const reactiveObj = reactive({ a: 1, b: 2 });
const rawObj = toRaw(reactiveObj);

console.log(rawObj); // { a: 1, b: 2 } - 这是原始数据
```

在这个例子中，`reactiveObj`是一个响应式对象，而`rawObj`则是它的原始版本，不再具有响应性。通过`toRaw`，我们可以直接访问和操作这些原始数据。

## 编写单测

```ts
it('happy path', () => {
    // toRaw 可以 return 通过 `reactive` 、 `readonly` 、`shallowReactive` 、`shallowReadonly` 包装的 origin 值
    const reactiveOrigin = { key: 'reactive' }
    expect(toRaw(reactive(reactiveOrigin))).toEqual(reactiveOrigin)
    const readonlyOrigin = { key: 'readonly' }
    expect(toRaw(readonly(readonlyOrigin))).toEqual(readonlyOrigin)
    const shallowReadonlyOrigin = { key: 'shallowReadonly' }
    expect(toRaw(shallowReadonly(shallowReadonlyOrigin))).toEqual(
        shallowReadonlyOrigin
    )
    const shallowReactiveOrigin = { key: 'shallowReactive' }
    expect(toRaw(shallowReactive(shallowReactiveOrigin))).toEqual(
        shallowReactiveOrigin
    )

    const nestedWrapped = {
        foo: { bar: { baz: 1 }, foo2: { bar: { baz: 2 } } },
    }
    expect(toRaw(reactive(nestedWrapped))).toEqual(nestedWrapped)
})
```

通过测试样例我们发现，toRaw 的作用就是将包装过的值的原始值返回回来，同时我们嵌套的值也要嵌套转换回来

## 实现

```ts
// reactive.ts

// 创建 RAW 枚举
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw',
}


export function toRaw(observed) {
  // 这里就是嵌套转换了
  const original = observed && observed[ReactiveFlags.RAW]
  return isProxy(original) ? toRaw(original) : original
}
```

```ts
// baseHandlers

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key === ReactiveFlags.RAW) {
      // 判断一下，如果访问的 key 是 ReactiveFlag.RAW，就直接返回就可以了
      return target
    }
    // other code ...
  }
}
```

