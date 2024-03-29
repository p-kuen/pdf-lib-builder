import {Element, isTag, isText, Node, ParentNode, Text} from 'domhandler'
import {decodeFromBase64DataUri} from '@patcher56/pdf-lib'
import PDFDocumentBuilder from '../main.js'
import {getNodeStyle, ListStyleType, StyleOptions} from './style.js'
import {PDFBuilderPageDrawTextOptions} from '../plugins/text.js'

export async function renderHtmlDocument(
  doc: PDFDocumentBuilder,
  node: ParentNode,
  options?: {style?: StyleOptions; textStyle?: PDFBuilderPageDrawTextOptions}
) {
  let i = 0
  for (const child of node.children) {
    await renderHtmlNode(doc, child, {
      lastNode: ++i === node.children.length,
      style: options?.style,
      textStyle: options?.textStyle,
    })
  }
}

export async function renderNode(
  doc: PDFDocumentBuilder,
  node: Node,
  options?: {style?: StyleOptions; textStyle?: PDFBuilderPageDrawTextOptions}
) {
  if (isText(node)) {
    // strip new lines and whitespace if text is not inside a pre tag and if parent tag is not root
    const strippedText =
      node.parent && !(isTag(node.parent) && node.parent.name === 'pre') ? node.data.replace(/\n/g, '') : node.data

    if (strippedText.trim() === '') {
      return
    }

    // if parent is a link tag, create a link text
    const parentLinkTag = findParentElementWithTag(node, 'a')

    if (parentLinkTag) {
      return doc.link(parentLinkTag.attribs.href, {...options?.textStyle, linkText: strippedText})
    }

    return doc.text(strippedText, options?.textStyle)
  }

  if (isTag(node) && node.name === 'img' && node.attribs.src?.match(/^data:.*;base64/)) {
    return doc.image(decodeFromBase64DataUri(node.attribs.src))
  }

  if (isTag(node) && node.name === 'li') {
    return renderListNode(doc, node, options)
  }

  // move down on empty p tags
  if (isTag(node) && node.name === 'p' && node.children.length === 1) {
    const firstChildren = node.children[0]

    if (isText(firstChildren) && firstChildren.data === '\n') {
      doc.moveDown()
    }
  }
}

async function renderHtmlNode(
  doc: PDFDocumentBuilder,
  node: Node,
  options?: {lastNode?: boolean; style?: StyleOptions; textStyle?: PDFBuilderPageDrawTextOptions}
) {
  const domhandler = await import('domhandler')
  const htmlText = await import('../html/text.js')
  const style = Object.assign({}, options?.style, getNodeStyle(node))

  const textStyle = Object.assign(
    {},
    options?.textStyle ?? {},
    node.parent ? htmlText.getHtmlTextOptions(doc, node.parent, options?.lastNode) : undefined
  )

  const newOptions = {...options, textStyle, style}

  await renderNode(doc, node, newOptions)

  if (domhandler.hasChildren(node)) {
    await renderHtmlDocument(doc, node, newOptions)
  }
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
