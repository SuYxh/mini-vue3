# 实现 ref

## 编写单测

```ts
it('happy path', () => {
    const refFoo = ref(1)
    expect(refFoo.value).toBe(1)
})
```

下面我们去实现

```ts
// ref.ts
export function ref(value) {
  return { value }
}
```

## ref 应该是响应式

### 编写单测

```ts
it("should be reactive", () => {
  const a = ref(1);
  let dummy;
  let calls = 0;
  effect(() => {
    calls++;
    dummy = a.value;
  });
  expect(calls).toBe(1);
  expect(dummy).toBe(1);
  a.value = 2;
  expect(calls).toBe(2);
  expect(dummy).toBe(2);
  // same value should not trigger
  a.value = 2;
  expect(calls).toBe(2);
  expect(dummy).toBe(2);
});
```

通过对 ref 的说明，我们发现 ref 传入的值大多数情况下是一个原始值。那么我们就不能通过 Proxy 的特性来对值进行封装了，但是可以用到 track 和 trigger 中的部分逻辑，所以我们进行一个逻辑拆分。

reactive 方法适用于对象形式的，所有会有很对 key

ref 适用于值类型，就一个 key 为 value

### 实现 RefImpl 类

> 通过 get 和 set 进行依赖收集和派发更新

我们先把 happy path 通过 class 的方式实现

```js
class RefImpl {
  private _value: any;
  
  constructor(value) {
    this._value = value
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    this._value = convert(newValue);
  }
}
```



### 实现响应式

这里我们要响应式其实还是和 reactive 的套路是一样的，在 get 中收集依赖，在 set 中触发依赖。这个时候我们就可以去复用 reactive 的 track 逻辑了。

```ts
// 我们先看看现在 track 的逻辑

export function track(target, key) {
  if (!isTracking()) return
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
  if (dep.has(activeEffect)) return
  activeEffect.deps.push(dep)
  dep.add(activeEffect)
}
```

其实有很多是无法通用的，下面的收集依赖的逻辑我们就可以单独抽离出来了

```ts
export function track(target, key) {
  if (!isTracking()) return
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
  trackEffects(dep)
}

// 抽离函数
export function trackEffects(dep) {
  if (dep.has(activeEffect)) return
  activeEffect.deps.push(dep)
  dep.add(activeEffect)
}
```

而 trigger 呢？

```ts
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  for (const effect of deps) {
    if (effect.options.scheduler) {
      effect.options.scheduler()
    } else {
      effect.run()
    }
  }
}
```

同理，我们也可以将 trigger 单独的部分抽离出来，在重构了一个模块后，需要重新运行一遍测试，查看是否功能正常

```ts
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  triggerEffects(deps)
}

export function triggerEffects(deps) {
  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}
```

最后，我们就可以在 ref 中

```ts
class RefImpl {
  private _value: any
  // 这里我们也需要一个 dep Set 用于储存所有的依赖
  public dep = new Set()
  constructor(value) {
    this._value = value
  }
  get value() {
    // 在 get 中进行依赖收集
    if (isTracking()) {
      trackEffects(this.dep);
    }
    return this._value
  }
  set value(newValue) {
    // 
    this._value = newValue
    // 在 set 中进行触发依赖
    triggerEffects(this.dep)
  }
}
```

这样我们再去运行测试发现就可以通过了

### 相同的值不会触发依赖

```ts
r.value = 2
expect(calls).toBe(2)
expect(dummy).toBe(2)
```

这个实现方法也非常简单:

```ts
class RefImpl {
  // other code ...
  set value(newValue) {
    // 在这里进行判断
   if (Object.is(newValue, this._value)) {
      return
   }
    // other code ...
  }
}
```

其实这里的判断我们可以写一个工具函数：

```ts
// shared/index.ts
export function hasChanged(val, newVal) {
  return !Object.is(val, newVal)
}
```

```ts
class RefImpl {
  // other code ...
  set value(newValue) {
    // 在这里用这个工具函数进行判断
    if (hasChanged(this._value, newValue)) {
      this._value = newValue
      triggerEffect(this.deps)
    }
  }
}
```

这个时候我们再进行测试发现就没有问题了

## 实现ref 支持对象形式

我们先看看单元测试

```ts
it('should make nested properties reactive', () => {
    const a = ref({
        foo: 1,
    })
    let dummy
    effect(() => {
        dummy = a.value.foo
    })
    a.value.foo = 2
    expect(dummy).toBe(2)
    expect(isReactive(a.value)).toBe(true)
})
```

那这个我们该怎么实现呢？如果传入的是对象，那么我们应该使用 reactive 方法进行处理一下，所以我们需要在constructor中对 value 进行一个判断，判断一下是否为对象。那么问题来了，使用 reactive 方法处理后就变成了 proxy 的对象，在set 中进行对比的时候，就变成了`newValue` 和 proxy 实例进行对比，肯定会有问题，所以我们使用 `_rawValue`  保存原来的 `value`，在进行对比的时候，使用  	`newValue` 和 `_rawValue` 进行对比就好了。

```ts
class RefImpl {
  // other code ...
   constructor(value) {
    // 保存一下 value，在 set 中用于对比
    this._rawValue = value
    // 如果 value 是一个对象，调用 reactive 进行转换
    this._value = isObject(value) ? reactive(value) : value
    this.dep = new Set();
  }
  // other code ...
  
  set value(newValue) {
    // 判断下 newValue 和 this._value 是否相等
    // 如果 value 是一个 对象，那么 this._value 是经过 reactive 处理过的，会是一个 proxy 的对象，所以这里需要处理一下
    // 在 constructor 中 我们直接将值保存在 this._rawValue， 对比的时候对比这个值就行
    if (hasChanged(newValue, this._rawValue)) {
    // 一定先去修改了 value 
      this._rawValue = newValue
      this._value = isObject(newValue) ? reactive(newValue) : newValue
      // 在 set 中进行触发依赖
      triggerEffects(this.dep);
    }
  }
}
```

下面我们再跑一下测试，就可以跑通了



## 重构

```js
this._value = isObject(value) ? reactive(value) : value
```

这行代码，我们可以看到有多次使用，抽离成一个方法，如下：

```js
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
```

之后的 `RefImpl`：
```js
class RefImpl {
  private _value: any;
  public dep;
  private _rawValue: any;
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}
```



## 流程图

![image-20240114094929971](https://qn.huat.xyz/mac/202401140949065.png)







