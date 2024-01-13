import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers';

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

function createReactiveObject(raw, baseHandlers) {
  return new Proxy(raw, baseHandlers)
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers)
}

// 1、readonly 的对象不会被 track，
// 2、readonly 的属性值不可更改，set 中直接返回 true 即可
export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
}

export function isReactive(value) {
  // 如果 value 是一个响应式对象， 在 value 身上进行取值，就会触发 getter，在 getter 中进行了判断，返回了 true
  // 如果 value 不是一个响应式对象，value[ReactiveFlags.IS_REACTIVE] 的值为 undefined， 转成 boolean 也就是 false
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}