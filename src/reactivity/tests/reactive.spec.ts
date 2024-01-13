import { isReactive, reactive } from '../reactive';

describe('reactive', () => {
  
  it('happy test', () => {
    const original = { foo: 1 }
    const observed = reactive({ foo: 1 })
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)

    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
  })

  test("nested reactives", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    // 我们期望 observed.nested 也是一个 响应式对象
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
})