import {Element, isTag, isText, Node, Text} from 'domhandler'
import {decodeFromBase64DataUri} from 'pdf-lib'
import PDFDocumentBuilder, {PDFBuilderPageDrawTextOptions} from '../main.js'
import {ListStyleType, StyleOptions} from './style.js'

export async function renderNode(
  doc: PDFDocumentBuilder,
  node: Node,
  options?: {style?: StyleOptions; textStyle?: PDFBuilderPageDrawTextOptions}
) {
  if (isText(node)) {
    return renderHtmlTextNode(doc, node, options?.textStyle)
  }

  if (isTag(node) && node.name === 'img' && node.attribs.src?.match(/^data:.*;base64/)) {
    return doc.image(decodeFromBase64DataUri(node.attribs.src))
  }

  if (isTag(node) && node.name === 'li') {
    return renderListNode(doc, node, options)
  }
}

function renderHtmlTextNode(doc: PDFDocumentBuilder, node: Text, options?: PDFBuilderPageDrawTextOptions) {
  doc.text(node.data, options)
}

function renderListNode(doc: PDFDocumentBuilder, node: Element, options?: {style?: StyleOptions}) {
  if (options?.style?.listStyleType === ListStyleType.None) {
    return
  }

  if (options?.style?.listStyleType === ListStyleType.Decimal) {
    // find ol element
    const olElement = findParentElementWithTag(node, 'ol')

    if (olElement) {
      olElement.attribs.count ??= '0'
      olElement.attribs.count = (Number(olElement.attribs.count) + 1).toString()
    }

    const count = Number(olElement?.attribs.count ?? 0)
    doc.text(`${count}. `, {lineBreak: false})
  } else if (options?.style?.listStyleType === ListStyleType.Disc) {
    doc.text('- ', {lineBreak: false})
  }
}

function findParentElementWithTag(node: Node, tag: string): Element | null {
  if (node.parent) {
    if (isTag(node.parent) && node.parent.name === tag) {
      return node.parent
    } else {
      return findParentElementWithTag(node.parent, tag)
    }
  }

  return null
}
