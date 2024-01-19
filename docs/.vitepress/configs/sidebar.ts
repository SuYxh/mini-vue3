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
      ],
    }
  ],
  "/compiler/": [
    {
      text: "编译器",
      collapsed: false,
      items: [
        { text: "概览", link: "/compiler/index" },
      ],
    }
  ],
};
