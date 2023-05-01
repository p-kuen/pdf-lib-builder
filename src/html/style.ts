import {PDFPageDrawTextOptions} from '@patcher56/pdf-lib'
import {fromRgbString, hexColor} from '../utils/color.js'
import {isTag, Node} from 'domhandler'

export enum ListStyleType {
  None,
  Disc,
  Decimal,
}

export type StyleOptions = {
  listStyleType?: ListStyleType
}

export function parseCssStyles(style: string) {
  const rules = style.split(';')

  const textStyle: PDFPageDrawTextOptions = {}

  for (const rule of rules) {
    const parsedRule = rule.match(/(.*):\s*(.*)/)

    if (!parsedRule) {
      continue
    }

    const property = parsedRule[1]
    const value = parsedRule[2]

    switch (property) {
      case 'color':
        textStyle.color = value.match(/^#?[a-f0-9]+/) ? hexColor(value) : fromRgbString(value)
        break
      default:
        break
    }
  }

  return textStyle
}

export function getNodeStyle(node: Node): StyleOptions | undefined {
  if (!isTag(node)) {
    return
  }

  if (node.name === 'ol') {
    return {listStyleType: ListStyleType.Decimal}
  } else if (node.name === 'ul') {
    return {listStyleType: ListStyleType.Disc}
  }
}
