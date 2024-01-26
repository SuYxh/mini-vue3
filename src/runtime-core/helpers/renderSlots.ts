import { createVNode } from "../vnode";

export function renderSlots(slots, name = 'default', props) {
  const slot = slots[name]

  if (slot) {
    if (typeof slot === "function") {
      // 说明用户使用的是具名插槽或者作用域插槽
      return createVNode("div", {}, slot(props));
    }else if (Array.isArray(slot)) {
      // 说明用户使用的是普通插槽
      return createVNode("div", {}, slot);
    }
  }
}
