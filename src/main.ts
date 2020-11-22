import {
  addRandomSuffix,
  BlendMode,
  breakTextIntoLines,
  cleanText,
  Color,
  degrees,
  drawLinesOfText,
  drawText,
  lineSplit,
  PDFContentStream,
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFName,
  PDFOperator,
  PDFPage,
  PDFPageDrawImageOptions,
  PDFPageDrawTextOptions,
  PDFRef,
  rgb,
  StandardFonts,
} from "pdf-lib";

import { readFileSync } from "fs";

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

export default class PDFDocumentBuilder {
  doc: PDFDocument;
  page: PDFPage;
  options: PDFDocumentBuilderOptions;

  font: PDFFont;
  private fontKey?: string;

  fontSize = 24;
  fontColor: Color = rgb(0, 0, 0);
  lineHeightFactor = 1.3;
  lineHeight = 24;

  pageIndex = 0;

  contentStream?: PDFContentStream;
  contentStreamRef?: PDFRef;

  constructor(doc: PDFDocument, options?: Partial<PDFDocumentBuilderOptions>) {
    this.doc = doc;
    this.font = this.doc.embedStandardFont(StandardFonts.Helvetica);

    // If there is no page in the document, create one
    const pageCount = doc.getPageCount();
    if (pageCount === 0) {
      this.page = doc.addPage();
    } else {
      this.page = doc.getPage(pageCount - 1);
    }

    const defaultOptions: PDFDocumentBuilderOptions = {
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
    };

    this.options = Object.assign(defaultOptions, options);

    this.moveTo(this.options.margins.left, this.options.margins.top);
  }

  moveDown(lines = 1) {
    this.page.moveDown(this.lineHeight * lines);
  }

  setFont(font: PDFFont) {
    this.font = font;
    this.fontKey = addRandomSuffix(this.font.name);
    this.page.node.setFontDictionary(PDFName.of(this.fontKey), this.font.ref);
  }

  getFont(): [PDFFont, string] {
    if (!this.font || !this.fontKey) {
      const font = this.doc.embedStandardFont(StandardFonts.Helvetica);
      this.setFont(font);
    }
    return [this.font!, this.fontKey!];
  }

  setFontSize(size: number) {
    this.fontSize = size;
    this.page.setFontSize(size);
    this.setLineHeight(size * this.lineHeightFactor);
  }

  setLineHeight(lineHeight: number) {
    this.lineHeight = lineHeight;
    this.page.setLineHeight(lineHeight);
  }

  text(text: string, options?: PDFPageDrawTextOptions) {
    const defaultOptions: PDFPageDrawTextOptions = {
      maxWidth: Infinity,
    };
    options = Object.assign(defaultOptions, options);
    options.maxWidth = Math.min(
      options.maxWidth || Infinity,
      this.page.getWidth() - this.x - this.options.margins.right
    );
    const [originalFont] = this.getFont();
    if (options.font) this.setFont(options.font);
    const [font, fontKey] = this.getFont();

    const wordBreaks = options.wordBreaks || this.doc.defaultWordBreaks;
    const fontSize = options.size || this.fontSize;
    const textWidth = (t: string) => font.widthOfTextAtSize(t, fontSize);
    const textLines =
      options.maxWidth === undefined
        ? lineSplit(cleanText(text))
        : breakTextIntoLines(text, wordBreaks, options.maxWidth, textWidth);

    const encodedLines = textLines.map((text) => font.encodeText(text));

    let contentStream = this.getContentStream();

    const color = options.color || this.fontColor;
    const size = options.size || fontSize;
    const rotate = options.rotate || degrees(0);
    const xSkew = options.xSkew || degrees(0);
    const ySkew = options.ySkew || degrees(0);
    const lineHeight = options.lineHeight || this.lineHeight;

    let graphicsStateKey = this.maybeEmbedGraphicsState({
      opacity: options.opacity,
      blendMode: options.blendMode,
    });

    let i = 0;
    for (const line of encodedLines) {
      if (this.y + lineHeight > this.maxY) {
        this.nextPage();
        this.moveTo(this.options.margins.left, this.options.margins.top);
        this.setFontSize(this.fontSize);
        contentStream = this.getContentStream();
        graphicsStateKey = this.maybeEmbedGraphicsState({
          opacity: options.opacity,
          blendMode: options.blendMode,
        });
      }

      this.page.moveDown(lineHeight);

      const operators = drawText(line, {
        color,
        font: fontKey,
        size,
        rotate,
        xSkew,
        ySkew,
        x: options.x || this.page.getX(),
        y: options.y ? this.page.getHeight() - options.y : this.page.getY(),
        graphicsState: graphicsStateKey,
      });

      contentStream.push(...operators);
      i++;
    }

    if (options.font) this.setFont(originalFont);
  }

