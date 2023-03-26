import { PDFString } from '@patcher56/pdf-lib';
export const createPageLinkAnnotation = (page, uri, rect) => page.doc.context.register(page.doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
    Border: [0, 0, 2],
    C: [0, 0, 1],
    A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(uri),
    },
}));
//# sourceMappingURL=hyperlink.js.map