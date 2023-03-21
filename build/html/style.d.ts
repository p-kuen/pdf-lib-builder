import { PDFBuilderPageDrawTextOptions } from '../main.js';
import { Node } from 'domhandler';
export declare enum ListStyleType {
    None = 0,
    Disc = 1,
    Decimal = 2
}
export type StyleOptions = {
    listStyleType?: ListStyleType;
};
export declare function parseCssStyles(style: string): PDFBuilderPageDrawTextOptions;
export declare function getNodeStyle(node: Node): StyleOptions | undefined;
