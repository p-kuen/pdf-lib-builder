import { BlendMode, Color, PDFContentStream, PDFDocument, PDFFont, PDFImage, PDFPage, PDFPageDrawEllipseOptions, PDFPageDrawImageOptions, PDFPageDrawLineOptions, PDFPageDrawRectangleOptions, PDFPageDrawSVGOptions, PDFRef, Rotation } from '@patcher56/pdf-lib';
import { PluginBase } from './plugin.js';
import './plugins/text.js';
import './plugins/link.js';
import './plugins/html.js';
interface Margins {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export interface Point {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
}
export declare enum RectangleAlignment {
    TopLeft = 0,
    TopCenter = 1,
    TopRight = 2,
    CenterLeft = 3,
    Center = 4,
    CenterRight = 5,
    BottomLeft = 6,
    BottomCenter = 7,
    BottomRight = 8
}
export interface PDFDocumentBuilderOptions {
    margins: Margins;
}
export interface PDFBuilderPageDrawImageOptions extends PDFPageDrawImageOptions {
    fit?: {
        width?: number;
        height?: number;
    };
    align?: AlignSetting;
    onLoad?: (image: PDFImage) => void;
}
export interface PDFBuilderPageDrawRectangleOptions extends PDFPageDrawRectangleOptions {
    align?: RectangleAlignment;
}
export declare function rotatePoint(point: Point, rotation: Rotation): Point;
export declare class PDFDocumentBuilder extends PluginBase {
    #private;
    doc: PDFDocument;
    page: PDFPage;
    options: PDFDocumentBuilderOptions;
    font: PDFFont;
    fontSize: number;
    fontColor: Color;
    /** The factor a line is larger than it's font size */
    lineHeightFactor: number;
    pageIndex: number;
    contentStream?: PDFContentStream;
    contentStreamRef?: PDFRef;
    protected static plugins: (import("./plugin.js").PluginConfig<{
        text(this: PDFDocumentBuilder, text: string, options?: import("./plugins/text.js").PDFBuilderPageDrawTextOptions | undefined): void;
    }> | import("./plugin.js").PluginConfig<{
        link(this: PDFDocumentBuilder, link: string, options?: (import("./plugins/text.js").PDFBuilderPageDrawTextOptions & {
            linkText?: string | undefined;
        }) | undefined): void;
    }> | import("./plugin.js").PluginConfig<{
        html(this: PDFDocumentBuilder, html: string): Promise<void>;
    }>)[];
    constructor(doc: PDFDocument, options?: Partial<PDFDocumentBuilderOptions>);
    moveDown(lines?: number): void;
    setFont(font: PDFFont): void;
    getFont(): [PDFFont, string];
    setFontSize(size: number): void;
    setLineHeight(lineHeight: number): void;
    image(input: Uint8Array | ArrayBuffer | PDFImage, options?: PDFBuilderPageDrawImageOptions): Promise<PDFImage>;
    rect(options: PDFBuilderPageDrawRectangleOptions): void;
    /**
     * Draw an ellipse on this page.
     * [x] and [y] define the center of the ellipse
     * [xScale] and [yScale] define the scale from center to the outside border
     * @param options
     */
    ellipse(options?: PDFPageDrawEllipseOptions): void;
    line(options: PDFPageDrawLineOptions): void;
    svgPath(path: string, options: PDFPageDrawSVGOptions): void;
    moveTo(x: number, y: number): void;
    /**
     * Resets the position to the top left of the page.
     */
    resetPosition(): void;
    hexColor(hex: string): import("@patcher56/pdf-lib").RGB;
    switchToPage(index: number): void;
    addPage(): void;
    nextPage(options?: {
        keepPosition: boolean;
    }): void;
    setFontColor(fontColor: Color): void;
    convertY(y: number): number;
    get lineHeight(): number;
    get isLastPage(): boolean;
    get x(): number;
    get y(): number;
    set x(newX: number);
    set y(newY: number);
    /**
     * @returns calculated maximum x-value using the page width minus right margin
     */
    get maxX(): number;
    /**
     * @returns calculated maximum width using the current x-position and page width
     */
    get maxWidth(): number;
    /**
     * @returns calculated maximum y-value using the page height minus bottom margin
     */
    get maxY(): number;
    getContentStream(useExisting?: boolean): PDFContentStream;
    maybeEmbedGraphicsState(options: {
        opacity?: number;
        borderOpacity?: number;
        blendMode?: BlendMode;
    }): string | undefined;
}
export default PDFDocumentBuilder;
