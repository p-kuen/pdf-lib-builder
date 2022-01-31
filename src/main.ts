import {
  addRandomSuffix,
  BlendMode,
  breakTextIntoLines,
  cleanText,
  Color,
  degrees,
  drawEllipse,
  drawImage,
  drawLine,
  drawRectangle,
  drawSvgPath,
  drawText,
  lineSplit,
  PDFContentStream,
  PDFDocument,
  PDFFont,
  PDFImage,
  PDFName,
  PDFOperator,
  PDFPage,
  PDFPageDrawEllipseOptions,
  PDFPageDrawImageOptions,
  PDFPageDrawLineOptions,
  PDFPageDrawRectangleOptions,
  PDFPageDrawSVGOptions,
  PDFPageDrawTextOptions,
  PDFRef,
  rgb,
  StandardFonts,
  TextAlignment,
  toRadians,
  radians,
  Rotation,
} from 'pdf-lib'

import {readFileSync} from 'fs'

interface Margins {
  top: number
  bottom: number
  left: number
  right: number
}

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export enum RectangleAlignment {
  TopLeft,
  TopCenter,
  TopRight,
  CenterLeft,
  Center,
  CenterRight,
  BottomLeft,
  BottomCenter,
  BottomRight,
}

export interface PDFDocumentBuilderOptions {
  margins: Margins
}

export interface PDFBuilderPageDrawImageOptions extends PDFPageDrawImageOptions {
  fit?: {
    width?: number
    height?: number
  }
  align?: AlignSetting
  onLoad?: (image: PDFImage) => void
}

export interface PDFBuilderPageDrawTextOptions extends PDFPageDrawTextOptions {
  lineBreak?: boolean
  align?: TextAlignment
  maxLines?: number
}

export interface PDFBuilderPageDrawRectangleOptions extends PDFPageDrawRectangleOptions {
  align?: RectangleAlignment
}

export function rotatePoint(point: Point, rotation: Rotation): Point {
  const rad = toRadians(rotation)
  return {
    x: point.x * Math.cos(rad) - point.y * Math.sin(rad),
    y: point.x * Math.sin(rad) + point.y * Math.cos(rad),
  }
}

export class PDFDocumentBuilder {
  doc: PDFDocument
  page: PDFPage
  options: PDFDocumentBuilderOptions

  font: PDFFont
  private fontKey?: string

  fontSize = 24
  fontColor: Color = rgb(0, 0, 0)

  /** The factor a line is larger than it's font size */
  lineHeightFactor = 1.3

  pageIndex = 0

  contentStream?: PDFContentStream
  contentStreamRef?: PDFRef

  constructor(doc: PDFDocument, options?: Partial<PDFDocumentBuilderOptions>) {
    this.doc = doc
    this.font = this.doc.embedStandardFont(StandardFonts.Helvetica)

    // If there is no page in the document, create one
    const pageCount = doc.getPageCount()
    if (pageCount === 0) {
      this.page = doc.addPage()
    } else {
      this.page = doc.getPage(pageCount - 1)
    }

    const defaultOptions: PDFDocumentBuilderOptions = {
      margins: {top: 72, bottom: 72, left: 72, right: 72},
    }

    this.options = Object.assign(defaultOptions, options)

    this.moveTo(this.options.margins.left, this.options.margins.top)
  }

  moveDown(lines = 1) {
    this.page.moveDown(this.lineHeight * lines)
  }

  setFont(font: PDFFont) {
    this.font = font
    this.fontKey = addRandomSuffix(this.font.name)
    this.page.node.setFontDictionary(PDFName.of(this.fontKey), this.font.ref)
  }

  getFont(): [PDFFont, string] {
    if (!this.font || !this.fontKey) {
      const font = this.doc.embedStandardFont(StandardFonts.Helvetica)
      this.setFont(font)
    }
    return [this.font!, this.fontKey!]
  }

  setFontSize(size: number) {
    this.fontSize = size
    this.page.setFontSize(size)
  }

  setLineHeight(lineHeight: number) {
    this.lineHeightFactor = lineHeight / this.fontSize
    this.page.setLineHeight(lineHeight)
  }

