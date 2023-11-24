import { parse, parseFrag } from "./parser.ts";
import { CTOR_KEY } from "./constructor-lock.ts";
import { Comment, NodeType, Text } from "./dom/node.ts";
import { DocumentType } from "./dom/document.ts";
import { DocumentFragment } from "./dom/document-fragment.ts";
import { HTMLTemplateElement } from "./dom/elements/html-template-element.ts";
import { Element } from "./dom/element.ts";
export function nodesFromString(html) {
    const parsed = JSON.parse(parse(html));
    const node = nodeFromArray(parsed, null);
    return node;
}
export function fragmentNodesFromString(html, contextLocalName) {
    const parsed = JSON.parse(parseFrag(html, contextLocalName));
    const node = nodeFromArray(parsed, null);
    return node;
}
function nodeFromArray(data, parentNode) {
    // For reference only:
    // type node = [NodeType, nodeName, attributes, node[]]
    //             | [NodeType, characterData]
    // <template> element gets special treatment, until
    // we implement all the HTML elements
    if (data[1] === "template") {
        const content = nodeFromArray(data[3], null);
        const contentFrag = new DocumentFragment();
        const fragMutator = contentFrag._getChildNodesMutator();
        for (const child of content.childNodes){
            fragMutator.push(child);
            child._setParent(contentFrag);
        }
        return new HTMLTemplateElement(parentNode, data[2], CTOR_KEY, contentFrag);
    }
    const elm = new Element(data[1], parentNode, data[2], CTOR_KEY);
    const childNodes = elm._getChildNodesMutator();
    let childNode;
    for (const child of data.slice(3)){
        switch(child[0]){
            case NodeType.TEXT_NODE:
                childNode = new Text(child[1]);
                childNode.parentNode = childNode.parentElement = elm;
                childNodes.push(childNode);
                break;
            case NodeType.COMMENT_NODE:
                childNode = new Comment(child[1]);
                childNode.parentNode = childNode.parentElement = elm;
                childNodes.push(childNode);
                break;
            case NodeType.DOCUMENT_NODE:
            case NodeType.ELEMENT_NODE:
                nodeFromArray(child, elm);
                break;
            case NodeType.DOCUMENT_TYPE_NODE:
                childNode = new DocumentType(child[1], child[2], child[3], CTOR_KEY);
                childNode.parentNode = childNode.parentElement = elm;
                childNodes.push(childNode);
                break;
        }
    }
    return elm;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40My9zcmMvZGVzZXJpYWxpemUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGFyc2UsIHBhcnNlRnJhZyB9IGZyb20gXCIuL3BhcnNlci50c1wiO1xuaW1wb3J0IHsgQ1RPUl9LRVkgfSBmcm9tIFwiLi9jb25zdHJ1Y3Rvci1sb2NrLnRzXCI7XG5pbXBvcnQgeyBDb21tZW50LCBOb2RlLCBOb2RlVHlwZSwgVGV4dCB9IGZyb20gXCIuL2RvbS9ub2RlLnRzXCI7XG5pbXBvcnQgeyBEb2N1bWVudFR5cGUgfSBmcm9tIFwiLi9kb20vZG9jdW1lbnQudHNcIjtcbmltcG9ydCB7IERvY3VtZW50RnJhZ21lbnQgfSBmcm9tIFwiLi9kb20vZG9jdW1lbnQtZnJhZ21lbnQudHNcIjtcbmltcG9ydCB7IEhUTUxUZW1wbGF0ZUVsZW1lbnQgfSBmcm9tIFwiLi9kb20vZWxlbWVudHMvaHRtbC10ZW1wbGF0ZS1lbGVtZW50LnRzXCI7XG5pbXBvcnQgeyBFbGVtZW50IH0gZnJvbSBcIi4vZG9tL2VsZW1lbnQudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVzRnJvbVN0cmluZyhodG1sOiBzdHJpbmcpOiBOb2RlIHtcbiAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShwYXJzZShodG1sKSk7XG4gIGNvbnN0IG5vZGUgPSBub2RlRnJvbUFycmF5KHBhcnNlZCwgbnVsbCk7XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcmFnbWVudE5vZGVzRnJvbVN0cmluZyhcbiAgaHRtbDogc3RyaW5nLFxuICBjb250ZXh0TG9jYWxOYW1lOiBzdHJpbmcsXG4pOiBOb2RlIHtcbiAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShwYXJzZUZyYWcoaHRtbCwgY29udGV4dExvY2FsTmFtZSkpO1xuICBjb25zdCBub2RlID0gbm9kZUZyb21BcnJheShwYXJzZWQsIG51bGwpO1xuXG4gIHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiBub2RlRnJvbUFycmF5KGRhdGE6IGFueSwgcGFyZW50Tm9kZTogTm9kZSB8IG51bGwpOiBOb2RlIHtcbiAgLy8gRm9yIHJlZmVyZW5jZSBvbmx5OlxuICAvLyB0eXBlIG5vZGUgPSBbTm9kZVR5cGUsIG5vZGVOYW1lLCBhdHRyaWJ1dGVzLCBub2RlW11dXG4gIC8vICAgICAgICAgICAgIHwgW05vZGVUeXBlLCBjaGFyYWN0ZXJEYXRhXVxuXG4gIC8vIDx0ZW1wbGF0ZT4gZWxlbWVudCBnZXRzIHNwZWNpYWwgdHJlYXRtZW50LCB1bnRpbFxuICAvLyB3ZSBpbXBsZW1lbnQgYWxsIHRoZSBIVE1MIGVsZW1lbnRzXG4gIGlmIChkYXRhWzFdID09PSBcInRlbXBsYXRlXCIpIHtcbiAgICBjb25zdCBjb250ZW50ID0gbm9kZUZyb21BcnJheShkYXRhWzNdLCBudWxsKTtcbiAgICBjb25zdCBjb250ZW50RnJhZyA9IG5ldyBEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgY29uc3QgZnJhZ011dGF0b3IgPSBjb250ZW50RnJhZy5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY29udGVudC5jaGlsZE5vZGVzKSB7XG4gICAgICBmcmFnTXV0YXRvci5wdXNoKGNoaWxkKTtcbiAgICAgIGNoaWxkLl9zZXRQYXJlbnQoY29udGVudEZyYWcpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgSFRNTFRlbXBsYXRlRWxlbWVudChcbiAgICAgIHBhcmVudE5vZGUsXG4gICAgICBkYXRhWzJdLFxuICAgICAgQ1RPUl9LRVksXG4gICAgICBjb250ZW50RnJhZyxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZWxtID0gbmV3IEVsZW1lbnQoZGF0YVsxXSwgcGFyZW50Tm9kZSwgZGF0YVsyXSwgQ1RPUl9LRVkpO1xuICBjb25zdCBjaGlsZE5vZGVzID0gZWxtLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICBsZXQgY2hpbGROb2RlOiBOb2RlO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgZGF0YS5zbGljZSgzKSkge1xuICAgIHN3aXRjaCAoY2hpbGRbMF0pIHtcbiAgICAgIGNhc2UgTm9kZVR5cGUuVEVYVF9OT0RFOlxuICAgICAgICBjaGlsZE5vZGUgPSBuZXcgVGV4dChjaGlsZFsxXSk7XG4gICAgICAgIGNoaWxkTm9kZS5wYXJlbnROb2RlID0gY2hpbGROb2RlLnBhcmVudEVsZW1lbnQgPSA8RWxlbWVudD4gZWxtO1xuICAgICAgICBjaGlsZE5vZGVzLnB1c2goY2hpbGROb2RlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTm9kZVR5cGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICBjaGlsZE5vZGUgPSBuZXcgQ29tbWVudChjaGlsZFsxXSk7XG4gICAgICAgIGNoaWxkTm9kZS5wYXJlbnROb2RlID0gY2hpbGROb2RlLnBhcmVudEVsZW1lbnQgPSA8RWxlbWVudD4gZWxtO1xuICAgICAgICBjaGlsZE5vZGVzLnB1c2goY2hpbGROb2RlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTm9kZVR5cGUuRE9DVU1FTlRfTk9ERTpcbiAgICAgIGNhc2UgTm9kZVR5cGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICBub2RlRnJvbUFycmF5KGNoaWxkLCBlbG0pO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBOb2RlVHlwZS5ET0NVTUVOVF9UWVBFX05PREU6XG4gICAgICAgIGNoaWxkTm9kZSA9IG5ldyBEb2N1bWVudFR5cGUoY2hpbGRbMV0sIGNoaWxkWzJdLCBjaGlsZFszXSwgQ1RPUl9LRVkpO1xuICAgICAgICBjaGlsZE5vZGUucGFyZW50Tm9kZSA9IGNoaWxkTm9kZS5wYXJlbnRFbGVtZW50ID0gPEVsZW1lbnQ+IGVsbTtcbiAgICAgICAgY2hpbGROb2Rlcy5wdXNoKGNoaWxkTm9kZSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbG07XG59XG4iXSwibmFtZXMiOltd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