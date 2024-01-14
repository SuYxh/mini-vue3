import { hasChanged } from "../shared";
import { trackEffects, triggerEffects, isTracking } from "./effect"

class RefImpl {
  private _value: any
  // 这里我们也需要一个 dep Set 用于储存所有的依赖
  public dep = new Set()
  constructor(value) {
    this._value = value
  }
  get value() {
    // 在 get 中进行依赖收集
    // if (isTracking()) {
    //   trackEffects(this.dep);
    // }
    // 提取函数
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    // 判断下 newValue 和 this._value 是否相等
    if (hasChanged(newValue, this._value)) {
    // 一定先去修改了 value 
      this._value = newValue
      // 在 set 中进行触发依赖
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  return new RefImpl(value)
}