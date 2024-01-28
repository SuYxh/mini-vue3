import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";
import { effect } from '../reactivity/effect';
import { EMPTY_OBJ } from "../shared";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container) {
    patch(null, vnode, container, null);
  }

  // n1 - 之前的虚拟节点，如果不存在说明是初始化流程
  // n2 - 新的虚拟节点
  function patch(n1, n2, container, parentComponent) {
    const { type, shapeFlag } = n2;

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    // n1 不存在说明是初始化
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 这里需要传递 el，我们需要考虑一点，到这一层的时候
    // n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
    // 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent);
    patchProps(el, oldProps, newProps);
  }

  // n1 是老 vnode
  // n2 是新 vnode
  function patchChildren(n1, n2, container, parentComponent) {
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    // 新的节点是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的节点是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 把老的 children 清空
        unmountChildren(n1.children);
      }

      // 老的节点是文本 【老的节点是数组是数组的时候也会走这里哦】
      if (c1 !== c2) {
        // 设置新的 text
        hostSetElementText(container, c2);
      }
    } else {
      // 老的： text =>  新的： array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 把老的 text 删除掉
        hostSetElementText(container, "");
        // 然后渲染新的节点
        mountChildren(c2, container, parentComponent);
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent);
      }
    }
  }

  function patchKeyedChildren(c1, c2, container, parentComponent) {
    const l2 = c2.length;
    // 声明三个指针，e1 是老节点最后一个元素，e2 是新节点最后一个元素，i 是当前对比的元素
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSomeVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 左侧 -- 新旧节点头部对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      
      // 如果当前对比的 vnode 相同，就进入 patch 阶段，如果不相等，直接中断掉这个循环
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent);
      } else {
        break;
      }

      i ++
    }

    // 右侧 -- 新旧节点尾部对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    // 新的比老的多，需要进行创建
    // 新节点比旧节点长，在尾部添加新节点 
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent);
          i++;
        }
      }
    }

    console.log('i', i, e1, e2);
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }


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

  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));

    const { children, shapeFlag } = vnode;

    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent);
    }

    // props
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }
   
    hostInsert(el, container);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(initialVNode: any, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    effect(() => {
      if (!instance.isMounted) {
        console.log("init");
        const { proxy } = instance;
        // 将虚拟节点放在实例上，在更新的时候会拿出来对比
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance);
        initialVNode.el = subTree.el;
        // 更新之后打一个标识
        instance.isMounted = true;
      } else {
        console.log("update");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        // 从实例上取出之前放置的虚拟节点 subTree，也就是在初始化时进行的赋值
        const prevSubTree = instance.subTree;
        // 更新组件实例上的 subTree
        instance.subTree = subTree;
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
