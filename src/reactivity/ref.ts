import { hasChanged, isObject } from "../shared";
import { trackEffects, triggerEffects, isTracking } from "./effect"
import { reactive } from "./reactive";

class RefImpl {
  private _value: any
  // 这里我们也需要一个 dep Set 用于储存所有的依赖
  public dep;
  private _rawValue: any
  public __v_isRef = true;
  constructor(value) {
    // 保存一下 value，在 set 中用于对比
    this._rawValue = value
    // 如果 value 是一个对象，调用 reactive 进行转换
    this._value = convert(value);
    this.dep = new Set();
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
    // 如果 value 是一个 对象，那么 this._value 是经过 reactive 处理过的，会是一个 proxy 的对象，所以这里需要处理一下
    // 在 constructor 中 我们直接将值保存在 this._rawValue， 对比的时候对比这个值就行
    if (hasChanged(newValue, this._rawValue)) {
    // 一定先去修改了 value 
      this._rawValue = newValue
      this._value = convert(newValue);
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

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },

    set(target, key, value) {
      // set 分为两种情况：
      // 如果原来的值是 ref，并且新的值不是 ref，那么就去更新原来的 ref.value = newValue
      // 第二种情况就是原来的值是 ref，newValue 也是一个 ref，那么就直接替换就 OK 了
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}