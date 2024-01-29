import type { DefaultTheme } from "vitepress";

export const nav: DefaultTheme.Config["nav"] = [
  {
    text: "环境搭建",
    link: "/environment/",
    activeMatch: "^/environment",
  },
  {
    text: "响应式",
    link: "/reactivity/",
    activeMatch: "^/reactivity",
  },
  {
    text: "运行时",
    link: "/runtime/",
    activeMatch: "^/runtime",
  },
  {
    text: "编译器",
    link: "/compiler/",
    activeMatch: "^/compiler",
  },
];
