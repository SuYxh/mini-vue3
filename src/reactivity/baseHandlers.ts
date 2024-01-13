import { track, trigger } from "./effect"

const get = createGetter()
const readonlyGet = createGetter(true)
const set = createSetter()

function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    // readonly 的对象不会被 track
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


// mutable 可变的
export const mutableHandlers = {
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  // readonly 的属性值不可更改，set 中直接返回 true 即可
  set(target, key, value) {
    return true
  },
}
