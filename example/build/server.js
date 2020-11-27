"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const pdf_lib_1 = require("pdf-lib");
const node_fetch_1 = __importDefault(require("node-fetch"));
const pdf_lib_builder_1 = __importDefault(require("pdf-lib-builder"));
const port = 4000;
http_1.createServer(async (req, res) => {
    const doc = await pdf_lib_1.PDFDocument.create();
    const builder = new pdf_lib_builder_1.default(doc);
    builder.text("This is a test document");
    builder.text("This should be rendered on next line.");
    builder.text("On this text \nwe \nfind \nnew \nlines");
    builder.moveDown(1);
    builder.text("There should be a space between last lines and this line.");
    builder.moveDown(4);
    builder.text("We skipped 5 lines now.");
    const boldFont = doc.embedStandardFont(pdf_lib_1.StandardFonts.HelveticaBold);
    builder.text("This text should be bold", { font: boldFont });
    builder.text("This should be big", { size: 48 });
    // jpg=ArrayBuffer
    const url = "https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg";
    const arrayBuffer = await node_fetch_1.default(url).then((res) => res.arrayBuffer());
    const image = await doc.embedJpg(arrayBuffer);
    builder.moveDown();
    builder.image(image, { fit: { height: 100 } });
    builder.moveDown();
    builder.text("This should show on next page with automatic wrapping");
    res.write(await doc.save());
    res.end();
}).listen(port);
console.log(`🚀 Server ready on port ${port}.`);
//# sourceMappingURL=server.js.map