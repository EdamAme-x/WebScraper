import { Node } from "./node.ts";
import { HTMLCollection } from "./html-collection.ts";
const NodeListFakeClass = (()=>{
    return class NodeList {
        constructor(){
            throw new TypeError("Illegal constructor");
        }
        static [Symbol.hasInstance](value) {
            return value.constructor === NodeListClass;
        }
    };
})();
export const nodeListMutatorSym = Symbol();
const nodeListCachedMutator = Symbol();
// Array methods that we need for NodeList mutator implementation
const { push , splice , slice , indexOf , filter  } = Array.prototype;
// Implementation of a NodeList mutator
class NodeListMutatorImpl {
    arrayInstance;
    // There should only ever be one elementView per element. Element views
    // are basically just the source of HTMLCollections/.children properties
    // on elements that are always in sync with their .childNodes counterpart.
    elementViews;
    constructor(arrayInstance){
        this.arrayInstance = arrayInstance;
        this.elementViews = [];
    }
    push(...items) {
        // Copy the new items to the element view (if any)
        for (const view of this.elementViews){
            for (const item of items){
                if (item.nodeType === Node.ELEMENT_NODE) {
                    push.call(view, item);
                }
            }
        }
        return push.call(this.arrayInstance, ...items);
    }
    splice(index, deleteCount = 0, ...items) {
        // Delete and insert new elements in an element view (if any)
        for (const view of this.elementViews){
            const toDelete = filter.call(slice.call(this.arrayInstance, index, index + deleteCount), (item)=>item.nodeType === Node.ELEMENT_NODE);
            const toInsert = items.filter((item)=>item.nodeType === Node.ELEMENT_NODE);
            // Find where to start splicing in the element view
            let elementViewSpliceIndex = -1;
            for(let idx = index; idx < this.arrayInstance.length; idx++){
                const item = this.arrayInstance[idx];
                if (item.nodeType === Node.ELEMENT_NODE) {
                    elementViewSpliceIndex = indexOf.call(view, item);
                    break;
                }
            }
            // If no element is found just do everything at the end
            // of the view
            if (elementViewSpliceIndex === -1) {
                elementViewSpliceIndex = view.length;
            }
            if (toDelete.length) {
                splice.call(view, elementViewSpliceIndex, toDelete.length);
            }
            // Finally, insert all the found elements
            splice.call(view, elementViewSpliceIndex, 0, ...toInsert);
        }
        return splice.call(this.arrayInstance, index, deleteCount, ...items);
    }
    indexOf(item, fromIndex = 0) {
        return indexOf.call(this.arrayInstance, item, fromIndex);
    }
    indexOfElementsView(item, fromIndex = 0) {
        return indexOf.call(this.elementsView(), item, fromIndex);
    }
    // Return the elements-only view for this NodeList. Creates one if
    // it doesn't already exist.
    elementsView() {
        let view = this.elementViews[0];
        if (!view) {
            view = new HTMLCollection();
            this.elementViews.push(view);
            push.call(view, ...filter.call(this.arrayInstance, (item)=>item.nodeType === Node.ELEMENT_NODE));
        }
        return view;
    }
}
// We define the `NodeList` inside a closure to ensure that its
// `.name === "NodeList"` property stays intact, as we need to manipulate
// its prototype and completely change its TypeScript-recognized type.
const NodeListClass = (()=>{
    // @ts-ignore
    class NodeList extends Array {
        // @ts-ignore
        forEach(cb, thisArg = undefined) {
            super.forEach(cb, thisArg);
        }
        item(index) {
            return this[index] ?? null;
        }
        [nodeListMutatorSym]() {
            const cachedMutator = this[nodeListCachedMutator];
            if (cachedMutator) {
                return cachedMutator;
            } else {
                const cachedMutator = new NodeListMutatorImpl(this);
                this[nodeListCachedMutator] = cachedMutator;
                return cachedMutator;
            }
        }
        toString() {
            return "[object NodeList]";
        }
    }
    return NodeList;
})();
for (const staticMethod of [
    "from",
    "isArray",
    "of"
]){
    NodeListClass[staticMethod] = undefined;
}
for (const instanceMethod of [
    "concat",
    "copyWithin",
    "every",
    "fill",
    "filter",
    "find",
    "findIndex",
    "flat",
    "flatMap",
    "includes",
    "indexOf",
    "join",
    "lastIndexOf",
    "map",
    "pop",
    "push",
    "reduce",
    "reduceRight",
    "reverse",
    "shift",
    "slice",
    "some",
    "sort",
    "splice",
    "toLocaleString",
    "unshift"
]){
    NodeListClass.prototype[instanceMethod] = undefined;
}
export const NodeList = NodeListClass;
export const NodeListPublic = NodeListFakeClass;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40My9zcmMvZG9tL25vZGUtbGlzdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOb2RlIH0gZnJvbSBcIi4vbm9kZS50c1wiO1xuaW1wb3J0IHsgSFRNTENvbGxlY3Rpb24gfSBmcm9tIFwiLi9odG1sLWNvbGxlY3Rpb24udHNcIjtcblxuY29uc3QgTm9kZUxpc3RGYWtlQ2xhc3M6IGFueSA9ICgoKSA9PiB7XG4gIHJldHVybiBjbGFzcyBOb2RlTGlzdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSWxsZWdhbCBjb25zdHJ1Y3RvclwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgW1N5bWJvbC5oYXNJbnN0YW5jZV0odmFsdWU6IGFueSkge1xuICAgICAgcmV0dXJuIHZhbHVlLmNvbnN0cnVjdG9yID09PSBOb2RlTGlzdENsYXNzO1xuICAgIH1cbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBjb25zdCBub2RlTGlzdE11dGF0b3JTeW0gPSBTeW1ib2woKTtcbmNvbnN0IG5vZGVMaXN0Q2FjaGVkTXV0YXRvciA9IFN5bWJvbCgpO1xuXG4vLyBBcnJheSBtZXRob2RzIHRoYXQgd2UgbmVlZCBmb3IgTm9kZUxpc3QgbXV0YXRvciBpbXBsZW1lbnRhdGlvblxuY29uc3QgeyBwdXNoLCBzcGxpY2UsIHNsaWNlLCBpbmRleE9mLCBmaWx0ZXIgfSA9IEFycmF5LnByb3RvdHlwZTtcblxuLy8gSW1wbGVtZW50YXRpb24gb2YgYSBOb2RlTGlzdCBtdXRhdG9yXG5jbGFzcyBOb2RlTGlzdE11dGF0b3JJbXBsIHtcbiAgLy8gVGhlcmUgc2hvdWxkIG9ubHkgZXZlciBiZSBvbmUgZWxlbWVudFZpZXcgcGVyIGVsZW1lbnQuIEVsZW1lbnQgdmlld3NcbiAgLy8gYXJlIGJhc2ljYWxseSBqdXN0IHRoZSBzb3VyY2Ugb2YgSFRNTENvbGxlY3Rpb25zLy5jaGlsZHJlbiBwcm9wZXJ0aWVzXG4gIC8vIG9uIGVsZW1lbnRzIHRoYXQgYXJlIGFsd2F5cyBpbiBzeW5jIHdpdGggdGhlaXIgLmNoaWxkTm9kZXMgY291bnRlcnBhcnQuXG4gIGVsZW1lbnRWaWV3czogYW55W11bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBhcnJheUluc3RhbmNlOiBhbnlbXSxcbiAgKSB7fVxuXG4gIHB1c2goLi4uaXRlbXM6IGFueVtdKSB7XG4gICAgLy8gQ29weSB0aGUgbmV3IGl0ZW1zIHRvIHRoZSBlbGVtZW50IHZpZXcgKGlmIGFueSlcbiAgICBmb3IgKGNvbnN0IHZpZXcgb2YgdGhpcy5lbGVtZW50Vmlld3MpIHtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICBpZiAoaXRlbS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICBwdXNoLmNhbGwodmlldywgaXRlbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcHVzaC5jYWxsKHRoaXMuYXJyYXlJbnN0YW5jZSwgLi4uaXRlbXMpO1xuICB9XG5cbiAgc3BsaWNlKGluZGV4OiBudW1iZXIsIGRlbGV0ZUNvdW50ID0gMCwgLi4uaXRlbXM6IGFueVtdKSB7XG4gICAgLy8gRGVsZXRlIGFuZCBpbnNlcnQgbmV3IGVsZW1lbnRzIGluIGFuIGVsZW1lbnQgdmlldyAoaWYgYW55KVxuICAgIGZvciAoY29uc3QgdmlldyBvZiB0aGlzLmVsZW1lbnRWaWV3cykge1xuICAgICAgY29uc3QgdG9EZWxldGUgPSBmaWx0ZXIuY2FsbChcbiAgICAgICAgc2xpY2UuY2FsbCh0aGlzLmFycmF5SW5zdGFuY2UsIGluZGV4LCBpbmRleCArIGRlbGV0ZUNvdW50KSxcbiAgICAgICAgKGl0ZW0pID0+IGl0ZW0ubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgdG9JbnNlcnQgPSBpdGVtcy5maWx0ZXIoKGl0ZW0pID0+XG4gICAgICAgIGl0ZW0ubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFXG4gICAgICApO1xuXG4gICAgICAvLyBGaW5kIHdoZXJlIHRvIHN0YXJ0IHNwbGljaW5nIGluIHRoZSBlbGVtZW50IHZpZXdcbiAgICAgIGxldCBlbGVtZW50Vmlld1NwbGljZUluZGV4ID0gLTE7XG4gICAgICBmb3IgKGxldCBpZHggPSBpbmRleDsgaWR4IDwgdGhpcy5hcnJheUluc3RhbmNlLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYXJyYXlJbnN0YW5jZVtpZHhdO1xuXG4gICAgICAgIGlmIChpdGVtLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgIGVsZW1lbnRWaWV3U3BsaWNlSW5kZXggPSBpbmRleE9mLmNhbGwodmlldywgaXRlbSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gZWxlbWVudCBpcyBmb3VuZCBqdXN0IGRvIGV2ZXJ5dGhpbmcgYXQgdGhlIGVuZFxuICAgICAgLy8gb2YgdGhlIHZpZXdcbiAgICAgIGlmIChlbGVtZW50Vmlld1NwbGljZUluZGV4ID09PSAtMSkge1xuICAgICAgICBlbGVtZW50Vmlld1NwbGljZUluZGV4ID0gdmlldy5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIGlmICh0b0RlbGV0ZS5sZW5ndGgpIHtcbiAgICAgICAgc3BsaWNlLmNhbGwodmlldywgZWxlbWVudFZpZXdTcGxpY2VJbmRleCwgdG9EZWxldGUubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgLy8gRmluYWxseSwgaW5zZXJ0IGFsbCB0aGUgZm91bmQgZWxlbWVudHNcbiAgICAgIHNwbGljZS5jYWxsKHZpZXcsIGVsZW1lbnRWaWV3U3BsaWNlSW5kZXgsIDAsIC4uLnRvSW5zZXJ0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3BsaWNlLmNhbGwodGhpcy5hcnJheUluc3RhbmNlLCBpbmRleCwgZGVsZXRlQ291bnQsIC4uLml0ZW1zKTtcbiAgfVxuXG4gIGluZGV4T2YoaXRlbTogYW55LCBmcm9tSW5kZXggPSAwKSB7XG4gICAgcmV0dXJuIGluZGV4T2YuY2FsbCh0aGlzLmFycmF5SW5zdGFuY2UsIGl0ZW0sIGZyb21JbmRleCk7XG4gIH1cblxuICBpbmRleE9mRWxlbWVudHNWaWV3KGl0ZW06IGFueSwgZnJvbUluZGV4ID0gMCkge1xuICAgIHJldHVybiBpbmRleE9mLmNhbGwodGhpcy5lbGVtZW50c1ZpZXcoKSwgaXRlbSwgZnJvbUluZGV4KTtcbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgZWxlbWVudHMtb25seSB2aWV3IGZvciB0aGlzIE5vZGVMaXN0LiBDcmVhdGVzIG9uZSBpZlxuICAvLyBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gIGVsZW1lbnRzVmlldygpIHtcbiAgICBsZXQgdmlldyA9IHRoaXMuZWxlbWVudFZpZXdzWzBdO1xuXG4gICAgaWYgKCF2aWV3KSB7XG4gICAgICB2aWV3ID0gbmV3IEhUTUxDb2xsZWN0aW9uKCkgYXMgYW55IGFzIGFueVtdO1xuICAgICAgdGhpcy5lbGVtZW50Vmlld3MucHVzaCh2aWV3KTtcbiAgICAgIHB1c2guY2FsbChcbiAgICAgICAgdmlldyxcbiAgICAgICAgLi4uZmlsdGVyLmNhbGwoXG4gICAgICAgICAgdGhpcy5hcnJheUluc3RhbmNlLFxuICAgICAgICAgIChpdGVtKSA9PiBpdGVtLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSxcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZpZXc7XG4gIH1cbn1cblxuLy8gV2UgZGVmaW5lIHRoZSBgTm9kZUxpc3RgIGluc2lkZSBhIGNsb3N1cmUgdG8gZW5zdXJlIHRoYXQgaXRzXG4vLyBgLm5hbWUgPT09IFwiTm9kZUxpc3RcImAgcHJvcGVydHkgc3RheXMgaW50YWN0LCBhcyB3ZSBuZWVkIHRvIG1hbmlwdWxhdGVcbi8vIGl0cyBwcm90b3R5cGUgYW5kIGNvbXBsZXRlbHkgY2hhbmdlIGl0cyBUeXBlU2NyaXB0LXJlY29nbml6ZWQgdHlwZS5cbmNvbnN0IE5vZGVMaXN0Q2xhc3M6IGFueSA9ICgoKSA9PiB7XG4gIC8vIEB0cy1pZ25vcmVcbiAgY2xhc3MgTm9kZUxpc3QgZXh0ZW5kcyBBcnJheTxOb2RlPiB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGZvckVhY2goXG4gICAgICBjYjogKG5vZGU6IE5vZGUsIGluZGV4OiBudW1iZXIsIG5vZGVMaXN0OiBOb2RlW10pID0+IHZvaWQsXG4gICAgICB0aGlzQXJnOiBOb2RlTGlzdCB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgICApIHtcbiAgICAgIHN1cGVyLmZvckVhY2goY2IsIHRoaXNBcmcpO1xuICAgIH1cblxuICAgIGl0ZW0oaW5kZXg6IG51bWJlcik6IE5vZGUgfCBudWxsIHtcbiAgICAgIHJldHVybiB0aGlzW2luZGV4XSA/PyBudWxsO1xuICAgIH1cblxuICAgIFtub2RlTGlzdE11dGF0b3JTeW1dKCkge1xuICAgICAgY29uc3QgY2FjaGVkTXV0YXRvciA9ICh0aGlzIGFzIGFueSlbbm9kZUxpc3RDYWNoZWRNdXRhdG9yXTtcblxuICAgICAgaWYgKGNhY2hlZE11dGF0b3IpIHtcbiAgICAgICAgcmV0dXJuIGNhY2hlZE11dGF0b3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjYWNoZWRNdXRhdG9yID0gbmV3IE5vZGVMaXN0TXV0YXRvckltcGwodGhpcyk7XG4gICAgICAgICh0aGlzIGFzIGFueSlbbm9kZUxpc3RDYWNoZWRNdXRhdG9yXSA9IGNhY2hlZE11dGF0b3I7XG4gICAgICAgIHJldHVybiBjYWNoZWRNdXRhdG9yO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgcmV0dXJuIFwiW29iamVjdCBOb2RlTGlzdF1cIjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gTm9kZUxpc3Q7XG59KSgpO1xuXG5mb3IgKFxuICBjb25zdCBzdGF0aWNNZXRob2Qgb2YgW1xuICAgIFwiZnJvbVwiLFxuICAgIFwiaXNBcnJheVwiLFxuICAgIFwib2ZcIixcbiAgXVxuKSB7XG4gIE5vZGVMaXN0Q2xhc3Nbc3RhdGljTWV0aG9kXSA9IHVuZGVmaW5lZDtcbn1cblxuZm9yIChcbiAgY29uc3QgaW5zdGFuY2VNZXRob2Qgb2YgW1xuICAgIFwiY29uY2F0XCIsXG4gICAgXCJjb3B5V2l0aGluXCIsXG4gICAgXCJldmVyeVwiLFxuICAgIFwiZmlsbFwiLFxuICAgIFwiZmlsdGVyXCIsXG4gICAgXCJmaW5kXCIsXG4gICAgXCJmaW5kSW5kZXhcIixcbiAgICBcImZsYXRcIixcbiAgICBcImZsYXRNYXBcIixcbiAgICBcImluY2x1ZGVzXCIsXG4gICAgXCJpbmRleE9mXCIsXG4gICAgXCJqb2luXCIsXG4gICAgXCJsYXN0SW5kZXhPZlwiLFxuICAgIFwibWFwXCIsXG4gICAgXCJwb3BcIixcbiAgICBcInB1c2hcIixcbiAgICBcInJlZHVjZVwiLFxuICAgIFwicmVkdWNlUmlnaHRcIixcbiAgICBcInJldmVyc2VcIixcbiAgICBcInNoaWZ0XCIsXG4gICAgXCJzbGljZVwiLFxuICAgIFwic29tZVwiLFxuICAgIFwic29ydFwiLFxuICAgIFwic3BsaWNlXCIsXG4gICAgXCJ0b0xvY2FsZVN0cmluZ1wiLFxuICAgIFwidW5zaGlmdFwiLFxuICBdXG4pIHtcbiAgTm9kZUxpc3RDbGFzcy5wcm90b3R5cGVbaW5zdGFuY2VNZXRob2RdID0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5vZGVMaXN0IHtcbiAgbmV3ICgpOiBOb2RlTGlzdDtcbiAgcmVhZG9ubHkgW2luZGV4OiBudW1iZXJdOiBOb2RlO1xuICByZWFkb25seSBsZW5ndGg6IG51bWJlcjtcbiAgW1N5bWJvbC5pdGVyYXRvcl0oKTogR2VuZXJhdG9yPE5vZGU+O1xuXG4gIGl0ZW0oaW5kZXg6IG51bWJlcik6IE5vZGU7XG4gIGZvckVhY2goXG4gICAgY2I6IChub2RlOiBOb2RlLCBpbmRleDogbnVtYmVyLCBub2RlTGlzdDogTm9kZVtdKSA9PiB2b2lkLFxuICAgIHRoaXNBcmc/OiBOb2RlTGlzdCB8IHVuZGVmaW5lZCxcbiAgKTogdm9pZDtcbiAgW25vZGVMaXN0TXV0YXRvclN5bV0oKTogTm9kZUxpc3RNdXRhdG9yO1xufVxuXG5leHBvcnQgdHlwZSBOb2RlTGlzdFB1YmxpYyA9IE9taXQ8Tm9kZUxpc3QsIHR5cGVvZiBub2RlTGlzdE11dGF0b3JTeW0+O1xuZXhwb3J0IGludGVyZmFjZSBOb2RlTGlzdE11dGF0b3Ige1xuICBwdXNoKC4uLm5vZGVzOiBOb2RlW10pOiBudW1iZXI7XG4gIHNwbGljZShzdGFydDogbnVtYmVyLCBkZWxldGVDb3VudD86IG51bWJlciwgLi4uaXRlbXM6IE5vZGVbXSk6IE5vZGVbXTtcbiAgaW5kZXhPZihub2RlOiBOb2RlLCBmcm9tSW5kZXg/OiBudW1iZXIgfCB1bmRlZmluZWQpOiBudW1iZXI7XG4gIGluZGV4T2ZFbGVtZW50c1ZpZXcobm9kZTogTm9kZSwgZnJvbUluZGV4PzogbnVtYmVyIHwgdW5kZWZpbmVkKTogbnVtYmVyO1xuICBlbGVtZW50c1ZpZXcoKTogSFRNTENvbGxlY3Rpb247XG59XG5cbmV4cG9ydCBjb25zdCBOb2RlTGlzdCA9IDxOb2RlTGlzdD4gTm9kZUxpc3RDbGFzcztcbmV4cG9ydCBjb25zdCBOb2RlTGlzdFB1YmxpYyA9IDxOb2RlTGlzdFB1YmxpYz4gTm9kZUxpc3RGYWtlQ2xhc3M7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxJQUFJLFFBQVEsWUFBWTtBQUNqQyxTQUFTLGNBQWMsUUFBUSx1QkFBdUI7QUFFdEQsTUFBTSxvQkFBeUIsQUFBQyxDQUFBLElBQU07SUFDcEMsT0FBTyxNQUFNO1FBQ1gsYUFBYztZQUNaLE1BQU0sSUFBSSxVQUFVLHVCQUF1QjtRQUM3QztRQUVBLE9BQU8sQ0FBQyxPQUFPLFdBQVcsQ0FBQyxDQUFDLEtBQVUsRUFBRTtZQUN0QyxPQUFPLE1B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