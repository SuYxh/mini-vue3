'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context));
}
function parseChildren(context) {
    const nodes = [];
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
        node = parseInterpolation(context);
    }
    else if (s[0] === "<") {
        if (/[a-z]/i.test(s[1])) {
            node = parseElement(context);
        }
    }
    if (!node) {
        node = parseText(context);
    }
    nodes.push(node);
    return nodes;
}
function parseText(context) {
    // 1. 获取content
    const content = parseTextData(context, context.source.length);
    return {
        type: 3 /* TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    // 2. 推进
    advanceBy(context, length);
    return content;
}
function parseElement(context) {
    const element = parseTag(context, 0 /* Start */);
    parseTag(context, 1 /* End */);
    return element;
}
function parseTag(context, type) {
    // <div></div>
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* End */)
        return;
    return {
        type: 2 /* ELEMENT */,
        tag,
    };
}
function parseInterpolation(context) {
    // {{message}}
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
    };
}
function createParserContext(content) {
    return {
        source: content,
    };
}

exports.baseParse = baseParse;
//# sourceMappingURL=compiler.cjs.js.map
