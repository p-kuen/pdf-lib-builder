import { PDFBuilderPageDrawTextOptions } from './text.js';
export declare const linkPlugin: import("../plugin.js").PluginConfig<{
    link(this: import("../main.js").PDFDocumentBuilder, link: string, options?: PDFBuilderPageDrawTextOptions & {
        linkText?: string;
    }): void;
}>;
type LinkMethod = (typeof linkPlugin)['methods']['link'];
declare module '../main.js' {
    interface PDFDocumentBuilder {
        link: LinkMethod;
    }
}
export {};
