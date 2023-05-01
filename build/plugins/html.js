import { createPlugin } from '../plugin.js';
import { renderHtmlDocument } from '../html/html.js';
export const htmlPlugin = createPlugin({
    methods: {
        async html(html) {
            const parser = await import('htmlparser2');
            const parsed = parser.parseDocument(html, {});
            await renderHtmlDocument(this, parsed);
        },
    },
});
//# sourceMappingURL=html.js.map