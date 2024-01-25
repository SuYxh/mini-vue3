import { h } from "../../lib/x-mini-vue.esm.js";

export const App = {
  // 必须要写 render
  render() {
    console.log('this', this);
    // console.log('this.$el', this.$el);
    // ui
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
      },
      // "hi, " + this.msg
      // string
      // "hi, mini-vue"
      // Array
      [h("p", { class:"red"}, "hi"), h("p", {class:"blue"}, "mini-vue"), h("a", {class:"blue"}, this.msg)]
    );
  },

  setup() {
    return {
      msg: "x-mini-vue",
    };
  },
};
