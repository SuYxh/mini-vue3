# 实现 isReactive 和 isReadonly

## isReactive 单测

```ts
// reactive.spec.ts
it('happy path', () => {
    // other code ...
    // 加入 isReactive 判断
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
})
```

## isReactive 实现

这个该如何实现呢，其实也是非常简单的：

```ts
// reactive.ts

// other code ...

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

// other code ...

export function isReactive(raw) {
  // 如果 value 是一个响应式对象， 在 value 身上进行取值，就会触发 getter，在 getter 中进行了判断，返回了 true
  // 如果 value 不是一个响应式对象，value[ReactiveFlags.IS_REACTIVE] 的值为 undefined， 转成 boolean 也就是 false
  return !!raw[ReactiveFlags.IS_REACTIVE]
}
```

在 `createGetter`方法中增加判断

```js
// baseHandler.ts

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (key === ReactiveFlags.RAW) {
      // 判断一下，如果访问的 key 是 ReactiveFlag.RAW，就直接返回就可以了
      return target
    }
		
    // ...其他代码
    return res
  }
}
```

测试之后就跑通了

## isReadonly 单测

```ts
// readonly.spec.ts
it('happy path', () => {
    // other code ...

    // [isReadonly]
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
})
```

## isReadonly 实现

这个实现也是很简单的，仿照 isReactive 的实现：

```ts
// reacive.ts

// other code ...

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  // 添加枚举
  IS_READONLY = '__v_isReadonly',
}

// other code ...


// 添加 API
export function isReadonly(raw) {
  return !!raw[ReactiveFlags.IS_READONLY]
}
```

```ts
// baseHandlers.ts

// other code ...

function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    // 进行判断
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    // other code ...
  }
}

// other code ...
```

这个时候再进行测试发现就可以通过了

