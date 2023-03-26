import { TextAlignment } from '@patcher56/pdf-lib';
import { breakTextIntoLines } from './lines.js';
export function alignX(text, x, font, fontSize, align) {
    if (!align) {
        return x;
    }
    const textWidth = (t) => font.widthOfTextAtSize(t, fontSize);
    if (align === TextAlignment.Center) {
        return x - textWidth(text) / 2;
    }
    else if (align === TextAlignment.Right) {
        return x - textWidth(text);
    }
    return x;
}
export function breakTextIntoLinesOfPage(builder, text, options) {
    const wordBreaks = options?.wordBreaks || builder.doc.defaultWordBreaks;
    const maxWidth = Math.min(options?.maxWidth || Infinity, builder.page.getWidth() - builder.x - builder.options.margins.right);
    const fontSize = options?.size || builder.fontSize;
    const textWidth = (t) => builder.font.widthOfTextAtSize(t, fontSize);
    const textLines = breakTextIntoLines(text, wordBreaks, (l) => (l === 1 ? maxWidth : options?.maxWidth ?? builder.maxX - builder.options.margins.left), textWidth);
    const encodedLines = [];
    let i = 0;
    for (const text of textLines) {
        // check if maxLines are exceeded
        if (i === (options?.maxLines || Infinity)) {
            break;
        }
        // if this is a cut off line add an ellipsis
        if (i === (options?.maxLines || Infinity) - 1 && textLines.length > i + 1) {
            const ellipsis = '…';
            encodedLines.push(builder.font.encodeText(breakTextIntoLines(text, wordBreaks, (l) => maxWidth - textWidth(ellipsis), textWidth)[0] + ellipsis));
        }
        else {
            encodedLines.push(builder.font.encodeText(text));
        }
        i++;
    }
    return {
        textLines,
        encodedLines,
    };
}
//# sourceMappingURL=text.js.map