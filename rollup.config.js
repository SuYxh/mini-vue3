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
