# 实现 provide 和 inject

## 核心思想

`provide`： 存

`inject`：取



![image-20240127153959049](https://qn.huat.xyz/mac/202401271539096.png)



## 使用

```ts
// 组件 provide 和 inject 功能
import { h, provide, inject } from "../../lib/x-mini-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(Consumer)]);
  },
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");

    return {
      foo,
      bar,
    };
  },

  render() {
    return h("div", {}, `Consumer: - ${this.foo} - ${this.bar}`);
  },
};

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};

```

## 基础实现

1、创建一个 `runtime-core/apiInjecet.ts`

```ts
import { getCurrentInstance } from "./component";

export function provide(key, value) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    let { provides } = currentInstance;

    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    return parentProvides[key];
  }
}

```

2、在 `createComponentInstance` 中设置 `provides`

```ts
export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    emit: () => {},
  };

  component.emit = emit.bind(null, component) as any;

  return component;
}
```

3、因为 `createComponentInstance` 方法中增加了参数，所以需要对` render.ts` 的传参进行修改。

4、修改 `setupRenderEffect` 方法

```js
function setupRenderEffect(instance, vnode, container) {
  const subTree = instance.render.call(instance.proxy)
  // 这里的第三个参数，就是 parent
  patch(subTree, container, instance)
  vnode.el = subTree.el
}
```

到此，就可以实现 `provide`、`inject` 的基础版本了

## 支持多层传递

provide 使用更多的是跨层级传递数据，我们在多一层组件，那么代码就会出现问题。

### 案例

```ts
// 组件 provide 和 inject 功能
import { h, provide, inject } from "../../lib/x-mini-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)]);
  },
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "fooTwo");
    const foo = inject("foo");

    return {
      foo,
    };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `ProviderTwo foo:${this.foo}`),
      h(Consumer),
    ]);
  },
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");

    return {
      foo,
      bar,
    };
  },

  render() {
    return h("div", {}, `Consumer: - ${this.foo} - ${this.bar}`);
  },
};

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};

```



![image-20240127152734013](https://qn.huat.xyz/mac/202401271527091.png)

由于我们直接用的是直接覆盖，上面我们将 `instance.providers` 修改为 `parent.provides`，但是我们在 `provides` 中直接将自己的 provides 更改了，由于引用关系，导致自己的 `parent.provides` 也被修改了。

例如下面的应用场景：

```js
// 修改了自己的 provides.foo 也间接修改了 parent.provides.foo
provide('foo', 'foo2')
// 这时候取父亲的 provides.foo 发现就会被修改了
const foo = inject('foo')
```





### 实现

通过原型链的方式巧妙的进行设置：

```js
export function provide(key, value) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    let { provides } = currentInstance;

    const parentProvides = currentInstance.parent.provides;
    
		// 如果自己的 provides 和 parent.provides，那么就证明是初始化阶段
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }

    provides[key] = value;
  }
}
```



## inject 支持默认值

### 案例

在 inject 时设置一个默认值，默认值可能时一个函数或者一个原始值

```ts
// 组件 provide 和 inject 功能
import { h, provide, inject } from "../../lib/x-mini-vue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)]);
    // return h("div", {}, [h("p", {}, "Provider"), h(Consumer)]);
  },
};

const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "fooTwo");
    const foo = inject("foo");

    return {
      foo,
    };
  },
  render() {
    return h("div", {}, [
      h("p", {}, `ProviderTwo foo:${this.foo}`),
      h(Consumer),
    ]);
  },
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    // const baz = inject("baz", "bazDefault");
    const baz = inject("baz", () => "bazDefault");

    return {
      foo,
      bar,
      baz,
    };
  },

  render() {
    return h("div", {}, `Consumer: - ${this.foo} - ${this.bar}-${this.baz}`);
  },
};

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};

```

### 实现

```ts
export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    
    if (key in parentProvides) {
      return parentProvides[key];
    }else if(defaultValue){
      if(typeof defaultValue === "function"){
        return defaultValue()
      }
      return defaultValue
    }
  }
}
```
