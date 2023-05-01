import type { ParentNode } from 'domhandler';
import PDFDocumentBuilder from '../main.js';
import { PDFBuilderPageDrawTextOptions } from '../plugins/text.js';
export declare function getHtmlTextOptions(builder: PDFDocumentBuilder, node: ParentNode, lastNode?: boolean): PDFBuilderPageDrawTextOptions;
