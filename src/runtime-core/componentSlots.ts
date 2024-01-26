import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  // slots

  const slots = {}
  for (const key in children) {
    const value = children[key]
    slots[key] = Array.isArray(value) ? value : [value];
  }

  instance.slots = slots
}
