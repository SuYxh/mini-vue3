import { h, renderSlots } from "../../lib/x-mini-vue.esm.js";

export const Foo = {
  render() {
    console.log("Foo-this", this);
    const age = 18
    const foo = h("p", {}, "foo");

    // 基础插槽的使用
    // return h("div", {}, [
    //   foo,
    //   renderSlots(this.$slots),
    // ]);

    // 具名插槽 + 作用域插槽 的使用
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
  setup() {
    return {};
  },
};
