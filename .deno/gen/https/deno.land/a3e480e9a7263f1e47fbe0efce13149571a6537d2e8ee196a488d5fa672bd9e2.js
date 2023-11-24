import { CTOR_KEY } from "../constructor-lock.ts";
import { NodeList, nodeListMutatorSym } from "./node-list.ts";
import { Node, nodesAndTextNodes, NodeType } from "./node.ts";
import { customByClassNameSym, customByTagNameSym } from "./selectors/custom-api.ts";
import { getElementsByClassName } from "./utils.ts";
import UtilTypes from "./utils-types.ts";
export class DocumentFragment extends Node {
    constructor(){
        super("#document-fragment", NodeType.DOCUMENT_FRAGMENT_NODE, null, CTOR_KEY);
    }
    get childElementCount() {
        return this._getChildNodesMutator().elementsView().length;
    }
    get children() {
        return this._getChildNodesMutator().elementsView();
    }
    get firstElementChild() {
        const elements = this._getChildNodesMutator().elementsView();
        return elements[0] ?? null;
    }
    get lastElementChild() {
        const elements = this._getChildNodesMutator().elementsView();
        return elements[elements.length - 1] ?? null;
    }
    _shallowClone() {
        return new DocumentFragment();
    }
    append(...nodes) {
        const mutator = this._getChildNodesMutator();
        mutator.push(...nodesAndTextNodes(nodes, this));
    }
    prepend(...nodes) {
        const mutator = this._getChildNodesMutator();
        mutator.splice(0, 0, ...nodesAndTextNodes(nodes, this));
    }
    replaceChildren(...nodes) {
        const mutator = this._getChildNodesMutator();
        // Remove all current child nodes
        for (const child of this.childNodes){
            child._setParent(null);
        }
        mutator.splice(0, this.childNodes.length);
        // Add new children
        mutator.splice(0, 0, ...nodesAndTextNodes(nodes, this));
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
    querySelector(selectors) {
        if (!this.ownerDocument) {
            throw new Error("DocumentFragment must have an owner document");
        }
        return this.ownerDocument._nwapi.first(selectors, this);
    }
    querySelectorAll(selectors) {
        if (!this.ownerDocument) {
            throw new Error("DocumentFragment must have an owner document");
        }
        const nodeList = new NodeList();
        const mutator = nodeList[nodeListMutatorSym]();
        mutator.push(...this.ownerDocument._nwapi.select(selectors, this));
        return nodeList;
    }
}
UtilTypes.DocumentFragment = DocumentFragment;
// Add required methods just for Sizzle.js selector to work on
// DocumentFragment's
function documentFragmentGetElementsByTagName(tagName) {
    const search = [];
    if (tagName === "*") {
        return documentFragmentGetElementsByTagNameWildcard(this, search);
    }
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
function documentFragmentGetElementsByClassName(className) {
    return getElementsByClassName(this, className, []);
}
function documentFragmentGetElementsByTagNameWildcard(fragment, search) {
    for (const child of fragment.childNodes){
        if (child.nodeType === NodeType.ELEMENT_NODE) {
            search.push(child);
            child._getElementsByTagNameWildcard(search);
        }
    }
    return search;
}
DocumentFragment.prototype[customByTagNameSym] = documentFragmentGetElementsByTagName;
DocumentFragment.prototype[customByClassNameSym] = documentFragmentGetElementsByClassName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40My9zcmMvZG9tL2RvY3VtZW50LWZyYWdtZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENUT1JfS0VZIH0gZnJvbSBcIi4uL2NvbnN0cnVjdG9yLWxvY2sudHNcIjtcbmltcG9ydCB7IEhUTUxDb2xsZWN0aW9uIH0gZnJvbSBcIi4vaHRtbC1jb2xsZWN0aW9uLnRzXCI7XG5pbXBvcnQgeyBOb2RlTGlzdCwgbm9kZUxpc3RNdXRhdG9yU3ltIH0gZnJvbSBcIi4vbm9kZS1saXN0LnRzXCI7XG5pbXBvcnQgeyBOb2RlLCBub2Rlc0FuZFRleHROb2RlcywgTm9kZVR5cGUgfSBmcm9tIFwiLi9ub2RlLnRzXCI7XG5pbXBvcnQgeyBFbGVtZW50IH0gZnJvbSBcIi4vZWxlbWVudC50c1wiO1xuaW1wb3J0IHtcbiAgY3VzdG9tQnlDbGFzc05hbWVTeW0sXG4gIGN1c3RvbUJ5VGFnTmFtZVN5bSxcbn0gZnJvbSBcIi4vc2VsZWN0b3JzL2N1c3RvbS1hcGkudHNcIjtcbmltcG9ydCB7IGdldEVsZW1lbnRzQnlDbGFzc05hbWUgfSBmcm9tIFwiLi91dGlscy50c1wiO1xuaW1wb3J0IFV0aWxUeXBlcyBmcm9tIFwiLi91dGlscy10eXBlcy50c1wiO1xuXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRGcmFnbWVudCBleHRlbmRzIE5vZGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiI2RvY3VtZW50LWZyYWdtZW50XCIsXG4gICAgICBOb2RlVHlwZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFLFxuICAgICAgbnVsbCxcbiAgICAgIENUT1JfS0VZLFxuICAgICk7XG4gIH1cblxuICBnZXQgY2hpbGRFbGVtZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKS5lbGVtZW50c1ZpZXcoKS5sZW5ndGg7XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogSFRNTENvbGxlY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpLmVsZW1lbnRzVmlldygpO1xuICB9XG5cbiAgZ2V0IGZpcnN0RWxlbWVudENoaWxkKCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBlbGVtZW50cyA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCkuZWxlbWVudHNWaWV3KCk7XG4gICAgcmV0dXJuIGVsZW1lbnRzWzBdID8/IG51bGw7XG4gIH1cblxuICBnZXQgbGFzdEVsZW1lbnRDaGlsZCgpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLl9nZXRDaGlsZE5vZGVzTXV0YXRvcigpLmVsZW1lbnRzVmlldygpO1xuICAgIHJldHVybiBlbGVtZW50c1tlbGVtZW50cy5sZW5ndGggLSAxXSA/PyBudWxsO1xuICB9XG5cbiAgb3ZlcnJpZGUgX3NoYWxsb3dDbG9uZSgpOiBEb2N1bWVudEZyYWdtZW50IHtcbiAgICByZXR1cm4gbmV3IERvY3VtZW50RnJhZ21lbnQoKTtcbiAgfVxuXG4gIGFwcGVuZCguLi5ub2RlczogKE5vZGUgfCBzdHJpbmcpW10pIHtcbiAgICBjb25zdCBtdXRhdG9yID0gdGhpcy5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcbiAgICBtdXRhdG9yLnB1c2goLi4ubm9kZXNBbmRUZXh0Tm9kZXMobm9kZXMsIHRoaXMpKTtcbiAgfVxuXG4gIHByZXBlbmQoLi4ubm9kZXM6IChOb2RlIHwgc3RyaW5nKVtdKSB7XG4gICAgY29uc3QgbXV0YXRvciA9IHRoaXMuX2dldENoaWxkTm9kZXNNdXRhdG9yKCk7XG4gICAgbXV0YXRvci5zcGxpY2UoMCwgMCwgLi4ubm9kZXNBbmRUZXh0Tm9kZXMobm9kZXMsIHRoaXMpKTtcbiAgfVxuXG4gIHJlcGxhY2VDaGlsZHJlbiguLi5ub2RlczogKE5vZGUgfCBzdHJpbmcpW10pIHtcbiAgICBjb25zdCBtdXRhdG9yID0gdGhpcy5fZ2V0Q2hpbGROb2Rlc011dGF0b3IoKTtcblxuICAgIC8vIFJlbW92ZSBhbGwgY3VycmVudCBjaGlsZCBub2Rlc1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBjaGlsZC5fc2V0UGFyZW50KG51bGwpO1xuICAgIH1cbiAgICBtdXRhdG9yLnNwbGljZSgwLCB0aGlzLmNoaWxkTm9kZXMubGVuZ3RoKTtcblxuICAgIC8vIEFkZCBuZXcgY2hpbGRyZW5cbiAgICBtdXRhdG9yLnNwbGljZSgwLCAwLCAuLi5ub2Rlc0FuZFRleHROb2Rlcyhub2RlcywgdGhpcykpO1xuICB9XG5cbiAgLy8gVE9ETzogRFJZISEhXG4gIGdldEVsZW1lbnRCeUlkKGlkOiBzdHJpbmcpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkTm9kZXMpIHtcbiAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gTm9kZVR5cGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIGlmICgoPEVsZW1lbnQ+IGNoaWxkKS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICByZXR1cm4gPEVsZW1lbnQ+IGNoaWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VhcmNoID0gKDxFbGVtZW50PiBjaGlsZCkuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBpZiAoc2VhcmNoKSB7XG4gICAgICAgICAgcmV0dXJuIHNlYXJjaDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcXVlcnlTZWxlY3RvcihzZWxlY3RvcnM6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBpZiAoIXRoaXMub3duZXJEb2N1bWVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRG9jdW1lbnRGcmFnbWVudCBtdXN0IGhhdmUgYW4gb3duZXIgZG9jdW1lbnRcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMub3duZXJEb2N1bWVudCEuX253YXBpLmZpcnN0KHNlbGVjdG9ycywgdGhpcyBhcyBhbnkgYXMgRWxlbWVudCk7XG4gIH1cblxuICBxdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yczogc3RyaW5nKTogTm9kZUxpc3Qge1xuICAgIGlmICghdGhpcy5vd25lckRvY3VtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEb2N1bWVudEZyYWdtZW50IG11c3QgaGF2ZSBhbiBvd25lciBkb2N1bWVudFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBub2RlTGlzdCA9IG5ldyBOb2RlTGlzdCgpO1xuICAgIGNvbnN0IG11dGF0b3IgPSBub2RlTGlzdFtub2RlTGlzdE11dGF0b3JTeW1dKCk7XG4gICAgbXV0YXRvci5wdXNoKFxuICAgICAgLi4udGhpcy5vd25lckRvY3VtZW50IS5fbndhcGkuc2VsZWN0KHNlbGVjdG9ycywgdGhpcyBhcyBhbnkgYXMgRWxlbWVudCksXG4gICAgKTtcblxuICAgIHJldHVybiBub2RlTGlzdDtcbiAgfVxufVxuXG5VdGlsVHlwZXMuRG9jdW1lbnRGcmFnbWVudCA9IERvY3VtZW50RnJhZ21lbnQ7XG5cbi8vIEFkZCByZXF1aXJlZCBtZXRob2RzIGp1c3QgZm9yIFNpenpsZS5qcyBzZWxlY3RvciB0byB3b3JrIG9uXG4vLyBEb2N1bWVudEZyYWdtZW50J3NcbmZ1bmN0aW9uIGRvY3VtZW50RnJhZ21lbnRHZXRFbGVtZW50c0J5VGFnTmFtZShcbiAgdGhpczogRG9jdW1lbnRGcmFnbWVudCxcbiAgdGFnTmFtZTogc3RyaW5nLFxuKTogTm9kZVtdIHtcbiAgY29uc3Qgc2VhcmNoOiBOb2RlW10gPSBbXTtcblxuICBpZiAodGFnTmFtZSA9PT0gXCIqXCIpIHtcbiAgICByZXR1cm4gZG9jdW1lbnRGcmFnbWVudEdldEVsZW1lbnRzQnlUYWdOYW1lV2lsZGNhcmQodGhpcywgc2VhcmNoKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlVHlwZS5FTEVNRU5UX05PREUpIHtcbiAgICAgIGlmICgoPEVsZW1lbnQ+IGNoaWxkKS50YWdOYW1lID09PSB0YWdOYW1lKSB7XG4gICAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgIH1cblxuICAgICAgKDxFbGVtZW50PiBjaGlsZCkuX2dldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUsIHNlYXJjaCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNlYXJjaDtcbn1cblxuZnVuY3Rpb24gZG9jdW1lbnRGcmFnbWVudEdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gIHRoaXM6IERvY3VtZW50RnJhZ21lbnQsXG4gIGNsYXNzTmFtZTogc3RyaW5nLFxuKSB7XG4gIHJldHVybiBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHRoaXMsIGNsYXNzTmFtZSwgW10pO1xufVxuXG5mdW5jdGlvbiBkb2N1bWVudEZyYWdtZW50R2V0RWxlbWVudHNCeVRhZ05hbWVXaWxkY2FyZChcbiAgZnJhZ21lbnQ6IERvY3VtZW50RnJhZ21lbnQsXG4gIHNlYXJjaDogTm9kZVtdLFxuKTogTm9kZVtdIHtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBmcmFnbWVudC5jaGlsZE5vZGVzKSB7XG4gICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSBOb2RlVHlwZS5FTEVNRU5UX05PREUpIHtcbiAgICAgIHNlYXJjaC5wdXNoKGNoaWxkKTtcbiAgICAgICg8RWxlbWVudD4gY2hpbGQpLl9nZXRFbGVtZW50c0J5VGFnTmFtZVdpbGRjYXJkKHNlYXJjaCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNlYXJjaDtcbn1cblxuKERvY3VtZW50RnJhZ21lbnQgYXMgYW55KS5wcm90b3R5cGVbY3VzdG9tQnlUYWdOYW1lU3ltXSA9XG4gIGRvY3VtZW50RnJhZ21lbnRHZXRFbGVtZW50c0J5VGFnTmFtZTtcbihEb2N1bWVudEZyYWdtZW50IGFzIGFueSkucHJvdG90eXBlW2N1c3RvbUJ5Q2xhc3NOYW1lU3ltXSA9XG4gIGRvY3VtZW50RnJhZ21lbnRHZXRFbGVtZW50c0J5Q2xhc3NOYW1lO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsUUFBUSxRQUFRLHlCQUF5QjtBQUVsRCxTQUFTLFFBQVEsRUFBRSxrQkFBa0IsUUFBUSxpQkFBaUI7QUFDOUQsU0FBUyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxRQUFRLFlBQVk7QUFFOUQsU0FDRSxvQkFBb0IsRUFDcEIsa0JBQWtCLFFBQ2IsNEJBQTRCO0FBQ25DLFNBQVMsc0JBQXNCLFFBQVEsYUFBYTtBQUNwRCxPQUFPLGVBQWUsbUJBQW1CO0FBRXpDLE9BQU8sTUFBTSx5QkFBeUI7SUFDcEMsYUFBYztRQUNaLEtBQUssQ0FDSCxzQkFDQSxTQUFTLHNCQUFzQixFQUMvQixJQUFJLEVBQ0o7SUFFSjtJQUVBLElBQUksb0JBQTRCO1FBQzlCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixHQUFHLFlBQVksR0FBRyxNQUFNO0lBQzNEO0lBRUEsSUFBSSxXQUEyQjtRQUM3QixPQUFPLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxZQUFZO0lBQ2xEO0lBRUEsSUFBSSxvQkFBb0M7UUFDdEMsTUFBTSxXQUFXLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxZQUFZO1FBQzFELE9BQU8sUUFBUSxDQUFDLEVBQUUsSUFBSSxJQUFJO0lBQzVCO0lBRUEsSUFBSSxtQkFBbUM7UUFDckMsTUFBTSxXQUFXLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxZQUFZO1FBQzFELE9BQU8sUUFBUSxDQUFDLFNBQVMsTUFBTSxHQUFHLEVBQUUsSUFBSSxJQUFJO0lBQzlDO0lBRVMsZ0JBQWtDO1FBQ3pDLE9BQU8sSUFBSTtJQUNiO0lBRUEsT0FBTyxHQUFHLEtBQXdCLEVBQUU7UUFDbEMsTUFBTSxVQUFVLElBQUksQ0FBQyxxQkFBcUI7UUFDMUMsUUFBUSxJQUFJLElBQUksa0JBQWtCLE9BQU8sSUFBSTtJQUMvQztJQUVBLFFBQVEsR0FBRyxLQUF3QixFQUFFO1FBQ25D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