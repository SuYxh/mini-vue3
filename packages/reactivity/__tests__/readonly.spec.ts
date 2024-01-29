import { readonly } from "../src/reactive";
import { describe, vi, expect, it } from 'vitest';

describe('readonly', () => {
  it('should make nested values readonly', () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
  })

  it('should warn when update readonly prop value', () => {
    console.warn = vi.fn()
    const readonlyObj = readonly({ foo: 1 })
    readonlyObj.foo = 2
    expect(console.warn).toHaveBeenCalled()
  })
})