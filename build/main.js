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
            ? pdf_lib_1.lineSplit(pdf_lib_1.cleanText(text))
            : pdf_lib_1.breakTextIntoLines(text, wordBreaks, options.maxWidth, textWidth);
        const encodedLines = [];
        let i = 0;
        for (const text of textLines) {
            // check if maxLines are exceeded
            if (i === ((options === null || options === void 0 ? void 0 : options.maxLines) || Infinity)) {
                break;
            }
            // if this is a cut off line add an ellipsis
            if (i === (((options === null || options === void 0 ? void 0 : options.maxLines) || Infinity) - 1) && textLines.length > i + 1) {
                const ellipsis = '…';
                encodedLines.push(font.encodeText(pdf_lib_1.breakTextIntoLines(text, wordBreaks, options.maxWidth - textWidth(ellipsis), textWidth)[0] + ellipsis));
            }
            else {
                encodedLines.push(font.encodeText(text));
            }
            i++;
        }
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
        i = 0;
        for (const line of encodedLines) {
            const isLastLine = i === encodedLines.length - 1;
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
            const operators = pdf_lib_1.drawText(line, {
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
        var _a, _b, _c, _d, _e, _f, _g;
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
        if (options === null || options === void 0 ? void 0 : options.fit) {
            const fitDims = image.scaleToFit(options.fit.width || image.width, options.fit.height || image.height);
            options.width = fitDims.width;
            options.height = fitDims.height;
        }
        // at this point, let's check if there is enough space for the lines on this page
        if (this.y + ((options === null || options === void 0 ? void 0 : options.height) || image.height) > this.maxY) {
            this.nextPage();
            this.moveTo(this.options.margins.left, this.options.margins.top);
        }
        const xObjectKey = pdf_lib_1.addRandomSuffix("Image", 10);
        this.page.node.setXObject(pdf_lib_1.PDFName.of(xObjectKey), image.ref);
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options === null || options === void 0 ? void 0 : options.opacity,
            blendMode: options === null || options === void 0 ? void 0 : options.blendMode,
        });
        const contentStream = this.getContentStream();
        contentStream.push(...pdf_lib_1.drawImage(xObjectKey, {
            x: (_a = options === null || options === void 0 ? void 0 : options.x) !== null && _a !== void 0 ? _a : this.x,
            y: this.convertY((_b = options === null || options === void 0 ? void 0 : options.y) !== null && _b !== void 0 ? _b : this.y) - ((options === null || options === void 0 ? void 0 : options.height) || image.height),
            width: (_c = options === null || options === void 0 ? void 0 : options.width) !== null && _c !== void 0 ? _c : image.size().width,
            height: (_d = options === null || options === void 0 ? void 0 : options.height) !== null && _d !== void 0 ? _d : image.size().height,
            rotate: (_e = options === null || options === void 0 ? void 0 : options.rotate) !== null && _e !== void 0 ? _e : pdf_lib_1.degrees(0),
            xSkew: (_f = options === null || options === void 0 ? void 0 : options.xSkew) !== null && _f !== void 0 ? _f : pdf_lib_1.degrees(0),
            ySkew: (_g = options === null || options === void 0 ? void 0 : options.ySkew) !== null && _g !== void 0 ? _g : pdf_lib_1.degrees(0),
            graphicsState: graphicsStateKey,
        }));
        // if the image is in the text flow, move down to set position after the image
        if ((options === null || options === void 0 ? void 0 : options.y) === undefined) {
            this.page.moveDown((options === null || options === void 0 ? void 0 : options.height) || image.height);
        }
    }
    rect(options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const contentStream = this.getContentStream();
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options.opacity,
            borderOpacity: options.borderOpacity,
            blendMode: options.blendMode,
        });
        if (!options.color && !options.borderColor) {
            options.color = pdf_lib_1.rgb(0, 0, 0);
        }
        contentStream.push(...pdf_lib_1.drawRectangle({
            x: (_a = options.x) !== null && _a !== void 0 ? _a : this.x,
            y: this.convertY((_b = options.y) !== null && _b !== void 0 ? _b : this.y) - ((_c = options.height) !== null && _c !== void 0 ? _c : 100),
            width: (_d = options.width) !== null && _d !== void 0 ? _d : 150,
            height: (_e = options.height) !== null && _e !== void 0 ? _e : 100,
            rotate: (_f = options.rotate) !== null && _f !== void 0 ? _f : pdf_lib_1.degrees(0),
            xSkew: (_g = options.xSkew) !== null && _g !== void 0 ? _g : pdf_lib_1.degrees(0),
            ySkew: (_h = options.ySkew) !== null && _h !== void 0 ? _h : pdf_lib_1.degrees(0),
            borderWidth: (_j = options.borderWidth) !== null && _j !== void 0 ? _j : 0,
            color: (_k = options.color) !== null && _k !== void 0 ? _k : undefined,
            borderColor: (_l = options.borderColor) !== null && _l !== void 0 ? _l : undefined,
            borderDashArray: (_m = options.borderDashArray) !== null && _m !== void 0 ? _m : undefined,
            borderDashPhase: (_o = options.borderDashPhase) !== null && _o !== void 0 ? _o : undefined,
            graphicsState: graphicsStateKey,
            borderLineCap: (_p = options.borderLineCap) !== null && _p !== void 0 ? _p : undefined,
        }));
    }
    ellipse(options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options === null || options === void 0 ? void 0 : options.opacity,
            borderOpacity: options === null || options === void 0 ? void 0 : options.borderOpacity,
            blendMode: options === null || options === void 0 ? void 0 : options.blendMode,
        });
        const contentStream = this.getContentStream();
        contentStream.push(...pdf_lib_1.drawEllipse({
            x: (_a = options === null || options === void 0 ? void 0 : options.x) !== null && _a !== void 0 ? _a : this.x,
            y: this.convertY((_b = options === null || options === void 0 ? void 0 : options.y) !== null && _b !== void 0 ? _b : this.y),
            xScale: (_c = options === null || options === void 0 ? void 0 : options.xScale) !== null && _c !== void 0 ? _c : 100,
            yScale: (_d = options === null || options === void 0 ? void 0 : options.yScale) !== null && _d !== void 0 ? _d : 100,
            rotate: (_e = options === null || options === void 0 ? void 0 : options.rotate) !== null && _e !== void 0 ? _e : undefined,
            color: (_f = options === null || options === void 0 ? void 0 : options.color) !== null && _f !== void 0 ? _f : ((options === null || options === void 0 ? void 0 : options.borderColor) ? undefined : pdf_lib_1.rgb(0, 0, 0)),
            borderColor: (_g = options === null || options === void 0 ? void 0 : options.borderColor) !== null && _g !== void 0 ? _g : undefined,
            borderWidth: (_h = options === null || options === void 0 ? void 0 : options.borderWidth) !== null && _h !== void 0 ? _h : 0,
            borderDashArray: (_j = options === null || options === void 0 ? void 0 : options.borderDashArray) !== null && _j !== void 0 ? _j : undefined,
            borderDashPhase: (_k = options === null || options === void 0 ? void 0 : options.borderDashPhase) !== null && _k !== void 0 ? _k : undefined,
            borderLineCap: (_l = options === null || options === void 0 ? void 0 : options.borderLineCap) !== null && _l !== void 0 ? _l : undefined,
            graphicsState: graphicsStateKey,
        }));
    }
    line(options) {
        var _a, _b, _c, _d, _e;
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            borderOpacity: options.opacity,
            blendMode: options.blendMode,
        });
        const contentStream = this.getContentStream();
        contentStream.push(...pdf_lib_1.drawLine({
            start: {
                x: options.start.x,
                y: this.convertY(options.start.y),
            },
            end: {
                x: options.end.x,
                y: this.convertY(options.end.y),
            },
            thickness: (_a = options.thickness) !== null && _a !== void 0 ? _a : 1,
            color: (_b = options.color) !== null && _b !== void 0 ? _b : pdf_lib_1.rgb(0, 0, 0),
            dashArray: (_c = options.dashArray) !== null && _c !== void 0 ? _c : undefined,
            dashPhase: (_d = options.dashPhase) !== null && _d !== void 0 ? _d : undefined,
            lineCap: (_e = options.lineCap) !== null && _e !== void 0 ? _e : undefined,
            graphicsState: graphicsStateKey,
        }));
    }
    svgPath(path, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const graphicsStateKey = this.maybeEmbedGraphicsState({
            opacity: options.opacity,
            borderOpacity: options.borderOpacity,
            blendMode: options.blendMode,
        });
        if (!options.color && !options.borderColor) {
            options.borderColor = pdf_lib_1.rgb(0, 0, 0);
        }
        const contentStream = this.getContentStream();
        contentStream.push(...pdf_lib_1.drawSvgPath(path, {
            x: (_a = options.x) !== null && _a !== void 0 ? _a : this.x,
            y: this.convertY((_b = options.y) !== null && _b !== void 0 ? _b : this.y),
            scale: options.scale,
            rotate: (_c = options.rotate) !== null && _c !== void 0 ? _c : pdf_lib_1.degrees(0),
            color: (_d = options.color) !== null && _d !== void 0 ? _d : undefined,
            borderColor: (_e = options.borderColor) !== null && _e !== void 0 ? _e : undefined,
            borderWidth: (_f = options.borderWidth) !== null && _f !== void 0 ? _f : 0,
            borderDashArray: (_g = options.borderDashArray) !== null && _g !== void 0 ? _g : undefined,
            borderDashPhase: (_h = options.borderDashPhase) !== null && _h !== void 0 ? _h : undefined,
            borderLineCap: (_j = options.borderLineCap) !== null && _j !== void 0 ? _j : undefined,
            graphicsState: graphicsStateKey,
        }));
    }
    moveTo(x, y) {
        this.page.moveTo(x, this.convertY(y));
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