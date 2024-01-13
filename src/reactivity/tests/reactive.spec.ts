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
})