import PDFDocumentBuilder from './main.js'

export class PluginBase {
  protected static plugins: PluginConfig<{}>[] = []
  constructor(...args: any[]) {
    const constructor = this.constructor as typeof PluginBase

    // add all plugins to base constructor
    for (const plugins of constructor.plugins) {
      Object.assign(this, plugins.methods)
    }
  }

  static registerPlugin(plugin: PluginConfig<{}>) {
    this.plugins.push(plugin)
  }
}

export type PluginMethod<Args extends any[] = any[]> = (this: PDFDocumentBuilder, ...args: Args) => void

export type PluginConfig<Methods extends Record<string, PluginMethod> | undefined> = {
  methods: Methods
}

export function createPlugin<Methods extends Record<string, PluginMethod>>(config: PluginConfig<Methods>) {
  return config
}
