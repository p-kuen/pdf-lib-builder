import { TextAlignment, degrees, drawText } from '@patcher56/pdf-lib';
import { createPlugin } from '../plugin.js';
import { breakTextIntoLines } from '../utils/lines.js';
export const textPlugin = createPlugin({
    methods: {
        /**
         * Draw one or more lines of text on this page
         * Origin for position is the top left of the text depending on TextAlignment.
         * Origin for rotation is the bottom left of the text depending on TextAlignment.
         * @see drawText
         * @param text
         * @param options
         */
        text(text, options) {
            const defaultOptions = {
                maxWidth: Infinity,
            };
            options = Object.assign(defaultOptions, options);
            const [originalFont] = this.getFont();
            if (options.font)
                this.setFont(options.font);
            let [font, fontKey] = this.getFont();
            const fontSize = options.size || this.fontSize;
            const textWidth = (t) => font.widthOfTextAtSize(t, fontSize);
            const textStartPosition = options.x || this.page.getX();
            let x = alignX(text, options.x || this.page.getX(), font, fontSize, options?.align);
            // handle position options
            let originalY = this.y;
            if (options.y) {
                this.y = options.y;
            }
            const { textLines, encodedLines } = breakTextIntoLinesOfPage(this, text, options);
            let contentStream = this.getContentStream();
            const color = options.color || this.fontColor;
            const rotate = options.rotate || degrees(0);
            const xSkew = options.xSkew || degrees(0);
            const ySkew = options.ySkew || degrees(0);
            const lineHeight = options.lineHeight || fontSize * this.lineHeightFactor;
            let graphicsStateKey = this.maybeEmbedGraphicsState({
                opacity: options.opacity,
                blendMode: options.blendMode,
            });
            let i = 0;
            for (const line of encodedLines) {
                const isFirstLine = i === 0;
                const isLastLine = i === encodedLines.length - 1;
                // Check if current line is beneath maxY. If so, switch to next page
                if (options.y === undefined && this.y + fontSize > this.maxY) {
                    this.nextPage();
                    // Add font to directory on the new page and get the font key
                    this.setFont(font);
                    [font, fontKey] = this.getFont();
                    this.setFontSize(this.fontSize);
                    contentStream = this.getContentStream(false);
                    graphicsStateKey = this.maybeEmbedGraphicsState({
                        opacity: options.opacity,
                        blendMode: options.blendMode,
                    });
                }
                x = textStartPosition;
                // if first line does not fit on the page width, do a line break
                if (isFirstLine && !options.x && x + textWidth(textLines[i]) >= this.maxX) {
                    // move down only the line height factor
                    this.moveDown();
                    x = this.options.margins.left;
                    this.x = x;
                }
                // Handle alignment
                x = alignX(textLines[i], x, font, fontSize, options?.align);
                this.page.moveDown(fontSize);
                let rotateOrigin = typeof options?.rotateOrigin !== 'string' ? options.rotateOrigin : undefined;
                if (typeof options?.rotateOrigin === 'string') {
                    if (options.rotateOrigin === 'bottomCenter') {
                        rotateOrigin = { x: textWidth(textLines[i]) / 2 };
                    }
                }
                const drawTextOptions = {
                    color,
                    font: fontKey,
                    size: fontSize,
                    rotate,
                    rotateOrigin,
                    xSkew,
                    ySkew,
                    x,
                    y: this.page.getY(),
                    graphicsState: graphicsStateKey,
                };
                const operators = drawText(line, drawTextOptions);
                if (options?.afterLineDraw) {
                    options.afterLineDraw(textLines[i], font, drawTextOptions);
                }
                // Handle line breaks after a line drawing.
                // Move down the difference of lineHeight and font size to create a gap **after** the text
                if (options.lineBreak !== false || !isLastLine) {
                    // move down only the line height factor
                    this.page.moveDown(lineHeight - fontSize);
                    this.x = this.options.margins.left;
                }
                else {
                    // we have to move up the fontSize, because we move down the font size in the next text call
                    // this strange behaviour is necessary because it is possible to use multiple font sizes
                    this.page.moveUp(fontSize);
                    if (!options.x) {
                        this.x = this.page.getX() + textWidth(textLines[i]);
                    }
                }
                contentStream.push(...operators);
                i++;
            }
            if (options.y) {
                this.y = originalY;
            }
            if (options.font)
                this.setFont(originalFont);
        },
    },
});
function alignX(text, x, font, fontSize, align) {
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
function breakTextIntoLinesOfPage(builder, text, options) {
    const wordBreaks = options?.wordBreaks || builder.doc.defaultWordBreaks;
    const maxWidth = Math.min(options?.maxWidth || Infinity, builder.page.getWidth() - builder.x - builder.options.margins.right);
    const fontSize = options?.size || builder.fontSize;
    const textWidth = (t) => builder.font.widthOfTextAtSize(t, fontSize);
    const textLines = breakTextIntoLines(text, wordBreaks, (l) => (l === 1 ? maxWidth : Math.min(options?.maxWidth ?? Infinity, builder.maxX - builder.options.margins.right)), textWidth);
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