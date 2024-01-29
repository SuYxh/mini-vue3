import { baseParse } from "../../lib/compiler.es.js";
const ast = baseParse("{{ message }}");
console.log(ast);