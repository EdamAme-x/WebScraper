import { CTOR_KEY } from "../constructor-lock.ts";
import { Comment, Node, NodeType, Text } from "./node.ts";
import { NodeList, nodeListMutatorSym } from "./node-list.ts";
import { Element } from "./element.ts";
import { DocumentFragment } from "./document-fragment.ts";
import { HTMLTemplateElement } from "./elements/html-template-element.ts";
import { getSelectorEngine } from "./selectors/selectors.ts";
import { getElementsByClassName } from "./utils.ts";
import UtilTypes from "./utils-types.ts";
export class DOMImplementation {
    constructor(key){
        if (key !== CTOR_KEY) {
            throw new TypeError("Illegal constructor.");
        }
    }
    createDocument() {
        throw new Error("Unimplemented"); // TODO
    }
    createHTMLDocument(titleStr) {
        titleStr += "";
        const doc = new HTMLDocument(CTOR_KEY);
        const docType = new DocumentType("html", "", "", CTOR_KEY);
        doc.appendChild(docType);
        const html = new Element("html", doc, [], CTOR_KEY);
        html._setOwnerDocument(doc);
        const head = new Element("head", html, [], CTOR_KEY);
        const body = new Element("body", html, [], CTOR_KEY);
        const title = new Element("title", head, [], CTOR_KEY);
        const titleText = new Text(titleStr);
        title.appendChild(titleText);
        doc.head = head;
        doc.body = body;
        return doc;
    }
    createDocumentType(qualifiedName, publicId, systemId) {
        const doctype = new DocumentType(qualifiedName, publicId, systemId, CTOR_KEY);
        return doctype;
    }
}
export class DocumentType extends Node {
    #qualifiedName = "";
    #publicId = "";
    #systemId = "";
    constructor(name, publicId, systemId, key){
        super("html", NodeType.DOCUMENT_TYPE_NODE, null, key);
        this.#qualifiedName = name;
        this.#publicId = publicId;
        this.#systemId = systemId;
    }
    get name() {
        return this.#qualifiedName;
    }
    get publicId() {
        return this.#publicId;
    }
    get systemId() {
        return this.#systemId;
    }
    _shallowClone() {
        return new DocumentType(this.#qualifiedName, this.#publicId, this.#systemId, CTOR_KEY);
    }
}
export class Document extends Node {
    head = null;
    body = null;
    implementation;
    #lockState = false;
    #documentURI = "about:blank";
    #title = "";
    #nwapi = null;
    constructor(){
        super("#document", NodeType.DOCUMENT_NODE, null, CTOR_KEY);
        this.implementation = new DOMImplementation(CTOR_KEY);
    }
    _shallowClone() {
        return new Document();
    }
    // Expose the document's NWAPI for Element's access to
    // querySelector/querySelectorAll
    get _nwapi() {
        return this.#nwapi || (this.#nwapi = getSelectorEngine()(this));
    }
    get documentURI() {
        return this.#documentURI;
    }
    get title() {
        return this.querySelector("title")?.textContent || "";
    }
    get cookie() {
        return ""; // TODO
    }
    set cookie(newCookie) {
    // TODO
    }
    get visibilityState() {
        return "visible";
    }
    get hidden() {
        return false;
    }
    get compatMode() {
        return "CSS1Compat";
    }
    get documentElement() {
        for (const node of this.childNodes){
            if (node.nodeType === NodeType.ELEMENT_NODE) {
                return node;
            }
        }
        return null;
    }
    get doctype() {
        for (const node of this.childNodes){
            if (node.nodeType === NodeType.DOCUMENT_TYPE_NODE) {
                return node;
            }
        }
        return null;
    }
    get childElementCount() {
        let count = 0;
        for (const { nodeType  } of this.childNodes){
            if (nodeType === NodeType.ELEMENT_NODE) {
                count++;
            }
        }
        return count;
    }
    appendChild(child) {
        super.appendChild(child);
        child._setOwnerDocument(this);
        return child;
    }
    createElement(tagName, options) {
        tagName = tagName.toUpperCase();
        switch(tagName){
            case "TEMPLATE":
                {
                    const frag = new DocumentFragment();
                    const elm = new HTMLTemplateElement(null, [], CTOR_KEY, frag);
                    elm._setOwnerDocument(this);
                    return elm;
                }
            default:
                {
                    const elm = new Element(tagName, null, [], CTOR_KEY);
                    elm._setOwnerDocument(this);
                    return elm;
                }
        }
    }
    createElementNS(namespace, qualifiedName, options) {
        if (namespace === "http://www.w3.org/1999/xhtml") {
            return this.createElement(qualifiedName, options);
        } else {
            throw new Error(`createElementNS: "${namespace}" namespace unimplemented`); // TODO
        }
    }
    createTextNode(data) {
        return new Text(data);
    }
    createComment(data) {
        return new Comment(data);
    }
    createDocumentFragment() {
        const fragment = new DocumentFragment();
        fragment._setOwnerDocument(this);
        return fragment;
    }
    importNode(node, deep = false) {
        const copy = node.cloneNode(deep);
        copy._setOwnerDocument(this);
        return copy;
    }
    adoptNode(node) {
        if (node instanceof Document) {
            throw new DOMException("Adopting a Document node is not supported.", "NotSupportedError");
        }
        node._setParent(null);
        node._setOwnerDocument(this);
        return node;
    }
    querySelector(selectors) {
        return this._nwapi.first(selectors, this);
    }
    querySelectorAll(selectors) {
        const nodeList = new NodeList();
        const mutator = nodeList[nodeListMutatorSym]();
        for (const match of this._nwapi.select(selectors, this)){
            mutator.push(match);
        }
        return nodeList;
    }
    // TODO: DRY!!!
    getElementById(id) {
        for (const child of this.childNodes){
            if (child.nodeType === NodeType.ELEMENT_NODE) {
                if (child.id === id) {
                    return child;
                }
                const search = child.getElementById(id);
                if (search) {
                    return search;
                }
            }
        }
        return null;
    }
    getElementsByTagName(tagName) {
        if (tagName === "*") {
            return this.documentElement ? this._getElementsByTagNameWildcard(this.documentElement, []) : [];
        } else {
            return this._getElementsByTagName(tagName.toUpperCase(), []);
        }
    }
    _getElementsByTagNameWildcard(node, search) {
        for (const child of this.childNodes){
            if (child.nodeType === NodeType.ELEMENT_NODE) {
                search.push(child);
                child._getElementsByTagNameWildcard(search);
            }
        }
        return search;
    }
    _getElementsByTagName(tagName, search) {
        for (const child of this.childNodes){
            if (child.nodeType === NodeType.ELEMENT_NODE) {
                if (child.tagName === tagName) {
                    search.push(child);
                }
                child._getElementsByTagName(tagName, search);
            }
        }
        return search;
    }
    getElementsByTagNameNS(_namespace, localName) {
        return this.getElementsByTagName(localName);
    }
    getElementsByClassName(className) {
        return getElementsByClassName(this, className, []);
    }
    hasFocus() {
        return true;
    }
}
export class HTMLDocument extends Document {
    constructor(key){
        if (key !== CTOR_KEY) {
            throw new TypeError("Illegal constructor.");
        }
        super();
    }
    _shallowClone() {
        return new HTMLDocument(CTOR_KEY);
    }
}
UtilTypes.Document = Document;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40My9zcmMvZG9tL2RvY3VtZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENUT1JfS0VZIH0gZnJvbSBcIi4uL2NvbnN0cnVjdG9yLWxvY2sudHNcIjtcbmltcG9ydCB7IENvbW1lbnQsIE5vZGUsIE5vZGVUeXBlLCBUZXh0IH0gZnJvbSBcIi4vbm9kZS50c1wiO1xuaW1wb3J0IHsgTm9kZUxpc3QsIG5vZGVMaXN0TXV0YXRvclN5bSB9IGZyb20gXCIuL25vZGUtbGlzdC50c1wiO1xuaW1wb3J0IHsgRWxlbWVudCB9IGZyb20gXCIuL2VsZW1lbnQudHNcIjtcbmltcG9ydCB7IERvY3VtZW50RnJhZ21lbnQgfSBmcm9tIFwiLi9kb2N1bWVudC1mcmFnbWVudC50c1wiO1xuaW1wb3J0IHsgSFRNTFRlbXBsYXRlRWxlbWVudCB9IGZyb20gXCIuL2VsZW1lbnRzL2h0bWwtdGVtcGxhdGUtZWxlbWVudC50c1wiO1xuaW1wb3J0IHsgZ2V0U2VsZWN0b3JFbmdpbmUsIFNlbGVjdG9yQXBpIH0gZnJvbSBcIi4vc2VsZWN0b3JzL3NlbGVjdG9ycy50c1wiO1xuaW1wb3J0IHsgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSB9IGZyb20gXCIuL3V0aWxzLnRzXCI7XG5pbXBvcnQgVXRpbFR5cGVzIGZyb20gXCIuL3V0aWxzLXR5cGVzLnRzXCI7XG5cbmV4cG9ydCBjbGFzcyBET01JbXBsZW1lbnRhdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGtleTogdHlwZW9mIENUT1JfS0VZKSB7XG4gICAgaWYgKGtleSAhPT0gQ1RPUl9LRVkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbGxlZ2FsIGNvbnN0cnVjdG9yLlwiKTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVEb2N1bWVudCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmltcGxlbWVudGVkXCIpOyAvLyBUT0RPXG4gIH1cblxuICBjcmVhdGVIVE1MRG9jdW1lbnQodGl0bGVTdHI/OiBzdHJpbmcpOiBIVE1MRG9jdW1lbnQge1xuICAgIHRpdGxlU3RyICs9IFwiXCI7XG5cbiAgICBjb25zdCBkb2MgPSBuZXcgSFRNTERvY3VtZW50KENUT1JfS0VZKTtcblxuICAgIGNvbnN0IGRvY1R5cGUgPSBuZXcgRG9jdW1lbnRUeXBlKFwiaHRtbFwiLCBcIlwiLCBcIlwiLCBDVE9SX0tFWSk7XG4gICAgZG9jLmFwcGVuZENoaWxkKGRvY1R5cGUpO1xuXG4gICAgY29uc3QgaHRtbCA9IG5ldyBFbGVtZW50KFwiaHRtbFwiLCBkb2MsIFtdLCBDVE9SX0tFWSk7XG4gICAgaHRtbC5fc2V0T3duZXJEb2N1bWVudChkb2MpO1xuXG4gICAgY29uc3QgaGVhZCA9IG5ldyBFbGVtZW50KFwiaGVhZFwiLCBodG1sLCBbXSwgQ1RPUl9LRVkpO1xuICAgIGNvbnN0IGJvZHkgPSBuZXcgRWxlbWVudChcImJvZHlcIiwgaHRtbCwgW10sIENUT1JfS0VZKTtcblxuICAgIGNvbnN0IHRpdGxlID0gbmV3IEVsZW1lbnQoXCJ0aXRsZVwiLCBoZWFkLCBbXSwgQ1RPUl9LRVkpO1xuICAgIGNvbnN0IHRpdGxlVGV4dCA9IG5ldyBUZXh0KHRpdGxlU3RyKTtcbiAgICB0aXRsZS5hcHBlbmRDaGlsZCh0aXRsZVRleHQpO1xuXG4gICAgZG9jLmhlYWQgPSBoZWFkO1xuICAgIGRvYy5ib2R5ID0gYm9keTtcblxuICAgIHJldHVybiBkb2M7XG4gIH1cblxuICBjcmVhdGVEb2N1bWVudFR5cGUoXG4gICAgcXVhbGlmaWVkTmFtZTogc3RyaW5nLFxuICAgIHB1YmxpY0lkOiBzdHJpbmcsXG4gICAgc3lzdGVtSWQ6IHN0cmluZyxcbiAgKTogRG9jdW1lbnRUeXBlIHtcbiAgICBjb25zdCBkb2N0eXBlID0gbmV3IERvY3VtZW50VHlwZShcbiAgICAgIHF1YWxpZmllZE5hbWUsXG4gICAgICBwdWJsaWNJZCxcbiAgICAgIHN5c3RlbUlkLFxuICAgICAgQ1RPUl9LRVksXG4gICAgKTtcblxuICAgIHJldHVybiBkb2N0eXBlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEb2N1bWVudFR5cGUgZXh0ZW5kcyBOb2RlIHtcbiAgI3F1YWxpZmllZE5hbWUgPSBcIlwiO1xuICAjcHVibGljSWQgPSBcIlwiO1xuICAjc3lzdGVtSWQgPSBcIlwiO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwdWJsaWNJZDogc3RyaW5nLFxuICAgIHN5c3RlbUlkOiBzdHJpbmcsXG4gICAga2V5OiB0eXBlb2YgQ1RPUl9LRVksXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgXCJodG1sXCIsXG4gICAgICBOb2RlVHlwZS5ET0NVTUVOVF9UWVBFX05PREUsXG4gICAgICBudWxsLFxuICAgICAga2V5LFxuICAgICk7XG5cbiAgICB0aGlzLiNxdWFsaWZpZWROYW1lID0gbmFtZTtcbiAgICB0aGlzLiNwdWJsaWNJZCA9IHB1YmxpY0lkO1xuICAgIHRoaXMuI3N5c3RlbUlkID0gc3lzdGVtSWQ7XG4gIH1cblxuICBnZXQgbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jcXVhbGlmaWVkTmFtZTtcbiAgfVxuXG4gIGdldCBwdWJsaWNJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jcHVibGljSWQ7XG4gIH1cblxuICBnZXQgc3lzdGVtSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3N5c3RlbUlkO1xuICB9XG5cbiAgX3NoYWxsb3dDbG9uZSgpOiBOb2RlIHtcbiAgICByZXR1cm4gbmV3IERvY3VtZW50VHlwZShcbiAgICAgIHRoaXMuI3F1YWxpZmllZE5hbWUsXG4gICAgICB0aGlzLiNwdWJsaWNJZCxcbiAgICAgIHRoaXMuI3N5c3RlbUlkLFxuICAgICAgQ1RPUl9LRVksXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVsZW1lbnRDcmVhdGlvbk9wdGlvbnMge1xuICBpczogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBWaXNpYmlsaXR5U3RhdGUgPSBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInByZXJlbmRlclwiO1xuZXhwb3J0IHR5cGUgTmFtZXNwYWNlVVJJID1cbiAgfCBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIlxuICB8IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxuICB8IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTFwiO1xuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnQgZXh0ZW5kcyBOb2RlIHtcbiAgcHVibGljIGhlYWQ6IEVsZW1lbnQgPSA8RWxlbWVudD4gPHVua25vd24+IG51bGw7XG4gIHB1YmxpYyBib2R5OiBFbGVtZW50ID0gPEVsZW1lbnQ+IDx1bmtub3duPiBudWxsO1xuICBwdWJsaWMgaW1wbGVtZW50YXRpb246IERPTUltcGxlbWVudGF0aW9uO1xuXG4gICNsb2NrU3RhdGUgPSBmYWxzZTtcbiAgI2RvY3VtZW50VVJJID0gXCJhYm91dDpibGFua1wiOyAvLyBUT0RPXG4gICN0aXRsZSA9IFwiXCI7XG4gICNud2FwaTogU2VsZWN0b3JBcGkgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiI2RvY3VtZW50XCIsXG4gICAgICBOb2RlVHlwZS5ET0NVTUVOVF9OT0RFLFxuICAgICAgbnVsbCxcbiAgICAgIENUT1JfS0VZLFxuICAgICk7XG5cbiAgICB0aGlzLmltcGxlbWVudGF0aW9uID0gbmV3IERPTUltcGxlbWVudGF0aW9uKENUT1JfS0VZKTtcbiAgfVxuXG4gIF9zaGFsbG93Q2xvbmUoKTogTm9kZSB7XG4gICAgcmV0dXJuIG5ldyBEb2N1bWVudCgpO1xuICB9XG5cbiAgLy8gRXhwb3NlIHRoZSBkb2N1bWVudCdzIE5XQVBJIGZvciBFbGVtZW50J3MgYWNjZXNzIHRvXG4gIC8vIHF1ZXJ5U2VsZWN0b3IvcXVlcnlTZWxlY3RvckFsbFxuICBnZXQgX253YXBpKCkge1xuICAgIHJldHVybiB0aGlzLiNud2FwaSB8fCAodGhpcy4jbndhcGkgPSBnZXRTZWxlY3RvckVuZ2luZSgpKHRoaXMpKTtcbiAgfVxuXG4gIGdldCBkb2N1bWVudFVSSSgpIHtcbiAgICByZXR1cm4gdGhpcy4jZG9jdW1lbnRVUkk7XG4gIH1cblxuICBnZXQgdGl0bGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnlTZWxlY3RvcihcInRpdGxlXCIpPy50ZXh0Q29udGVudCB8fCBcIlwiO1xuICB9XG5cbiAgZ2V0IGNvb2tpZSgpIHtcbiAgICByZXR1cm4gXCJcIjsgLy8gVE9ET1xuICB9XG5cbiAgc2V0IGNvb2tpZShuZXdDb29raWU6IHN0cmluZykge1xuICAgIC8vIFRPRE9cbiAgfVxuXG4gIGdldCB2aXNpYmlsaXR5U3RhdGUoKTogVmlzaWJpbGl0eVN0YXRlIHtcbiAgICByZXR1cm4gXCJ2aXNpYmxlXCI7XG4gIH1cblxuICBnZXQgaGlkZGVuKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGdldCBjb21wYXRNb2RlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIFwiQ1NTMUNvbXBhdFwiO1xuICB9XG5cbiAgZ2V0IGRvY3VtZW50RWxlbWVudCgpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgZm9yIChjb25zdCBub2RlIG9mIHRoaXMuY2hpbGROb2Rlcykge1xuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICByZXR1cm4gPEVsZW1lbnQ+IG5vZGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXQgZG9jdHlwZSgpOiBEb2N1bWVudFR5cGUgfCBudWxsIHtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRE9DVU1FTlRfVFlQRV9OT0RFKSB7XG4gICAgICAgIHJldHVybiA8RG9jdW1lbnRUeXBlPiBub2RlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZ2V0IGNoaWxkRWxlbWVudENvdW50KCk6IG51bWJlciB7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBmb3IgKGNvbnN0IHsgbm9kZVR5cGUgfSBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIGlmIChub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIGNvdW50Kys7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKGNoaWxkOiBOb2RlKTogTm9kZSB7XG4gICAgc3VwZXIuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIGNoaWxkLl9zZXRPd25lckRvY3VtZW50KHRoaXMpO1xuICAgIHJldHVybiBjaGlsZDtcbiAgfVxuXG4gIGNyZWF0ZUVsZW1lbnQodGFnTmFtZTogc3RyaW5nLCBvcHRpb25zPzogRWxlbWVudENyZWF0aW9uT3B0aW9ucyk6IEVsZW1lbnQge1xuICAgIHRhZ05hbWUgPSB0YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG5cbiAgICBzd2l0Y2ggKHRhZ05hbWUpIHtcbiAgICAgIGNhc2UgXCJURU1QTEFURVwiOiB7XG4gICAgICAgIGNvbnN0IGZyYWcgPSBuZXcgRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICBjb25zdCBlbG0gPSBuZXcgSFRNTFRlbXBsYXRlRWxlbWVudChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIFtdLFxuICAgICAgICAgIENUT1JfS0VZLFxuICAgICAgICAgIGZyYWcsXG4gICAgICAgICk7XG4gICAgICAgIGVsbS5fc2V0T3duZXJEb2N1bWVudCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIGVsbTtcbiAgICAgIH1cblxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICBjb25zdCBlbG0gPSBuZXcgRWxlbWVudCh0YWdOYW1lLCBudWxsLCBbXSwgQ1RPUl9LRVkpO1xuICAgICAgICBlbG0uX3NldE93bmVyRG9jdW1lbnQodGhpcyk7XG4gICAgICAgIHJldHVybiBlbG07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlRWxlbWVudE5TKFxuICAgIG5hbWVzcGFjZTogTmFtZXNwYWNlVVJJLFxuICAgIHF1YWxpZmllZE5hbWU6IHN0cmluZyxcbiAgICBvcHRpb25zPzogRWxlbWVudENyZWF0aW9uT3B0aW9ucyxcbiAgKTogRWxlbWVudCB7XG4gICAgaWYgKG5hbWVzcGFjZSA9PT0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVsZW1lbnQocXVhbGlmaWVkTmFtZSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGNyZWF0ZUVsZW1lbnROUzogXCIke25hbWVzcGFjZX1cIiBuYW1lc3BhY2UgdW5pbXBsZW1lbnRlZGAsXG4gICAgICApOyAvLyBUT0RPXG4gICAgfVxuICB9XG5cbiAgY3JlYXRlVGV4dE5vZGUoZGF0YT86IHN0cmluZyk6IFRleHQge1xuICAgIHJldHVybiBuZXcgVGV4dChkYXRhKTtcbiAgfVxuXG4gIGNyZWF0ZUNvbW1lbnQoZGF0YT86IHN0cmluZyk6IENvbW1lbnQge1xuICAgIHJldHVybiBuZXcgQ29tbWVudChkYXRhKTtcbiAgfVxuXG4gIGNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTogRG9jdW1lbnRGcmFnbWVudCB7XG4gICAgY29uc3QgZnJhZ21lbnQgPSBuZXcgRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIGZyYWdtZW50Ll9zZXRPd25lckRvY3VtZW50KHRoaXMpO1xuICAgIHJldHVybiBmcmFnbWVudDtcbiAgfVxuXG4gIGltcG9ydE5vZGUobm9kZTogTm9kZSwgZGVlcDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgY29uc3QgY29weSA9IG5vZGUuY2xvbmVOb2RlKGRlZXApO1xuXG4gICAgY29weS5fc2V0T3duZXJEb2N1bWVudCh0aGlzKTtcblxuICAgIHJldHVybiBjb3B5O1xuICB9XG5cbiAgYWRvcHROb2RlKG5vZGU6IE5vZGUpIHtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERvY3VtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFxuICAgICAgICBcIkFkb3B0aW5nIGEgRG9jdW1lbnQgbm9kZSBpcyBub3Qgc3VwcG9ydGVkLlwiLFxuICAgICAgICBcIk5vdFN1cHBvcnRlZEVycm9yXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBub2RlLl9zZXRQYXJlbnQobnVsbCk7XG4gICAgbm9kZS5fc2V0T3duZXJEb2N1bWVudCh0aGlzKTtcblxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcXVlcnlTZWxlY3RvcihzZWxlY3RvcnM6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fbndhcGkuZmlyc3Qoc2VsZWN0b3JzLCB0aGlzKTtcbiAgfVxuXG4gIHF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzOiBzdHJpbmcpOiBOb2RlTGlzdCB7XG4gICAgY29uc3Qgbm9kZUxpc3QgPSBuZXcgTm9kZUxpc3QoKTtcbiAgICBjb25zdCBtdXRhdG9yID0gbm9kZUxpc3Rbbm9kZUxpc3RNdXRhdG9yU3ltXSgpO1xuXG4gICAgZm9yIChjb25zdCBtYXRjaCBvZiB0aGlzLl9ud2FwaS5zZWxlY3Qoc2VsZWN0b3JzLCB0aGlzKSkge1xuICAgICAgbXV0YXRvci5wdXNoKG1hdGNoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZUxpc3Q7XG4gIH1cblxuICAvLyBUT0RPOiBEUlkhISFcbiAgZ2V0RWxlbWVudEJ5SWQoaWQ6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGROb2Rlcykge1xuICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlVHlwZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgaWYgKCg8RWxlbWVudD4gY2hpbGQpLmlkID09PSBpZCkge1xuICAgICAgICAgIHJldHVybiA8RWxlbWVudD4gY2hpbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWFyY2ggPSAoPEVsZW1lbnQ+IGNoaWxkKS5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGlmIChzZWFyY2gpIHtcbiAgICAgICAgICByZXR1cm4gc2VhcmNoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lOiBzdHJpbmcpOiBFbGVtZW50W10ge1xuICAgIGlmICh0YWdOYW1lID09PSBcIipcIikge1xuICAgICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRFbGVtZW50XG4gICAgICAgID8gPEVsZW1lbnRbXT4gdGhpcy5fZ2V0RWxlbWVudHNCeVRhZ05hbWVXaWxkY2FyZChcbiAgICAgICAgICB0aGlzLmRvY3VtZW50RWxlbWVudCxcbiAgICAgICAgICBbXSxcbiAgICAgICAgKVxuICAgICAgICA6IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gPEVsZW1lbnRbXT4gdGhpcy5fZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZS50b1VwcGVyQ2FzZSgpLCBbXSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0RWxlbWVudHNCeVRhZ05hbWVXaWxkY2FyZChub2RlOiBOb2RlLCBzZWFyY2g6IE5vZGVbXSk6IE5vZGVbXSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgKDxhbnk+IGNoaWxkKS5fZ2V0RWxlbWVudHNCeVRhZ05hbWVXaWxkY2FyZChzZWFyY2gpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWFyY2g7XG4gIH1cblxuICBwcml2YXRlIF9nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lOiBzdHJpbmcsIHNlYXJjaDogTm9kZVtdKTogTm9kZVtdIHtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGROb2Rlcykge1xuICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlVHlwZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgaWYgKCg8RWxlbWVudD4gY2hpbGQpLnRhZ05hbWUgPT09IHRhZ05hbWUpIHtcbiAgICAgICAgICBzZWFyY2gucHVzaChjaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICAoPGFueT4gY2hpbGQpLl9nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lLCBzZWFyY2gpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWFyY2g7XG4gIH1cblxuICBnZXRFbGVtZW50c0J5VGFnTmFtZU5TKF9uYW1lc3BhY2U6IHN0cmluZywgbG9jYWxOYW1lOiBzdHJpbmcpOiBFbGVtZW50W10ge1xuICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKGxvY2FsTmFtZSk7XG4gIH1cblxuICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNsYXNzTmFtZTogc3RyaW5nKTogRWxlbWVudFtdIHtcbiAgICByZXR1cm4gPEVsZW1lbnRbXT4gZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSh0aGlzLCBjbGFzc05hbWUsIFtdKTtcbiAgfVxuXG4gIGhhc0ZvY3VzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBIVE1MRG9jdW1lbnQgZXh0ZW5kcyBEb2N1bWVudCB7XG4gIGNvbnN0cnVjdG9yKGtleTogdHlwZW9mIENUT1JfS0VZKSB7XG4gICAgaWYgKGtleSAhPT0gQ1RPUl9LRVkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbGxlZ2FsIGNvbnN0cnVjdG9yLlwiKTtcbiAgICB9XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIF9zaGFsbG93Q2xvbmUoKTogTm9kZSB7XG4gICAgcmV0dXJuIG5ldyBIVE1MRG9jdW1lbnQoQ1RPUl9LRVkpO1xuICB9XG59XG5cblV0aWxUeXBlcy5Eb2N1bWVudCA9IERvY3VtZW50O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsUUFBUSxRQUFRLHlCQUF5QjtBQUNsRCxTQUFTLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksUUFBUSxZQUFZO0FBQzFELFNBQVMsUUFBUSxFQUFFLGtCQUFrQixRQUFRLGlCQUFpQjtBQUM5RCxTQUFTLE9BQU8sUUFBUSxlQUFlO0FBQ3ZDLFNBQVMsZ0JBQWdCLFFBQVEseUJBQXlCO0FBQzFELFNBQVMsbUJBQW1CLFFBQVEsc0NBQXNDO0FBQzFFLFNBQVMsaUJBQWlCLFFBQXFCLDJCQUEyQjtBQUMxRSxTQUFTLHNCQUFzQixRQUFRLGFBQWE7QUFDcEQsT0FBTyxlQUFlLG1CQUFtQjtBQUV6QyxPQUFPLE1BQU07SUFDWCxZQUFZLEdBQW9CLENBQUU7UUFDaEMsSUFBSSxRQUFRLFVBQVU7WUFDcEIsTUFBTSxJQUFJLFVBQVUsd0JBQXdCO1FBQzlDLENBQUM7SUFDSDtJQUVBLGlCQUFpQjtRQUNmLE1BQU0sSUFBSSxNQUFNLGlCQUFpQixDQUFDLE9BQU87SUFDM0M7SUFFQSxtQkFBbUIsUUFBaUIsRUFBZ0I7UUFDbEQsWUFBWTtRQUVaLE1BQU0sTUFBTSxJQUFJLGFBQWE7UUFFN0IsTUFBTSxVQUFVLElBQUksYUFBYSxRQUFRLElBQUksSUFBSTtRQUNqRCxJQUFJLFdBQVcsQ0FBQztRQUVoQixNQUFNLE9BQU8sSUFBSSxRQUFRLFFBQVEsS0FBSyxFQUFFLEVBQUU7UUFDMUMsS0FBSyxpQkFBaUIsQ0FBQztRQUV2QixNQUFNLE9BQU8sSUFBSSxRQUFRLFFBQVEsTUFBTSxFQUFFLEVBQUU7UUFDM0MsTUFBTSxPQUFPLElBQUksUUFBUSxRQUFRLE1BQU0sRUFBRSxFQUFFO1FBRTNDLE1BQU0sUUFBUSxJQUFJLFFBQVEsU0FBUyxNQUFNLEVBQUUsRUFBRTtRQUM3QyxNQUFNLFlB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