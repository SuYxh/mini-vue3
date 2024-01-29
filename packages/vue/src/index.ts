// mini-vue 出口
// export * from "./runtime-dom/index"
// export * from "./reactivity"

// mini-vue 出口
export * from "@x-mini-vue/runtime-dom";
import { baseCompile } from "@x-mini-vue/compiler-core";
import * as runtimeDom from "@x-mini-vue/runtime-dom";
import { registerRuntimeCompiler } from "@x-mini-vue/runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
