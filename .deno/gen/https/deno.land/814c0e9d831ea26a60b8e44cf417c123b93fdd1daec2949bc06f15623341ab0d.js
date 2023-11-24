import { CTOR_KEY } from "../constructor-lock.ts";
import { nodesFromString } from "../deserialize.ts";
import { DocumentType, HTMLDocument } from "./document.ts";
export class DOMParser {
    parseFromString(source, mimeType) {
        if (mimeType !== "text/html") {
            throw new Error(`DOMParser: "${mimeType}" unimplemented`); // TODO
        }
        const doc = new HTMLDocument(CTOR_KEY);
        const fakeDoc = nodesFromString(source);
        let htmlNode = null;
        let hasDoctype = false;
        for (const child of [
            ...fakeDoc.childNodes
        ]){
            doc.appendChild(child);
            if (child instanceof DocumentType) {
                hasDoctype = true;
            } else if (child.nodeName === "HTML") {
                htmlNode = child;
            }
        }
        if (!hasDoctype) {
            const docType = new DocumentType("html", "", "", CTOR_KEY);
            // doc.insertBefore(docType, doc.firstChild);
            if (doc.childNodes.length === 0) {
                doc.appendChild(docType);
            } else {
                doc.insertBefore(docType, doc.childNodes[0]);
            }
        }
        if (htmlNode) {
            for (const child of htmlNode.childNodes){
                switch(child.tagName){
                    case "HEAD":
                        doc.head = child;
                        break;
                    case "BODY":
                        doc.body = child;
                        break;
                }
            }
        }
        return doc;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub19kb21AdjAuMS40My9zcmMvZG9tL2RvbS1wYXJzZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ1RPUl9LRVkgfSBmcm9tIFwiLi4vY29uc3RydWN0b3ItbG9jay50c1wiO1xuaW1wb3J0IHsgbm9kZXNGcm9tU3RyaW5nIH0gZnJvbSBcIi4uL2Rlc2VyaWFsaXplLnRzXCI7XG5pbXBvcnQgeyBEb2N1bWVudFR5cGUsIEhUTUxEb2N1bWVudCB9IGZyb20gXCIuL2RvY3VtZW50LnRzXCI7XG5pbXBvcnQgdHlwZSB7IEVsZW1lbnQgfSBmcm9tIFwiLi9lbGVtZW50LnRzXCI7XG5cbmV4cG9ydCB0eXBlIERPTVBhcnNlck1pbWVUeXBlID1cbiAgfCBcInRleHQvaHRtbFwiXG4gIHwgXCJ0ZXh0L3htbFwiXG4gIHwgXCJhcHBsaWNhdGlvbi94bWxcIlxuICB8IFwiYXBwbGljYXRpb24veGh0bWwreG1sXCJcbiAgfCBcImltYWdlL3N2Zyt4bWxcIjtcblxuZXhwb3J0IGNsYXNzIERPTVBhcnNlciB7XG4gIHBhcnNlRnJvbVN0cmluZyhcbiAgICBzb3VyY2U6IHN0cmluZyxcbiAgICBtaW1lVHlwZTogRE9NUGFyc2VyTWltZVR5cGUsXG4gICk6IEhUTUxEb2N1bWVudCB8IG51bGwge1xuICAgIGlmIChtaW1lVHlwZSAhPT0gXCJ0ZXh0L2h0bWxcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBET01QYXJzZXI6IFwiJHttaW1lVHlwZX1cIiB1bmltcGxlbWVudGVkYCk7IC8vIFRPRE9cbiAgICB9XG5cbiAgICBjb25zdCBkb2MgPSBuZXcgSFRNTERvY3VtZW50KENUT1JfS0VZKTtcblxuICAgIGNvbnN0IGZha2VEb2MgPSBub2Rlc0Zyb21TdHJpbmcoc291cmNlKTtcbiAgICBsZXQgaHRtbE5vZGU6IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgICBsZXQgaGFzRG9jdHlwZSA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBbLi4uZmFrZURvYy5jaGlsZE5vZGVzXSkge1xuICAgICAgZG9jLmFwcGVuZENoaWxkKGNoaWxkKTtcblxuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgRG9jdW1lbnRUeXBlKSB7XG4gICAgICAgIGhhc0RvY3R5cGUgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChjaGlsZC5ub2RlTmFtZSA9PT0gXCJIVE1MXCIpIHtcbiAgICAgICAgaHRtbE5vZGUgPSA8RWxlbWVudD4gY2hpbGQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFoYXNEb2N0eXBlKSB7XG4gICAgICBjb25zdCBkb2NUeXBlID0gbmV3IERvY3VtZW50VHlwZShcImh0bWxcIiwgXCJcIiwgXCJcIiwgQ1RPUl9LRVkpO1xuICAgICAgLy8gZG9jLmluc2VydEJlZm9yZShkb2NUeXBlLCBkb2MuZmlyc3RDaGlsZCk7XG4gICAgICBpZiAoZG9jLmNoaWxkTm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGRvYy5hcHBlbmRDaGlsZChkb2NUeXBlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvYy5pbnNlcnRCZWZvcmUoZG9jVHlwZSwgZG9jLmNoaWxkTm9kZXNbMF0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChodG1sTm9kZSkge1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBodG1sTm9kZS5jaGlsZE5vZGVzKSB7XG4gICAgICAgIHN3aXRjaCAoKDxFbGVtZW50PiBjaGlsZCkudGFnTmFtZSkge1xuICAgICAgICAgIGNhc2UgXCJIRUFEXCI6XG4gICAgICAgICAgICBkb2MuaGVhZCA9IDxFbGVtZW50PiBjaGlsZDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJCT0RZXCI6XG4gICAgICAgICAgICBkb2MuYm9keSA9IDxFbGVtZW50PiBjaGlsZDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRvYztcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsUUFBUSxRQUFRLHlCQUF5QjtBQUNsRCxTQUFTLGVBQWUsUUFBUSxvQkFBb0I7QUFDcEQsU0FBUyxZQUFZLEVBQUUsWUFBWSxRQUFRLGdCQUFnQjtBQVUzRCxPQUFPLE1BQU07SUFDWCxnQkFDRSxNQUFjLEVBQ2QsUUFBMkIsRUFDTjtRQUNyQixJQUFJLGFBQWEsYUFBYTtZQUM1QixNQUFNLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRSxTQUFTLGVBQWUsQ0FBQyxFQUFFLENBQUMsT0FBTztRQUNwRSxDQUFDO1FBRUQsTUFBTSxNQUFNLElBQUksYUFBYTtRQUU3QixNQUFNLFVBQVUsZ0JBQWdCO1FBQ2hDLElBQUksV0FBMkIsSUFBSTtRQUNuQyxJQUFJLGFBQWEsS0FBSztRQUV0QixLQUFLLE1BQU0sU0FBUztlQUFJLFFBQVEsVUFBVTtTQUFDLENBQUU7WUFDM0MsSUFBSSxXQUFXLENBQUM7WUFFaEIsSUFBSSxpQkFBaUIsY0FBYztnQkFDakMsYUFBYSxJQUFJO1lBQ25CLE9BQU8sSUFBSSxNQUFNLFFBQVEsS0FBSyxRQUFRO2dCQUNwQyxXQUFxQjtZQUN2QixDQUFDO1FBQ0g7UUFFQSxJQUFJLENBQUMsWUFBWTtZQUNmLE1BQU0sVUFBVSxJQUFJLGFBQWEsUUFBUSxJQUFJLElBQUk7WUFDakQsNkNBQTZDO1lBQzdDLElBQUksSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLEdBQUc7Z0JBQy9CLElBQUksV0FBVyxDQUFDO1lBQ2xCLE9BQU87Z0JBQ0wsSUFBSSxZQUFZLENBQUMsU0FBUyxJQUFJLFVBQVUsQ0FBQyxFQUFFO1lBQzdDLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxVQUFVO1lBQ1osS0FBSyxNQUFNLFNBQVMsU0FBUyxVQUFVLENBQUU7Z0JBQ3ZDLE9BQVEsQUFBVyxNQUFPLE9BQU87b0JBQy9CLEtBQUs7d0JBQ0gsSUFBSSxJQUFJLEdBQWE7d0JBQ3JCLEtBQU07b0JBQ1IsS0FBSzt3QkFDSCxJQUFJLElBQUksR0FBYTt3QkFDckIsS0FBTTtnQkFDVjtZQUNGO1FBQ0YsQ0FBQztRQUVELE9BQU87SUFDVDtBQUNGLENBQUMifQ==