import {createPlugin} from '../plugin.js'
import {renderHtmlDocument} from '../html/html.js'

export const htmlPlugin = createPlugin({
  methods: {
    async html(html: string) {
      const parser = await import('htmlparser2')
      const parsed = parser.parseDocument(html, {})

      await renderHtmlDocument(this, parsed)
    },
  },
})

type HtmlMethod = (typeof htmlPlugin)['methods']['html']

declare module '../main.js' {
  interface PDFDocumentBuilder {
    html: HtmlMethod
  }
}
