import { track, trigger } from "./effect"

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
  return function set(target, key, val, receiver) {
    const res = Reflect.set(target, key, val, receiver)
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


// 1、readonly 的对象不会被 track，
// 2、readonly 的属性值不可更改，set 中直接返回 true 即可
export function readonly(raw) {
  return new Proxy(raw, {
    get: createGetter(true),
    set() {
      return true
    }
  })
}