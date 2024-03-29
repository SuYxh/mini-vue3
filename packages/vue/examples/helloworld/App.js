import { h } from "../../dist/x-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  // 必须要写 render
  render() {
    console.log("this", this);
    // console.log('this.$el', this.$el);
    // ui
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
        onClick() {
          console.log("click");
        },
        onMousedown() {
          console.log("mousedown");
        },
      },
      // "hi, " + this.msg
      // string
      // "hi, mini-vue"
      // Array
      // [h("p", { class:"red"}, "hi"), h("p", {class:"blue"}, "mini-vue"), h("a", {class:"blue"}, this.msg)]
      [
        // 挂载一个组件
        h(Foo, {
          class: "blue",
          counter: 0,
          onAdd(a, b) {
            console.log("onAdd", a, b);
          },
          onAddFoo() {
            console.log("onAddFoo");
          },
        }),
      ]
    );
  },

  setup() {
    return {
      msg: "x-mini-vue",
    };
  },
};
