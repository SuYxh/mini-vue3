# 实现 shallowReactive

## 编写单测

```ts
it('happy path', () => {
    const original = { foo: { bar: 1 } }
    const observed = shallowReactive(original)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(observed.foo)).toBe(false)
})
```

## 实现 

通过 shallowReadonly 我们发现这两者其实是非常相似的

```ts
// reactive.ts
export function shallowReactive(raw) {
  return createActiveObject(raw, shalloReactiveHandlers)
}
```

```ts
// baseHandlers

const shallowMutableGet = createGetter(false, true)

// other code ...


export const shallowMutableHandlers = extend({}, mutableHandlers, {
  get: shallowMutableGet,
})
```

这样跑测试就可以通过了