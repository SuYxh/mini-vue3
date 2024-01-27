# 更新 props

## 案例

更新 props 都会考虑到哪些情况：

- foo 之前的值和现在的值不一样了 --> 修改
- foo 的新值变成了 null undefined --> 删除
- 之前存在的属性在新的里面没有了 --> 删除

```ts
import { h, ref } from "../../lib/x-mini-vue.esm.js";

export const App = {
  name: "App",

  setup() {
    const count = ref(0);

    const onClick = () => {
      count.value++;
    };

    const props = ref({
      foo: "foo",
      bar: "bar",
    });
    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo";
    };

    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };

    const onChangePropsDemo3 = () => {
      props.value = {
        foo: "foo",
      };
    };

    return {
      count,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      props,
    };
  },
  render() {
    return h(
      "div",
      {
        id: "root",
        ...this.props,
      },
      [
        h("div", {}, "count:" + this.count),
        h(
          "button",
          {
            onClick: this.onClick,
          },
          "click"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo1,
          },
          "changeProps - 值改变了 - 修改"
        ),

        h(
          "button",
          {
            onClick: this.onChangePropsDemo2,
          },
          "changeProps - 值变成了 undefined - 删除"
        ),

        h(
          "button",
          {
            onClick: this.onChangePropsDemo3,
          },
          "changeProps - key 在新的里面没有了 - 删除"
        ),
      ]
    );
  },
};

```

## 实现

接下来，我们需要在`patchElement`函数中加入对 `props` 的更新逻辑的处理。

```ts
function patchElement(n1, n2, container) {
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    // 这里需要传递 el，我们需要考虑一点，到这一层的时候
  	// n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
  	// 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
    const el = (n2.el = n1.el);

    patchProps(el, oldProps, newProps);
  }
```

然后我们在 `patchProps` 中加入多种情况下对于 props 的处理

```ts
function patchProps(oldProps, newProps) {
  // 情况1: old !== new 这个走更新的逻辑
  // 情况2: old 存在，new !== undefined，这个走删除的逻辑
  // 情况3: old 存在，new 不存在，这个也走删除的逻辑
}
```

### foo 之前的值和现在的值不一样了 --> 修改

```ts
function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      // foo 之前的值和现在的值不一样了 --> 修改
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];

        if (prevProp !== nextProp) {
          // 在 `runtime-dom/index.ts/patchProp` 不要忘记添加这个参数
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }
    }
  }
```

### null undefined --> 删除

在情况2 中，`newProp` 是 undefined 或者 null，由于我们处理的逻辑已经抽离到了 `runtime-dom/index` 中，所以这里我们需要去修改那里的代码。

```ts
function patchProp(el, key, prevVal, nextVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    // null undefined --> 删除
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}
```

### 之前存在的属性在新的里面没有了 --> 删除

```ts
function patchProps(el, oldProps, newProps) {
  if (oldProps !== newProps) {
    // foo 之前的值和现在的值不一样了 --> 修改
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];

      if (prevProp !== nextProp) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }

    if (oldProps !== EMPTY_OBJ) {
      // 之前存在的属性在新的里面没有了 --> 删除
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  }
}
```





## 优化

接下来我们还可以进行优化一下：

```ts
// shared/index

// 创建一个常量
export const EMPTY_OBJ = {}
```

```ts
function patchElement(n1, n2, container) {
  const oldProps = n1.props || EMPTY_OBJ;
  const newProps = n2.props || EMPTY_OBJ;

  // 这里需要传递 el，我们需要考虑一点，到这一层的时候
  // n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
  // 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
  const el = (n2.el = n1.el);

  patchProps(el, oldProps, newProps);
}
```

