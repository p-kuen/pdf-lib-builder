import { asNumber } from '@patcher56/pdf-lib';
import { createPlugin } from '../plugin.js';
import { hexColor } from '../utils/color.js';
import { createPageLinkAnnotation } from '../utils/hyperlink.js';
export const linkPlugin = createPlugin({
    methods: {
        link(link, options) {
            const page = this.page;
            const lineHeight = this.lineHeight;
            const builder = this;
            const linkColor = options?.color ?? hexColor('#3366CC');
            this.text(options?.linkText ?? link, {
                ...options,
                color: linkColor,
                afterLineDraw(lineText, font, options) {
                    const textWidth = font.widthOfTextAtSize(lineText, asNumber(options.size));
                    const linkAnnotation = createPageLinkAnnotation(page, link, {
                        x: asNumber(options.x),
                        y: asNumber(options.y),
                        width: textWidth,
                        height: lineHeight,
                    });
                    page.node.addAnnot(linkAnnotation);
                    const thickness = Math.round(asNumber(options.size) / 10);
                    const lineY = builder.convertY(asNumber(options.y)) + thickness + 2;
                    builder.line({
                        start: { x: asNumber(options.x), y: lineY },
                        end: { x: asNumber(options.x) + textWidth, y: lineY },
                        color: linkColor,
                        thickness,
                    });
                },
            });
        },
    },
});
//# sourceMappingURL=link.js.map