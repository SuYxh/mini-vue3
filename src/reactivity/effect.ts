
class ReactiveEffect {
  private _fn: any
  deps = [];
  active = true;
  public scheduler: Function | undefined;
  constructor(fn, scheduler?: Function) {
    this._fn = fn
    this.scheduler = scheduler
  }

  run() {
    // 保存一下当前的 activeEffect
    activeEffect = this
    const res = this._fn()
    return res
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}

// targetMap 为什么要是全局的？
// 如果 targetMap 不是全局的，只是在 track 方法中定义，那么在 trigger 中就无法获取到 targetMap
const targetMap = new Map()
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

  dep.add(activeEffect)

  activeEffect.deps.push(dep);
}

export function trigger(target, key) {
  // trigger 的逻辑就更加简单了，我们只需要取出depsMap中 key 对应的 dep， 这个 dep 是 一个 set 结构，再遍历 set 执行每个 effect 就可以了
  const depsMap = targetMap.get(target)
  const dep = depsMap.get(key)
  for (const effect of dep) {
    if (typeof effect.scheduler === 'function') {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

type effectOptions = {
  scheduler?: Function;
};

let activeEffect
export function effect(fn, options:effectOptions = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)

  _effect.run()

  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect;

  return runner
}

export function stop(runner) {
  runner.effect.stop();
}