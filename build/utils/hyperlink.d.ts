import { PDFPage } from 'pdf-lib';
export declare const createPageLinkAnnotation: (page: PDFPage, uri: string, rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}) => import("pdf-lib/cjs/core/objects/PDFRef.js").default;
