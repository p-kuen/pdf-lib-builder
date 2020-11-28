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
const pdf_lib_1 = require("pdf-lib");
const fs_1 = require("fs");
class PDFDocumentBuilder {
    constructor(doc, options) {
        this.fontSize = 24;
        this.fontColor = pdf_lib_1.rgb(0, 0, 0);
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
        this.fontKey = pdf_lib_1.addRandomSuffix(this.font.name);
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
        options.maxWidth = Math.min(options.maxWidth || Infinity, this.page.getWidth() - this.x - this.options.margins.right);
        const [originalFont] = this.getFont();
        if (options.font)
            this.setFont(options.font);
        let [font, fontKey] = this.getFont();
        const wordBreaks = options.wordBreaks || this.doc.defaultWordBreaks;
        const fontSize = options.size || this.fontSize;
        const textWidth = (t) => font.widthOfTextAtSize(t, fontSize);
        const textLines = options.maxWidth === undefined
            ? pdf_lib_1.lineSplit(pdf_lib_1.cleanText(text))
            : pdf_lib_1.breakTextIntoLines(text, wordBreaks, options.maxWidth, textWidth);
        const encodedLines = textLines.map((text) => font.encodeText(text));
        let contentStream = this.getContentStream();
        const color = options.color || this.fontColor;
        const rotate = options.rotate || pdf_lib_1.degrees(0);
        const xSkew = options.xSkew || pdf_lib_1.degrees(0);
        const ySkew = options.ySkew || pdf_lib_1.degrees(0);
        const lineHeight = options.lineHeight || fontSize * this.lineHeightFactor;
        let graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options.opacity,
            blendMode: options.blendMode,
        });
        for (const line of encodedLines) {
            // Check if current line is beneath maxY. If so, switch to next page
            if (options.y === undefined && this.y + fontSize > this.maxY) {
                this.nextPage();
                // Add font to directory on the new page and get the font key
                this.setFont(font);
                [font, fontKey] = this.getFont();
                // Move to the top of the new page
                this.moveTo(this.options.margins.left, this.options.margins.top);
                this.setFontSize(this.fontSize);
                contentStream = this.getContentStream(false);
                graphicsStateKey = this.maybeEmbedGraphicsState({
                    opacity: options.opacity,
                    blendMode: options.blendMode,
                });
            }
            this.page.moveDown(fontSize);
            const operators = pdf_lib_1.drawText(line, {
                color,
                font: fontKey,
                size: fontSize,
                rotate,
                xSkew,
                ySkew,
                x: options.x || this.page.getX(),
                y: options.y ? this.page.getHeight() - options.y : this.page.getY(),
                graphicsState: graphicsStateKey,
            });
            // Move down the difference of lineHeight and font size to create a gap **after** the text
            this.page.moveDown(lineHeight - fontSize);
            contentStream.push(...operators);
        }
        if (options.font)
            this.setFont(originalFont);
    }
    async image(input, options) {
        let image;
        if (typeof input !== "string") {
            image = input;
        }
        else {
            const fileContent = fs_1.readFileSync(input);
            const { fromBuffer } = await Promise.resolve().then(() => __importStar(require("file-type")));
            const fileType = await fromBuffer(fileContent);
            if (!fileType) {
                console.error(`File type of file ${input} could not be determined, using JPEG!`);
                image = await this.doc.embedJpg(fileContent);
            }
            else if (fileType.mime === "image/jpeg") {
                image = await this.doc.embedJpg(fileContent);
            }
            else if (fileType.mime === "image/png") {
                image = await this.doc.embedPng(fileContent);
            }
            else {
                throw new Error(`File type ${fileType.mime} could not be used as an image!`);
            }
        }
        if (options?.fit) {
            const fitDims = image.scaleToFit(options.fit.width || image.width, options.fit.height || image.height);
            options.width = fitDims.width;
            options.height = fitDims.height;
        }
        if (options?.y) {
            options.y = this.page.getHeight() - options.y - (options.height || image.height);
        }
        // at this point, let's check if there is enough space for the lines on this page
        if (this.y + (options?.height || image.height) > this.maxY) {
            this.nextPage();
            this.moveTo(this.options.margins.left, this.options.margins.top);
        }
        // because the origin is on the bottom left, let's first move down by the image height
        this.page.moveDown(options?.height || image.height);
        this.page.drawImage(image, options);
    }
    moveTo(x, y) {
        this.page.moveTo(x, this.page.getHeight() - y);
    }
    hexColor(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? pdf_lib_1.rgb(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255)
            : pdf_lib_1.rgb(0, 0, 0);
    }
    switchToPage(index) {
        if (index === this.pageIndex) {
            return;
        }
        this.page = this.doc.getPage(index);
        this.contentStream = undefined;
        this.contentStreamRef = undefined;
        this.pageIndex = index;
    }
    addPage() {
        this.page = this.doc.addPage();
        this.contentStream = undefined;
        this.contentStreamRef = undefined;
        this.pageIndex++;
        // add current font to dictionary
        this.setFont(this.font);
    }
    nextPage() {
        if (this.isLastPage) {
            this.addPage();
        }
        else {
            this.switchToPage(this.pageIndex + 1);
        }
    }
    setFontColor(fontColor) {
        this.fontColor = fontColor;
        this.page.setFontColor(fontColor);
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
        return this.page.getHeight() - this.page.getY();
    }
    set x(newX) {
        this.page.moveTo(newX, this.page.getY());
    }
    set y(newY) {
        this.page.moveTo(this.page.getX(), this.page.getHeight() - newY);
    }
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
        const key = pdf_lib_1.addRandomSuffix("GS", 10);
        const graphicsState = this.doc.context.obj({
            Type: "ExtGState",
            ca: opacity,
            CA: borderOpacity,
            BM: blendMode,
        });
        this.page.node.setExtGState(pdf_lib_1.PDFName.of(key), graphicsState);
        return key;
    }
}
exports.default = PDFDocumentBuilder;
//# sourceMappingURL=main.js.map