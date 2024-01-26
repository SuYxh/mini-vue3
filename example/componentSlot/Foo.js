import { h, renderSlots } from "../../lib/x-mini-vue.esm.js";

export const Foo = {
  
  render() {
    console.log('Foo-this', this);

    const foo = h("p", {}, "foo");
    // return h("div", {}, [foo]);
    return h("div", {}, [foo, renderSlots(this.$slots)]);
  },
  setup() {
    return {};
  },
};
