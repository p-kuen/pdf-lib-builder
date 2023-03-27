import { isTag } from 'domhandler';
import { StandardFonts } from '@patcher56/pdf-lib';
import { parseCssStyles } from './style.js';
export function getHtmlTextOptions(builder, node, lastNode) {
    if (!isTag(node)) {
        return {};
    }
    const inlineElements = new Set(['strong', 'em', 's', 'a', 'u', 'span', 'small']);
    const helveticaBold = builder.doc.embedStandardFont(StandardFonts.HelveticaBold);
    const helveticaOblique = builder.doc.embedStandardFont(StandardFonts.HelveticaOblique);
    const defaultTextStyles = { lineBreak: lastNode };
    // Handle styles
    if (node.attribs?.style) {
        Object.assign(defaultTextStyles, parseCssStyles(node.attribs.style));
    }
    const inlineTextStyles = { ...defaultTextStyles, lineBreak: false };
    const defaultHeaderStyles = {
        ...defaultTextStyles,
        lineBreak: lastNode,
        font: helveticaBold,
    };
    switch (node.name) {
        case 'p':
            return {
                ...defaultTextStyles,
                lineBreak: lastNode,
            };
        case 'h1':
            return {
                ...defaultHeaderStyles,
                size: builder.fontSize * 2,
            };
        case 'h2':
            return {
                ...defaultHeaderStyles,
                size: builder.fontSize * 1.7,
            };
        case 'h3':
            return {
                ...defaultHeaderStyles,
                size: builder.fontSize * 1.5,
            };
        case 'h4':
            return {
                ...defaultHeaderStyles,
                size: builder.fontSize * 1.2,
            };
        case 'strong':
            return {
                ...inlineTextStyles,
                font: helveticaBold,
                lineBreak: false,
            };
        case 'em':
            return {
                ...inlineTextStyles,
                font: helveticaOblique,
                lineBreak: false,
            };
        case 'a':
            return {
                ...inlineTextStyles,
                lineBreak: false,
            };
        default:
            if (inlineElements.has(node.name)) {
                return inlineTextStyles;
            }
            else {
                return defaultTextStyles;
            }
    }
}
//# sourceMappingURL=text.js.map