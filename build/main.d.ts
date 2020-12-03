import { Color, PDFContentStream, PDFDocument, PDFFont, PDFImage, PDFPage, PDFPageDrawImageOptions, PDFPageDrawLineOptions, PDFPageDrawRectangleOptions, PDFPageDrawTextOptions, PDFRef } from "pdf-lib";
interface Margins {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
interface PDFDocumentBuilderOptions {
    margins: Margins;
}
interface PDFBuilderPageDrawImageOptions extends PDFPageDrawImageOptions {
    fit?: {
        width?: number;
        height?: number;
    };
}
interface PDFBuilderPageDrawTextOptions extends PDFPageDrawTextOptions {
    lineBreak?: boolean;
}
export default class PDFDocumentBuilder {
    doc: PDFDocument;
    page: PDFPage;
    options: PDFDocumentBuilderOptions;
    font: PDFFont;
    private fontKey?;
    fontSize: number;
    fontColor: Color;
    /** The factor a line is larger than it's font size */
    lineHeightFactor: number;
    pageIndex: number;
    contentStream?: PDFContentStream;
    contentStreamRef?: PDFRef;
    constructor(doc: PDFDocument, options?: Partial<PDFDocumentBuilderOptions>);
    moveDown(lines?: number): void;
    setFont(font: PDFFont): void;
    getFont(): [PDFFont, string];
    setFontSize(size: number): void;
    setLineHeight(lineHeight: number): void;
    text(text: string, options?: PDFBuilderPageDrawTextOptions): void;
    image(input: string | PDFImage, options?: PDFBuilderPageDrawImageOptions): Promise<void>;
    rect(options: PDFPageDrawRectangleOptions): void;
    line(options: PDFPageDrawLineOptions): void;
    moveTo(x: number, y: number): void;
    hexColor(hex: string): import("pdf-lib").RGB;
    switchToPage(index: number): void;
    addPage(): void;
    nextPage(): void;
    setFontColor(fontColor: Color): void;
    private convertY;
    get lineHeight(): number;
    get isLastPage(): boolean;
    get x(): number;
    get y(): number;
    set x(newX: number);
    set y(newY: number);
    get maxY(): number;
    getContentStream(useExisting?: boolean): PDFContentStream;
    private createContentStream;
    private maybeEmbedGraphicsState;
}
export {};