  text(text: string, options?: PDFBuilderPageDrawTextOptions) {
    const defaultOptions: PDFBuilderPageDrawTextOptions = {
      maxWidth: Infinity,
    }
    options = Object.assign(defaultOptions, options)
    options.maxWidth = Math.min(
      options.maxWidth || Infinity,
      this.page.getWidth() - (options.x || this.page.getX()) - this.options.margins.right
    )

    // handle position options
    let originalY = this.y
    if (options.y) {
      this.y = options.y
    }

    const [originalFont] = this.getFont()
    if (options.font) this.setFont(options.font)
    let [font, fontKey] = this.getFont()

    const wordBreaks = options.wordBreaks || this.doc.defaultWordBreaks
    const fontSize = options.size || this.fontSize
    const textWidth = (t: string) => font.widthOfTextAtSize(t, fontSize)
    const textLines =
      options.maxWidth === undefined
        ? lineSplit(cleanText(text))
        : breakTextIntoLines(text, wordBreaks, options.maxWidth, textWidth)

    const encodedLines = []

    let i = 0
    for (const text of textLines) {
      // check if maxLines are exceeded
      if (i === (options?.maxLines || Infinity)) {
        break
      }

      // if this is a cut off line add an ellipsis
      if (i === (options?.maxLines || Infinity) - 1 && textLines.length > i + 1) {
        const ellipsis = '…'
        encodedLines.push(
          font.encodeText(
            breakTextIntoLines(text, wordBreaks, options.maxWidth - textWidth(ellipsis), textWidth)[0] + ellipsis
          )
        )
      } else {
        encodedLines.push(font.encodeText(text))
      }

      i++
    }

    let contentStream = this.getContentStream()

    const color = options.color || this.fontColor
    const rotate = options.rotate || degrees(0)
    const xSkew = options.xSkew || degrees(0)
    const ySkew = options.ySkew || degrees(0)
    const lineHeight = options.lineHeight || fontSize * this.lineHeightFactor

    let graphicsStateKey = this.maybeEmbedGraphicsState({
      opacity: options.opacity,
      blendMode: options.blendMode,
    })

    i = 0
    for (const line of encodedLines) {
      const isLastLine = i === encodedLines.length - 1
      // Check if current line is beneath maxY. If so, switch to next page
      if (options.y === undefined && this.y + fontSize > this.maxY) {
        this.nextPage()

        // Add font to directory on the new page and get the font key
        this.setFont(font)
        ;[font, fontKey] = this.getFont()

        this.setFontSize(this.fontSize)
        contentStream = this.getContentStream(false)
        graphicsStateKey = this.maybeEmbedGraphicsState({
          opacity: options.opacity,
          blendMode: options.blendMode,
        })
      }

      let x = options.x || this.page.getX()

      // Handle alignment
      if (options.align) {
        if (options.align === TextAlignment.Center) {
          x -= textWidth(textLines[i]) / 2
        } else if (options.align === TextAlignment.Right) {
          x -= textWidth(textLines[i])
        }
      }

      this.page.moveDown(fontSize)

      const operators = drawText(line, {
        color,
        font: fontKey,
        size: fontSize,
        rotate,
        xSkew,
        ySkew,
        x,
        y: this.page.getY(),
        graphicsState: graphicsStateKey,
      })

      // Move down the difference of lineHeight and font size to create a gap **after** the text
      if (options.lineBreak !== false || !isLastLine) {
        this.page.moveDown(lineHeight - fontSize)
      } else {
        this.page.moveUp(fontSize)

        if (!options.x) {
          this.x = this.page.getX() + textWidth(textLines[i])
        }
      }

      contentStream.push(...operators)
      i++
    }

    if (options.y) {
      this.y = originalY
    }

    if (options.font) this.setFont(originalFont)
  }

