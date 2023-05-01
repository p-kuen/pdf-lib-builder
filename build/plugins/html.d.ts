export declare const htmlPlugin: import("../plugin.js").PluginConfig<{
    html(this: import("../main.js").PDFDocumentBuilder, html: string): Promise<void>;
}>;
type HtmlMethod = (typeof htmlPlugin)['methods']['html'];
declare module '../main.js' {
    interface PDFDocumentBuilder {
        html: HtmlMethod;
    }
}
export {};
