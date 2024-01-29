import { isReactive, shallowReactive } from "../src/reactive";
import { describe, expect, it } from 'vitest';

describe("shallowReadonly", () => {
  it('happy path', () => {
    const original = { foo: { bar: 1 } }
    const observed = shallowReactive(original)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(observed.foo)).toBe(false)
  })
});
