import { track, trigger } from "./effect"

export function reactive(target) {
  return new Proxy(target, {
    get(target, key) {
      const res = Reflect.get(target, key)
      track(target, key)
      return res
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val)
      trigger(target,key)
      return res
    }
  })
}


// 1、readonly 的对象不会被 track，
// 2、readonly 的属性值不可更改，set 中直接返回 true 即可
export function readonly(target) {
  return new Proxy(target, {
    get(target, key) {
      const res = Reflect.get(target, key)
      return res
    },
    set() {
      return true
    }
  })
}