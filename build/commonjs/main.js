"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFDocumentBuilder = exports.rotatePoint = exports.RectangleAlignment = void 0;
const pdf_lib_1 = require("pdf-lib");
const fs_1 = require("fs");
var RectangleAlignment;
(function (RectangleAlignment) {
    RectangleAlignment[RectangleAlignment["TopLeft"] = 0] = "TopLeft";
    RectangleAlignment[RectangleAlignment["TopCenter"] = 1] = "TopCenter";
    RectangleAlignment[RectangleAlignment["TopRight"] = 2] = "TopRight";
    RectangleAlignment[RectangleAlignment["CenterLeft"] = 3] = "CenterLeft";
    RectangleAlignment[RectangleAlignment["Center"] = 4] = "Center";
    RectangleAlignment[RectangleAlignment["CenterRight"] = 5] = "CenterRight";
    RectangleAlignment[RectangleAlignment["BottomLeft"] = 6] = "BottomLeft";
    RectangleAlignment[RectangleAlignment["BottomCenter"] = 7] = "BottomCenter";
    RectangleAlignment[RectangleAlignment["BottomRight"] = 8] = "BottomRight";
})(RectangleAlignment = exports.RectangleAlignment || (exports.RectangleAlignment = {}));
function rotatePoint(point, rotation) {
    const rad = (0, pdf_lib_1.toRadians)(rotation);
    return {
        x: point.x * Math.cos(rad) - point.y * Math.sin(rad),
        y: point.x * Math.sin(rad) + point.y * Math.cos(rad),
    };
}
exports.rotatePoint = rotatePoint;
class PDFDocumentBuilder {
    constructor(doc, options) {
        this.fontSize = 24;
        this.fontColor = (0, pdf_lib_1.rgb)(0, 0, 0);
        /** The factor a line is larger than it's font size */
        this.lineHeightFactor = 1.3;
        this.pageIndex = 0;
        this.doc = doc;
        this.font = this.doc.embedStandardFont(pdf_lib_1.StandardFonts.Helvetica);
        // If there is no page in the document, create one
        const pageCount = doc.getPageCount();
        if (pageCount === 0) {
            this.page = doc.addPage();
        }
        else {
            this.page = doc.getPage(pageCount - 1);
        }
        const defaultOptions = {
            margins: { top: 72, bottom: 72, left: 72, right: 72 },
        };
        this.options = Object.assign(defaultOptions, options);
        this.moveTo(this.options.margins.left, this.options.margins.top);
    }
    moveDown(lines = 1) {
        this.page.moveDown(this.lineHeight * lines);
    }
    setFont(font) {
        this.font = font;
        this.fontKey = (0, pdf_lib_1.addRandomSuffix)(this.font.name);
        this.page.node.setFontDictionary(pdf_lib_1.PDFName.of(this.fontKey), this.font.ref);
    }
    getFont() {
        if (!this.font || !this.fontKey) {
            const font = this.doc.embedStandardFont(pdf_lib_1.StandardFonts.Helvetica);
            this.setFont(font);
        }
        return [this.font, this.fontKey];
    }
    setFontSize(size) {
        this.fontSize = size;
        this.page.setFontSize(size);
    }
    setLineHeight(lineHeight) {
        this.lineHeightFactor = lineHeight / this.fontSize;
        this.page.setLineHeight(lineHeight);
    }
    text(text, options) {
        const defaultOptions = {
            maxWidth: Infinity,
        };
        options = Object.assign(defaultOptions, options);
        options.maxWidth = Math.min(options.maxWidth || Infinity, this.page.getWidth() - (options.x || this.page.getX()) - this.options.margins.right);
        // handle position options
        let originalY = this.y;
        if (options.y) {
            this.y = options.y;
        }
        const [originalFont] = this.getFont();
        if (options.font)
            this.setFont(options.font);
        let [font, fontKey] = this.getFont();
        const wordBreaks = options.wordBreaks || this.doc.defaultWordBreaks;
        const fontSize = options.size || this.fontSize;
        const textWidth = (t) => font.widthOfTextAtSize(t, fontSize);
        const textLines = options.maxWidth === undefined
            ? (0, pdf_lib_1.lineSplit)((0, pdf_lib_1.cleanText)(text))
            : (0, pdf_lib_1.breakTextIntoLines)(text, wordBreaks, options.maxWidth, textWidth);
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
                encodedLines.push(font.encodeText((0, pdf_lib_1.breakTextIntoLines)(text, wordBreaks, options.maxWidth - textWidth(ellipsis), textWidth)[0] + ellipsis));
            }
            else {
                encodedLines.push(font.encodeText(text));
            }
            i++;
        }
        let contentStream = this.getContentStream();
        const color = options.color || this.fontColor;
        const rotate = options.rotate || (0, pdf_lib_1.degrees)(0);
        const xSkew = options.xSkew || (0, pdf_lib_1.degrees)(0);
        const ySkew = options.ySkew || (0, pdf_lib_1.degrees)(0);
        const lineHeight = options.lineHeight || fontSize * this.lineHeightFactor;
        let graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options.opacity,
            blendMode: options.blendMode,
        });
        i = 0;
        for (const line of encodedLines) {
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
            let x = options.x || this.page.getX();
            // Handle alignment
            if (options.align) {
                if (options.align === pdf_lib_1.TextAlignment.Center) {
                    x -= textWidth(textLines[i]) / 2;
                }
                else if (options.align === pdf_lib_1.TextAlignment.Right) {
                    x -= textWidth(textLines[i]);
                }
            }
            this.page.moveDown(fontSize);
            const operators = (0, pdf_lib_1.drawText)(line, {
                color,
                font: fontKey,
                size: fontSize,
                rotate,
                xSkew,
                ySkew,
                x,
                y: this.page.getY(),
                graphicsState: graphicsStateKey,
            });
            // Move down the difference of lineHeight and font size to create a gap **after** the text
            if (options.lineBreak !== false || !isLastLine) {
                this.page.moveDown(lineHeight - fontSize);
            }
            else {
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
    }
    async image(input, options) {
        let image;
        if (typeof input !== 'string') {
            image = input;
        }
        else {
            const fileContent = (0, fs_1.readFileSync)(input);
            const { fileTypeFromBuffer } = await Promise.resolve().then(() => __importStar(require('file-type')));
            const fileType = await fileTypeFromBuffer(fileContent);
            if (!fileType) {
                console.error(`File type of file ${input} could not be determined, using JPEG!`);
                image = await this.doc.embedJpg(fileContent);
            }
            else if (fileType.mime === 'image/jpeg') {
                image = await this.doc.embedJpg(fileContent);
            }
            else if (fileType.mime === 'image/png') {
                image = await this.doc.embedPng(fileContent);
            }
            else {
                throw new Error(`File type ${fileType.mime} could not be used as an image!`);
            }
        }
        if (options?.onLoad !== undefined) {
            options.onLoad(image);
        }
        if (options?.fit) {
            const fitDims = image.scaleToFit(options.fit.width || image.width, options.fit.height || image.height);
            options.width = fitDims.width;
            options.height = fitDims.height;
        }
        if (options?.align === 'center') {
            options.x = (this.page.getWidth() - (options.width || image.width)) / 2;
        }
        else if (options?.align === 'right') {
            options.x = this.page.getWidth() - (options.width || image.width) - this.options.margins.right;
        }
        // at this point, let's check if there is enough space for the lines on this page
        if (this.y + (options?.height || image.height) > this.maxY) {
            this.nextPage();
        }
        const xObjectKey = (0, pdf_lib_1.addRandomSuffix)('Image', 10);
        this.page.node.setXObject(pdf_lib_1.PDFName.of(xObjectKey), image.ref);
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options?.opacity,
            blendMode: options?.blendMode,
        });
        const contentStream = this.getContentStream();
        contentStream.push(...(0, pdf_lib_1.drawImage)(xObjectKey, {
            x: options?.x ?? this.x,
            y: this.convertY(options?.y ?? this.y) - (options?.height || image.height),
            width: options?.width ?? image.size().width,
            height: options?.height ?? image.size().height,
            rotate: options?.rotate ?? (0, pdf_lib_1.degrees)(0),
            xSkew: options?.xSkew ?? (0, pdf_lib_1.degrees)(0),
            ySkew: options?.ySkew ?? (0, pdf_lib_1.degrees)(0),
            graphicsState: graphicsStateKey,
        }));
        // if the image is in the text flow, move down to set position after the image
        if (options?.y === undefined) {
            this.page.moveDown(options?.height || image.height);
        }
        return image;
    }
    rect(options) {
        const contentStream = this.getContentStream();
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options.opacity,
            borderOpacity: options.borderOpacity,
            blendMode: options.blendMode,
        });
        if (!options.color && !options.borderColor) {
            options.color = (0, pdf_lib_1.rgb)(0, 0, 0);
        }
        const width = options.width ?? 150;
        const height = options.height ?? 100;
        let x = options.x ?? this.x;
        let y = options.y ?? this.y;
        const rotation = options.rotate ?? (0, pdf_lib_1.radians)(0);
        if (options.align === RectangleAlignment.Center) {
            const rotationOffset = rotatePoint({ x: width / 2, y: height / 2 }, rotation);
            x -= rotationOffset.x;
            y += rotationOffset.y - height;
        }
        else if (options.align !== undefined) {
            throw new Error(`Unsupported alignment option ${options.align}`);
        }
        contentStream.push(...(0, pdf_lib_1.drawRectangle)({
            x,
            y: this.convertY(y) - height,
            width: width,
            height: height,
            rotate: rotation,
            xSkew: options.xSkew ?? (0, pdf_lib_1.degrees)(0),
            ySkew: options.ySkew ?? (0, pdf_lib_1.degrees)(0),
            borderWidth: options.borderWidth ?? 0,
            color: options.color ?? undefined,
            borderColor: options.borderColor ?? undefined,
            borderDashArray: options.borderDashArray ?? undefined,
            borderDashPhase: options.borderDashPhase ?? undefined,
            graphicsState: graphicsStateKey,
            borderLineCap: options.borderLineCap ?? undefined,
        }));
    }
    /**
     * Draw an ellipse on this page.
     * [x] and [y] define the center of the ellipse
     * [xScale] and [yScale] define the scale from center to the outside border
     * @param options
     */
    ellipse(options) {
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options?.opacity,
            borderOpacity: options?.borderOpacity,
            blendMode: options?.blendMode,
        });
        const contentStream = this.getContentStream();
        contentStream.push(...(0, pdf_lib_1.drawEllipse)({
            x: options?.x ?? this.x,
            y: this.convertY(options?.y ?? this.y),
            xScale: options?.xScale ?? 100,
            yScale: options?.yScale ?? 100,
            rotate: options?.rotate ?? undefined,
            color: options?.color ?? (options?.borderColor ? undefined : (0, pdf_lib_1.rgb)(0, 0, 0)),
            borderColor: options?.borderColor ?? undefined,
            borderWidth: options?.borderWidth ?? 0,
            borderDashArray: options?.borderDashArray ?? undefined,
            borderDashPhase: options?.borderDashPhase ?? undefined,
            borderLineCap: options?.borderLineCap ?? undefined,
            graphicsState: graphicsStateKey,
        }));
    }
    line(options) {
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            borderOpacity: options.opacity,
            blendMode: options.blendMode,
        });
        const contentStream = this.getContentStream();
        contentStream.push(...(0, pdf_lib_1.drawLine)({
            start: {
                x: options.start.x,
                y: this.convertY(options.start.y),
            },
            end: {
                x: options.end.x,
                y: this.convertY(options.end.y),
            },
            thickness: options.thickness ?? 1,
            color: options.color ?? (0, pdf_lib_1.rgb)(0, 0, 0),
            dashArray: options.dashArray ?? undefined,
            dashPhase: options.dashPhase ?? undefined,
            lineCap: options.lineCap ?? undefined,
            graphicsState: graphicsStateKey,
        }));
    }
    svgPath(path, options) {
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options.opacity,
            borderOpacity: options.borderOpacity,
            blendMode: options.blendMode,
        });
        if (!options.color && !options.borderColor) {
            options.borderColor = (0, pdf_lib_1.rgb)(0, 0, 0);
        }
        const contentStream = this.getContentStream();
        contentStream.push(...(0, pdf_lib_1.drawSvgPath)(path, {
            x: options.x ?? this.x,
            y: this.convertY(options.y ?? this.y),
            scale: options.scale,
            rotate: options.rotate ?? (0, pdf_lib_1.degrees)(0),
            color: options.color ?? undefined,
            borderColor: options.borderColor ?? undefined,
            borderWidth: options.borderWidth ?? 0,
            borderDashArray: options.borderDashArray ?? undefined,
            borderDashPhase: options.borderDashPhase ?? undefined,
            borderLineCap: options.borderLineCap ?? undefined,
            graphicsState: graphicsStateKey,
        }));
    }
    moveTo(x, y) {
        this.page.moveTo(x, this.convertY(y));
    }
    /**
     * Resets the position to the top left of the page.
     */
    resetPosition() {
        this.moveTo(this.options.margins.left, this.options.margins.right);
    }
    hexColor(hex) {
        const result = /^#?([a-f\d]{2})?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? (0, pdf_lib_1.rgb)(parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255, parseInt(result[4], 16) / 255)
            : (0, pdf_lib_1.rgb)(0, 0, 0);
    }
    switchToPage(index) {
        if (index === this.pageIndex) {
            return;
        }
        this.page = this.doc.getPage(index);
        this.contentStream = undefined;
        this.contentStreamRef = undefined;
        this.pageIndex = index;
        // add current font to dictionary because the current fontKey is not valid on the new page
        this.setFont(this.font);
    }
    addPage() {
        this.page = this.doc.addPage();
        this.contentStream = undefined;
        this.contentStreamRef = undefined;
        this.pageIndex++;
        // add current font to dictionary
        this.setFont(this.font);
    }
    nextPage(options) {
        if (this.isLastPage) {
            this.addPage();
        }
        else {
            this.switchToPage(this.pageIndex + 1);
        }
        if (options?.keepPosition !== true) {
            this.resetPosition();
        }
    }
    setFontColor(fontColor) {
        this.fontColor = fontColor;
        this.page.setFontColor(fontColor);
    }
    convertY(y) {
        return this.page.getHeight() - y;
    }
    get lineHeight() {
        return this.fontSize * this.lineHeightFactor;
    }
    get isLastPage() {
        return this.pageIndex === this.doc.getPageCount() - 1;
    }
    get x() {
        return this.page.getX();
    }
    get y() {
        return this.convertY(this.page.getY());
    }
    set x(newX) {
        this.page.moveTo(newX, this.page.getY());
    }
    set y(newY) {
        this.page.moveTo(this.page.getX(), this.page.getHeight() - newY);
    }
    /**
     * @returns calculated maximum x-value using the page width minus right margin
     */
    get maxX() {
        return this.page.getWidth() - this.options.margins.right;
    }
    /**
     * @returns calculated maximum y-value using the page height minus bottom margin
     */
    get maxY() {
        return this.page.getHeight() - this.options.margins.bottom;
    }
    getContentStream(useExisting = true) {
        if (useExisting && this.contentStream)
            return this.contentStream;
        this.contentStream = this.createContentStream();
        this.contentStreamRef = this.doc.context.register(this.contentStream);
        this.page.node.addContentStream(this.contentStreamRef);
        return this.contentStream;
    }
    createContentStream(...operators) {
        const dict = this.doc.context.obj({});
        const contentStream = pdf_lib_1.PDFContentStream.of(dict, operators);
        return contentStream;
    }
    maybeEmbedGraphicsState(options) {
        const { opacity, borderOpacity, blendMode } = options;
        if (opacity === undefined && borderOpacity === undefined && blendMode === undefined) {
            return undefined;
        }
        const key = (0, pdf_lib_1.addRandomSuffix)('GS', 10);
        const graphicsState = this.doc.context.obj({
            Type: 'ExtGState',
            ca: opacity,
            CA: borderOpacity,
            BM: blendMode,
        });
        this.page.node.setExtGState(pdf_lib_1.PDFName.of(key), graphicsState);
        return key;
    }
}
exports.PDFDocumentBuilder = PDFDocumentBuilder;
exports.default = PDFDocumentBuilder;
//# sourceMappingURL=main.js.map