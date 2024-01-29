# 实现 isRef 和 unRef

## isRef

### 编写单测

```ts
it('isRef', () => {
    expect(isRef(1)).toBe(false)
    expect(isRef(ref(1))).toBe(true)
    expect(isRef(reactive({ foo: 1 }))).toBe(false)
})
```

### 实现

这个实现起来就非常简单，只需要给其一个标识即可

```ts
class RefImpl {
  
  public __v_isRef = true;

  // other code ...
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}
```

## unRef

### 编写单测

```ts
it('unRef', () => {
    expect(unRef(ref(1))).toBe(1)
    expect(unRef(1)).toBe(1)
})
```

### 实现

```ts
export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}
```

这样测试就跑过了