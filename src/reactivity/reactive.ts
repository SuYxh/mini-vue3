import { mutableHandlers, readonlyHandlers } from './baseHandlers';

function createActiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers)
}

// 1、readonly 的对象不会被 track，
// 2、readonly 的属性值不可更改，set 中直接返回 true 即可
export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers)
}