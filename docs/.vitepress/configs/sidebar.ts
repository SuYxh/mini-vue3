import type { DefaultTheme } from "vitepress";

export const sidebar: DefaultTheme.Config["sidebar"] = {
  "/environment/": [
    {
      text: "环境搭建",
      collapsed: false,
      items: [
        { text: "概览", link: "/environment/index.md" },
        { text: "初始化环境", link: "/environment/0.初始化环境.md" },
      ],
    }
  ],
  "/reactivity/": [
    {
      text: "响应式",
      collapsed: false,
      items: [
        { text: "概览", link: "/reactivity/index" },
        { text: "依赖收集派发更新", link: "/reactivity/1.实现effect&reactive&依赖收集&触发依赖" },
        { text: "实现effect返回runner", link: "/reactivity/2.实现effect返回runner" },
        { text: "实现scheduler", link: "/reactivity/3.实现effect的scheduler功能" },
        { text: "实现stop", link: "/reactivity/4.实现effect的stop功能" },
        { text: "实现readonly", link: "/reactivity/5.实现readonly功能" },
        { text: "实现isReactive和isReadonly", link: "/reactivity/6.实现isReactive和isReadonly" },
        { text: "优化stop", link: "/reactivity/7.优化stop功能" },
        { text: "实现reactive和readonly的嵌套转换", link: "/reactivity/8.实现reactive和readonly的嵌套转换" },
        { text: "实现shallowReadonly", link: "/reactivity/9.实现shallowReadonly" },
        { text: "实现isProxy", link: "/reactivity/10.实现isProxy" },
        { text: "实现shallowReactive", link: "/reactivity/11.实现shallowReactive" },
        { text: "实现ref", link: "/reactivity/12.实现ref" },
        { text: "实现toRaw", link: "/reactivity/13.实现toRaw" },
        { text: "实现isRef和unRef", link: "/reactivity/14.实现isRef和unRef" },
        { text: "实现proxyRefs", link: "/reactivity/15.实现proxyRefs" },
        { text: "实现computed", link: "/reactivity/16.实现computed" },
      ],
    }
  ],
  "/runtime/": [
    {
      text: "运行时",
      collapsed: false,
      items: [
        { text: "概览", link: "/runtime/index" },
        { text: "组件的初始化流程", link: "/runtime/1. 组件的初始化流程" },
        { text: "配置 rollup", link: "/runtime/2. 配置 rollup" },
        { text: "组件的代理对象", link: "/runtime/3. 组件的代理对象" },
        { text: "实现 shapeFlags", link: "/runtime/4. 实现 shapeFlags" },
        { text: "实现注册事件功能", link: "/runtime/5. 实现注册事件功能" },
        { text: "实现组件的 props 功能", link: "/runtime/6. 实现组件的 props 功能" },
        { text: "实现组件的 emit 功能", link: "/runtime/7. 实现组件的 emit 功能" },
        { text: "实现组件的 slot 功能", link: "/runtime/8. 实现组件的 slot 功能" },
        { text: "实现 Fragment 和 Text 节点", link: "/runtime/9. 实现 Fragment 和 Text 节点" },
        { text: "实现 getCurrentInstance", link: "/runtime/10. 实现 getCurrentInstance" },
        { text: "实现 provide 和 inject", link: "/runtime/11. 实现 provide 和 inject" },
        { text: "实现 customRenderer", link: "/runtime/12. 实现 customRenderer" },
        { text: "初始化 element 更新流程", link: "/runtime/13. 初始化 element 更新流程" },
        { text: "更新 props", link: "/runtime/14. 更新 props" },
        { text: "更新 children（一）", link: "/runtime/15. 更新 children（一）" },
        { text: "更新 children（二）", link: "/runtime/16. 更新 children（二）" },
        { text: "更新 children（三）", link: "/runtime/17. 更新 children（三）" },
        { text: "更新 children（四）", link: "/runtime/18. 更新 children（四）" },
        { text: "更新组件", link: "/runtime/19. 更新组件" },
        { text: "视图异步更新 && nextTick API", link: "/runtime/20. 视图异步更新 && nextTick API" },
      ],
    }
  ],
  "/compiler/": [
    {
      text: "编译器",
      collapsed: false,
      items: [
        { text: "简介", link: "/compiler/index" },
        { text: "编译模块概述", link: "/compiler/1-编译模块概述" },
        { text: "实现解析插值表达式", link: "/compiler/2-实现解析插值表达式" },
        { text: "实现解析elemen标签", link: "/compiler/3-实现解析elemen标签" },
        { text: "实现解析text", link: "/compiler/4-实现解析text" },
        { text: "三种类型联合解析", link: "/compiler/5-三种类型联合解析" },
        { text: "从有限状态机的角度看parse原理", link: "/compiler/6-从有限状态机的角度看parse原理" },
        { text: "transform模块", link: "/compiler/7-transform模块" },
        { text: "实现代码生成string类型", link: "/compiler/8-实现代码生成string类型" },
        { text: "实现代码生成插值类型", link: "/compiler/9-实现代码生成插值类型" },
        { text: "codegen生成element", link: "/compiler/10-codegen生成element" },
        { text: "codegen生成联合3种类型", link: "/compiler/11-codegen生成联合3种类型" },
        { text: "实现template编译为render", link: "/compiler/12-实现template编译为render" },
      ],
    }
  ],
};
