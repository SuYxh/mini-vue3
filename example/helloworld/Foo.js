import { h } from "../../lib/x-mini-vue.esm.js";

export const Foo = {
  setup(props) {
    console.log('Foo-props-1',props)
    props.count++
    console.log('Foo-props-2',props)
  },
  render() {
    return h('div', {}, 'Hello Foo!  counter: ' + this.counter)
  },
}