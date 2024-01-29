# 优化 stop 

### 问题分析

回顾之前的单元测试

```ts
 it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    
    obj.prop = 3;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });
```

当我们将 `obj.prop = 3;` 改为 `obj.pro++`时就发现用例跑不通了，这是为什么呢？

因为 `obj.prop = 3` 只会触发 set操作，而 `obj.pro++`  先触发了 get 操作，然后又触发了 set操作。

在调用 stop 的时候，我们执行了 `cleanupEffect(*this*);`  方法 将依赖给清空了，然后又执行了 get 操作 又收集了依赖，所以 effect 的回调函数还会执行， 单测无法通过。



### 解决方式

既然是 getter 操作导致了依赖再次收集的问题，那么就想办法过滤掉这次的依赖收集

添加一个开关，在 track 方法中添加一下  ` if (!shouldTrack) return `， 

```js
export function track(target, key) {
  // 我们在运行时，可能会创建多个 target，每个 target 还会可能有多个 key，每个 key 又关联着多个 effectFn
  // 而且 target -> key -> effectFn，这三者是树形的关系
  // 因此就可以创建一个 Map 用于保存 target，取出来就是每个 key 对应这一个 depsMap，而每个 depsMap 又是一个 Set
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

  // 如果没有这句话就会报错，为什么会有这句话呢？ activeEffect 什么时候不存在？
  // 当只有用户写了 effect 函数的时候，才会有
  if (!activeEffect) return;
  if (!shouldTrack) return

  dep.add(activeEffect)
  activeEffect.deps.push(dep);
}
```

然后在 ReactiveEffect类的 run 方法执行的时候进行管控，

```js
  run() {
    // 调用 stop 后 this.active 变为了 false， shouldTrack 为 false，在 track 方法就不会在收集到依赖
    if (!this.active) {
      return this._fn();
    }

    // 应该收集
    shouldTrack = true;
    // 保存一下当前的 activeEffect
    activeEffect = this;
    const r = this._fn();

    // 重置
    shouldTrack = false;

    return r;
  }
```



### 代码重构

将 `if (!activeEffect) return;`  `if (!shouldTrack) return` 改写 `isTracking` 函数，如下： 

```js
export function track(target, key) {
  // 如果没有这句话就会报错，为什么会有这句话呢？ activeEffect 什么时候不存在？
  // 当只有用户写了 effect 函数的时候，才会有
  // if (!activeEffect) return;
  // if (!shouldTrack) return

  // 将上面2 行代码进行优化
  if (!isTracking()) return

  // 我们在运行时，可能会创建多个 target，每个 target 还会可能有多个 key，每个 key 又关联着多个 effectFn
  // 而且 target -> key -> effectFn，这三者是树形的关系
  // 因此就可以创建一个 Map 用于保存 target，取出来就是每个 key 对应这一个 depsMap，而每个 depsMap 又是一个 Set
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
  
  // 看看 dep 之前有没有添加过，添加过的话 那么就不添加了
  if (dep.has(activeEffect)) return;

  dep.add(activeEffect)
  activeEffect.deps.push(dep);
}

function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}
```

