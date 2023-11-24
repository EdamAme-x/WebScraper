import {
  DOMParser
} from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { type HTMLDocument } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

export type HTTPS = `https://${string}`;
export type HTTP = `http://${string}`;
export type URL = HTTPS | HTTP;

export class WebScraper {
  public url: URL = "https://twitter.com/amex2189";
  private match: URLPattern = new URLPattern(this.url);
  private DOMParser: DOMParser = new DOMParser();
  
  constructor(url: URL) {
    this.changeURL(url)
  }

  async getRawResponse(config?: RequestInit) {
    return await fetch(this.url, config);
  }

  async getText(config?: RequestInit): Promise<string> {
    return await (await this.getRawResponse(config)).text();
  }

  async geJSON(config?: RequestInit): Promise<unknown> {
    return await (await this.getRawResponse(config)).json();
  }

  async getHTML(config?: RequestInit): Promise<HTMLDocument> {
    const source = await this.getText(config);
    const DOM = this.DOMParser.parseFromString(source, "text/html");
    return DOM;
  }

  changeURL(url: URL) {
    this.url = url;
    this.match = new URLPattern(this.url);
  }

  getPath() {
    return this.match.pathname;
  }

  getHost() {
    return this.match.hostname;
  }

  getPattern() {
    return this.match;
  }
}