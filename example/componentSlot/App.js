import { h } from "../../lib/x-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  render() {
    const app = h("div", {}, "App");
    // 基础插槽使用
    // const foo = h(Foo, {}, h('p', {}, '123'));
    // 基础插槽使用 - 传递多个元素
    // const foo = h(Foo, {}, [h('p', {}, '123'), h('p', {}, '234')]);
    // 具名插槽 + 作用域插槽的使用
    const foo = h(Foo, {}, {
      header: ({age}) => h('p', {}, 'header' + age),
      footer: () => h('p', {}, 'footer'),
    });

    return h("div", {}, [app, foo]);
  },

  setup() {
    return {};
  },
};
