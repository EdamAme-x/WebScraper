import { Node, nodesAndTextNodes, NodeType } from "./node.ts";
import UtilTypes from "./utils-types.ts";
export const upperCaseCharRe = /[A-Z]/;
export const lowerCaseCharRe = /[a-z]/;
/**
 * Convert JS property name to dataset attribute name without
 * validation
 */ export function getDatasetHtmlAttrName(name) {
    let attributeName = "data-";
    for (const char of name){
        if (upperCaseCharRe.test(char)) {
            attributeName += "-" + char.toLowerCase();
        } else {
            attributeName += char;
        }
    }
    return attributeName;
}
export function getDatasetJavascriptName(name) {
    let javascriptName = "";
    let prevChar = "";
    for (const char of name.slice("data-".length)){
        if (prevChar === "-" && lowerCaseCharRe.test(char)) {
            javascriptName += char.toUpperCase();
            prevChar = "";
        } else {
            javascriptName += prevChar;
            prevChar = char;
        }
    }
    return javascriptName + prevChar;
}
export function getElementsByClassName(element, className, search) {
    for (const child of element.childNodes){
        if (child.nodeType === NodeType.ELEMENT_NODE) {
            const classList = className.trim().split(/\s+/);
            let matchesCount = 0;
            for (const singleClassName of classList){
                if (child.classList.contains(singleClassName)) {
                    matchesCount++;
                }
            }
            // ensure that all class names are present
            if (matchesCount === classList.length) {
                search.push(child);
            }
            getElementsByClassName(child, className, search);
        }
    }
    return search;
}
function getOuterHTMLOpeningTag(parentElement) {
    return "<" + parentElement.localName + getElementAttributesString(parentElement) + ">";
}
const voidElements = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);
/**
 * .innerHTML/.outerHTML implementation without recursion to avoid stack
 * overflows
 */ export function getOuterOrInnerHtml(parentElement, asOuterHtml) {
    let outerHTMLOpeningTag = "";
    let outerHTMLClosingTag = "";
    let innerHTML = "";
    if (asOuterHtml) {
        outerHTMLOpeningTag = getOuterHTMLOpeningTag(parentElement);
        outerHTMLClosingTag = `</${parentElement.localName}>`;
        if (voidElements.has(parentElement.localName)) {
            return outerHTMLOpeningTag;
        }
    }
    const initialChildNodes = parentElement.localName === "template" ? parentElement.content.childNodes : parentElement.childNodes;
    const childNodeDepth = [
        initialChildNodes
    ];
    const indexDepth = [
        0
    ];
    const closingTagDepth = [
        outerHTMLClosingTag
    ];
    let depth = 0;
    depthLoop: while(depth > -1){
        const child = childNodeDepth[depth][indexDepth[depth]];
        if (child) {
            switch(child.nodeType){
                case NodeType.ELEMENT_NODE:
                    {
                        innerHTML += getOuterHTMLOpeningTag(child);
                        const childLocalName = child.localName;
                        // Void elements don't have a closing tag nor print innerHTML
                        if (!voidElements.has(childLocalName)) {
                            if (childLocalName === "template") {
                                childNodeDepth.push(child.content.childNodes);
                            } else {
                                childNodeDepth.push(child.childNodes);
                            }
                            indexDepth.push(0);
                            closingTagDepth.push(`</${childLocalName}>`);
                            depth++;
                            continue depthLoop;
                        }
                        break;
                    }
                case NodeType.COMMENT_NODE:
                    innerHTML += `<!--${child.data}-->`;
                    break;
                case NodeType.TEXT_NODE:
                    // Special handling for rawtext-like elements.
                    switch(child.parentNode.localName){
                        case "style":
                        case "script":
                        case "xmp":
                        case "iframe":
                        case "noembed":
                        case "noframes":
                        case "plaintext":
                            innerHTML += child.data;
                            break;
                        default:
                            // escaping: https://html.spec.whatwg.org/multipage/parsing.html#escapingString
                            innerHTML += child.data.replace(/&/g, "&amp;").replace(/\xA0/g, "&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            break;
                    }
                    break;
            }
        } else {
            depth--;
            indexDepth.pop();
            childNodeDepth.pop();
            innerHTML += closingTagDepth.pop();
        }
        // Go to next child
        indexDepth[depth]++;
    }
    // If innerHTML is requested then the opening tag should be an empty string
    return outerHTMLOpeningTag + innerHTML;
}
// FIXME: This uses the incorrect .attributes implementation, it
// should probably be changed when .attributes is fixed
export function getElementAttributesString(element) {
    let out = "";
    for (const attribute of element.getAttributeNames()){
        out += ` ${attribute.toLowerCase()}`;
        // escaping: https://html.spec.whatwg.org/multipage/parsing.html#escapingString
        out += `="${element.getAttribute(attribute).replace(/&/g, "&amp;").replace(/\xA0/g, "&nbsp;").replace(/"/g, "&quot;")}"`;
    }
    return out;
}
export function insertBeforeAfter(node, nodes, before) {
    const parentNode = node.parentNode;
    const mutator = parentNode._getChildNodesMutator();
    // Find the previous/next sibling to `node` that isn't in `nodes` before the
    // nodes in `nodes` are removed from their parents.
    let viablePrevNextSibling = null;
    {
        const difference = before ? -1 : +1;
        for(let i = mutator.indexOf(node) + difference; 0 <= i && i < parentNode.childNodes.length; i += difference){
            if (!nodes.includes(parentNode.childNodes[i])) {
                viablePrevNextSibling = parentNode.childNodes[i];
                break;
            }
        }
    }
    nodes = nodesAndTextNodes(nodes, parentNode);
    let index;
    if (viablePrevNextSibling) {
        index = mutator.indexOf(viablePrevNextSibling) + (before ? 1 : 0);
    } else {
        index = before ? 0 : parentNode.childNodes.length;
    }
    mutator.splice(index, 0, ...nodes);
}
export function isDocumentFragment(node) {
    let obj = node;
    if (!(obj && typeof obj === "object")) {
        return false;
    }
    while(true){
        switch(obj.constructor){
            case UtilTypes.DocumentFragment:
                return true;
            case Node:
            case UtilTypes.Element:
                return false;
            // FIXME: We should probably throw here?
            case Object:
            case null:
            case undefined:
                return false;
            default:
                obj = Reflect.getPrototypeOf(obj);
        }
    }
}
/**
 * Sets the new parent for the children via _setParent() on all
 * the child nodes and removes them from the DocumentFragment's
 * childNode list.
 *
 * A helper function for appendChild, etc. It should be called
 * _after_ the children are already pushed onto the new parent's
 * childNodes.
 */ export function moveDocumentFragmentChildren(fragment, newParent) {
    const childCount = fragment.childNodes.length;
    for (const child of fragment.childNodes){
        child._setParent(newParent);
    }
    const mutator = fragment._getChildNodesMutator();
    mutator.splice(0, childCount);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40My9zcmMvZG9tL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1lbnQsIE5vZGUsIG5vZGVzQW5kVGV4dE5vZGVzLCBOb2RlVHlwZSwgVGV4dCB9IGZyb20gXCIuL25vZGUudHNcIjtcbmltcG9ydCB7IE5vZGVMaXN0IH0gZnJvbSBcIi4vbm9kZS1saXN0LnRzXCI7XG5pbXBvcnQgVXRpbFR5cGVzIGZyb20gXCIuL3V0aWxzLXR5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEVsZW1lbnQgfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEhUTUxUZW1wbGF0ZUVsZW1lbnQgfSBmcm9tIFwiLi9lbGVtZW50cy9odG1sLXRlbXBsYXRlLWVsZW1lbnQudHNcIjtcbmltcG9ydCB0eXBlIHsgRG9jdW1lbnRGcmFnbWVudCB9IGZyb20gXCIuL2RvY3VtZW50LWZyYWdtZW50LnRzXCI7XG5cbmV4cG9ydCBjb25zdCB1cHBlckNhc2VDaGFyUmUgPSAvW0EtWl0vO1xuZXhwb3J0IGNvbnN0IGxvd2VyQ2FzZUNoYXJSZSA9IC9bYS16XS87XG4vKipcbiAqIENvbnZlcnQgSlMgcHJvcGVydHkgbmFtZSB0byBkYXRhc2V0IGF0dHJpYnV0ZSBuYW1lIHdpdGhvdXRcbiAqIHZhbGlkYXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGFzZXRIdG1sQXR0ck5hbWUobmFtZTogc3RyaW5nKTogYGRhdGEtJHtzdHJpbmd9YCB7XG4gIGxldCBhdHRyaWJ1dGVOYW1lOiBgZGF0YS0ke3N0cmluZ31gID0gXCJkYXRhLVwiO1xuICBmb3IgKGNvbnN0IGNoYXIgb2YgbmFtZSkge1xuICAgIGlmICh1cHBlckNhc2VDaGFyUmUudGVzdChjaGFyKSkge1xuICAgICAgYXR0cmlidXRlTmFtZSArPSBcIi1cIiArIGNoYXIudG9Mb3dlckNhc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXR0cmlidXRlTmFtZSArPSBjaGFyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGVOYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGF0YXNldEphdmFzY3JpcHROYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBqYXZhc2NyaXB0TmFtZSA9IFwiXCI7XG4gIGxldCBwcmV2Q2hhciA9IFwiXCI7XG4gIGZvciAoY29uc3QgY2hhciBvZiBuYW1lLnNsaWNlKFwiZGF0YS1cIi5sZW5ndGgpKSB7XG4gICAgaWYgKHByZXZDaGFyID09PSBcIi1cIiAmJiBsb3dlckNhc2VDaGFyUmUudGVzdChjaGFyKSkge1xuICAgICAgamF2YXNjcmlwdE5hbWUgKz0gY2hhci50b1VwcGVyQ2FzZSgpO1xuICAgICAgcHJldkNoYXIgPSBcIlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBqYXZhc2NyaXB0TmFtZSArPSBwcmV2Q2hhcjtcbiAgICAgIHByZXZDaGFyID0gY2hhcjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gamF2YXNjcmlwdE5hbWUgKyBwcmV2Q2hhcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gIGVsZW1lbnQ6IGFueSxcbiAgY2xhc3NOYW1lOiBzdHJpbmcsXG4gIHNlYXJjaDogTm9kZVtdLFxuKTogTm9kZVtdIHtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBlbGVtZW50LmNoaWxkTm9kZXMpIHtcbiAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgY29uc3QgY2xhc3NMaXN0ID0gY2xhc3NOYW1lLnRyaW0oKS5zcGxpdCgvXFxzKy8pO1xuICAgICAgbGV0IG1hdGNoZXNDb3VudCA9IDA7XG5cbiAgICAgIGZvciAoY29uc3Qgc2luZ2xlQ2xhc3NOYW1lIG9mIGNsYXNzTGlzdCkge1xuICAgICAgICBpZiAoKDxFbGVtZW50PiBjaGlsZCkuY2xhc3NMaXN0LmNvbnRhaW5zKHNpbmdsZUNsYXNzTmFtZSkpIHtcbiAgICAgICAgICBtYXRjaGVzQ291bnQrKztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBlbnN1cmUgdGhhdCBhbGwgY2xhc3MgbmFtZXMgYXJlIHByZXNlbnRcbiAgICAgIGlmIChtYXRjaGVzQ291bnQgPT09IGNsYXNzTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgc2VhcmNoLnB1c2goY2hpbGQpO1xuICAgICAgfVxuXG4gICAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKDxFbGVtZW50PiBjaGlsZCwgY2xhc3NOYW1lLCBzZWFyY2gpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzZWFyY2g7XG59XG5cbmZ1bmN0aW9uIGdldE91dGVySFRNTE9wZW5pbmdUYWcocGFyZW50RWxlbWVudDogRWxlbWVudCkge1xuICByZXR1cm4gXCI8XCIgKyBwYXJlbnRFbGVtZW50LmxvY2FsTmFtZSArXG4gICAgZ2V0RWxlbWVudEF0dHJpYnV0ZXNTdHJpbmcocGFyZW50RWxlbWVudCkgKyBcIj5cIjtcbn1cblxuY29uc3Qgdm9pZEVsZW1lbnRzID0gbmV3IFNldChbXG4gIFwiYXJlYVwiLFxuICBcImJhc2VcIixcbiAgXCJiclwiLFxuICBcImNvbFwiLFxuICBcImVtYmVkXCIsXG4gIFwiaHJcIixcbiAgXCJpbWdcIixcbiAgXCJpbnB1dFwiLFxuICBcImxpbmtcIixcbiAgXCJtZXRhXCIsXG4gIFwicGFyYW1cIixcbiAgXCJzb3VyY2VcIixcbiAgXCJ0cmFja1wiLFxuICBcIndiclwiLFxuXSk7XG5cbi8qKlxuICogLmlubmVySFRNTC8ub3V0ZXJIVE1MIGltcGxlbWVudGF0aW9uIHdpdGhvdXQgcmVjdXJzaW9uIHRvIGF2b2lkIHN0YWNrXG4gKiBvdmVyZmxvd3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE91dGVyT3JJbm5lckh0bWwoXG4gIHBhcmVudEVsZW1lbnQ6IEVsZW1lbnQsXG4gIGFzT3V0ZXJIdG1sOiBib29sZWFuLFxuKTogc3RyaW5nIHtcbiAgbGV0IG91dGVySFRNTE9wZW5pbmdUYWcgPSBcIlwiO1xuICBsZXQgb3V0ZXJIVE1MQ2xvc2luZ1RhZyA9IFwiXCI7XG4gIGxldCBpbm5lckhUTUwgPSBcIlwiO1xuXG4gIGlmIChhc091dGVySHRtbCkge1xuICAgIG91dGVySFRNTE9wZW5pbmdUYWcgPSBnZXRPdXRlckhUTUxPcGVuaW5nVGFnKHBhcmVudEVsZW1lbnQpO1xuICAgIG91dGVySFRNTENsb3NpbmdUYWcgPSBgPC8ke3BhcmVudEVsZW1lbnQubG9jYWxOYW1lfT5gO1xuXG4gICAgaWYgKHZvaWRFbGVtZW50cy5oYXMocGFyZW50RWxlbWVudC5sb2NhbE5hbWUpKSB7XG4gICAgICByZXR1cm4gb3V0ZXJIVE1MT3BlbmluZ1RhZztcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbml0aWFsQ2hpbGROb2RlcyA9IHBhcmVudEVsZW1lbnQubG9jYWxOYW1lID09PSBcInRlbXBsYXRlXCJcbiAgICA/IChwYXJlbnRFbGVtZW50IGFzIEhUTUxUZW1wbGF0ZUVsZW1lbnQpLmNvbnRlbnQuY2hpbGROb2Rlc1xuICAgIDogcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzO1xuICBjb25zdCBjaGlsZE5vZGVEZXB0aCA9IFtpbml0aWFsQ2hpbGROb2Rlc107XG4gIGNvbnN0IGluZGV4RGVwdGggPSBbMF07XG4gIGNvbnN0IGNsb3NpbmdUYWdEZXB0aCA9IFtvdXRlckhUTUxDbG9zaW5nVGFnXTtcbiAgbGV0IGRlcHRoID0gMDtcblxuICBkZXB0aExvb3A6XG4gIHdoaWxlIChkZXB0aCA+IC0xKSB7XG4gICAgY29uc3QgY2hpbGQgPSBjaGlsZE5vZGVEZXB0aFtkZXB0aF1baW5kZXhEZXB0aFtkZXB0aF1dO1xuXG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICBzd2l0Y2ggKGNoaWxkLm5vZGVUeXBlKSB7XG4gICAgICAgIGNhc2UgTm9kZVR5cGUuRUxFTUVOVF9OT0RFOiB7XG4gICAgICAgICAgaW5uZXJIVE1MICs9IGdldE91dGVySFRNTE9wZW5pbmdUYWcoY2hpbGQgYXMgRWxlbWVudCk7XG4gICAgICAgICAgY29uc3QgY2hpbGRMb2NhbE5hbWUgPSAoY2hpbGQgYXMgRWxlbWVudCkubG9jYWxOYW1lO1xuXG4gICAgICAgICAgLy8gVm9pZCBlbGVtZW50cyBkb24ndCBoYXZlIGEgY2xvc2luZyB0YWcgbm9yIHByaW50IGlubmVySFRNTFxuICAgICAgICAgIGlmICghdm9pZEVsZW1lbnRzLmhhcyhjaGlsZExvY2FsTmFtZSkpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZExvY2FsTmFtZSA9PT0gXCJ0ZW1wbGF0ZVwiKSB7XG4gICAgICAgICAgICAgIGNoaWxkTm9kZURlcHRoLnB1c2goXG4gICAgICAgICAgICAgICAgKGNoaWxkIGFzIEhUTUxUZW1wbGF0ZUVsZW1lbnQpLmNvbnRlbnQuY2hpbGROb2RlcyxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNoaWxkTm9kZURlcHRoLnB1c2goY2hpbGQuY2hpbGROb2Rlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRleERlcHRoLnB1c2goMCk7XG4gICAgICAgICAgICBjbG9zaW5nVGFnRGVwdGgucHVzaChgPC8ke2NoaWxkTG9jYWxOYW1lfT5gKTtcbiAgICAgICAgICAgIGRlcHRoKys7XG4gICAgICAgICAgICBjb250aW51ZSBkZXB0aExvb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSBOb2RlVHlwZS5DT01NRU5UX05PREU6XG4gICAgICAgICAgaW5uZXJIVE1MICs9IGA8IS0tJHsoY2hpbGQgYXMgQ29tbWVudCkuZGF0YX0tLT5gO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgTm9kZVR5cGUuVEVYVF9OT0RFOlxuICAgICAgICAgIC8vIFNwZWNpYWwgaGFuZGxpbmcgZm9yIHJhd3RleHQtbGlrZSBlbGVtZW50cy5cbiAgICAgICAgICBzd2l0Y2ggKChjaGlsZC5wYXJlbnROb2RlISBhcyBFbGVtZW50KS5sb2NhbE5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzdHlsZVwiOlxuICAgICAgICAgICAgY2FzZSBcInNjcmlwdFwiOlxuICAgICAgICAgICAgY2FzZSBcInhtcFwiOlxuICAgICAgICAgICAgY2FzZSBcImlmcmFtZVwiOlxuICAgICAgICAgICAgY2FzZSBcIm5vZW1iZWRcIjpcbiAgICAgICAgICAgIGNhc2UgXCJub2ZyYW1lc1wiOlxuICAgICAgICAgICAgY2FzZSBcInBsYWludGV4dFwiOlxuICAgICAgICAgICAgICBpbm5lckhUTUwgKz0gKGNoaWxkIGFzIFRleHQpLmRhdGE7XG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAvLyBlc2NhcGluZzogaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvcGFyc2luZy5odG1sI2VzY2FwaW5nU3RyaW5nXG4gICAgICAgICAgICAgIGlubmVySFRNTCArPSAoY2hpbGQgYXMgVGV4dCkuZGF0YVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFx4QTAvZywgXCImbmJzcDtcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvPC9nLCBcIiZsdDtcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvPi9nLCBcIiZndDtcIik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZGVwdGgtLTtcblxuICAgICAgaW5kZXhEZXB0aC5wb3AoKTtcbiAgICAgIGNoaWxkTm9kZURlcHRoLnBvcCgpO1xuICAgICAgaW5uZXJIVE1MICs9IGNsb3NpbmdUYWdEZXB0aC5wb3AoKTtcbiAgICB9XG5cbiAgICAvLyBHbyB0byBuZXh0IGNoaWxkXG4gICAgaW5kZXhEZXB0aFtkZXB0aF0rKztcbiAgfVxuXG4gIC8vIElmIGlubmVySFRNTCBpcyByZXF1ZXN0ZWQgdGhlbiB0aGUgb3BlbmluZyB0YWcgc2hvdWxkIGJlIGFuIGVtcHR5IHN0cmluZ1xuICByZXR1cm4gb3V0ZXJIVE1MT3BlbmluZ1RhZyArIGlubmVySFRNTDtcbn1cblxuLy8gRklYTUU6IFRoaXMgdXNlcyB0aGUgaW5jb3JyZWN0IC5hdHRyaWJ1dGVzIGltcGxlbWVudGF0aW9uLCBpdFxuLy8gc2hvdWxkIHByb2JhYmx5IGJlIGNoYW5nZWQgd2hlbiAuYXR0cmlidXRlcyBpcyBmaXhlZFxuZXhwb3J0IGZ1bmN0aW9uIGdldEVsZW1lbnRBdHRyaWJ1dGVzU3RyaW5nKFxuICBlbGVtZW50OiBFbGVtZW50LFxuKTogc3RyaW5nIHtcbiAgbGV0IG91dCA9IFwiXCI7XG5cbiAgZm9yIChjb25zdCBhdHRyaWJ1dGUgb2YgZWxlbWVudC5nZXRBdHRyaWJ1dGVOYW1lcygpKSB7XG4gICAgb3V0ICs9IGAgJHthdHRyaWJ1dGUudG9Mb3dlckNhc2UoKX1gO1xuXG4gICAgLy8gZXNjYXBpbmc6IGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3BhcnNpbmcuaHRtbCNlc2NhcGluZ1N0cmluZ1xuICAgIG91dCArPSBgPVwiJHtcbiAgICAgIGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZSkhXG4gICAgICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcbiAgICAgICAgLnJlcGxhY2UoL1xceEEwL2csIFwiJm5ic3A7XCIpXG4gICAgICAgIC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKVxuICAgIH1cImA7XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0QmVmb3JlQWZ0ZXIoXG4gIG5vZGU6IE5vZGUsXG4gIG5vZGVzOiAoTm9kZSB8IHN0cmluZylbXSxcbiAgYmVmb3JlOiBib29sZWFuLFxuKSB7XG4gIGNvbnN0IHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGUhO1xuICBjb25zdCBtdXRhdG9yID0gcGFyZW50Tm9kZS5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcbiAgLy8gRmluZCB0aGUgcHJldmlvdXMvbmV4dCBzaWJsaW5nIHRvIGBub2RlYCB0aGF0IGlzbid0IGluIGBub2Rlc2AgYmVmb3JlIHRoZVxuICAvLyBub2RlcyBpbiBgbm9kZXNgIGFyZSByZW1vdmVkIGZyb20gdGhlaXIgcGFyZW50cy5cbiAgbGV0IHZpYWJsZVByZXZOZXh0U2libGluZzogTm9kZSB8IG51bGwgPSBudWxsO1xuICB7XG4gICAgY29uc3QgZGlmZmVyZW5jZSA9IGJlZm9yZSA/IC0xIDogKzE7XG4gICAgZm9yIChcbiAgICAgIGxldCBpID0gbXV0YXRvci5pbmRleE9mKG5vZGUpICsgZGlmZmVyZW5jZTtcbiAgICAgIDAgPD0gaSAmJiBpIDwgcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgIGkgKz0gZGlmZmVyZW5jZVxuICAgICkge1xuICAgICAgaWYgKCFub2Rlcy5pbmNsdWRlcyhwYXJlbnROb2RlLmNoaWxkTm9kZXNbaV0pKSB7XG4gICAgICAgIHZpYWJsZVByZXZOZXh0U2libGluZyA9IHBhcmVudE5vZGUuY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIG5vZGVzID0gbm9kZXNBbmRUZXh0Tm9kZXMobm9kZXMsIHBhcmVudE5vZGUpO1xuXG4gIGxldCBpbmRleDtcbiAgaWYgKHZpYWJsZVByZXZOZXh0U2libGluZykge1xuICAgIGluZGV4ID0gbXV0YXRvci5pbmRleE9mKHZpYWJsZVByZXZOZXh0U2libGluZykgKyAoYmVmb3JlID8gMSA6IDApO1xuICB9IGVsc2Uge1xuICAgIGluZGV4ID0gYmVmb3JlID8gMCA6IHBhcmVudE5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7XG4gIH1cbiAgbXV0YXRvci5zcGxpY2UoaW5kZXgsIDAsIC4uLig8Tm9kZVtdPiBub2RlcykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNEb2N1bWVudEZyYWdtZW50KG5vZGU6IE5vZGUpOiBub2RlIGlzIERvY3VtZW50RnJhZ21lbnQge1xuICBsZXQgb2JqOiBhbnkgPSBub2RlO1xuXG4gIGlmICghKG9iaiAmJiB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChvYmouY29uc3RydWN0b3IpIHtcbiAgICAgIGNhc2UgVXRpbFR5cGVzLkRvY3VtZW50RnJhZ21lbnQ6XG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICBjYXNlIE5vZGU6XG4gICAgICBjYXNlIFV0aWxUeXBlcy5FbGVtZW50OlxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIC8vIEZJWE1FOiBXZSBzaG91bGQgcHJvYmFibHkgdGhyb3cgaGVyZT9cblxuICAgICAgY2FzZSBPYmplY3Q6XG4gICAgICBjYXNlIG51bGw6XG4gICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBvYmogPSBSZWZsZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbmV3IHBhcmVudCBmb3IgdGhlIGNoaWxkcmVuIHZpYSBfc2V0UGFyZW50KCkgb24gYWxsXG4gKiB0aGUgY2hpbGQgbm9kZXMgYW5kIHJlbW92ZXMgdGhlbSBmcm9tIHRoZSBEb2N1bWVudEZyYWdtZW50J3NcbiAqIGNoaWxkTm9kZSBsaXN0LlxuICpcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIGZvciBhcHBlbmRDaGlsZCwgZXRjLiBJdCBzaG91bGQgYmUgY2FsbGVkXG4gKiBfYWZ0ZXJfIHRoZSBjaGlsZHJlbiBhcmUgYWxyZWFkeSBwdXNoZWQgb250byB0aGUgbmV3IHBhcmVudCdzXG4gKiBjaGlsZE5vZGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbW92ZURvY3VtZW50RnJhZ21lbnRDaGlsZHJlbihcbiAgZnJhZ21lbnQ6IERvY3VtZW50RnJhZ21lbnQsXG4gIG5ld1BhcmVudDogTm9kZSxcbikge1xuICBjb25zdCBjaGlsZENvdW50ID0gZnJhZ21lbnQuY2hpbGROb2Rlcy5sZW5ndGg7XG5cbiAgZm9yIChjb25zdCBjaGlsZCBvZiBmcmFnbWVudC5jaGlsZE5vZGVzKSB7XG4gICAgY2hpbGQuX3NldFBhcmVudChuZXdQYXJlbnQpO1xuICB9XG5cbiAgY29uc3QgbXV0YXRvciA9IGZyYWdtZW50Ll9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICBtdXRhdG9yLnNwbGljZSgwLCBjaGlsZENvdW50KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFrQixJQUFJLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxRQUFjLFlBQVk7QUFFN0UsT0FBTyxlQUFlLG1CQUFtQjtBQUt6QyxPQUFPLE1BQU0sa0JBQWtCLFFBQVE7QUFDdkMsT0FBTyxNQUFNLGtCQUFrQixRQUFRO0FBQ3ZDOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyx1QkFBdUIsSUFBWSxFQUFvQjtJQUNyRSxJQUFJLGdCQUFrQztJQUN0QyxLQUFLLE1BQU0sUUFBUSxLQUFNO1FBQ3ZCLElBQUksZ0JBQWdCLElBQUksQ0FBQyxPQUFPO1lBQzlCLGlCQUFpQixNQUFNLEtBQUssV0FBVztRQUN6QyxPQUFPO1lBQ0wsaUJBQWlCO1FBQ25CLENBQUM7SUFDSDtJQUVBLE9BQU87QUFDVCxDQUFDO0FBRUQsT0FBTyxTQUFTLHlCQUF5QixJQUFZLEVBQVU7SUFDN0QsSUFBSSxpQkFBaUI7SUFDckIsSUFBSSxXQUFXO0lBQ2YsS0FBSyxNQUFNLFFBQVEsS0FBSyxLQUFLLENBQUMsUUFBUSxNQUFNLEVBQUc7UUFDN0MsSUFBSSxhQUFhLE9BQU8sZ0JBQWdCLElBQUksQ0FBQyxPQUFPO1lBQ2xELGtCQUFrQixLQUFLLFdBQVc7WUFDbEMsV0FBVztRQUNiLE9BQU87WUFDTCxrQkFBa0I7WUFDbEIsV0FBVztRQUNiLENBQUM7SUFDSDtJQUVBLE9BQU8saUJBQWlCO0FBQzFCLENBQUM7QUFFRCxPQUFPLFNBQVMsdUJBQ2QsT0FBWSxFQUNaLFNBQWlCLEVBQ2pCLE1BQWMsRUFDTjtJQUNSLEtBQUssTUFBTSxTQUFTLFFBQVEsVUFBVSxDQUFFO1FBQ3RDLElBQUksTUFBTSxRQUFRLEtBQUssU0FBUyxZQUFZLEVBQUU7WUFDNUMsTUFBTSxZQUFZLFVBQVUsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUN6QyxJQUFJLGVBQWU7WUFFbkIsS0FBSyxNQUFNLG1CQUFtQixVQUFXO2dCQUN2QyxJQUFJLEFBQVcsTUFBTyxTQUFTLENBQUMsUUFBUSxDQUFDLGtCQUFrQjtvQkFDekQ7Z0JBQ0YsQ0FBQztZQUNIO1lBRUEsMENBQTBDO1lBQzFDLElBQUksaUJBQWlCLFVBQVUsTUFBTSxFQUFFO2dCQUNyQyxPQUFPLElBQUksQ0FBQztZQUNkLENBQUM7WUFFRCx1QkFBaUMsT0FBTyxXQUFXO1FBQ3JELENBQUM7SUFDSDtJQUVBLE9BQU87QUFDVCxDQUFDO0FBRUQsU0FBUyx1QkFBdUIsYUFBc0IsRUFBRTtJQUN0RCxPQUFPLE1BQU0sY0FBYyxTQUFTLEdBQ2xDLDJCQUEyQixpQkFBaUI7QUFDaEQ7QUFFQSxNQUFNLGVBQWUsSUFBSSxJQUFJO0lBQzNCO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7Q0FDRDtBQUVEOzs7Q0FHQyxHQUNELE9BQU8sU0FBUyxvQkFDZCxhQUFzQixFQUN0QixXQUFvQixFQUNaO0lBQ1IsSUFBSSxzQkFBc0I7SUFDMUIsSUFBSSxzQkFBc0I7SUFDMUIsSUFBSSxZQUFZO0lBRWhCLElBQUksYUFBYTtRQUNmLHNCQUFzQix1QkFBdUI7UUFDN0Msc0JBQXNCLENBQUMsRUFBRSxFQUFFLGNBQWMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUVyRCxJQUFJLGFBQWEsR0FBRyxDQUFDLGNBQWMsU0FBUyxHQUFHO1lBQzdDLE9BQU87UUFDVCxDQUFDO0lBQ0gsQ0FBQztJQUVELE1BQU0sb0JBQW9CLGNBQWMsU0FBUyxLQUFLLGFBQ2xELEFBQUMsY0FBc0MsT0FBTyxDQUFDLFVBQVUsR0FDekQsY0FBYyxVQUFVO0lBQzVCLE1BQU0saUJBQWlCO1FBQUM7S0FBa0I7SUFDMUMsTUFBTSxhQUFhO1FBQUM7S0FBRTtJQUN0QixNQUFNLGtCQUFrQjtRQUFDO0tBQW9CO0lBQzdDLElBQUksUUFBUTtJQUVaLFdBQ0EsTUFBTyxRQUFRLENBQUMsRUFBRztRQUNqQixNQUFNLFFBQVEsY0FBYyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1FBRXRELElBQUksT0FBTztZQUNULE9BQVEsTUFBTSxRQUFRO2dCQUNwQixLQUFLLFNBQVMsWUFBWTtvQkFBRTt3QkFDMUIsYUFBYSx1QkFBdUI7d0JBQ3BDLE1BQU0saUJBQWlCLEFBQUMsTUFBa0IsU0FBUzt3QkFFbkQsNkRBQTZEO3dCQUM3RCxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsaUJBQWlCOzRCQUNyQyxJQUFJLG1CQUFtQixZQUFZO2dDQUNqQyxlQUFlLElBQUksQ0FDakIsQUFBQyxNQUE4QixPQUFPLENBQUMsVUFBVTs0QkFFckQsT0FBTztnQ0FDTCxlQUFlLElBQUksQ0FBQyxNQUFNLFVBQVU7NEJBQ3RDLENBQUM7NEJBQ0QsV0FBVyxJQUFJLENBQUM7NEJBQ2hCLGdCQUFnQixJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7NEJBQzNDOzRCQUNBLFNBQVMsU0FBVTt3QkFDckIsQ0FBQzt3QkFDRCxLQUFNO29CQUNSO2dCQUVBLEtBQUssU0FBUyxZQUFZO29CQUN4QixhQUFhLENBQUMsSUFBSSxFQUFFLEFBQUMsTUFBa0IsSUFBSSxDQUFDLEdBQUcsQ0FBQztvQkFDaEQsS0FBTTtnQkFFUixLQUFLLFNBQVMsU0FBUztvQkFDckIsOENBQThDO29CQUM5QyxPQUFRLEFBQUMsTUFBTSxVQUFVLENBQWMsU0FBUzt3QkFDOUMsS0FBSzt3QkFDTCxLQUFLO3dCQUNMLEtBQUs7d0JBQ0wsS0FBSzt3QkFDTCxLQUFLO3dCQUNMLEtBQUs7d0JBQ0wsS0FBSzs0QkFDSCxhQUFhLEFBQUMsTUFBZSxJQUFJOzRCQUNqQyxLQUFNO3dCQUVSOzRCQUNFLCtFQUErRTs0QkFDL0UsYUFBYSxBQUFDLE1BQWUsSUFBSSxDQUM5QixPQUFPLENBQUMsTUFBTSxTQUNkLE9BQU8sQ0FBQyxTQUFTLFVBQ2pCLE9BQU8sQ0FBQyxNQUFNLFFBQ2QsT0FBTyxDQUFDLE1BQU07NEJBQ2pCLEtBQU07b0JBQ1Y7b0JBQ0EsS0FBTTtZQUNWO1FBQ0YsT0FBTztZQUNMO1lBRUEsV0FBVyxHQUFHO1lBQ2QsZUFBZSxHQUFHO1lBQ2xCLGFBQWEsZ0JBQWdCLEdBQUc7UUFDbEMsQ0FBQztRQUVELG1CQUFtQjtRQUNuQixVQUFVLENBQUMsTUFBTTtJQUNuQjtJQUVBLDJFQUEyRTtJQUMzRSxPQUFPLHNCQUFzQjtBQUMvQixDQUFDO0FBRUQsZ0VBQWdFO0FBQ2hFLHVEQUF1RDtBQUN2RCxPQUFPLFNBQVMsMkJBQ2QsT0FBZ0IsRUFDUjtJQUNSLElBQUksTUFBTTtJQUVWLEtBQUssTUFBTSxhQUFhLFFBQVEsaUJBQWlCLEdBQUk7UUFDbkQsT0FBTyxDQUFDLENBQUMsRUFBRSxVQUFVLFdBQVcsR0FBRyxDQUFDO1FBRXBDLCtFQUErRTtRQUMvRSxPQUFPLENBQUMsRUFBRSxFQUNSLFFBQVEsWUFBWSxDQUFDLFdBQ2xCLE9BQU8sQ0FBQyxNQUFNLFNBQ2QsT0FBTyxDQUFDLFNBQVMsVUFDakIsT0FBTyxDQUFDLE1BQU0sVUFDbEIsQ0FBQyxDQUFDO0lBQ0w7SUFFQSxPQUFPO0FBQ1QsQ0FBQztBQUVELE9BQU8sU0FBUyxrQkFDZCxJQUFVLEVBQ1YsS0FBd0IsRUFDeEIsTUFBZSxFQUNmO0lBQ0EsTUFBTSxhQUFhLEtBQUssVUFBVTtJQUNsQyxNQUFNLFVBQVUsV0FBVyxxQkFBcUI7SUFDaEQsNEVBQTRFO0lBQzVFLG1EQUFtRDtJQUNuRCxJQUFJLHdCQUFxQyxJQUFJO0lBQzdDO1FBQ0UsTUFBTSxhQUFhLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxJQUNFLElBQUksSUFBSSxRQUFRLE9BQU8sQ0FBQyxRQUFRLFlBQ2hDLEtBQUssS0FBSyxJQUFJLFdBQVcsVUFBVSxDQUFDLE1BQU0sRUFDMUMsS0FBSyxXQUNMO1lBQ0EsSUFBSSxDQUFDLE1BQU0sUUFBUSxDQUFDLFdBQVcsVUFBVSxDQUFDLEVBQUUsR0FBRztnQkFDN0Msd0JBQXdCLFdBQVcsVUFBVSxDQUFDLEVBQUU7Z0JBQ2hELEtBQU07WUFDUixDQUFDO1FBQ0g7SUFDRjtJQUNBLFFBQVEsa0JBQWtCLE9BQU87SUFFakMsSUFBSTtJQUNKLElBQUksdUJBQXVCO1FBQ3pCLFFBQVEsUUFBUSxPQUFPLENBQUMseUJBQXlCLENBQUMsU0FBUyxJQUFJLENBQUM7SUFDbEUsT0FBTztRQUNMLFFBQVEsU0FBUyxJQUFJLFdBQVcsVUFBVSxDQUFDLE1BQU07SUFDbkQsQ0FBQztJQUNELFFBQVEsTUFBTSxDQUFDLE9BQU8sTUFBZ0I7QUFDeEMsQ0FBQztBQUVELE9BQU8sU0FBUyxtQkFBbUIsSUFBVSxFQUE0QjtJQUN2RSxJQUFJLE1BQVc7SUFFZixJQUFJLENBQUMsQ0FBQyxPQUFPLE9BQU8sUUFBUSxRQUFRLEdBQUc7UUFDckMsT0FBTyxLQUFLO0lBQ2QsQ0FBQztJQUVELE1BQU8sSUFBSSxDQUFFO1FBQ1gsT0FBUSxJQUFJLFdBQVc7WUFDckIsS0FBSyxVQUFVLGdCQUFnQjtnQkFDN0IsT0FBTyxJQUFJO1lBRWIsS0FBSztZQUNMLEtBQUssVUFBVSxPQUFPO2dCQUNwQixPQUFPLEtBQUs7WUFFZCx3Q0FBd0M7WUFFeEMsS0FBSztZQUNMLEtBQUssSUFBSTtZQUNULEtBQUs7Z0JBQ0gsT0FBTyxLQUFLO1lBRWQ7Z0JBQ0UsTUFBTSxRQUFRLGNBQWMsQ0FBQztRQUNqQztJQUNGO0FBQ0YsQ0FBQztBQUVEOzs7Ozs7OztDQVFDLEdBQ0QsT0FBTyxTQUFTLDZCQUNkLFFBQTBCLEVBQzFCLFNBQWUsRUFDZjtJQUNBLE1BQU0sYUFBYSxTQUFTLFVBQVUsQ0FBQyxNQUFNO0lBRTdDLEtBQUssTUFBTSxTQUFTLFNBQVMsVUFBVSxDQUFFO1FBQ3ZDLE1BQU0sVUFBVSxDQUFDO0lBQ25CO0lBRUEsTUFBTSxVQUFVLFNBQVMscUJBQXFCO0lBQzlDLFFBQVEsTUFBTSxDQUFDLEdBQUc7QUFDcEIsQ0FBQyJ9