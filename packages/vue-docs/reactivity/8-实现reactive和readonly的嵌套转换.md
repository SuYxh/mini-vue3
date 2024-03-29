# 实现 reactive 和 readonly 的嵌套转换

## reactive 嵌套转换单测

```ts
it('nested reactive', () => {
    const original = {
        nested: { foo: 1 },
        array: [{ bar: 2 }],
    }
    const observed = reactive(original)
    // 我们期望 observed.nested 也是一个 响应式对象
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
})
```

## 实现 reactive 嵌套

针对`expect(isReactive(observed.nested)).toBe(true)` ，我们期望 observed.nested 也是一个 响应式对象，应该怎么做呢？ 

在 getter 的时候，我们对 `Reflect.get(target, key); `的返回值进行一个判断，如果是一个对象，再次调用一下 `reactive(res);`  方法，`readonly` 的处理，同理。

```ts
// baseHandlers.ts

function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    // other code ...
      
      
    const res = Reflect.get(target, key, receiver)
    // [嵌套转换]
    // 在 shared 中写一个工具函数 isObject 用于判断是否是对象
    if (isObject(res)) {
      return reactive(res)
    }
	
    // other code ...
  }
}
```

```ts
// shared/index.ts

export function isObject(val) {
  return val !== null && typeof val === 'object'
}
```

这样测试就可以跑通了

## readonly 嵌套单测

```ts
it('should readonly nested object', () => {
    const nested = { foo: { innerFoo: 1 }, bar: [{ innerBar: 2 }] }
    const wrapped = readonly(nested)
    expect(isReadonly(wrapped.foo)).toBe(true)
    expect(isReadonly(wrapped.bar)).toBe(true)
    expect(isReadonly(wrapped.bar[0])).toBe(true)
})
```

## readonly 嵌套实现

```ts
// 改一下即可

// baseHandlers.ts

if (isObject(res)) {
    return isReadonly ? readonly(res) : reactive(res)
}
```

