---
layout: home
layoutClass: "m-home-layout"

hero:
  name: mini-vue3
  text: 实现vue3核心模块
  tagline: 构建自己的 mini-vue3
  image:
    src: /logo.png
    alt: mini-vue3
  actions:
    - text: 开始
      link: /reactivity/
    # - text: 开发指南
    #   link: /development/
    #   theme: alt
features:
  - icon: 📖
    title: Reactivity
    details: Vue 3 的响应式系统使用 ES6 的 Proxy 特性来追踪和响应数据状态的改变，为构建动态用户界面提供了高效的数据绑定和更新机制
    link: /reactivity/
    linkText: 开始学习
  - icon: 🐞
    title: Runtime
    details: Vue 3 的运行时环境负责处理模板到真实 DOM 的渲染，组件的生命周期管理，以及通过优化和 Tree-shaking 提供更快速、轻量级的应用性能
    link: /runtime/
    linkText: 开始学习
  - icon: 💯
    title: 编译器
    details: Vue 3 的编译器将模板代码转换成高效的 JavaScript 渲染函数，通过编译时优化提高应用运行时的性能和效率
    link: /compiler/
    linkText: 开始学习
---

<style>
/*爱的魔力转圈圈*/
.m-home-layout .image-src:hover {
  transform: translate(-50%, -50%) rotate(666turn);
  transition: transform 59s 1s cubic-bezier(0.3, 0, 0.8, 1);
}

.m-home-layout .details small {
  opacity: 0.8;
}
</style>
