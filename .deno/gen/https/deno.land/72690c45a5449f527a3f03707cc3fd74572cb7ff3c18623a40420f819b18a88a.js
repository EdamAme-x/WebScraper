const HTMLCollectionFakeClass = (()=>{
    return class HTMLCollection {
        constructor(){
            throw new TypeError("Illegal constructor");
        }
        static [Symbol.hasInstance](value) {
            return value.constructor === HTMLCollectionClass;
        }
    };
})();
export const HTMLCollectionMutatorSym = Symbol();
// We define the `HTMLCollection` inside a closure to ensure that its
// `.name === "HTMLCollection"` property stays intact, as we need to manipulate
// its prototype and completely change its TypeScript-recognized type.
const HTMLCollectionClass = (()=>{
    // @ts-ignore
    class HTMLCollection extends Array {
        // @ts-ignore
        forEach(cb, thisArg = undefined) {
            super.forEach(cb, thisArg);
        }
        item(index) {
            return this[index] ?? null;
        }
        [HTMLCollectionMutatorSym]() {
            return {
                push: Array.prototype.push.bind(this),
                splice: Array.prototype.splice.bind(this),
                indexOf: Array.prototype.indexOf.bind(this)
            };
        }
        toString() {
            return "[object HTMLCollection]";
        }
    }
    return HTMLCollection;
})();
for (const staticMethod of [
    "from",
    "isArray",
    "of"
]){
    HTMLCollectionClass[staticMethod] = undefined;
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
    "unshift",
    // Unlike NodeList, HTMLCollection also doesn't implement these
    "entries",
    "forEach",
    "keys",
    "values"
]){
    HTMLCollectionClass.prototype[instanceMethod] = undefined;
}
export const HTMLCollection = HTMLCollectionClass;
export const HTMLCollectionPublic = HTMLCollectionFakeClass;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40My9zcmMvZG9tL2h0bWwtY29sbGVjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEVsZW1lbnQgfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5cbmNvbnN0IEhUTUxDb2xsZWN0aW9uRmFrZUNsYXNzOiBhbnkgPSAoKCkgPT4ge1xuICByZXR1cm4gY2xhc3MgSFRNTENvbGxlY3Rpb24ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIklsbGVnYWwgY29uc3RydWN0b3JcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIFtTeW1ib2wuaGFzSW5zdGFuY2VdKHZhbHVlOiBhbnkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gSFRNTENvbGxlY3Rpb25DbGFzcztcbiAgICB9XG4gIH07XG59KSgpO1xuXG5leHBvcnQgY29uc3QgSFRNTENvbGxlY3Rpb25NdXRhdG9yU3ltID0gU3ltYm9sKCk7XG5cbi8vIFdlIGRlZmluZSB0aGUgYEhUTUxDb2xsZWN0aW9uYCBpbnNpZGUgYSBjbG9zdXJlIHRvIGVuc3VyZSB0aGF0IGl0c1xuLy8gYC5uYW1lID09PSBcIkhUTUxDb2xsZWN0aW9uXCJgIHByb3BlcnR5IHN0YXlzIGludGFjdCwgYXMgd2UgbmVlZCB0byBtYW5pcHVsYXRlXG4vLyBpdHMgcHJvdG90eXBlIGFuZCBjb21wbGV0ZWx5IGNoYW5nZSBpdHMgVHlwZVNjcmlwdC1yZWNvZ25pemVkIHR5cGUuXG5jb25zdCBIVE1MQ29sbGVjdGlvbkNsYXNzOiBhbnkgPSAoKCkgPT4ge1xuICAvLyBAdHMtaWdub3JlXG4gIGNsYXNzIEhUTUxDb2xsZWN0aW9uIGV4dGVuZHMgQXJyYXk8RWxlbWVudD4ge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBmb3JFYWNoKFxuICAgICAgY2I6IChub2RlOiBFbGVtZW50LCBpbmRleDogbnVtYmVyLCBub2RlTGlzdDogRWxlbWVudFtdKSA9PiB2b2lkLFxuICAgICAgdGhpc0FyZzogSFRNTENvbGxlY3Rpb24gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gICAgKSB7XG4gICAgICBzdXBlci5mb3JFYWNoKGNiLCB0aGlzQXJnKTtcbiAgICB9XG5cbiAgICBpdGVtKGluZGV4OiBudW1iZXIpOiBFbGVtZW50IHwgbnVsbCB7XG4gICAgICByZXR1cm4gdGhpc1tpbmRleF0gPz8gbnVsbDtcbiAgICB9XG5cbiAgICBbSFRNTENvbGxlY3Rpb25NdXRhdG9yU3ltXSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHB1c2g6IEFycmF5LnByb3RvdHlwZS5wdXNoLmJpbmQodGhpcyksXG5cbiAgICAgICAgc3BsaWNlOiBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmJpbmQodGhpcyksXG5cbiAgICAgICAgaW5kZXhPZjogQXJyYXkucHJvdG90eXBlLmluZGV4T2YuYmluZCh0aGlzKSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICByZXR1cm4gXCJbb2JqZWN0IEhUTUxDb2xsZWN0aW9uXVwiO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBIVE1MQ29sbGVjdGlvbjtcbn0pKCk7XG5cbmZvciAoXG4gIGNvbnN0IHN0YXRpY01ldGhvZCBvZiBbXG4gICAgXCJmcm9tXCIsXG4gICAgXCJpc0FycmF5XCIsXG4gICAgXCJvZlwiLFxuICBdXG4pIHtcbiAgSFRNTENvbGxlY3Rpb25DbGFzc1tzdGF0aWNNZXRob2RdID0gdW5kZWZpbmVkO1xufVxuXG5mb3IgKFxuICBjb25zdCBpbnN0YW5jZU1ldGhvZCBvZiBbXG4gICAgXCJjb25jYXRcIixcbiAgICBcImNvcHlXaXRoaW5cIixcbiAgICBcImV2ZXJ5XCIsXG4gICAgXCJmaWxsXCIsXG4gICAgXCJmaWx0ZXJcIixcbiAgICBcImZpbmRcIixcbiAgICBcImZpbmRJbmRleFwiLFxuICAgIFwiZmxhdFwiLFxuICAgIFwiZmxhdE1hcFwiLFxuICAgIFwiaW5jbHVkZXNcIixcbiAgICBcImluZGV4T2ZcIixcbiAgICBcImpvaW5cIixcbiAgICBcImxhc3RJbmRleE9mXCIsXG4gICAgXCJtYXBcIixcbiAgICBcInBvcFwiLFxuICAgIFwicHVzaFwiLFxuICAgIFwicmVkdWNlXCIsXG4gICAgXCJyZWR1Y2VSaWdodFwiLFxuICAgIFwicmV2ZXJzZVwiLFxuICAgIFwic2hpZnRcIixcbiAgICBcInNsaWNlXCIsXG4gICAgXCJzb21lXCIsXG4gICAgXCJzb3J0XCIsXG4gICAgXCJzcGxpY2VcIixcbiAgICBcInRvTG9jYWxlU3RyaW5nXCIsXG4gICAgXCJ1bnNoaWZ0XCIsXG5cbiAgICAvLyBVbmxpa2UgTm9kZUxpc3QsIEhUTUxDb2xsZWN0aW9uIGFsc28gZG9lc24ndCBpbXBsZW1lbnQgdGhlc2VcbiAgICBcImVudHJpZXNcIixcbiAgICBcImZvckVhY2hcIixcbiAgICBcImtleXNcIixcbiAgICBcInZhbHVlc1wiLFxuICBdXG4pIHtcbiAgSFRNTENvbGxlY3Rpb25DbGFzcy5wcm90b3R5cGVbaW5zdGFuY2VNZXRob2RdID0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhUTUxDb2xsZWN0aW9uIHtcbiAgbmV3ICgpOiBIVE1MQ29sbGVjdGlvbjtcbiAgcmVhZG9ubHkgW2luZGV4OiBudW1iZXJdOiBFbGVtZW50O1xuICByZWFkb25seSBsZW5ndGg6IG51bWJlcjtcbiAgW1N5bWJvbC5pdGVyYXRvcl0oKTogR2VuZXJhdG9yPEVsZW1lbnQ+O1xuXG4gIGl0ZW0oaW5kZXg6IG51bWJlcik6IEVsZW1lbnQ7XG4gIFtIVE1MQ29sbGVjdGlvbk11dGF0b3JTeW1dKCk6IEhUTUxDb2xsZWN0aW9uTXV0YXRvcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIVE1MQ29sbGVjdGlvblB1YmxpYyBleHRlbmRzIEhUTUxDb2xsZWN0aW9uIHtcbiAgW0hUTUxDb2xsZWN0aW9uTXV0YXRvclN5bV06IG5ldmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhUTUxDb2xsZWN0aW9uTXV0YXRvciB7XG4gIHB1c2goLi4uZWxlbWVudHM6IEVsZW1lbnRbXSk6IG51bWJlcjtcbiAgc3BsaWNlKHN0YXJ0OiBudW1iZXIsIGRlbGV0ZUNvdW50PzogbnVtYmVyLCAuLi5pdGVtczogRWxlbWVudFtdKTogRWxlbWVudFtdO1xuICBpbmRleE9mKGVsZW1lbnQ6IEVsZW1lbnQsIGZyb21JbmRleD86IG51bWJlciB8IHVuZGVmaW5lZCk6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IEhUTUxDb2xsZWN0aW9uID0gPEhUTUxDb2xsZWN0aW9uPiBIVE1MQ29sbGVjdGlvbkNsYXNzO1xuZXhwb3J0IGNvbnN0IEhUTUxDb2xsZWN0aW9uUHVibGljID1cbiAgPEhUTUxDb2xsZWN0aW9uUHVibGljPiBIVE1MQ29sbGVjdGlvbkZha2VDbGFzcztcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLDBCQUErQixBQUFDLENBQUEsSUFBTTtJQUMxQyxPQUFPLE1BQU07UUFDWCxhQUFjO1lBQ1osTUFBTSxJQUFJLFVBQVUsdUJBQXVCO1FBQzdDO1FBRUEsT0FBTyxDQUFDLE9BQU8sV0FBVyxDQUFDLENBQUMsS0FBVSxFQUFFO1lBQ3RDLE9BQU8sTUFBTSxXQUFXLEtBQUs7UUFDL0I7SUFDRjtBQUNGLENBQUE7QUFFQSxPQUFPLE1BQU0sMkJBQTJCLFNBQVM7QUFFakQscUVBQXFFO0FBQ3JFLCtFQUErRTtBQUMvRSxzRUFBc0U7QUFDdEUsTUFBTSxzQkFBMkIsQUFBQyxDQUFBLElBQU07SUFDdEMsYUFBYTtJQUNiLE1BQU0sdUJBQXVCO1FBQzNCLGFBQWE7UUFDYixRQUNFLEVBQStELEVBQy9ELFVBQXNDLFNBQVMsRUFDL0M7WUFDQSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUk7UUFDcEI7UUFFQSxLQUFLLEtBQWEsRUFBa0I7WUFDbEMsT0FBTyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUk7UUFDNUI7UUFFQSxDQUFDLHlCQUF5QixHQUFHO1lBQzNCLE9BQU87Z0JBQ0wsTUFBTSxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBRXBDLFFBQVEsTUFBTSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJO2dCQUV4QyxTQUFTLE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSTtZQUM1QztRQUNGO1FBRUEsV0FBVztZQUNULE9BQU87UUFDVDtJQUNGO0lBRUEsT0FBTztBQUNULENBQUE7QUFFQSxLQUNFLE1BQU0sZ0JBQWdCO0lBQ3BCO0lBQ0E7SUFDQTtDQUNELENBQ0Q7SUFDQSxtQkFBbUIsQ0FBQyxhQUFhLEdBQUc7QUFDdEM7QUFFQSxLQUNFLE1BQU0sa0JBQWtCO0lBQ3RCO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFFQSwrREFBK0Q7SUFDL0Q7SUFDQTtJQUNBO0lBQ0E7Q0FDRCxDQUNEO0lBQ0Esb0JBQW9CLFNBQVMsQ0FBQyxlQUFlLEdBQUc7QUFDbEQ7QUFzQkEsT0FBTyxNQUFNLGlCQUFrQyxvQkFBb0I7QUFDbkUsT0FBTyxNQUFNLHVCQUNZLHdCQUF3QiJ9