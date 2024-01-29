import { extend, isObject } from "@x-mini-vue/shared";
import { track, trigger } from "./effect"
import { reactive, ReactiveFlags, readonly } from "./reactive";

// 
const get = createGetter()
const readonlyGet = createGetter(true)
const set = createSetter()
const shallowReadonlyGet = createGetter(true, true);
const shallowMutableGet = createGetter(false, true)

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

    const res = Reflect.get(target, key, receiver)

    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

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
  // 这里不需要每次都调用 createGetter 这个方法，所以缓存一下，初始化的时候调用一次就好
  // get: createGetter(),
  // set: createSetter(),
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  // readonly 的属性值不可更改，set 中直接返回 true 即可
  set(target, key, value) {
    // 在这里警告
    console.warn(
      `key: ${key} set value: ${value} fail, because the target is readonly`,
      target
    )
    return true
  },
}

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});

export const shalloReactiveHandlers = extend({}, mutableHandlers, {
  get: shallowMutableGet,
})