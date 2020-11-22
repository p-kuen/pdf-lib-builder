import {
  breakTextIntoLines,
  cleanText,
  lineSplit,
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFPage,
  PDFPageDrawImageOptions,
  PDFPageDrawTextOptions,
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
    width: number;
    height: number;
  };
}

export default class PDFDocumentBuilder {
  doc: PDFDocument;
  page: PDFPage;
  options: PDFDocumentBuilderOptions;
  font: PDFFont;

  fontSize = 24;
  lineHeightFactor = 1.3;
  lineHeight = 24;

  pageIndex = 0;

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
    this.page.setFont(font);
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
    const opts = Object.assign(defaultOptions, options);
    opts.maxWidth = Math.min(opts.maxWidth || Infinity, this.page.getWidth() - this.x - this.options.margins.right);

    const wordBreaks = opts.wordBreaks || this.doc.defaultWordBreaks;
    const fontSize = opts.size || this.fontSize;
    const lineHeight = fontSize * this.lineHeightFactor;
    // opts.lineHeight = fontSize * this.lineHeightFactor;
    const textWidth = (t: string) => this.font.widthOfTextAtSize(t, fontSize);
    const textLines =
      opts.maxWidth === undefined
        ? lineSplit(cleanText(text))
        : breakTextIntoLines(text, wordBreaks, opts.maxWidth, textWidth);

    // at this point, let's check if there is enough space for the lines on this page
    if (this.y + lineHeight * textLines.length > this.maxY) {
      this.isLastPage ? this.addPage() : this.switchToPage(this.pageIndex + 1);
      this.moveTo(this.options.margins.left, this.options.margins.top);
      this.setFontSize(this.fontSize);
    }

    // since the origin is on the bottom left we have to adjust the y by the text height
    this.page.moveDown(lineHeight);

    this.page.drawText(text, opts);

    this.page.moveDown(lineHeight * (textLines.length - 1));
  }

  async image(input: string | PDFImage, options?: PDFBuilderPageDrawImageOptions) {
    let image: PDFImage;

    if (typeof input !== "string") {
      image = input;
    } else {
      const fileContent = readFileSync(input);
      image = await this.doc.embedJpg(fileContent);
    }

    if (options?.fit) {
      const fitDims = image.scaleToFit(options.fit.width, options.fit.height);
      options.width = fitDims.width;
      options.height = fitDims.height;
    }

    if (options?.y) {
      options.y = this.page.getHeight() - options.y - (options.height || image.height);
    }

    // at this point, let's check if there is enough space for the lines on this page
    if (this.y + (options?.height || image.height) > this.maxY) {
      this.isLastPage ? this.addPage() : this.switchToPage(this.pageIndex + 1);
      this.moveTo(this.options.margins.left, this.options.margins.top);
      this.setFontSize(this.fontSize);
    }

    this.page.drawImage(image, options);
  }

  moveTo(x: number, y: number) {
    this.page.moveTo(x, this.page.getHeight() - y);
  }

  hexColor(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? rgb(parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255)
      : rgb(0, 0, 0);
  }

  switchToPage(index: number) {
    if (index === this.pageIndex) {
      return;
    }

    this.page = this.doc.getPage(index);
    this.pageIndex = index;
  }

  addPage() {
    this.page = this.doc.addPage();
    this.pageIndex++;
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
    return this.page.getHeight() - this.options.margins.top - this.options.margins.bottom;
  }
}
