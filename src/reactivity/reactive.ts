import { mutableHandlers, readonlyHandlers } from './baseHandlers';


export function reactive(raw) {
  return new Proxy(raw, mutableHandlers)
}


// 1、readonly 的对象不会被 track，
// 2、readonly 的属性值不可更改，set 中直接返回 true 即可
export function readonly(raw) {
  return new Proxy(raw, readonlyHandlers)
}