import { PDFFont, TextAlignment } from '@patcher56/pdf-lib';
import PDFDocumentBuilder, { PDFBuilderPageDrawTextOptions } from '../main.js';
export declare function alignX(text: string, x: number, font: PDFFont, fontSize: number, align?: TextAlignment): number;
export declare function breakTextIntoLinesOfPage(builder: PDFDocumentBuilder, text: string, options?: Pick<PDFBuilderPageDrawTextOptions, 'wordBreaks' | 'maxWidth' | 'maxLines' | 'size'>): {
    textLines: string[];
    encodedLines: import("@patcher56/pdf-lib/cjs/core/objects/PDFHexString.js").default[];
};
