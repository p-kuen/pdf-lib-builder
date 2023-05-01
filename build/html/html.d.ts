import { Node, ParentNode } from 'domhandler';
import PDFDocumentBuilder from '../main.js';
import { StyleOptions } from './style.js';
import { PDFBuilderPageDrawTextOptions } from '../plugins/text.js';
export declare function renderHtmlDocument(doc: PDFDocumentBuilder, node: ParentNode, options?: {
    style?: StyleOptions;
    textStyle?: PDFBuilderPageDrawTextOptions;
}): Promise<void>;
export declare function renderNode(doc: PDFDocumentBuilder, node: Node, options?: {
    style?: StyleOptions;
    textStyle?: PDFBuilderPageDrawTextOptions;
}): Promise<void | import("@patcher56/pdf-lib").PDFImage>;
