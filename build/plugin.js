class PluginBase {
    static plugins = [];
    constructor(...args) {
        const constructor = this.constructor;
        // add all plugins to base constructor
        for (const plugins of constructor.plugins) {
            Object.assign(this, plugins.methods);
        }
    }
    static registerPlugin(plugin) {
        this.plugins.push(plugin);
    }
}
export { PluginBase };
export function createPlugin(config) {
    return config;
}
//# sourceMappingURL=plugin.js.map