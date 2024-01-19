// import { createWriteStream } from "node:fs";
// import { resolve } from "node:path";
// import { SitemapStream } from "sitemap";
import { defineConfig, PageData } from "vitepress";

import { head, nav, sidebar } from "./configs";

const links: { url: string; lastmod: PageData["lastUpdated"] }[] = [];

export default defineConfig({
  outDir: "../dist",
  base: process.env.APP_BASE_PATH || "/",

  lang: "zh-CN",
  title: "Mini Vue3",
  description:
    "vue3 学习与实现",
  head,

  lastUpdated: true,
  cleanUrls: true,

  /* markdown 配置 */
  markdown: {
    lineNumbers: true,
  },

  /* 主题配置 */
  themeConfig: {
    i18nRouting: false,

    logo: "/logo.png",

    nav,
    sidebar,
    /* 右侧大纲配置 */
    outline: {
      level: "deep",
      label: "本页目录",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/SuYxh/mini-vue3" }],

    footer: {
      message: "你相信光吗",
      copyright: "Copyright © 2023-present",
    },

    darkModeSwitchLabel: "外观",
    returnToTopLabel: "返回顶部",
    lastUpdatedText: "上次更新",

    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },
  },

  /* 生成站点地图 */
  transformHtml: (_, id, { pageData }) => {
    if (!/[\\/]404\.html$/.test(id))
      links.push({
        url: pageData.relativePath.replace(/((^|\/)index)?\.md$/, "$2"),
        lastmod: pageData.lastUpdated,
      });
  },
  // buildEnd: async ({ outDir }) => {
  //   const sitemap = new SitemapStream({ hostname: "https://note.ironc.cn/" });
  //   const writeStream = createWriteStream(resolve(outDir, "sitemap.xml"));
  //   sitemap.pipe(writeStream);
  //   links.forEach((link) => sitemap.write(link));
  //   sitemap.end();
  //   await new Promise((r) => writeStream.on("finish", r));
  // },
});
