import {PDFPage, PDFRef, PDFString} from '@patcher56/pdf-lib'

export const createPageLinkAnnotation = (
  page: PDFPage,
  uri: string,
  rect: {x: number; y: number; width: number; height: number}
): PDFRef =>
  page.doc.context.register(
    page.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
      Border: [0, 0, 2],
      C: [0, 0, 1],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(uri),
      },
    })
  )
