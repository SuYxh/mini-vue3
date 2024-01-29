# 实现 effect & reactive & 依赖收集 & 触发依赖

## 实现reactive

### 编写单测

```js
// 编写 reactive 的 happy path
describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    // 期望包装后和源对象不一样
    expect(observed).not.toBe(original)
    // 期望包装后某个属性的值和源对象一样
    expect(observed.foo).toBe(original.foo)
  })
})
```

那该如何实现呢？在这里我们就可以使用 `Proxy` + `Reflect` 来实现了

### 实现

```js
// 可以使用简单的 Proxy 来实现
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      return res
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver)
      return res
    },
  })
}
```

运行一下 happy path，通过

## effect 实现

已经有了 reactive，接下来就是去实现一个 effect API。我们写一个单元测试：

```js
describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
    })
    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)

    // update
    user.age++
    expect(nextAge).toBe(12)
  })
})
```

### v1 版本

首先，我们知道了 effect 接受一个参数，可以通过抽象一层：

```js
class ReactiveEffect {
  private _fn: any
  constructor(fn) {
    this._fn = fn
  }
  run() {
    this._fn()
  }
}

export function effect(fn) {
  // 抽象一层
  const _effect = new ReactiveEffect(fn)
  // 去调用方法
  _effect.run()
}
```

此时我们 update 之前的逻辑就可以跑通了，下面的难点在于 update

### v2 版本

这个版本，我们主要是用于解决 update 的问题，我们来看看测试，发现在 get 操作的时候需要将依赖收集，在 set 操作的时候再去触发这个依赖，下面我们就可以手动在 reactive 中添加相应的逻辑

```js
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      // 在 get 时收集依赖
      track(target, key)
      return res
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver)
      // 在 set 时触发依赖
      trigger(target, key)
      return res
    },
  })
}
```

下面，我们就去实现 `track` 和 `trigger`



#### track

```js
// track 相关代码
class ReactiveEffect {
  // ...
  run() {
    // 保存一下当前的 activeEffect
    activeEffect = this
    this._fn()
  }
}

// 创建全局变量 targetMap
const targetMap = new WeakMap()
export function track(target, key) {
  // 我们在运行时，可能会创建多个 target，每个 target 还会可能有多个 key，每个 key 又关联着多个 effectFn
  // 而且 target -> key -> effectFn，这三者是树形的关系
  // 因此就可以创建一个 WeakMap 用于保存 target，取出来就是每个 key 对应这一个 depsMap，而每个 depsMap 又是一个 Set
  // 使用 set 结构（避免保存重复的 effect）
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  // 将 effect 加入到 set 中
  dep.add(activeEffect)
}

// 需要一个全局变量来保存当前的 effect
let activeEffect

export function effect(fn) {
  // ...
}
```

#### trigger

```js
export function trigger(target, key) {
  // trigger 的逻辑就更加简单了，我们只需要取出depsMap中 key 对应的 dep， 这个 dep 是 一个 set 结构，再遍历 set 执行每个 effect 就可以了
  const depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  for (const effect of deps) {
    effect.run()
  }
}
```

现在我们再跑测试，就发现通过了，现在我们已经实现了 effect、reactive 的 happy path 了



## 3.响应式数据结构

![image-20240119132926453](https://qn.huat.xyz/mac/202401191329493.png)





## 3.思考

1、reactive 函数如果这样实现会有什么问题？

```js
export function reactive(target) {
  return new Proxy(target, {
    get(target, key) {
      track(target, key)
      return Reflect.get(target, key)
    },
    set(target, key, val) {
      trigger(target,key)
      return Reflect.set(target, key, val)
    }
  })
}
```

问题： 执行顺序出错，可能无法得到预期的效果。先执行了 trigger，然后才触发的 Reflect.set(target, key, val) 更新的数据，那么在执行 effect 的回调函数的时候，响应式的值还是之前的值，并不是更新后的，可以直接使用 effect 的那个单元测试跑跑看。



2、reactvie 创建的响应式为什么解构会丢失？

一个数据是否具备响应性的关键在于：**是否可以监听它的 getter 和 setter **。而根据我们的代码可知，只有 proxy 类型的 **代理对象** 才可以被监听 getter 和 setter ，而一旦解构，对应的属性将不再是 proxy 类型的对象，所以：**解构之后的属性，将不具备响应性。**



3、解构的本质是什么？

对象的解构就是: 创建新变量 -> 枚举属性 -> 复制属性并赋值。

https://juejin.cn/post/7218014583864328247



4、`Proxy`为什么要配合 `Reflect` 一起使用？ 

https://juejin.cn/post/7324877504552714255



5、依赖收集和派发更新流程图是什么样？

![image-20240119133138290](https://qn.huat.xyz/mac/202401191331327.png)





