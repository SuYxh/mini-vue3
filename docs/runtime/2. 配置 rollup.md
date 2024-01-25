# 使用`rollup`

代码已经写完了，接下来就是打包相关的工作了。`rollup` 更适合去打包一个库，`webpack` 更多用于应用的打包。

## 安装 `rollup`

```bash
yarn add -D rollup
```

```bash
# 安装 typescript 插件
# https://npmjs.com/package/@rollup/plugin-typescript
yarn add -D @rollup/plugin-typescript
```
```bash
# 安装 tslib
yarn add -D tslib 
```


## 配置 `rollup`

 `rollup.config.js` 文件内容如下：

> 这里开启 sourcemap 方便调试

```js
import pkg from "./package.json";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "./src/index.ts",
  output: [
    {
      format: "cjs",
      file: pkg.main,
      sourcemap: true
    },
    {
      format: "es",
      file: pkg.module,
      sourcemap: true
    }
  ],

  plugins: [typescript()],
};

```

## 修改`package.json` 

在 `rollup.config.js` 文件中看到有从`package.json `文件中导出信息：

```js
{
	"main": "lib/x-mini-vue.cjs.js",
  "module": "lib/x-mini-vue.esm.js",
  "scripts": {
    "build": "rollup -c -w rollup.config.js",
  },
}
```

其实就是将打包后的文件放在 `package.json `文件中去进行管理，还有就是增加一个打包命令。



## 打包

这里打包的时候可能会有一个 `warning`，只需要把 `tsconfig.json` 中的 `module` 改为 `esnext` 即可。

