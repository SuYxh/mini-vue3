# 实现 readonly 功能

## 核心点

- readonly 对象，在取值的时候不进行 依赖收集， 即： 在get函数中不执行 track 方法
- readonly 对象在修改值时不生效，在 set 函数中直接返回 true 即可
- readonly 对象在修改值时给出警告，在 set 函数中打印出警告



## 单元测试

```ts
it('happy path', () => {
    // not set
    const original = { foo: 1, bar: 2 }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original)
    expect(wrapped.bar).toBe(2)
    wrapped.foo = 2
    // set 后不会更改
    expect(wrapped.foo).toBe(1)
})
```

## 实现

我们知道 readonly 和 reactive 的实现原理是一致的，都可以通过 Proxy 来实现一个包装类，唯一的区别在于，readonly 的不会被 track，而且 readonly 的属性值不可更改

### v1版

> 基础实现

```ts
// reactive.ts
export function readonly(raw) {
    return new Proxy(raw, {
        get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver)
            return res
        },
        set() {
            return true
        },
    })
}
```

在这个版本下，我们就实现了最简单的 readonly 的实现。

### v2版

但是我们可以发现其实 reactive 和 readonly 的部分代码是一样的，就可以提取重复代码变为函数：

> 公共逻辑抽离

```ts
import { track, trigger } from './effect'


// version 2 版本就可以将重复的代码提取出来
// 作为 createGetter 和 createSetter
function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    if (!isReadonly) {
      track(target, key)
    }
    return res
  }
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver)
    trigger(target, key)
    return res
  }
}

export function reactive(raw) {
  return new Proxy(raw, {
    get: createGetter(),
    set: createSetter(),
  })
}

export function readonly(raw) {
  return new Proxy(raw, {
    get: createGetter(true),
    set() {
      return true
    },
  })
}
```



### v3版

为了更好的管理代码，可以直接将 createSetter 和 createGetter 分层出去

> 逻辑分层

```ts
// reactivity/baseHandlers.ts
import { track, trigger } from './effect'

const get = createGetter()
const readonlyGet = createGetter(true)
const set = createSetter()

function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    // 在 get 时收集依赖
    if (!isReadonly) {
      track(target, key)
    }
    return res
  }
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver)
    // 在 set 时触发依赖
    trigger(target, key)
    return res
  }
}

// mutable 可变的
export const mutableHandlers = {
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    return true
  },
}

```

```ts
import { mutableHandlers, readonlyHandlers } from './baseHandlers'

export function reactive(raw) {
  return new Proxy(raw, mutableHandlers)
}

export function readonly(raw) {
  return new Proxy(raw, readonlyHandlers)
}
```

这样就可以将实现与入口分离开来了。

### v4版

其实 reactive 和 readonly 它的创建方式是差不多的都是通过 new Proxy 的方式来创建，那么这些步骤我们也可以来分离开

> 再优化、抽离

```ts
// reactive.ts

import { mutableHandlers, readonlyHandlers } from './baseHandlers'

function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers)
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers)
}
```



## 警告特性单元测试

这个单元测试，我们要让用户在设置一个 readonly prop value 时报一个警告

```ts
it('should warn when update readonly prop value', () => {
    // 这里使用 vi.fn
    console.warn = vi.fn()
    const readonlyObj = readonly({ foo: 1 })
    readonlyObj.foo = 2
    expect(console.warn).toHaveBeenCalled()
})
```

## 实现警告特性

这里我们发现实现警告还是非常简单的，只需要找到 readonly proxy 的 set 即可

```ts
// baseHandlers.ts

export const readonlyHandlers = {
  get,
  set(target, key, value) {
    // 在这里警告
    console.warn(
      `key: ${key} set value: ${value} fail, because the target is readonly`,
      target
    )
    return true
  },
}
```

这个时候我们再跑一边测试，发现就完全没问题了。


