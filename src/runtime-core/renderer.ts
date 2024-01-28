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
    patch(null, vnode, container, null, null);
  }

  // n1 - 之前的虚拟节点，如果不存在说明是初始化流程
  // n2 - 新的虚拟节点
  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2;

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processElement(n1, n2: any, container: any, parentComponent, anchor) {
    // n1 不存在说明是初始化
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 这里需要传递 el，我们需要考虑一点，到这一层的时候
    // n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
    // 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  // n1 是老 vnode
  // n2 是新 vnode
  function patchChildren(n1, n2, container, parentComponent, anchor) {
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
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
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
        patch(n1, n2, container, parentComponent, parentAnchor);
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
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    // 新的比老的多，需要进行创建
    // 新节点比旧节点长，在尾部添加新节点 
    // 新节点比旧节点长，在头部插入新节点，此时循环判断条件一样，所以需要一个标识是在尾部添加还是在头部插入，同时还需要修改 runtime-dom 中的 insert 方法
    if (i > e1) {
      if (i <= e2) {
        // nextPos 就是需要追加元素的索引
        // 如果这个新元素的索引已经超过了新节点的长度，那么说明是追加到尾部
        // anchor = null，如果没有超过新节点的长度，那么就是插入到某个位置
        // 此时 anchor = c2[nextPos].el，也就是这个新加元素的下一个元素
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;

        // console.log('nextPos', nextPos);
        // console.log('c2', c2);
        // console.log('c2[nextPos]', c2[nextPos]);
        // console.log('c2[nextPos].el', c2[nextPos].el);

        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
    
      // 中间对比
      let s1 = i;
      let s2 = i;

      const toBePatched = e2 - s2 + 1;
      let patched = 0;

      // 添加映射
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 循环老的，根据映射找
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        // 所有的新节点都对比结束后，老节点中剩余没有对比的节点直接删掉
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        // 如果当前老的子节点的 key 不是空的，因为用户可能不会写
        if (prevChild.key != null) {
          // 就去映射表中找到新的对应的 newIndex
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          //  如果老的子节点的 key 是空的，还需要再次遍历新节点，找到与当前老节点相同的 VNode，并将其索引赋给 
          for (let j = s2; j < e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j;

              break;
            }
          }
        }
        // 如果新节点中不存在对应的老节点，那么就删除掉老节点
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          // 如果存在，就进入到 patch 阶段，继续递归对比
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
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

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));

    const { children, shapeFlag } = vnode;

    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor);
    }

    // props
    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }
   
    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(initialVNode: any, container, parentComponent, anchor) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    effect(() => {
      if (!instance.isMounted) {
        console.log("init");
        const { proxy } = instance;
        // 将虚拟节点放在实例上，在更新的时候会拿出来对比
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance, anchor);
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
        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
