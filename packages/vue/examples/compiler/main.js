import { baseParse } from "../../lib/compiler.es.js";

// 解析插值
// const ast1 = baseParse("{{ message }}");
// console.log('解析插值', ast1);

//  解析 element
// const ast2 = baseParse("<div></div>");
// console.log('解析 element', ast2);

//  解析 text
// const ast3 = baseParse("some text");
// console.log('解析 text', ast3);


// const ast4 = baseParse("<div>hi,{{message}}</div>");
// console.log(ast4);

const ast5 = baseParse("<div><p>hi</p>{{message}}</div>");
console.log(ast5);

// const ast6 = baseParse("<div><span></div>");
// console.log(ast6);