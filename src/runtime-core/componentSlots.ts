import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  // 插槽的不同形式对应的 children 不同，如下：
  // 1、h(Foo, {}, h('p', {}, '123')); ==> children:  {"type":"p","props":{},"children":"123","shapeFlag":5,"el":null}
  // 2、h(Foo, {}, [h('p', {}, '123'), h('p', {}, '234')]); ==> children: [{"type":"p","props":{},"children":"123","shapeFlag":5,"el":null},{"type":"p","props":{},"children":"234","shapeFlag":5,"el":null}]
  // 3、 const foo = h(Foo, {}, { header: ({age}) => h('p', {}, 'header' + age), footer: () => h('p', {}, 'footer'), }); 其 children 形式如下：
  //    children: ==>
  //      {
  //        footer :  () => h('p', {}, 'footer')
  //        header :  ({age}) => h('p', {}, 'header' + age)
  //      } 

  const { vnode } = instance;
  // 是插槽的时候才需要处理
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    // 如果 children 存在 shapeFlag 属性，说明他是一个 vnode，此时用户应该是这样使用插槽的：
    // h(Foo, {}, h('p', {}, '123'));
    if (children.shapeFlag) {
      instance.slots.default = [children]
      return
    }

    // 如果 children 是一个数组，此时用户应该是这样使用插槽的：
    // h(Foo, {}, [h('p', {}, '123'), h('p', {}, '234')]);
    // children 的形式为： [{"type":"p","props":{},"children":"123","shapeFlag":5,"el":null},{"type":"p","props":{},"children":"234","shapeFlag":5,"el":null}]
    if (Array.isArray(children)) {
      instance.slots.default = children
      return
    }

    // 到这里说明 children 是一个对象，用户应该是使用的 具名插槽或者是作用域插槽
    // 具体形式请看上方注释 《插槽的不同形式对应的 children 不同》
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key]
    // 具名插槽
    /**
     * 具名插槽 对应的使用方式
     * const foo = h(Foo, {}, {
        header:  h('p', {}, 'header'),
        footer:  h('p', {}, 'footer'),
      });

      其实 normalizeSlotValue(value); 中的 value 就是 h('p', {}, 'header') 
     */
    // slots[key] = normalizeSlotValue(value);
    // 作用域插槽使用函数

     /**
     * 作用域插槽对应的使用方式
     * const foo = h(Foo, {}, {
        header: ({age}) => h('p', {}, 'header' + age),
        footer: () => h('p', {}, 'footer'),
      });

      其实 slots[key] = (props) => normalizeSlotValue(value(props)); 中的 value(props) 就是 header 或者 footer 对应的函数
     */
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
