import { PDFPage, PDFRef } from '@patcher56/pdf-lib';
export declare const createPageLinkAnnotation: (page: PDFPage, uri: string, rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}) => PDFRef;
