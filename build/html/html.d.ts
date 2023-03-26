import { Node } from 'domhandler';
import PDFDocumentBuilder, { PDFBuilderPageDrawTextOptions } from '../main.js';
import { StyleOptions } from './style.js';
export declare function renderNode(doc: PDFDocumentBuilder, node: Node, options?: {
    style?: StyleOptions;
    textStyle?: PDFBuilderPageDrawTextOptions;
}): Promise<void | import("@patcher56/pdf-lib").PDFImage>;