  async image(input: string | PDFImage, options?: PDFBuilderPageDrawImageOptions) {
    let image: PDFImage

    if (typeof input !== 'string') {
      image = input
    } else {
      const fileContent = readFileSync(input)
      const {fileTypeFromBuffer} = await import('file-type')
      const fileType = await fileTypeFromBuffer(fileContent)

      if (!fileType) {
        console.error(`File type of file ${input} could not be determined, using JPEG!`)
        image = await this.doc.embedJpg(fileContent)
      } else if (fileType.mime === 'image/jpeg') {
        image = await this.doc.embedJpg(fileContent)
      } else if (fileType.mime === 'image/png') {
        image = await this.doc.embedPng(fileContent)
      } else {
        throw new Error(`File type ${fileType.mime} could not be used as an image!`)
      }
    }

    if (options?.onLoad !== undefined) {
      options.onLoad(image)
    }

    if (options?.fit) {
      const fitDims = image.scaleToFit(options.fit.width || image.width, options.fit.height || image.height)
      options.width = fitDims.width
      options.height = fitDims.height
    }

    if (options?.align === 'center') {
      options.x = (this.page.getWidth() - (options.width || image.width)) / 2
    } else if (options?.align === 'right') {
      options.x = this.page.getWidth() - (options.width || image.width) - this.options.margins.right
    }

    // at this point, let's check if there is enough space for the lines on this page
    if (this.y + (options?.height || image.height) > this.maxY) {
      this.nextPage()
    }

    const xObjectKey = addRandomSuffix('Image', 10)
    this.page.node.setXObject(PDFName.of(xObjectKey), image.ref)

    const graphicsStateKey = this.maybeEmbedGraphicsState({
      opacity: options?.opacity,
      blendMode: options?.blendMode,
    })

    const contentStream = this.getContentStream()
    contentStream.push(
      ...drawImage(xObjectKey, {
        x: options?.x ?? this.x,
        y: this.convertY(options?.y ?? this.y) - (options?.height || image.height),
        width: options?.width ?? image.size().width,
        height: options?.height ?? image.size().height,
        rotate: options?.rotate ?? degrees(0),
        xSkew: options?.xSkew ?? degrees(0),
        ySkew: options?.ySkew ?? degrees(0),
        graphicsState: graphicsStateKey,
      })
    )

    // if the image is in the text flow, move down to set position after the image
    if (options?.y === undefined) {
      this.page.moveDown(options?.height || image.height)
    }

    return image
  }

  rect(options: PDFBuilderPageDrawRectangleOptions) {
    const contentStream = this.getContentStream()

    const graphicsStateKey = this.maybeEmbedGraphicsState({
      opacity: options.opacity,
      borderOpacity: options.borderOpacity,
      blendMode: options.blendMode,
    })

    if (!options.color && !options.borderColor) {
      options.color = rgb(0, 0, 0)
    }

    const width = options.width ?? 150
    const height = options.height ?? 100

    let x = options.x ?? this.x
    let y = options.y ?? this.y
    const rotation = options.rotate ?? radians(0)

    if (options.align === RectangleAlignment.Center) {
      const rotationOffset = rotatePoint({x: width / 2, y: height / 2}, rotation)
      x -= rotationOffset.x
      y += rotationOffset.y - height
    } else if (options.align !== undefined) {
      throw new Error(`Unsupported alignment option ${options.align}`)
    }

    contentStream.push(
      ...drawRectangle({
        x,
        y: this.convertY(y) - height,
        width: width,
        height: height,
        rotate: rotation,
        xSkew: options.xSkew ?? degrees(0),
        ySkew: options.ySkew ?? degrees(0),
        borderWidth: options.borderWidth ?? 0,
        color: options.color ?? undefined,
        borderColor: options.borderColor ?? undefined,
        borderDashArray: options.borderDashArray ?? undefined,
        borderDashPhase: options.borderDashPhase ?? undefined,
        graphicsState: graphicsStateKey,
        borderLineCap: options.borderLineCap ?? undefined,
      })
    )
  }

  ellipse(options?: PDFPageDrawEllipseOptions) {
    const graphicsStateKey = this.maybeEmbedGraphicsState({
      opacity: options?.opacity,
      borderOpacity: options?.borderOpacity,
      blendMode: options?.blendMode,
    })

    const contentStream = this.getContentStream()
    contentStream.push(
      ...drawEllipse({
        x: options?.x ?? this.x,
        y: this.convertY(options?.y ?? this.y),
        xScale: options?.xScale ?? 100,
        yScale: options?.yScale ?? 100,
        rotate: options?.rotate ?? undefined,
        color: options?.color ?? (options?.borderColor ? undefined : rgb(0, 0, 0)),
        borderColor: options?.borderColor ?? undefined,
        borderWidth: options?.borderWidth ?? 0,
        borderDashArray: options?.borderDashArray ?? undefined,
        borderDashPhase: options?.borderDashPhase ?? undefined,
        borderLineCap: options?.borderLineCap ?? undefined,
        graphicsState: graphicsStateKey,
      })
    )
  }

  line(options: PDFPageDrawLineOptions) {
    const graphicsStateKey = this.maybeEmbedGraphicsState({
      borderOpacity: options.opacity,
      blendMode: options.blendMode,
    })

    const contentStream = this.getContentStream()
    contentStream.push(
      ...drawLine({
        start: {
          x: options.start.x,
          y: this.convertY(options.start.y),
        },
        end: {
          x: options.end.x,
          y: this.convertY(options.end.y),
        },
        thickness: options.thickness ?? 1,
        color: options.color ?? rgb(0, 0, 0),
        dashArray: options.dashArray ?? undefined,
        dashPhase: options.dashPhase ?? undefined,
        lineCap: options.lineCap ?? undefined,
        graphicsState: graphicsStateKey,
      })
    )
  }

