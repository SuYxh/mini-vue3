import { effect } from "../effect";
import { reactive, readonly, shallowReactive, shallowReadonly, toRaw } from "../reactive";
import { isRef, proxyRefs, ref, unRef } from "../ref";
describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });


  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it('toRaw', () => {
    // toRaw 可以 return 通过 `reactive` 、 `readonly` 、`shallowReactive` 、`shallowReadonly` 包装的 origin 值
    const reactiveOrigin = { key: 'reactive' }
    expect(toRaw(reactive(reactiveOrigin))).toEqual(reactiveOrigin)
    const readonlyOrigin = { key: 'readonly' }
    expect(toRaw(readonly(readonlyOrigin))).toEqual(readonlyOrigin)
    const shallowReadonlyOrigin = { key: 'shallowReadonly' }
    expect(toRaw(shallowReadonly(shallowReadonlyOrigin))).toEqual(
        shallowReadonlyOrigin
    )
    const shallowReactiveOrigin = { key: 'shallowReactive' }
    expect(toRaw(shallowReactive(shallowReactiveOrigin))).toEqual(
        shallowReactiveOrigin
    )

    const nestedWrapped = {
        foo: { bar: { baz: 1 }, foo2: { bar: { baz: 2 } } },
    }
    expect(toRaw(reactive(nestedWrapped))).toEqual(nestedWrapped)
  })

  it('isRef', () => {
    expect(isRef(1)).toBe(false)
    expect(isRef(ref(1))).toBe(true)
    expect(isRef(reactive({ foo: 1 }))).toBe(false)
  })

  it('unRef', () => {
    expect(unRef(ref(1))).toBe(1)
    expect(unRef(1)).toBe(1)
  })

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "xiaohong",
    };

    const proxyUser = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("xiaohong");

    proxyUser.age = 20;

    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    proxyUser.age = ref(10);
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });
});
