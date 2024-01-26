import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  // slots
  instance.slots = Array.isArray(children) ? children : [children];
}
