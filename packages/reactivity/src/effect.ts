import { extend } from "@x-mini-vue/shared";

let activeEffect
let shouldTrack
export class ReactiveEffect {
  private _fn: any
  deps = [];
  active = true;
  onStop?: () => void;
  public scheduler: Function | undefined;
  constructor(fn, scheduler?: Function) {
    this._fn = fn
    this.scheduler = scheduler
  }

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

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });

  effect.deps.length = 0
}

// targetMap 为什么要是全局的？
// 如果 targetMap 不是全局的，只是在 track 方法中定义，那么在 trigger 中就无法获取到 targetMap
const targetMap = new Map()
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

  trackEffects(dep)
}

// 抽离函数
export function trackEffects(dep) {
  // 看看 dep 之前有没有添加过，添加过的话 那么就不添加了
  if (dep.has(activeEffect)) return

  activeEffect.deps.push(dep)
  dep.add(activeEffect)
}
export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
  // trigger 的逻辑就更加简单了，我们只需要取出depsMap中 key 对应的 dep， 这个 dep 是 一个 set 结构，再遍历 set 执行每个 effect 就可以了
  const depsMap = targetMap.get(target)
  const dep = depsMap.get(key)
  triggerEffects(dep)
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

export function effect(fn, options:any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)
  extend(_effect, options);

  _effect.run()

  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect;

  return runner
}

export function stop(runner) {
  runner.effect.stop();
}