import type {ParentNode} from 'domhandler'
import {isTag} from 'domhandler'
import {StandardFonts} from 'pdf-lib'
import PDFDocumentBuilder, {PDFBuilderPageDrawTextOptions} from '../main.js'
import {parseCssStyles} from './style.js'

export function getHtmlTextOptions(
  builder: PDFDocumentBuilder,
  node: ParentNode,
  lastNode?: boolean
): PDFBuilderPageDrawTextOptions {
  if (!isTag(node)) {
    return {}
  }

  const helveticaBold = builder.doc.embedStandardFont(StandardFonts.HelveticaBold)
  const helveticaOblique = builder.doc.embedStandardFont(StandardFonts.HelveticaOblique)

  const defaultTextStyles: PDFBuilderPageDrawTextOptions = {lineBreak: lastNode}

  const defaultHeaderStyles: PDFBuilderPageDrawTextOptions = {
    ...defaultTextStyles,
    lineBreak: lastNode,
    font: helveticaBold,
  }

  if (node.attribs?.style) {
    Object.assign(defaultTextStyles, parseCssStyles(node.attribs.style))
  }

  switch (node.name) {
    case 'p':
      return {
        ...defaultTextStyles,
        lineBreak: lastNode,
      }
    case 'h1':
      return {
        ...defaultHeaderStyles,
        size: builder.fontSize * 2,
      }
    case 'h2':
      return {
        ...defaultHeaderStyles,
        size: builder.fontSize * 1.7,
      }
    case 'h3':
      return {
        ...defaultHeaderStyles,
        size: builder.fontSize * 1.5,
      }
    case 'h4':
      return {
        ...defaultHeaderStyles,
        size: builder.fontSize * 1.2,
      }
    case 'strong':
      return {
        ...defaultTextStyles,
        font: helveticaBold,
        lineBreak: false,
      }
    case 'em':
      return {
        ...defaultTextStyles,
        font: helveticaOblique,
        lineBreak: false,
      }
    case 'a':
      return {
        ...defaultTextStyles,
        lineBreak: false,
      }
    default:
      return defaultTextStyles
  }
}
