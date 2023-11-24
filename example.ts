import { WebScraper } from "./mod.ts";

const ws = new WebScraper("https://google.com");
// Title

const DOM = await ws.getHTML();

console.log(DOM.title);
