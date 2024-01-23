import { h } from "../../lib/x-mini-vue.esm";

export const App = {
  // 必须要写 render
  render() {
    // ui
    return h("div", "hi, " + this.msg);
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