  svgPath(path: string, options: PDFPageDrawSVGOptions) {
    const graphicsStateKey = this.maybeEmbedGraphicsState({
      opacity: options.opacity,
      borderOpacity: options.borderOpacity,
      blendMode: options.blendMode,
    })

    if (!options.color && !options.borderColor) {
      options.borderColor = rgb(0, 0, 0)
    }

    const contentStream = this.getContentStream()
    contentStream.push(
      ...drawSvgPath(path, {
        x: options.x ?? this.x,
        y: this.convertY(options.y ?? this.y),
        scale: options.scale,
        rotate: options.rotate ?? degrees(0),
        color: options.color ?? undefined,
        borderColor: options.borderColor ?? undefined,
        borderWidth: options.borderWidth ?? 0,
        borderDashArray: options.borderDashArray ?? undefined,
        borderDashPhase: options.borderDashPhase ?? undefined,
        borderLineCap: options.borderLineCap ?? undefined,
        graphicsState: graphicsStateKey,
      })
    )
  }

  moveTo(x: number, y: number) {
    this.page.moveTo(x, this.convertY(y))
  }

  /**
   * Resets the position to the top left of the page.
   */
  resetPosition() {
    this.moveTo(this.options.margins.left, this.options.margins.right)
  }

  hexColor(hex: string) {
    const result = /^#?([a-f\d]{2})?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? rgb(parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255, parseInt(result[4], 16) / 255)
      : rgb(0, 0, 0)
  }

  switchToPage(index: number) {
    if (index === this.pageIndex) {
      return
    }

    this.page = this.doc.getPage(index)
    this.contentStream = undefined
    this.contentStreamRef = undefined
    this.pageIndex = index

    // add current font to dictionary because the current fontKey is not valid on the new page
    this.setFont(this.font)
  }

  addPage() {
    this.page = this.doc.addPage()
    this.contentStream = undefined
    this.contentStreamRef = undefined
    this.pageIndex++

    // add current font to dictionary
    this.setFont(this.font)
  }

  nextPage(options?: {keepPosition: boolean}) {
    if (this.isLastPage) {
      this.addPage()
    } else {
      this.switchToPage(this.pageIndex + 1)
    }

    if (options?.keepPosition !== true) {
      this.resetPosition()
    }
  }

  setFontColor(fontColor: Color) {
    this.fontColor = fontColor
    this.page.setFontColor(fontColor)
  }

  private convertY(y: number) {
    return this.page.getHeight() - y
  }

  get lineHeight() {
    return this.fontSize * this.lineHeightFactor
  }

  get isLastPage() {
    return this.pageIndex === this.doc.getPageCount() - 1
  }

  get x() {
    return this.page.getX()
  }

  get y() {
    return this.convertY(this.page.getY())
  }

  set x(newX: number) {
    this.page.moveTo(newX, this.page.getY())
  }

  set y(newY: number) {
    this.page.moveTo(this.page.getX(), this.page.getHeight() - newY)
  }

  /**
   * @returns calculated maximum x-value using the page width minus right margin
   */
  get maxX() {
    return this.page.getWidth() - this.options.margins.right
  }

  /**
   * @returns calculated maximum y-value using the page height minus bottom margin
   */
  get maxY() {
    return this.page.getHeight() - this.options.margins.bottom
  }

  getContentStream(useExisting = true) {
    if (useExisting && this.contentStream) return this.contentStream
    this.contentStream = this.createContentStream()
    this.contentStreamRef = this.doc.context.register(this.contentStream)
    this.page.node.addContentStream(this.contentStreamRef)
    return this.contentStream
  }

  private createContentStream(...operators: PDFOperator[]): PDFContentStream {
    const dict = this.doc.context.obj({})
    const contentStream = PDFContentStream.of(dict, operators)
    return contentStream
  }

  private maybeEmbedGraphicsState(options: {
    opacity?: number
    borderOpacity?: number
    blendMode?: BlendMode
  }): string | undefined {
    const {opacity, borderOpacity, blendMode} = options

    if (opacity === undefined && borderOpacity === undefined && blendMode === undefined) {
      return undefined
    }

    const key = addRandomSuffix('GS', 10)

    const graphicsState = this.doc.context.obj({
      Type: 'ExtGState',
      ca: opacity,
      CA: borderOpacity,
      BM: blendMode,
    })

    this.page.node.setExtGState(PDFName.of(key), graphicsState)

    return key
  }
}

export default PDFDocumentBuilder
