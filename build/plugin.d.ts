import PDFDocumentBuilder from './main.js';
export declare class PluginBase {
    protected static plugins: PluginConfig<{}>[];
    constructor(...args: any[]);
    static registerPlugin(plugin: PluginConfig<{}>): void;
}
export type PluginMethod<Args extends any[] = any[]> = (this: PDFDocumentBuilder, ...args: Args) => void;
export type PluginConfig<Methods extends Record<string, PluginMethod> | undefined> = {
    methods: Methods;
};
export declare function createPlugin<Methods extends Record<string, PluginMethod>>(config: PluginConfig<Methods>): PluginConfig<Methods>;
