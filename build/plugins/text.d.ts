import { DrawTextOptions, PDFFont, PDFPageDrawTextOptions, TextAlignment } from '@patcher56/pdf-lib';
import PDFDocumentBuilder from '../main.js';
export interface PDFBuilderPageDrawTextOptions extends PDFPageDrawTextOptions {
    lineBreak?: boolean;
    align?: TextAlignment;
    maxLines?: number;
    afterLineDraw?: (lineText: string, font: PDFFont, options: DrawTextOptions) => void;
    rotateOrigin?: PDFPageDrawTextOptions['rotateOrigin'] & 'bottomCenter';
}
export declare const textPlugin: import("../plugin.js").PluginConfig<{
    /**
     * Draw one or more lines of text on this page
     * Origin for position is the top left of the text depending on TextAlignment.
     * Origin for rotation is the bottom left of the text depending on TextAlignment.
     * @see drawText
     * @param text
     * @param options
     */
    text(this: PDFDocumentBuilder, text: string, options?: PDFBuilderPageDrawTextOptions): void;
}>;
type TextMethod = (typeof textPlugin)['methods']['text'];
declare module '../main.js' {
    interface PDFDocumentBuilder {
        text: TextMethod;
    }
}
export {};
