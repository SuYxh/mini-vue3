import pkg from "./package.json";
import typescript from "@rollup/plugin-typescript";
export default [
  {
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
  },
  {
    input: "./src/compiler-core/index.ts",
    output: [
      {
        format: "cjs",
        file: './lib/compiler.cjs.js',
        sourcemap: true
      },
      {
        format: "es",
        file: './lib/compiler.es.js',
        sourcemap: true
      }
    ],
  
    plugins: [typescript()],
  },
]
