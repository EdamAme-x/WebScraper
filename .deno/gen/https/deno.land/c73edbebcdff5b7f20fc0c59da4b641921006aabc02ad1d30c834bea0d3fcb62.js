import { CTOR_KEY } from "../constructor-lock.ts";
import { fragmentNodesFromString } from "../deserialize.ts";
import { Node, nodesAndTextNodes, NodeType } from "./node.ts";
import { NodeList, nodeListMutatorSym } from "./node-list.ts";
import { getDatasetHtmlAttrName, getDatasetJavascriptName, getElementsByClassName, getOuterOrInnerHtml, insertBeforeAfter, lowerCaseCharRe, upperCaseCharRe } from "./utils.ts";
import UtilTypes from "./utils-types.ts";
export class DOMTokenList {
    #_value = "";
    get #value() {
        return this.#_value;
    }
    set #value(value) {
        this.#_value = value;
        this.#onChange(value);
    }
    #set = new Set();
    #onChange;
    constructor(onChange, key){
        if (key !== CTOR_KEY) {
            throw new TypeError("Illegal constructor");
        }
        this.#onChange = onChange;
    }
    static #invalidToken(token) {
        return token === "" || /[\t\n\f\r ]/.test(token);
    }
    #setIndices() {
        const classes = Array.from(this.#set);
        for(let i = 0; i < classes.length; i++){
            this[i] = classes[i];
        }
    }
    set value(input) {
        this.#value = input;
        this.#set = new Set(input.trim().split(/[\t\n\f\r\s]+/g).filter(Boolean));
        this.#setIndices();
    }
    get value() {
        return this.#_value;
    }
    get length() {
        return this.#set.size;
    }
    *entries() {
        const array = Array.from(this.#set);
        for(let i = 0; i < array.length; i++){
            yield [
                i,
                array[i]
            ];
        }
    }
    *values() {
        yield* this.#set.values();
    }
    *keys() {
        for(let i = 0; i < this.#set.size; i++){
            yield i;
        }
    }
    *[Symbol.iterator]() {
        yield* this.#set.values();
    }
    item(index) {
        index = Number(index);
        if (Number.isNaN(index) || index === Infinity) index = 0;
        return this[Math.trunc(index) % 2 ** 32] ?? null;
    }
    contains(element) {
        return this.#set.has(element);
    }
    add(...elements) {
        for (const element of elements){
            if (DOMTokenList.#invalidToken(element)) {
                throw new DOMException("Failed to execute 'add' on 'DOMTokenList': The token provided must not be empty.");
            }
            const { size  } = this.#set;
            this.#set.add(element);
            if (size < this.#set.size) {
                this[size] = element;
            }
        }
        this.#updateClassString();
    }
    remove(...elements) {
        const { size  } = this.#set;
        for (const element of elements){
            if (DOMTokenList.#invalidToken(element)) {
                throw new DOMException("Failed to execute 'remove' on 'DOMTokenList': The token provided must not be empty.");
            }
            this.#set.delete(element);
        }
        if (size !== this.#set.size) {
            for(let i = this.#set.size; i < size; i++){
                delete this[i];
            }
            this.#setIndices();
        }
        this.#updateClassString();
    }
    replace(oldToken, newToken) {
        if ([
            oldToken,
            newToken
        ].some((v)=>DOMTokenList.#invalidToken(v))) {
            throw new DOMException("Failed to execute 'replace' on 'DOMTokenList': The token provided must not be empty.");
        }
        if (!this.#set.has(oldToken)) {
            return false;
        }
        if (this.#set.has(newToken)) {
            this.remove(oldToken);
        } else {
            this.#set.delete(oldToken);
            this.#set.add(newToken);
            this.#setIndices();
            this.#updateClassString();
        }
        return true;
    }
    supports() {
        throw new Error("Not implemented");
    }
    toggle(element, force) {
        if (force !== undefined) {
            const operation = force ? "add" : "remove";
            this[operation](element);
            return false;
        } else {
            const contains = this.contains(element);
            const operation = contains ? "remove" : "add";
            this[operation](element);
            return !contains;
        }
    }
    forEach(callback) {
        for (const [i, value] of this.entries()){
            callback(value, i, this);
        }
    }
    #updateClassString() {
        this.#value = Array.from(this.#set).join(" ");
    }
}
const setNamedNodeMapOwnerElementSym = Symbol();
const setAttrValueSym = Symbol();
export class Attr extends Node {
    #namedNodeMap = null;
    #name = "";
    #value = "";
    #ownerElement = null;
    constructor(map, name, value, key){
        if (key !== CTOR_KEY) {
            throw new TypeError("Illegal constructor");
        }
        super(name, NodeType.ATTRIBUTE_NODE, null, CTOR_KEY);
        this.#name = name;
        this.#value = value;
        this.#namedNodeMap = map;
    }
    [setNamedNodeMapOwnerElementSym](ownerElement) {
        this.#ownerElement = ownerElement;
        this.#namedNodeMap = ownerElement?.attributes ?? null;
        if (ownerElement) {
            this._setOwnerDocument(ownerElement.ownerDocument);
        }
    }
    [setAttrValueSym](value) {
        this.#value = value;
    }
    _shallowClone() {
        const newAttr = new Attr(null, this.#name, this.#value, CTOR_KEY);
        newAttr._setOwnerDocument(this.ownerDocument);
        return newAttr;
    }
    cloneNode() {
        return super.cloneNode();
    }
    appendChild() {
        throw new DOMException("Cannot add children to an Attribute");
    }
    replaceChild() {
        throw new DOMException("Cannot add children to an Attribute");
    }
    insertBefore() {
        throw new DOMException("Cannot add children to an Attribute");
    }
    removeChild() {
        throw new DOMException("The node to be removed is not a child of this node");
    }
    get name() {
        return this.#name;
    }
    get localName() {
        // TODO: When we make namespaces a thing this needs
        // to be updated
        return this.#name;
    }
    get value() {
        return this.#value;
    }
    set value(value) {
        this.#value = String(value);
        if (this.#namedNodeMap) {
            this.#namedNodeMap[setNamedNodeMapValueSym](this.#name, this.#value, true);
        }
    }
    get ownerElement() {
        return this.#ownerElement ?? null;
    }
    get specified() {
        return true;
    }
    // TODO
    get prefix() {
        return null;
    }
}
const setNamedNodeMapValueSym = Symbol();
const getNamedNodeMapValueSym = Symbol();
const getNamedNodeMapAttrNamesSym = Symbol();
const getNamedNodeMapAttrNodeSym = Symbol();
const removeNamedNodeMapAttrSym = Symbol();
export class NamedNodeMap {
    static #indexedAttrAccess = function(map, index) {
        if (index + 1 > this.length) {
            return undefined;
        }
        const attribute = Object.keys(map).filter((attribute)=>map[attribute] !== undefined)[index]?.slice(1); // Remove "a" for safeAttrName
        return this[getNamedNodeMapAttrNodeSym](attribute);
    };
    #onAttrNodeChange;
    constructor(ownerElement, onAttrNodeChange, key){
        if (key !== CTOR_KEY) {
            throw new TypeError("Illegal constructor.");
        }
        this.#ownerElement = ownerElement;
        this.#onAttrNodeChange = onAttrNodeChange;
    }
    #attrNodeCache = {};
    #map = {};
    #length = 0;
    #capacity = 0;
    #ownerElement = null;
    [getNamedNodeMapAttrNodeSym](attribute) {
        const safeAttrName = "a" + attribute;
        let attrNode = this.#attrNodeCache[safeAttrName];
        if (!attrNode) {
            attrNode = this.#attrNodeCache[safeAttrName] = new Attr(this, attribute, this.#map[safeAttrName], CTOR_KEY);
            attrNode[setNamedNodeMapOwnerElementSym](this.#ownerElement);
        }
        return attrNode;
    }
    [getNamedNodeMapAttrNamesSym]() {
        const names = [];
        for (const [name, value] of Object.entries(this.#map)){
            if (value !== undefined) {
                names.push(name.slice(1)); // Remove "a" for safeAttrName
            }
        }
        return names;
    }
    [getNamedNodeMapValueSym](attribute) {
        const safeAttrName = "a" + attribute;
        return this.#map[safeAttrName];
    }
    [setNamedNodeMapValueSym](attribute, value, bubble = false) {
        const safeAttrName = "a" + attribute;
        if (this.#map[safeAttrName] === undefined) {
            this.#length++;
            if (this.#length > this.#capacity) {
                this.#capacity = this.#length;
                const index = this.#capacity - 1;
                Object.defineProperty(this, String(this.#capacity - 1), {
                    get: NamedNodeMap.#indexedAttrAccess.bind(this, this.#map, index)
                });
            }
        } else if (this.#attrNodeCache[safeAttrName]) {
            this.#attrNodeCache[safeAttrName][setAttrValueSym](value);
        }
        this.#map[safeAttrName] = value;
        if (bubble) {
            this.#onAttrNodeChange(attribute, value);
        }
    }
    /**
   * Called when an attribute is removed from
   * an element
   */ [removeNamedNodeMapAttrSym](attribute) {
        const safeAttrName = "a" + attribute;
        if (this.#map[safeAttrName] !== undefined) {
            this.#length--;
            this.#map[safeAttrName] = undefined;
            this.#onAttrNodeChange(attribute, null);
            const attrNode = this.#attrNodeCache[safeAttrName];
            if (attrNode) {
                attrNode[setNamedNodeMapOwnerElementSym](null);
                this.#attrNodeCache[safeAttrName] = undefined;
            }
        }
    }
    *[Symbol.iterator]() {
        for(let i = 0; i < this.length; i++){
            yield this[i];
        }
    }
    get length() {
        return this.#length;
    }
    // FIXME: This method should accept anything and basically
    // coerce any non numbers (and Infinity/-Infinity) into 0
    item(index) {
        if (index >= this.#length) {
            return null;
        }
        return this[index];
    }
    getNamedItem(attribute) {
        const safeAttrName = "a" + attribute;
        if (this.#map[safeAttrName] !== undefined) {
            return this[getNamedNodeMapAttrNodeSym](attribute);
        }
        return null;
    }
    setNamedItem(attrNode) {
        if (attrNode.ownerElement) {
            throw new DOMException("Attribute already in use");
        }
        const safeAttrName = "a" + attrNode.name;
        const previousAttr = this.#attrNodeCache[safeAttrName];
        if (previousAttr) {
            previousAttr[setNamedNodeMapOwnerElementSym](null);
            this.#map[safeAttrName] = undefined;
        }
        attrNode[setNamedNodeMapOwnerElementSym](this.#ownerElement);
        this.#attrNodeCache[safeAttrName] = attrNode;
        this[setNamedNodeMapValueSym](attrNode.name, attrNode.value, true);
    }
    removeNamedItem(attribute) {
        const safeAttrName = "a" + attribute;
        if (this.#map[safeAttrName] !== undefined) {
            const attrNode = this[getNamedNodeMapAttrNodeSym](attribute);
            this[removeNamedNodeMapAttrSym](attribute);
            return attrNode;
        }
        throw new DOMException("Node was not found");
    }
}
const XML_NAMESTART_CHAR_RE_SRC = ":A-Za-z_" + String.raw`\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}` + String.raw`\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}` + String.raw`\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}`;
const XML_NAME_CHAR_RE_SRC = XML_NAMESTART_CHAR_RE_SRC + String.raw`\u{B7}\u{0300}-\u{036F}\u{203F}-\u{2040}0-9.-`;
const xmlNamestartCharRe = new RegExp(`[${XML_NAMESTART_CHAR_RE_SRC}]`, "u");
const xmlNameCharRe = new RegExp(`[${XML_NAME_CHAR_RE_SRC}]`, "u");
export class Element extends Node {
    tagName;
    localName;
    attributes;
    #datasetProxy;
    #currentId;
    #classList;
    constructor(tagName, parentNode, attributes, key){
        super(tagName, NodeType.ELEMENT_NODE, parentNode, key);
        this.tagName = tagName;
        this.attributes = new NamedNodeMap(this, (attribute, value)=>{
            if (value === null) {
                value = "";
            }
            switch(attribute){
                case "class":
                    this.#classList.value = value;
                    break;
                case "id":
                    this.#currentId = value;
                    break;
            }
        }, CTOR_KEY);
        this.#datasetProxy = null;
        this.#currentId = "";
        this.#classList = new DOMTokenList((className)=>{
            if (this.hasAttribute("class") || className !== "") {
                this.attributes[setNamedNodeMapValueSym]("class", className);
            }
        }, CTOR_KEY);
        for (const attr of attributes){
            this.setAttribute(attr[0], attr[1]);
            switch(attr[0]){
                case "class":
                    this.#classList.value = attr[1];
                    break;
                case "id":
                    this.#currentId = attr[1];
                    break;
            }
        }
        this.tagName = this.nodeName = tagName.toUpperCase();
        this.localName = tagName.toLowerCase();
    }
    _shallowClone() {
        // FIXME: This attribute copying needs to also be fixed in other
        // elements that override _shallowClone like <template>
        const attributes = [];
        for (const attribute of this.getAttributeNames()){
            attributes.push([
                attribute,
                this.getAttribute(attribute)
            ]);
        }
        return new Element(this.nodeName, null, attributes, CTOR_KEY);
    }
    get childElementCount() {
        return this._getChildNodesMutator().elementsView().length;
    }
    get className() {
        return this.getAttribute("class") ?? "";
    }
    set className(className) {
        this.setAttribute("class", className);
        this.#classList.value = className;
    }
    get classList() {
        return this.#classList;
    }
    get outerHTML() {
        return getOuterOrInnerHtml(this, true);
    }
    set outerHTML(html) {
        if (this.parentNode) {
            const { parentElement , parentNode  } = this;
            let contextLocalName = parentElement?.localName;
            switch(parentNode.nodeType){
                case NodeType.DOCUMENT_NODE:
                    {
                        throw new DOMException("Modifications are not allowed for this document");
                    }
                // setting outerHTML, step 4. Document Fragment
                // ref: https://w3c.github.io/DOM-Parsing/#dom-element-outerhtml
                case NodeType.DOCUMENT_FRAGMENT_NODE:
                    {
                        contextLocalName = "body";
                    // fall-through
                    }
                default:
                    {
                        const { childNodes: newChildNodes  } = fragmentNodesFromString(html, contextLocalName).childNodes[0];
                        const mutator = parentNode._getChildNodesMutator();
                        const insertionIndex = mutator.indexOf(this);
                        for(let i = newChildNodes.length - 1; i >= 0; i--){
                            const child = newChildNodes[i];
                            mutator.splice(insertionIndex, 0, child);
                            child._setParent(parentNode);
                            child._setOwnerDocument(parentNode.ownerDocument);
                        }
                        this.remove();
                    }
            }
        }
    }
    get innerHTML() {
        return getOuterOrInnerHtml(this, false);
    }
    set innerHTML(html) {
        // Remove all children
        for (const child of this.childNodes){
            child._setParent(null);
        }
        const mutator = this._getChildNodesMutator();
        mutator.splice(0, this.childNodes.length);
        // Parse HTML into new children
        if (html.length) {
            const parsed = fragmentNodesFromString(html, this.localName);
            for (const child of parsed.childNodes[0].childNodes){
                mutator.push(child);
            }
            for (const child of this.childNodes){
                child._setParent(this);
                child._setOwnerDocument(this.ownerDocument);
            }
        }
    }
    get innerText() {
        return this.textContent;
    }
    set innerText(text) {
        this.textContent = text;
    }
    get children() {
        return this._getChildNodesMutator().elementsView();
    }
    get id() {
        return this.#currentId || "";
    }
    set id(id) {
        this.setAttribute("id", this.#currentId = id);
    }
    get dataset() {
        if (this.#datasetProxy) {
            return this.#datasetProxy;
        }
        this.#datasetProxy = new Proxy({}, {
            get: (_target, property, _receiver)=>{
                if (typeof property === "string") {
                    const attributeName = getDatasetHtmlAttrName(property);
                    return this.getAttribute(attributeName) ?? undefined;
                }
                return undefined;
            },
            set: (_target, property, value, _receiver)=>{
                if (typeof property === "string") {
                    let attributeName = "data-";
                    let prevChar = "";
                    for (const char of property){
                        // Step 1. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
                        if (prevChar === "-" && lowerCaseCharRe.test(char)) {
                            throw new DOMException("An invalid or illegal string was specified");
                        }
                        // Step 4. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
                        if (!xmlNameCharRe.test(char)) {
                            throw new DOMException("String contains an invalid character");
                        }
                        // Step 2. https://html.spec.whatwg.org/multipage/dom.html#dom-domstringmap-setitem
                        if (upperCaseCharRe.test(char)) {
                            attributeName += "-";
                        }
                        attributeName += char.toLowerCase();
                        prevChar = char;
                    }
                    this.setAttribute(attributeName, String(value));
                }
                return true;
            },
            deleteProperty: (_target, property)=>{
                if (typeof property === "string") {
                    const attributeName = getDatasetHtmlAttrName(property);
                    this.removeAttribute(attributeName);
                }
                return true;
            },
            ownKeys: (_target)=>{
                return this.getAttributeNames().flatMap((attributeName)=>{
                    if (attributeName.startsWith?.("data-")) {
                        return [
                            getDatasetJavascriptName(attributeName)
                        ];
                    } else {
                        return [];
                    }
                });
            },
            getOwnPropertyDescriptor: (_target, property)=>{
                if (typeof property === "string") {
                    const attributeName = getDatasetHtmlAttrName(property);
                    if (this.hasAttribute(attributeName)) {
                        return {
                            writable: true,
                            enumerable: true,
                            configurable: true
                        };
                    }
                }
                return undefined;
            },
            has: (_target, property)=>{
                if (typeof property === "string") {
                    const attributeName = getDatasetHtmlAttrName(property);
                    return this.hasAttribute(attributeName);
                }
                return false;
            }
        });
        return this.#datasetProxy;
    }
    getAttributeNames() {
        return this.attributes[getNamedNodeMapAttrNamesSym]();
    }
    getAttribute(name) {
        return this.attributes[getNamedNodeMapValueSym](name.toLowerCase()) ?? null;
    }
    setAttribute(rawName, value) {
        const name = String(rawName?.toLowerCase());
        const strValue = String(value);
        this.attributes[setNamedNodeMapValueSym](name, strValue);
        if (name === "id") {
            this.#currentId = strValue;
        } else if (name === "class") {
            this.#classList.value = strValue;
        }
    }
    removeAttribute(rawName) {
        const name = String(rawName?.toLowerCase());
        this.attributes[removeNamedNodeMapAttrSym](name);
        if (name === "class") {
            this.#classList.value = "";
        }
    }
    hasAttribute(name) {
        return this.attributes[getNamedNodeMapValueSym](String(name?.toLowerCase())) !== undefined;
    }
    hasAttributeNS(_namespace, name) {
        // TODO: Use namespace
        return this.attributes[getNamedNodeMapValueSym](String(name?.toLowerCase())) !== undefined;
    }
    replaceWith(...nodes) {
        this._replaceWith(...nodes);
    }
    remove() {
        this._remove();
    }
    append(...nodes) {
        const mutator = this._getChildNodesMutator();
        mutator.push(...nodesAndTextNodes(nodes, this));
    }
    prepend(...nodes) {
        const mutator = this._getChildNodesMutator();
        mutator.splice(0, 0, ...nodesAndTextNodes(nodes, this));
    }
    before(...nodes) {
        if (this.parentNode) {
            insertBeforeAfter(this, nodes, true);
        }
    }
    after(...nodes) {
        if (this.parentNode) {
            insertBeforeAfter(this, nodes, false);
        }
    }
    get firstElementChild() {
        const elements = this._getChildNodesMutator().elementsView();
        return elements[0] ?? null;
    }
    get lastElementChild() {
        const elements = this._getChildNodesMutator().elementsView();
        return elements[elements.length - 1] ?? null;
    }
    get nextElementSibling() {
        const parent = this.parentNode;
        if (!parent) {
            return null;
        }
        const mutator = parent._getChildNodesMutator();
        const index = mutator.indexOfElementsView(this);
        const elements = mutator.elementsView();
        return elements[index + 1] ?? null;
    }
    get previousElementSibling() {
        const parent = this.parentNode;
        if (!parent) {
            return null;
        }
        const mutator = parent._getChildNodesMutator();
        const index = mutator.indexOfElementsView(this);
        const elements = mutator.elementsView();
        return elements[index - 1] ?? null;
    }
    querySelector(selectors) {
        if (!this.ownerDocument) {
            throw new Error("Element must have an owner document");
        }
        return this.ownerDocument._nwapi.first(selectors, this);
    }
    querySelectorAll(selectors) {
        if (!this.ownerDocument) {
            throw new Error("Element must have an owner document");
        }
        const nodeList = new NodeList();
        const mutator = nodeList[nodeListMutatorSym]();
        for (const match of this.ownerDocument._nwapi.select(selectors, this)){
            mutator.push(match);
        }
        return nodeList;
    }
    matches(selectorString) {
        return this.ownerDocument._nwapi.match(selectorString, this);
    }
    closest(selectorString) {
        const { match  } = this.ownerDocument._nwapi; // See note below
        // deno-lint-ignore no-this-alias
        let el = this;
        do {
            // Note: Not using `el.matches(selectorString)` because on a browser if you override
            // `matches`, you *don't* see it being used by `closest`.
            if (match(selectorString, el)) {
                return el;
            }
            el = el.parentElement;
        }while (el !== null)
        return null;
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
        const fixCaseTagName = tagName.toUpperCase();
        if (fixCaseTagName === "*") {
            return this._getElementsByTagNameWildcard([]);
        } else {
            return this._getElementsByTagName(tagName.toUpperCase(), []);
        }
    }
    _getElementsByTagNameWildcard(search) {
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
    getElementsByClassName(className) {
        return getElementsByClassName(this, className, []);
    }
    getElementsByTagNameNS(_namespace, localName) {
        // TODO: Use namespace
        return this.getElementsByTagName(localName);
    }
}
UtilTypes.Element = Element;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40My9zcmMvZG9tL2VsZW1lbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1RPUl9LRVkgfSBmcm9tIFwiLi4vY29uc3RydWN0b3ItbG9jay50c1wiO1xuaW1wb3J0IHsgZnJhZ21lbnROb2Rlc0Zyb21TdHJpbmcgfSBmcm9tIFwiLi4vZGVzZXJpYWxpemUudHNcIjtcbmltcG9ydCB7IE5vZGUsIG5vZGVzQW5kVGV4dE5vZGVzLCBOb2RlVHlwZSB9IGZyb20gXCIuL25vZGUudHNcIjtcbmltcG9ydCB7IE5vZGVMaXN0LCBub2RlTGlzdE11dGF0b3JTeW0gfSBmcm9tIFwiLi9ub2RlLWxpc3QudHNcIjtcbmltcG9ydCB7IEhUTUxDb2xsZWN0aW9uIH0gZnJvbSBcIi4vaHRtbC1jb2xsZWN0aW9uLnRzXCI7XG5pbXBvcnQge1xuICBnZXREYXRhc2V0SHRtbEF0dHJOYW1lLFxuICBnZXREYXRhc2V0SmF2YXNjcmlwdE5hbWUsXG4gIGdldEVsZW1lbnRzQnlDbGFzc05hbWUsXG4gIGdldE91dGVyT3JJbm5lckh0bWwsXG4gIGluc2VydEJlZm9yZUFmdGVyLFxuICBsb3dlckNhc2VDaGFyUmUsXG4gIHVwcGVyQ2FzZUNoYXJSZSxcbn0gZnJvbSBcIi4vdXRpbHMudHNcIjtcbmltcG9ydCBVdGlsVHlwZXMgZnJvbSBcIi4vdXRpbHMtdHlwZXMudHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBET01Ub2tlbkxpc3Qge1xuICBbaW5kZXg6IG51bWJlcl06IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIERPTVRva2VuTGlzdCB7XG4gICNfdmFsdWUgPSBcIlwiO1xuICBnZXQgI3ZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLiNfdmFsdWU7XG4gIH1cbiAgc2V0ICN2YWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nLFxuICApIHtcbiAgICB0aGlzLiNfdmFsdWUgPSB2YWx1ZTtcbiAgICB0aGlzLiNvbkNoYW5nZSh2YWx1ZSk7XG4gIH1cbiAgI3NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAjb25DaGFuZ2U6IChjbGFzc05hbWU6IHN0cmluZykgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBvbkNoYW5nZTogKGNsYXNzTmFtZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgIGtleTogdHlwZW9mIENUT1JfS0VZLFxuICApIHtcbiAgICBpZiAoa2V5ICE9PSBDVE9SX0tFWSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgY29uc3RydWN0b3JcIik7XG4gICAgfVxuICAgIHRoaXMuI29uQ2hhbmdlID0gb25DaGFuZ2U7XG4gIH1cblxuICBzdGF0aWMgI2ludmFsaWRUb2tlbihcbiAgICB0b2tlbjogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gdG9rZW4gPT09IFwiXCIgfHwgL1tcXHRcXG5cXGZcXHIgXS8udGVzdCh0b2tlbik7XG4gIH1cblxuICAjc2V0SW5kaWNlcygpIHtcbiAgICBjb25zdCBjbGFzc2VzID0gQXJyYXkuZnJvbSh0aGlzLiNzZXQpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IGNsYXNzZXNbaV07XG4gICAgfVxuICB9XG5cbiAgc2V0IHZhbHVlKFxuICAgIGlucHV0OiBzdHJpbmcsXG4gICkge1xuICAgIHRoaXMuI3ZhbHVlID0gaW5wdXQ7XG4gICAgdGhpcy4jc2V0ID0gbmV3IFNldChcbiAgICAgIGlucHV0XG4gICAgICAgIC50cmltKClcbiAgICAgICAgLnNwbGl0KC9bXFx0XFxuXFxmXFxyXFxzXSsvZylcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKSxcbiAgICApO1xuICAgIHRoaXMuI3NldEluZGljZXMoKTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jX3ZhbHVlO1xuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy4jc2V0LnNpemU7XG4gIH1cblxuICAqZW50cmllcygpOiBJdGVyYWJsZUl0ZXJhdG9yPFtudW1iZXIsIHN0cmluZ10+IHtcbiAgICBjb25zdCBhcnJheSA9IEFycmF5LmZyb20odGhpcy4jc2V0KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB5aWVsZCBbaSwgYXJyYXlbaV1dO1xuICAgIH1cbiAgfVxuXG4gICp2YWx1ZXMoKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICB5aWVsZCogdGhpcy4jc2V0LnZhbHVlcygpO1xuICB9XG5cbiAgKmtleXMoKTogSXRlcmFibGVJdGVyYXRvcjxudW1iZXI+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuI3NldC5zaXplOyBpKyspIHtcbiAgICAgIHlpZWxkIGk7XG4gICAgfVxuICB9XG5cbiAgKltTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gICAgeWllbGQqIHRoaXMuI3NldC52YWx1ZXMoKTtcbiAgfVxuXG4gIGl0ZW0oXG4gICAgaW5kZXg6IG51bWJlcixcbiAgKSB7XG4gICAgaW5kZXggPSBOdW1iZXIoaW5kZXgpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4oaW5kZXgpIHx8IGluZGV4ID09PSBJbmZpbml0eSkgaW5kZXggPSAwO1xuICAgIHJldHVybiB0aGlzW01hdGgudHJ1bmMoaW5kZXgpICUgMiAqKiAzMl0gPz8gbnVsbDtcbiAgfVxuXG4gIGNvbnRhaW5zKFxuICAgIGVsZW1lbnQ6IHN0cmluZyxcbiAgKSB7XG4gICAgcmV0dXJuIHRoaXMuI3NldC5oYXMoZWxlbWVudCk7XG4gIH1cblxuICBhZGQoXG4gICAgLi4uZWxlbWVudHM6IEFycmF5PHN0cmluZz5cbiAgKSB7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgICBpZiAoRE9NVG9rZW5MaXN0LiNpbnZhbGlkVG9rZW4oZWxlbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcbiAgICAgICAgICBcIkZhaWxlZCB0byBleGVjdXRlICdhZGQnIG9uICdET01Ub2tlbkxpc3QnOiBUaGUgdG9rZW4gcHJvdmlkZWQgbXVzdCBub3QgYmUgZW1wdHkuXCIsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCB7IHNpemUgfSA9IHRoaXMuI3NldDtcbiAgICAgIHRoaXMuI3NldC5hZGQoZWxlbWVudCk7XG4gICAgICBpZiAoc2l6ZSA8IHRoaXMuI3NldC5zaXplKSB7XG4gICAgICAgIHRoaXNbc2l6ZV0gPSBlbGVtZW50O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLiN1cGRhdGVDbGFzc1N0cmluZygpO1xuICB9XG5cbiAgcmVtb3ZlKFxuICAgIC4uLmVsZW1lbnRzOiBBcnJheTxzdHJpbmc+XG4gICkge1xuICAgIGNvbnN0IHsgc2l6ZSB9ID0gdGhpcy4jc2V0O1xuICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgaWYgKERPTVRva2VuTGlzdC4jaW52YWxpZFRva2VuKGVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgICAgXCJGYWlsZWQgdG8gZXhlY3V0ZSAncmVtb3ZlJyBvbiAnRE9NVG9rZW5MaXN0JzogVGhlIHRva2VuIHByb3ZpZGVkIG11c3Qgbm90IGJlIGVtcHR5LlwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy4jc2V0LmRlbGV0ZShlbGVtZW50KTtcbiAgICB9XG4gICAgaWYgKHNpemUgIT09IHRoaXMuI3NldC5zaXplKSB7XG4gICAgICBmb3IgKGxldCBpID0gdGhpcy4jc2V0LnNpemU7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIHRoaXNbaV07XG4gICAgICB9XG4gICAgICB0aGlzLiNzZXRJbmRpY2VzKCk7XG4gICAgfVxuICAgIHRoaXMuI3VwZGF0ZUNsYXNzU3RyaW5nKCk7XG4gIH1cblxuICByZXBsYWNlKFxuICAgIG9sZFRva2VuOiBzdHJpbmcsXG4gICAgbmV3VG9rZW46IHN0cmluZyxcbiAgKSB7XG4gICAgaWYgKFtvbGRUb2tlbiwgbmV3VG9rZW5dLnNvbWUoKHYpID0+IERPTVRva2VuTGlzdC4jaW52YWxpZFRva2VuKHYpKSkge1xuICAgICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcbiAgICAgICAgXCJGYWlsZWQgdG8gZXhlY3V0ZSAncmVwbGFjZScgb24gJ0RPTVRva2VuTGlzdCc6IFRoZSB0b2tlbiBwcm92aWRlZCBtdXN0IG5vdCBiZSBlbXB0eS5cIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICghdGhpcy4jc2V0LmhhcyhvbGRUb2tlbikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy4jc2V0LmhhcyhuZXdUb2tlbikpIHtcbiAgICAgIHRoaXMucmVtb3ZlKG9sZFRva2VuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jc2V0LmRlbGV0ZShvbGRUb2tlbik7XG4gICAgICB0aGlzLiNzZXQuYWRkKG5ld1Rva2VuKTtcbiAgICAgIHRoaXMuI3NldEluZGljZXMoKTtcbiAgICAgIHRoaXMuI3VwZGF0ZUNsYXNzU3RyaW5nKCk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgc3VwcG9ydHMoKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIHRvZ2dsZShcbiAgICBlbGVtZW50OiBzdHJpbmcsXG4gICAgZm9yY2U/OiBib29sZWFuLFxuICApIHtcbiAgICBpZiAoZm9yY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qgb3BlcmF0aW9uID0gZm9yY2UgPyBcImFkZFwiIDogXCJyZW1vdmVcIjtcbiAgICAgIHRoaXNbb3BlcmF0aW9uXShlbGVtZW50KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY29udGFpbnMgPSB0aGlzLmNvbnRhaW5zKGVsZW1lbnQpO1xuICAgICAgY29uc3Qgb3BlcmF0aW9uID0gY29udGFpbnMgPyBcInJlbW92ZVwiIDogXCJhZGRcIjtcbiAgICAgIHRoaXNbb3BlcmF0aW9uXShlbGVtZW50KTtcbiAgICAgIHJldHVybiAhY29udGFpbnM7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaChcbiAgICBjYWxsYmFjazogKHZhbHVlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIsIGxpc3Q6IERPTVRva2VuTGlzdCkgPT4gdm9pZCxcbiAgKSB7XG4gICAgZm9yIChjb25zdCBbaSwgdmFsdWVdIG9mIHRoaXMuZW50cmllcygpKSB7XG4gICAgICBjYWxsYmFjayh2YWx1ZSwgaSwgdGhpcyk7XG4gICAgfVxuICB9XG5cbiAgI3VwZGF0ZUNsYXNzU3RyaW5nKCkge1xuICAgIHRoaXMuI3ZhbHVlID0gQXJyYXkuZnJvbSh0aGlzLiNzZXQpLmpvaW4oXCIgXCIpO1xuICB9XG59XG5cbmNvbnN0IHNldE5hbWVkTm9kZU1hcE93bmVyRWxlbWVudFN5bSA9IFN5bWJvbCgpO1xuY29uc3Qgc2V0QXR0clZhbHVlU3ltID0gU3ltYm9sKCk7XG5leHBvcnQgY2xhc3MgQXR0ciBleHRlbmRzIE5vZGUge1xuICAjbmFtZWROb2RlTWFwOiBOYW1lZE5vZGVNYXAgfCBudWxsID0gbnVsbDtcbiAgI25hbWUgPSBcIlwiO1xuICAjdmFsdWUgPSBcIlwiO1xuICAjb3duZXJFbGVtZW50OiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbWFwOiBOYW1lZE5vZGVNYXAgfCBudWxsLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIGtleTogdHlwZW9mIENUT1JfS0VZLFxuICApIHtcbiAgICBpZiAoa2V5ICE9PSBDVE9SX0tFWSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgY29uc3RydWN0b3JcIik7XG4gICAgfVxuICAgIHN1cGVyKG5hbWUsIE5vZGVUeXBlLkFUVFJJQlVURV9OT0RFLCBudWxsLCBDVE9SX0tFWSk7XG5cbiAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICB0aGlzLiN2YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuI25hbWVkTm9kZU1hcCA9IG1hcDtcbiAgfVxuXG4gIFtzZXROYW1lZE5vZGVNYXBPd25lckVsZW1lbnRTeW1dKG93bmVyRWxlbWVudDogRWxlbWVudCB8IG51bGwpIHtcbiAgICB0aGlzLiNvd25lckVsZW1lbnQgPSBvd25lckVsZW1lbnQ7XG4gICAgdGhpcy4jbmFtZWROb2RlTWFwID0gb3duZXJFbGVtZW50Py5hdHRyaWJ1dGVzID8/IG51bGw7XG5cbiAgICBpZiAob3duZXJFbGVtZW50KSB7XG4gICAgICB0aGlzLl9zZXRPd25lckRvY3VtZW50KG93bmVyRWxlbWVudC5vd25lckRvY3VtZW50KTtcbiAgICB9XG4gIH1cblxuICBbc2V0QXR0clZhbHVlU3ltXSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy4jdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIG92ZXJyaWRlIF9zaGFsbG93Q2xvbmUoKTogQXR0ciB7XG4gICAgY29uc3QgbmV3QXR0ciA9IG5ldyBBdHRyKG51bGwsIHRoaXMuI25hbWUsIHRoaXMuI3ZhbHVlLCBDVE9SX0tFWSk7XG4gICAgbmV3QXR0ci5fc2V0T3duZXJEb2N1bWVudCh0aGlzLm93bmVyRG9jdW1lbnQpO1xuICAgIHJldHVybiBuZXdBdHRyO1xuICB9XG5cbiAgb3ZlcnJpZGUgY2xvbmVOb2RlKCk6IEF0dHIge1xuICAgIHJldHVybiBzdXBlci5jbG9uZU5vZGUoKSBhcyBBdHRyO1xuICB9XG5cbiAgb3ZlcnJpZGUgYXBwZW5kQ2hpbGQoKTogTm9kZSB7XG4gICAgdGhyb3cgbmV3IERPTUV4Y2VwdGlvbihcIkNhbm5vdCBhZGQgY2hpbGRyZW4gdG8gYW4gQXR0cmlidXRlXCIpO1xuICB9XG5cbiAgb3ZlcnJpZGUgcmVwbGFjZUNoaWxkKCk6IE5vZGUge1xuICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXCJDYW5ub3QgYWRkIGNoaWxkcmVuIHRvIGFuIEF0dHJpYnV0ZVwiKTtcbiAgfVxuXG4gIG92ZXJyaWRlIGluc2VydEJlZm9yZSgpOiBOb2RlIHtcbiAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiQ2Fubm90IGFkZCBjaGlsZHJlbiB0byBhbiBBdHRyaWJ1dGVcIik7XG4gIH1cblxuICBvdmVycmlkZSByZW1vdmVDaGlsZCgpOiBOb2RlIHtcbiAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFxuICAgICAgXCJUaGUgbm9kZSB0byBiZSByZW1vdmVkIGlzIG5vdCBhIGNoaWxkIG9mIHRoaXMgbm9kZVwiLFxuICAgICk7XG4gIH1cblxuICBnZXQgbmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jbmFtZTtcbiAgfVxuXG4gIGdldCBsb2NhbE5hbWUoKSB7XG4gICAgLy8gVE9ETzogV2hlbiB3ZSBtYWtlIG5hbWVzcGFjZXMgYSB0aGluZyB0aGlzIG5lZWRzXG4gICAgLy8gdG8gYmUgdXBkYXRlZFxuICAgIHJldHVybiB0aGlzLiNuYW1lO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI3ZhbHVlO1xuICB9XG5cbiAgc2V0IHZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICB0aGlzLiN2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG5cbiAgICBpZiAodGhpcy4jbmFtZWROb2RlTWFwKSB7XG4gICAgICB0aGlzLiNuYW1lZE5vZGVNYXBbc2V0TmFtZWROb2RlTWFwVmFsdWVTeW1dKFxuICAgICAgICB0aGlzLiNuYW1lLFxuICAgICAgICB0aGlzLiN2YWx1ZSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IG93bmVyRWxlbWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jb3duZXJFbGVtZW50ID8/IG51bGw7XG4gIH1cblxuICBnZXQgc3BlY2lmaWVkKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gVE9ET1xuICBnZXQgcHJlZml4KCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmFtZWROb2RlTWFwIHtcbiAgW2luZGV4OiBudW1iZXJdOiBBdHRyO1xufVxuXG5jb25zdCBzZXROYW1lZE5vZGVNYXBWYWx1ZVN5bSA9IFN5bWJvbCgpO1xuY29uc3QgZ2V0TmFtZWROb2RlTWFwVmFsdWVTeW0gPSBTeW1ib2woKTtcbmNvbnN0IGdldE5hbWVkTm9kZU1hcEF0dHJOYW1lc1N5bSA9IFN5bWJvbCgpO1xuY29uc3QgZ2V0TmFtZWROb2RlTWFwQXR0ck5vZGVTeW0gPSBTeW1ib2woKTtcbmNvbnN0IHJlbW92ZU5hbWVkTm9kZU1hcEF0dHJTeW0gPSBTeW1ib2woKTtcbmV4cG9ydCBjbGFzcyBOYW1lZE5vZGVNYXAge1xuICBzdGF0aWMgI2luZGV4ZWRBdHRyQWNjZXNzID0gZnVuY3Rpb24gKFxuICAgIHRoaXM6IE5hbWVkTm9kZU1hcCxcbiAgICBtYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHVuZGVmaW5lZD4sXG4gICAgaW5kZXg6IG51bWJlcixcbiAgKTogQXR0ciB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKGluZGV4ICsgMSA+IHRoaXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IE9iamVjdFxuICAgICAgLmtleXMobWFwKVxuICAgICAgLmZpbHRlcigoYXR0cmlidXRlKSA9PiBtYXBbYXR0cmlidXRlXSAhPT0gdW5kZWZpbmVkKVtpbmRleF1cbiAgICAgID8uc2xpY2UoMSk7IC8vIFJlbW92ZSBcImFcIiBmb3Igc2FmZUF0dHJOYW1lXG4gICAgcmV0dXJuIHRoaXNbZ2V0TmFtZWROb2RlTWFwQXR0ck5vZGVTeW1dKGF0dHJpYnV0ZSk7XG4gIH07XG4gICNvbkF0dHJOb2RlQ2hhbmdlOiAoYXR0cjogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBvd25lckVsZW1lbnQ6IEVsZW1lbnQsXG4gICAgb25BdHRyTm9kZUNoYW5nZTogKGF0dHI6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHZvaWQsXG4gICAga2V5OiB0eXBlb2YgQ1RPUl9LRVksXG4gICkge1xuICAgIGlmIChrZXkgIT09IENUT1JfS0VZKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBjb25zdHJ1Y3Rvci5cIik7XG4gICAgfVxuICAgIHRoaXMuI293bmVyRWxlbWVudCA9IG93bmVyRWxlbWVudDtcbiAgICB0aGlzLiNvbkF0dHJOb2RlQ2hhbmdlID0gb25BdHRyTm9kZUNoYW5nZTtcbiAgfVxuXG4gICNhdHRyTm9kZUNhY2hlOiBSZWNvcmQ8c3RyaW5nLCBBdHRyIHwgdW5kZWZpbmVkPiA9IHt9O1xuICAjbWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCB1bmRlZmluZWQ+ID0ge307XG4gICNsZW5ndGggPSAwO1xuICAjY2FwYWNpdHkgPSAwO1xuICAjb3duZXJFbGVtZW50OiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgW2dldE5hbWVkTm9kZU1hcEF0dHJOb2RlU3ltXShhdHRyaWJ1dGU6IHN0cmluZyk6IEF0dHIge1xuICAgIGNvbnN0IHNhZmVBdHRyTmFtZSA9IFwiYVwiICsgYXR0cmlidXRlO1xuICAgIGxldCBhdHRyTm9kZSA9IHRoaXMuI2F0dHJOb2RlQ2FjaGVbc2FmZUF0dHJOYW1lXTtcbiAgICBpZiAoIWF0dHJOb2RlKSB7XG4gICAgICBhdHRyTm9kZSA9IHRoaXMuI2F0dHJOb2RlQ2FjaGVbc2FmZUF0dHJOYW1lXSA9IG5ldyBBdHRyKFxuICAgICAgICB0aGlzLFxuICAgICAgICBhdHRyaWJ1dGUsXG4gICAgICAgIHRoaXMuI21hcFtzYWZlQXR0ck5hbWVdIGFzIHN0cmluZyxcbiAgICAgICAgQ1RPUl9LRVksXG4gICAgICApO1xuICAgICAgYXR0ck5vZGVbc2V0TmFtZWROb2RlTWFwT3duZXJFbGVtZW50U3ltXSh0aGlzLiNvd25lckVsZW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBhdHRyTm9kZTtcbiAgfVxuXG4gIFtnZXROYW1lZE5vZGVNYXBBdHRyTmFtZXNTeW1dKCk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBuYW1lczogc3RyaW5nW10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgW25hbWUsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh0aGlzLiNtYXApKSB7XG4gICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYW1lcy5wdXNoKG5hbWUuc2xpY2UoMSkpOyAvLyBSZW1vdmUgXCJhXCIgZm9yIHNhZmVBdHRyTmFtZVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuYW1lcztcbiAgfVxuXG4gIFtnZXROYW1lZE5vZGVNYXBWYWx1ZVN5bV0oYXR0cmlidXRlOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHNhZmVBdHRyTmFtZSA9IFwiYVwiICsgYXR0cmlidXRlO1xuICAgIHJldHVybiB0aGlzLiNtYXBbc2FmZUF0dHJOYW1lXTtcbiAgfVxuXG4gIFtzZXROYW1lZE5vZGVNYXBWYWx1ZVN5bV0oYXR0cmlidXRlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIGJ1YmJsZSA9IGZhbHNlKSB7XG4gICAgY29uc3Qgc2FmZUF0dHJOYW1lID0gXCJhXCIgKyBhdHRyaWJ1dGU7XG4gICAgaWYgKHRoaXMuI21hcFtzYWZlQXR0ck5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuI2xlbmd0aCsrO1xuXG4gICAgICBpZiAodGhpcy4jbGVuZ3RoID4gdGhpcy4jY2FwYWNpdHkpIHtcbiAgICAgICAgdGhpcy4jY2FwYWNpdHkgPSB0aGlzLiNsZW5ndGg7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy4jY2FwYWNpdHkgLSAxO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgU3RyaW5nKHRoaXMuI2NhcGFjaXR5IC0gMSksIHtcbiAgICAgICAgICBnZXQ6IE5hbWVkTm9kZU1hcC4jaW5kZXhlZEF0dHJBY2Nlc3MuYmluZCh0aGlzLCB0aGlzLiNtYXAsIGluZGV4KSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLiNhdHRyTm9kZUNhY2hlW3NhZmVBdHRyTmFtZV0pIHtcbiAgICAgIHRoaXMuI2F0dHJOb2RlQ2FjaGVbc2FmZUF0dHJOYW1lXSFbc2V0QXR0clZhbHVlU3ltXSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgdGhpcy4jbWFwW3NhZmVBdHRyTmFtZV0gPSB2YWx1ZTtcblxuICAgIGlmIChidWJibGUpIHtcbiAgICAgIHRoaXMuI29uQXR0ck5vZGVDaGFuZ2UoYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIGFuIGF0dHJpYnV0ZSBpcyByZW1vdmVkIGZyb21cbiAgICogYW4gZWxlbWVudFxuICAgKi9cbiAgW3JlbW92ZU5hbWVkTm9kZU1hcEF0dHJTeW1dKGF0dHJpYnV0ZTogc3RyaW5nKSB7XG4gICAgY29uc3Qgc2FmZUF0dHJOYW1lID0gXCJhXCIgKyBhdHRyaWJ1dGU7XG4gICAgaWYgKHRoaXMuI21hcFtzYWZlQXR0ck5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuI2xlbmd0aC0tO1xuICAgICAgdGhpcy4jbWFwW3NhZmVBdHRyTmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLiNvbkF0dHJOb2RlQ2hhbmdlKGF0dHJpYnV0ZSwgbnVsbCk7XG5cbiAgICAgIGNvbnN0IGF0dHJOb2RlID0gdGhpcy4jYXR0ck5vZGVDYWNoZVtzYWZlQXR0ck5hbWVdO1xuICAgICAgaWYgKGF0dHJOb2RlKSB7XG4gICAgICAgIGF0dHJOb2RlW3NldE5hbWVkTm9kZU1hcE93bmVyRWxlbWVudFN5bV0obnVsbCk7XG4gICAgICAgIHRoaXMuI2F0dHJOb2RlQ2FjaGVbc2FmZUF0dHJOYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAqW1N5bWJvbC5pdGVyYXRvcl0oKTogR2VuZXJhdG9yPEF0dHI+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHlpZWxkIHRoaXNbaV07XG4gICAgfVxuICB9XG5cbiAgZ2V0IGxlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy4jbGVuZ3RoO1xuICB9XG5cbiAgLy8gRklYTUU6IFRoaXMgbWV0aG9kIHNob3VsZCBhY2NlcHQgYW55dGhpbmcgYW5kIGJhc2ljYWxseVxuICAvLyBjb2VyY2UgYW55IG5vbiBudW1iZXJzIChhbmQgSW5maW5pdHkvLUluZmluaXR5KSBpbnRvIDBcbiAgaXRlbShpbmRleDogbnVtYmVyKTogQXR0ciB8IG51bGwge1xuICAgIGlmIChpbmRleCA+PSB0aGlzLiNsZW5ndGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzW2luZGV4XTtcbiAgfVxuXG4gIGdldE5hbWVkSXRlbShhdHRyaWJ1dGU6IHN0cmluZyk6IEF0dHIgfCBudWxsIHtcbiAgICBjb25zdCBzYWZlQXR0ck5hbWUgPSBcImFcIiArIGF0dHJpYnV0ZTtcbiAgICBpZiAodGhpcy4jbWFwW3NhZmVBdHRyTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXNbZ2V0TmFtZWROb2RlTWFwQXR0ck5vZGVTeW1dKGF0dHJpYnV0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBzZXROYW1lZEl0ZW0oYXR0ck5vZGU6IEF0dHIpIHtcbiAgICBpZiAoYXR0ck5vZGUub3duZXJFbGVtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiQXR0cmlidXRlIGFscmVhZHkgaW4gdXNlXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHNhZmVBdHRyTmFtZSA9IFwiYVwiICsgYXR0ck5vZGUubmFtZTtcbiAgICBjb25zdCBwcmV2aW91c0F0dHIgPSB0aGlzLiNhdHRyTm9kZUNhY2hlW3NhZmVBdHRyTmFtZV07XG4gICAgaWYgKHByZXZpb3VzQXR0cikge1xuICAgICAgcHJldmlvdXNBdHRyW3NldE5hbWVkTm9kZU1hcE93bmVyRWxlbWVudFN5bV0obnVsbCk7XG4gICAgICB0aGlzLiNtYXBbc2FmZUF0dHJOYW1lXSA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBhdHRyTm9kZVtzZXROYW1lZE5vZGVNYXBPd25lckVsZW1lbnRTeW1dKHRoaXMuI293bmVyRWxlbWVudCk7XG4gICAgdGhpcy4jYXR0ck5vZGVDYWNoZVtzYWZlQXR0ck5hbWVdID0gYXR0ck5vZGU7XG4gICAgdGhpc1tzZXROYW1lZE5vZGVNYXBWYWx1ZVN5bV0oYXR0ck5vZGUubmFtZSwgYXR0ck5vZGUudmFsdWUsIHRydWUpO1xuICB9XG5cbiAgcmVtb3ZlTmFtZWRJdGVtKGF0dHJpYnV0ZTogc3RyaW5nKTogQXR0ciB7XG4gICAgY29uc3Qgc2FmZUF0dHJOYW1lID0gXCJhXCIgKyBhdHRyaWJ1dGU7XG4gICAgaWYgKHRoaXMuI21hcFtzYWZlQXR0ck5hbWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGF0dHJOb2RlID0gdGhpc1tnZXROYW1lZE5vZGVNYXBBdHRyTm9kZVN5bV0oYXR0cmlidXRlKTtcbiAgICAgIHRoaXNbcmVtb3ZlTmFtZWROb2RlTWFwQXR0clN5bV0oYXR0cmlidXRlKTtcbiAgICAgIHJldHVybiBhdHRyTm9kZTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiTm9kZSB3YXMgbm90IGZvdW5kXCIpO1xuICB9XG59XG5cbmNvbnN0IFhNTF9OQU1FU1RBUlRfQ0hBUl9SRV9TUkMgPSBcIjpBLVphLXpfXCIgK1xuICBTdHJpbmcucmF3YFxcdXtDMH0tXFx1e0Q2fVxcdXtEOH0tXFx1e0Y2fVxcdXtGOH0tXFx1ezJGRn1cXHV7MzcwfS1cXHV7MzdEfWAgK1xuICBTdHJpbmdcbiAgICAucmF3YFxcdXszN0Z9LVxcdXsxRkZGfVxcdXsyMDBDfS1cXHV7MjAwRH1cXHV7MjA3MH0tXFx1ezIxOEZ9XFx1ezJDMDB9LVxcdXsyRkVGfWAgK1xuICBTdHJpbmdcbiAgICAucmF3YFxcdXszMDAxfS1cXHV7RDdGRn1cXHV7RjkwMH0tXFx1e0ZEQ0Z9XFx1e0ZERjB9LVxcdXtGRkZEfVxcdXsxMDAwMH0tXFx1e0VGRkZGfWA7XG5jb25zdCBYTUxfTkFNRV9DSEFSX1JFX1NSQyA9IFhNTF9OQU1FU1RBUlRfQ0hBUl9SRV9TUkMgK1xuICBTdHJpbmcucmF3YFxcdXtCN31cXHV7MDMwMH0tXFx1ezAzNkZ9XFx1ezIwM0Z9LVxcdXsyMDQwfTAtOS4tYDtcbmNvbnN0IHhtbE5hbWVzdGFydENoYXJSZSA9IG5ldyBSZWdFeHAoYFske1hNTF9OQU1FU1RBUlRfQ0hBUl9SRV9TUkN9XWAsIFwidVwiKTtcbmNvbnN0IHhtbE5hbWVDaGFyUmUgPSBuZXcgUmVnRXhwKGBbJHtYTUxfTkFNRV9DSEFSX1JFX1NSQ31dYCwgXCJ1XCIpO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudCBleHRlbmRzIE5vZGUge1xuICBsb2NhbE5hbWU6IHN0cmluZztcbiAgYXR0cmlidXRlcyA9IG5ldyBOYW1lZE5vZGVNYXAodGhpcywgKGF0dHJpYnV0ZSwgdmFsdWUpID0+IHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHZhbHVlID0gXCJcIjtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgICAgY2FzZSBcImNsYXNzXCI6XG4gICAgICAgIHRoaXMuI2NsYXNzTGlzdC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJpZFwiOlxuICAgICAgICB0aGlzLiNjdXJyZW50SWQgPSB2YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9LCBDVE9SX0tFWSk7XG5cbiAgI2RhdGFzZXRQcm94eTogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPiB8IG51bGwgPSBudWxsO1xuICAjY3VycmVudElkID0gXCJcIjtcbiAgI2NsYXNzTGlzdCA9IG5ldyBET01Ub2tlbkxpc3QoXG4gICAgKGNsYXNzTmFtZSkgPT4ge1xuICAgICAgaWYgKHRoaXMuaGFzQXR0cmlidXRlKFwiY2xhc3NcIikgfHwgY2xhc3NOYW1lICE9PSBcIlwiKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1tzZXROYW1lZE5vZGVNYXBWYWx1ZVN5bV0oXCJjbGFzc1wiLCBjbGFzc05hbWUpO1xuICAgICAgfVxuICAgIH0sXG4gICAgQ1RPUl9LRVksXG4gICk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHRhZ05hbWU6IHN0cmluZyxcbiAgICBwYXJlbnROb2RlOiBOb2RlIHwgbnVsbCxcbiAgICBhdHRyaWJ1dGVzOiBbc3RyaW5nLCBzdHJpbmddW10sXG4gICAga2V5OiB0eXBlb2YgQ1RPUl9LRVksXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgdGFnTmFtZSxcbiAgICAgIE5vZGVUeXBlLkVMRU1FTlRfTk9ERSxcbiAgICAgIHBhcmVudE5vZGUsXG4gICAgICBrZXksXG4gICAgKTtcblxuICAgIGZvciAoY29uc3QgYXR0ciBvZiBhdHRyaWJ1dGVzKSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZShhdHRyWzBdLCBhdHRyWzFdKTtcblxuICAgICAgc3dpdGNoIChhdHRyWzBdKSB7XG4gICAgICAgIGNhc2UgXCJjbGFzc1wiOlxuICAgICAgICAgIHRoaXMuI2NsYXNzTGlzdC52YWx1ZSA9IGF0dHJbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpZFwiOlxuICAgICAgICAgIHRoaXMuI2N1cnJlbnRJZCA9IGF0dHJbMV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy50YWdOYW1lID0gdGhpcy5ub2RlTmFtZSA9IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICB0aGlzLmxvY2FsTmFtZSA9IHRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIF9zaGFsbG93Q2xvbmUoKTogTm9kZSB7XG4gICAgLy8gRklYTUU6IFRoaXMgYXR0cmlidXRlIGNvcHlpbmcgbmVlZHMgdG8gYWxzbyBiZSBmaXhlZCBpbiBvdGhlclxuICAgIC8vIGVsZW1lbnRzIHRoYXQgb3ZlcnJpZGUgX3NoYWxsb3dDbG9uZSBsaWtlIDx0ZW1wbGF0ZT5cbiAgICBjb25zdCBhdHRyaWJ1dGVzOiBbc3RyaW5nLCBzdHJpbmddW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZSBvZiB0aGlzLmdldEF0dHJpYnV0ZU5hbWVzKCkpIHtcbiAgICAgIGF0dHJpYnV0ZXMucHVzaChbYXR0cmlidXRlLCB0aGlzLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGUpIV0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEVsZW1lbnQodGhpcy5ub2RlTmFtZSwgbnVsbCwgYXR0cmlidXRlcywgQ1RPUl9LRVkpO1xuICB9XG5cbiAgZ2V0IGNoaWxkRWxlbWVudENvdW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuZWxlbWVudHNWaWV3KCkubGVuZ3RoO1xuICB9XG5cbiAgZ2V0IGNsYXNzTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpID8/IFwiXCI7XG4gIH1cblxuICBzZXQgY2xhc3NOYW1lKGNsYXNzTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc05hbWUpO1xuICAgIHRoaXMuI2NsYXNzTGlzdC52YWx1ZSA9IGNsYXNzTmFtZTtcbiAgfVxuXG4gIGdldCBjbGFzc0xpc3QoKTogRE9NVG9rZW5MaXN0IHtcbiAgICByZXR1cm4gdGhpcy4jY2xhc3NMaXN0O1xuICB9XG5cbiAgZ2V0IG91dGVySFRNTCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBnZXRPdXRlck9ySW5uZXJIdG1sKHRoaXMsIHRydWUpO1xuICB9XG5cbiAgc2V0IG91dGVySFRNTChodG1sOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICBjb25zdCB7IHBhcmVudEVsZW1lbnQsIHBhcmVudE5vZGUgfSA9IHRoaXM7XG4gICAgICBsZXQgY29udGV4dExvY2FsTmFtZSA9IHBhcmVudEVsZW1lbnQ/LmxvY2FsTmFtZTtcblxuICAgICAgc3dpdGNoIChwYXJlbnROb2RlLm5vZGVUeXBlKSB7XG4gICAgICAgIGNhc2UgTm9kZVR5cGUuRE9DVU1FTlRfTk9ERToge1xuICAgICAgICAgIHRocm93IG5ldyBET01FeGNlcHRpb24oXG4gICAgICAgICAgICBcIk1vZGlmaWNhdGlvbnMgYXJlIG5vdCBhbGxvd2VkIGZvciB0aGlzIGRvY3VtZW50XCIsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldHRpbmcgb3V0ZXJIVE1MLCBzdGVwIDQuIERvY3VtZW50IEZyYWdtZW50XG4gICAgICAgIC8vIHJlZjogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL0RPTS1QYXJzaW5nLyNkb20tZWxlbWVudC1vdXRlcmh0bWxcbiAgICAgICAgY2FzZSBOb2RlVHlwZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFOiB7XG4gICAgICAgICAgY29udGV4dExvY2FsTmFtZSA9IFwiYm9keVwiO1xuICAgICAgICAgIC8vIGZhbGwtdGhyb3VnaFxuICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgIGNvbnN0IHsgY2hpbGROb2RlczogbmV3Q2hpbGROb2RlcyB9ID1cbiAgICAgICAgICAgIGZyYWdtZW50Tm9kZXNGcm9tU3RyaW5nKGh0bWwsIGNvbnRleHRMb2NhbE5hbWUhKS5jaGlsZE5vZGVzWzBdO1xuICAgICAgICAgIGNvbnN0IG11dGF0b3IgPSBwYXJlbnROb2RlLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICAgICAgICAgIGNvbnN0IGluc2VydGlvbkluZGV4ID0gbXV0YXRvci5pbmRleE9mKHRoaXMpO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IG5ld0NoaWxkTm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gbmV3Q2hpbGROb2Rlc1tpXTtcbiAgICAgICAgICAgIG11dGF0b3Iuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCBjaGlsZCk7XG4gICAgICAgICAgICBjaGlsZC5fc2V0UGFyZW50KHBhcmVudE5vZGUpO1xuICAgICAgICAgICAgY2hpbGQuX3NldE93bmVyRG9jdW1lbnQocGFyZW50Tm9kZS5vd25lckRvY3VtZW50KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGlubmVySFRNTCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBnZXRPdXRlck9ySW5uZXJIdG1sKHRoaXMsIGZhbHNlKTtcbiAgfVxuXG4gIHNldCBpbm5lckhUTUwoaHRtbDogc3RyaW5nKSB7XG4gICAgLy8gUmVtb3ZlIGFsbCBjaGlsZHJlblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBjaGlsZC5fc2V0UGFyZW50KG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IG11dGF0b3IgPSB0aGlzLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICAgIG11dGF0b3Iuc3BsaWNlKDAsIHRoaXMuY2hpbGROb2Rlcy5sZW5ndGgpO1xuXG4gICAgLy8gUGFyc2UgSFRNTCBpbnRvIG5ldyBjaGlsZHJlblxuICAgIGlmIChodG1sLmxlbmd0aCkge1xuICAgICAgY29uc3QgcGFyc2VkID0gZnJhZ21lbnROb2Rlc0Zyb21TdHJpbmcoaHRtbCwgdGhpcy5sb2NhbE5hbWUpO1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBwYXJzZWQuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzKSB7XG4gICAgICAgIG11dGF0b3IucHVzaChjaGlsZCk7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICAgIGNoaWxkLl9zZXRQYXJlbnQodGhpcyk7XG4gICAgICAgIGNoaWxkLl9zZXRPd25lckRvY3VtZW50KHRoaXMub3duZXJEb2N1bWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IGlubmVyVGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnRleHRDb250ZW50O1xuICB9XG5cbiAgc2V0IGlubmVyVGV4dCh0ZXh0OiBzdHJpbmcpIHtcbiAgICB0aGlzLnRleHRDb250ZW50ID0gdGV4dDtcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBIVE1MQ29sbGVjdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuZWxlbWVudHNWaWV3KCk7XG4gIH1cblxuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jY3VycmVudElkIHx8IFwiXCI7XG4gIH1cblxuICBzZXQgaWQoaWQ6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiaWRcIiwgdGhpcy4jY3VycmVudElkID0gaWQpO1xuICB9XG5cbiAgZ2V0IGRhdGFzZXQoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMuI2RhdGFzZXRQcm94eSkge1xuICAgICAgcmV0dXJuIHRoaXMuI2RhdGFzZXRQcm94eTtcbiAgICB9XG5cbiAgICB0aGlzLiNkYXRhc2V0UHJveHkgPSBuZXcgUHJveHk8UmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPj4oe30sIHtcbiAgICAgIGdldDogKF90YXJnZXQsIHByb3BlcnR5LCBfcmVjZWl2ZXIpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9wZXJ0eSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBnZXREYXRhc2V0SHRtbEF0dHJOYW1lKHByb3BlcnR5KTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkgPz8gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH0sXG5cbiAgICAgIHNldDogKF90YXJnZXQsIHByb3BlcnR5LCB2YWx1ZSwgX3JlY2VpdmVyKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvcGVydHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBsZXQgYXR0cmlidXRlTmFtZSA9IFwiZGF0YS1cIjtcblxuICAgICAgICAgIGxldCBwcmV2Q2hhciA9IFwiXCI7XG4gICAgICAgICAgZm9yIChjb25zdCBjaGFyIG9mIHByb3BlcnR5KSB7XG4gICAgICAgICAgICAvLyBTdGVwIDEuIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2RvbS5odG1sI2RvbS1kb21zdHJpbmdtYXAtc2V0aXRlbVxuICAgICAgICAgICAgaWYgKHByZXZDaGFyID09PSBcIi1cIiAmJiBsb3dlckNhc2VDaGFyUmUudGVzdChjaGFyKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFxuICAgICAgICAgICAgICAgIFwiQW4gaW52YWxpZCBvciBpbGxlZ2FsIHN0cmluZyB3YXMgc3BlY2lmaWVkXCIsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFN0ZXAgNC4gaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2UvZG9tLmh0bWwjZG9tLWRvbXN0cmluZ21hcC1zZXRpdGVtXG4gICAgICAgICAgICBpZiAoIXhtbE5hbWVDaGFyUmUudGVzdChjaGFyKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRE9NRXhjZXB0aW9uKFwiU3RyaW5nIGNvbnRhaW5zIGFuIGludmFsaWQgY2hhcmFjdGVyXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTdGVwIDIuIGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2RvbS5odG1sI2RvbS1kb21zdHJpbmdtYXAtc2V0aXRlbVxuICAgICAgICAgICAgaWYgKHVwcGVyQ2FzZUNoYXJSZS50ZXN0KGNoYXIpKSB7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWUgKz0gXCItXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWUgKz0gY2hhci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgcHJldkNoYXIgPSBjaGFyO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIFN0cmluZyh2YWx1ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuXG4gICAgICBkZWxldGVQcm9wZXJ0eTogKF90YXJnZXQsIHByb3BlcnR5KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvcGVydHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gZ2V0RGF0YXNldEh0bWxBdHRyTmFtZShwcm9wZXJ0eSk7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG5cbiAgICAgIG93bktleXM6IChfdGFyZ2V0KSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgICAgLmdldEF0dHJpYnV0ZU5hbWVzKClcbiAgICAgICAgICAuZmxhdE1hcCgoYXR0cmlidXRlTmFtZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUuc3RhcnRzV2l0aD8uKFwiZGF0YS1cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFtnZXREYXRhc2V0SmF2YXNjcmlwdE5hbWUoYXR0cmlidXRlTmFtZSldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yOiAoX3RhcmdldCwgcHJvcGVydHkpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9wZXJ0eSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBnZXREYXRhc2V0SHRtbEF0dHJOYW1lKHByb3BlcnR5KTtcbiAgICAgICAgICBpZiAodGhpcy5oYXNBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9LFxuXG4gICAgICBoYXM6IChfdGFyZ2V0LCBwcm9wZXJ0eSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHByb3BlcnR5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGdldERhdGFzZXRIdG1sQXR0ck5hbWUocHJvcGVydHkpO1xuICAgICAgICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy4jZGF0YXNldFByb3h5O1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlTmFtZXMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNbZ2V0TmFtZWROb2RlTWFwQXR0ck5hbWVzU3ltXSgpO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNbZ2V0TmFtZWROb2RlTWFwVmFsdWVTeW1dKG5hbWUudG9Mb3dlckNhc2UoKSkgPz8gbnVsbDtcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZShyYXdOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBjb25zdCBuYW1lID0gU3RyaW5nKHJhd05hbWU/LnRvTG93ZXJDYXNlKCkpO1xuICAgIGNvbnN0IHN0clZhbHVlID0gU3RyaW5nKHZhbHVlKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXNbc2V0TmFtZWROb2RlTWFwVmFsdWVTeW1dKG5hbWUsIHN0clZhbHVlKTtcblxuICAgIGlmIChuYW1lID09PSBcImlkXCIpIHtcbiAgICAgIHRoaXMuI2N1cnJlbnRJZCA9IHN0clZhbHVlO1xuICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XG4gICAgICB0aGlzLiNjbGFzc0xpc3QudmFsdWUgPSBzdHJWYWx1ZTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVBdHRyaWJ1dGUocmF3TmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbmFtZSA9IFN0cmluZyhyYXdOYW1lPy50b0xvd2VyQ2FzZSgpKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXNbcmVtb3ZlTmFtZWROb2RlTWFwQXR0clN5bV0obmFtZSk7XG5cbiAgICBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XG4gICAgICB0aGlzLiNjbGFzc0xpc3QudmFsdWUgPSBcIlwiO1xuICAgIH1cbiAgfVxuXG4gIGhhc0F0dHJpYnV0ZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW2dldE5hbWVkTm9kZU1hcFZhbHVlU3ltXShcbiAgICAgIFN0cmluZyhuYW1lPy50b0xvd2VyQ2FzZSgpKSxcbiAgICApICE9PSB1bmRlZmluZWQ7XG4gIH1cblxuICBoYXNBdHRyaWJ1dGVOUyhfbmFtZXNwYWNlOiBzdHJpbmcsIG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIFRPRE86IFVzZSBuYW1lc3BhY2VcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW2dldE5hbWVkTm9kZU1hcFZhbHVlU3ltXShcbiAgICAgIFN0cmluZyhuYW1lPy50b0xvd2VyQ2FzZSgpKSxcbiAgICApICE9PSB1bmRlZmluZWQ7XG4gIH1cblxuICByZXBsYWNlV2l0aCguLi5ub2RlczogKE5vZGUgfCBzdHJpbmcpW10pIHtcbiAgICB0aGlzLl9yZXBsYWNlV2l0aCguLi5ub2Rlcyk7XG4gIH1cblxuICByZW1vdmUoKSB7XG4gICAgdGhpcy5fcmVtb3ZlKCk7XG4gIH1cblxuICBhcHBlbmQoLi4ubm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdKSB7XG4gICAgY29uc3QgbXV0YXRvciA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgbXV0YXRvci5wdXNoKC4uLm5vZGVzQW5kVGV4dE5vZGVzKG5vZGVzLCB0aGlzKSk7XG4gIH1cblxuICBwcmVwZW5kKC4uLm5vZGVzOiAoTm9kZSB8IHN0cmluZylbXSkge1xuICAgIGNvbnN0IG11dGF0b3IgPSB0aGlzLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpO1xuICAgIG11dGF0b3Iuc3BsaWNlKDAsIDAsIC4uLm5vZGVzQW5kVGV4dE5vZGVzKG5vZGVzLCB0aGlzKSk7XG4gIH1cblxuICBiZWZvcmUoLi4ubm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdKSB7XG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgaW5zZXJ0QmVmb3JlQWZ0ZXIodGhpcywgbm9kZXMsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIGFmdGVyKC4uLm5vZGVzOiAoTm9kZSB8IHN0cmluZylbXSkge1xuICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgIGluc2VydEJlZm9yZUFmdGVyKHRoaXMsIG5vZGVzLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGZpcnN0RWxlbWVudENoaWxkKCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuZWxlbWVudHNWaWV3KCk7XG4gICAgcmV0dXJuIGVsZW1lbnRzWzBdID8/IG51bGw7XG4gIH1cblxuICBnZXQgbGFzdEVsZW1lbnRDaGlsZCgpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpLmVsZW1lbnRzVmlldygpO1xuICAgIHJldHVybiBlbGVtZW50c1tlbGVtZW50cy5sZW5ndGggLSAxXSA/PyBudWxsO1xuICB9XG5cbiAgZ2V0IG5leHRFbGVtZW50U2libGluZygpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG11dGF0b3IgPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgY29uc3QgaW5kZXggPSBtdXRhdG9yLmluZGV4T2ZFbGVtZW50c1ZpZXcodGhpcyk7XG4gICAgY29uc3QgZWxlbWVudHMgPSBtdXRhdG9yLmVsZW1lbnRzVmlldygpO1xuICAgIHJldHVybiBlbGVtZW50c1tpbmRleCArIDFdID8/IG51bGw7XG4gIH1cblxuICBnZXQgcHJldmlvdXNFbGVtZW50U2libGluZygpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xuXG4gICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG11dGF0b3IgPSBwYXJlbnQuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgY29uc3QgaW5kZXggPSBtdXRhdG9yLmluZGV4T2ZFbGVtZW50c1ZpZXcodGhpcyk7XG4gICAgY29uc3QgZWxlbWVudHMgPSBtdXRhdG9yLmVsZW1lbnRzVmlldygpO1xuICAgIHJldHVybiBlbGVtZW50c1tpbmRleCAtIDFdID8/IG51bGw7XG4gIH1cblxuICBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yczogc3RyaW5nKTogRWxlbWVudCB8IG51bGwge1xuICAgIGlmICghdGhpcy5vd25lckRvY3VtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbGVtZW50IG11c3QgaGF2ZSBhbiBvd25lciBkb2N1bWVudFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vd25lckRvY3VtZW50IS5fbndhcGkuZmlyc3Qoc2VsZWN0b3JzLCB0aGlzKTtcbiAgfVxuXG4gIHF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzOiBzdHJpbmcpOiBOb2RlTGlzdCB7XG4gICAgaWYgKCF0aGlzLm93bmVyRG9jdW1lbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVsZW1lbnQgbXVzdCBoYXZlIGFuIG93bmVyIGRvY3VtZW50XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5vZGVMaXN0ID0gbmV3IE5vZGVMaXN0KCk7XG4gICAgY29uc3QgbXV0YXRvciA9IG5vZGVMaXN0W25vZGVMaXN0TXV0YXRvclN5bV0oKTtcblxuICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgdGhpcy5vd25lckRvY3VtZW50IS5fbndhcGkuc2VsZWN0KHNlbGVjdG9ycywgdGhpcykpIHtcbiAgICAgIG11dGF0b3IucHVzaChtYXRjaCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGVMaXN0O1xuICB9XG5cbiAgbWF0Y2hlcyhzZWxlY3RvclN0cmluZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMub3duZXJEb2N1bWVudCEuX253YXBpLm1hdGNoKHNlbGVjdG9yU3RyaW5nLCB0aGlzKTtcbiAgfVxuXG4gIGNsb3Nlc3Qoc2VsZWN0b3JTdHJpbmc6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCB7IG1hdGNoIH0gPSB0aGlzLm93bmVyRG9jdW1lbnQhLl9ud2FwaTsgLy8gU2VlIG5vdGUgYmVsb3dcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLXRoaXMtYWxpYXNcbiAgICBsZXQgZWw6IEVsZW1lbnQgfCBudWxsID0gdGhpcztcbiAgICBkbyB7XG4gICAgICAvLyBOb3RlOiBOb3QgdXNpbmcgYGVsLm1hdGNoZXMoc2VsZWN0b3JTdHJpbmcpYCBiZWNhdXNlIG9uIGEgYnJvd3NlciBpZiB5b3Ugb3ZlcnJpZGVcbiAgICAgIC8vIGBtYXRjaGVzYCwgeW91ICpkb24ndCogc2VlIGl0IGJlaW5nIHVzZWQgYnkgYGNsb3Nlc3RgLlxuICAgICAgaWYgKG1hdGNoKHNlbGVjdG9yU3RyaW5nLCBlbCkpIHtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgfVxuICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xuICAgIH0gd2hpbGUgKGVsICE9PSBudWxsKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFRPRE86IERSWSEhIVxuICBnZXRFbGVtZW50QnlJZChpZDogc3RyaW5nKTogRWxlbWVudCB8IG51bGwge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBpZiAoKDxFbGVtZW50PiBjaGlsZCkuaWQgPT09IGlkKSB7XG4gICAgICAgICAgcmV0dXJuIDxFbGVtZW50PiBjaGlsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlYXJjaCA9ICg8RWxlbWVudD4gY2hpbGQpLmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgaWYgKHNlYXJjaCkge1xuICAgICAgICAgIHJldHVybiBzZWFyY2g7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWU6IHN0cmluZyk6IEVsZW1lbnRbXSB7XG4gICAgY29uc3QgZml4Q2FzZVRhZ05hbWUgPSB0YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG5cbiAgICBpZiAoZml4Q2FzZVRhZ05hbWUgPT09IFwiKlwiKSB7XG4gICAgICByZXR1cm4gPEVsZW1lbnRbXT4gdGhpcy5fZ2V0RWxlbWVudHNCeVRhZ05hbWVXaWxkY2FyZChbXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiA8RWxlbWVudFtdPiB0aGlzLl9nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lLnRvVXBwZXJDYXNlKCksIFtdKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0RWxlbWVudHNCeVRhZ05hbWVXaWxkY2FyZChzZWFyY2g6IE5vZGVbXSk6IE5vZGVbXSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgKDxFbGVtZW50PiBjaGlsZCkuX2dldEVsZW1lbnRzQnlUYWdOYW1lV2lsZGNhcmQoc2VhcmNoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VhcmNoO1xuICB9XG5cbiAgX2dldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWU6IHN0cmluZywgc2VhcmNoOiBOb2RlW10pOiBOb2RlW10ge1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IE5vZGVUeXBlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBpZiAoKDxFbGVtZW50PiBjaGlsZCkudGFnTmFtZSA9PT0gdGFnTmFtZSkge1xuICAgICAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgICg8RWxlbWVudD4gY2hpbGQpLl9nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lLCBzZWFyY2gpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWFyY2g7XG4gIH1cblxuICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKGNsYXNzTmFtZTogc3RyaW5nKTogRWxlbWVudFtdIHtcbiAgICByZXR1cm4gPEVsZW1lbnRbXT4gZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSh0aGlzLCBjbGFzc05hbWUsIFtdKTtcbiAgfVxuXG4gIGdldEVsZW1lbnRzQnlUYWdOYW1lTlMoX25hbWVzcGFjZTogc3RyaW5nLCBsb2NhbE5hbWU6IHN0cmluZyk6IEVsZW1lbnRbXSB7XG4gICAgLy8gVE9ETzogVXNlIG5hbWVzcGFjZVxuICAgIHJldHVybiB0aGlzLmdldEVsZW1lbnRzQnlUYWdOYW1lKGxvY2FsTmFtZSk7XG4gIH1cbn1cblxuVXRpbFR5cGVzLkVsZW1lbnQgPSBFbGVtZW50O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsUUFBUSxRQUFRLHlCQUF5QjtBQUNsRCxTQUFTLHVCQUF1QixRQUFRLG9CQUFvQjtBQUM1RCxTQUFTLElBQUksRUFBRSxpQkFBaUIsRUFBRSxRQUFRLFFBQVEsWUFBWTtBQUM5RCxTQUFTLFFBQVEsRUFBRSxrQkFBa0IsUUFBUSxpQkFBaUI7QUFFOUQsU0FDRSxzQkFBc0IsRUFDdEIsd0JBQXdCLEVBQ3hCLHNCQUFzQixFQUN0QixtQkFBbUIsRUFDbkIsaUJBQWlCLEVBQ2pCLGVBQWUsRUFDZixlQUFlLFFBQ1YsYUFBYTtBQUNwQixPQUFPLGVBQWUsbUJBQW1CO0FBTXpDLE9BQU8sTUFBTTtJQUNYLENBQUMsTUFBTSxHQUFHLEdBQUc7SUFDYixJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsT0FBTyxJQUFJLENBQUMsQ0FBQyxNQUFNO0lBQ3JCO0lBQ0EsSUFBSSxDQUFDLEtBQUssQ0FDUixLQUFhLEVBQ2I7UUFDQSxJQUFJLENBQUMsQ0FBQyxN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