  async image(
    input: string | PDFImage,
    options?: PDFBuilderPageDrawImageOptions
  ) {
    let image: PDFImage;

    if (typeof input !== "string") {
      image = input;
    } else {
      const fileContent = readFileSync(input);
      image = await this.doc.embedJpg(fileContent);
    }

    if (options?.fit) {
      const fitDims = image.scaleToFit(
        options.fit.width || image.width,
        options.fit.height || image.height
      );
      options.width = fitDims.width;
      options.height = fitDims.height;
    }

    if (options?.y) {
      options.y =
        this.page.getHeight() - options.y - (options.height || image.height);
    }

    // at this point, let's check if there is enough space for the lines on this page
    if (this.y + (options?.height || image.height) > this.maxY) {
      this.nextPage();
      this.moveTo(this.options.margins.left, this.options.margins.top);
      this.setFontSize(this.fontSize);
    }

    // because the origin is on the bottom left, let's first move down by the image height
    this.page.moveDown(options?.height || image.height);

    // this.page.drawImage(image, options);
  }

  moveTo(x: number, y: number) {
    this.page.moveTo(x, this.page.getHeight() - y);
  }

  hexColor(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? rgb(
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        )
      : rgb(0, 0, 0);
  }

  switchToPage(index: number) {
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
  }

  nextPage() {
    if (this.isLastPage) {
      console.log("add a new page");
      this.addPage();
    } else {
      console.log("switch to next page");
      this.switchToPage(this.pageIndex + 1);
    }
  }

  setFontColor(fontColor: Color) {
    this.fontColor = fontColor;
    this.page.setFontColor(fontColor);
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

  set x(newX: number) {
    this.page.moveTo(newX, this.page.getY());
  }

  set y(newY: number) {
    this.page.moveTo(this.page.getX(), this.page.getHeight() - newY);
  }

  get maxY() {
    return (
      this.page.getHeight() -
      this.options.margins.top -
      this.options.margins.bottom
    );
  }

  getContentStream(useExisting = true) {
    if (useExisting && this.contentStream) return this.contentStream;
    this.contentStream = this.createContentStream();
    this.contentStreamRef = this.doc.context.register(this.contentStream);
    this.page.node.addContentStream(this.contentStreamRef);
    return this.contentStream;
  }

  private createContentStream(...operators: PDFOperator[]): PDFContentStream {
    const dict = this.doc.context.obj({});
    const contentStream = PDFContentStream.of(dict, operators);
    return contentStream;
  }

  private maybeEmbedGraphicsState(options: {
    opacity?: number;
    borderOpacity?: number;
    blendMode?: BlendMode;
  }): string | undefined {
    const { opacity, borderOpacity, blendMode } = options;

    if (
      opacity === undefined &&
      borderOpacity === undefined &&
      blendMode === undefined
    ) {
      return undefined;
    }

    const key = addRandomSuffix("GS", 10);

    const graphicsState = this.doc.context.obj({
      Type: "ExtGState",
      ca: opacity,
      CA: borderOpacity,
      BM: blendMode,
    });

    this.page.node.setExtGState(PDFName.of(key), graphicsState);

    return key;
  }
}
