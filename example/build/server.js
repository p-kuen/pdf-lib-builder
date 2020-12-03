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
    const builder = new pdf_lib_builder_1.default(doc, { margins: { top: 32, right: 25, left: 70, bottom: 50 } });
    builder.text("This is a test document");
    builder.text("This should be rendered on next line.");
    builder.text("On this text \nwe \nfind \nnew \nlines");
    builder.moveDown(1);
    builder.text("There should be a space between last lines and this line.");
    builder.moveDown(4);
    builder.text("We skipped 4 lines now.");
    const boldFont = doc.embedStandardFont(pdf_lib_1.StandardFonts.HelveticaBold);
    builder.text("This text should be bold", { font: boldFont });
    builder.text("This should be big", { size: 48 });
    // jpg=ArrayBuffer
    const url = "https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg";
    const arrayBuffer = await node_fetch_1.default(url).then((res) => res.arrayBuffer());
    const image = await doc.embedJpg(arrayBuffer);
    builder.image(image, { x: 10, y: 10, fit: { height: 100 }, opacity: 0.2 });
    builder.image(image, { fit: { height: 100 } });
    builder.moveDown();
    builder.text("This should show on next page with automatic wrapping");
    builder.text("This should not break", { lineBreak: false });
    builder.text("This should be placed right next to the previous line and should break");
    builder.x = builder.options.margins.left;
    builder.text("This should be placed on the next line");
    builder.rect({
        width: 200,
        height: 100,
    });
    const start = {
        x: builder.options.margins.left,
        y: builder.y + 100,
    };
    const end = {
        x: builder.options.margins.left + 200,
        y: builder.y,
    };
    builder.line({
        start,
        end,
        color: pdf_lib_1.rgb(1, 0, 0),
        thickness: 2,
    });
    builder.line({
        start,
        end,
        color: pdf_lib_1.rgb(1, 1, 1),
    });
    const [font] = builder.getFont();
    const text = "I am on the line";
    builder.text(text, {
        x: builder.options.margins.left + 100 - font.widthOfTextAtSize(text, 8) / 2,
        y: builder.y + 50,
        color: pdf_lib_1.rgb(1, 1, 1),
        size: 8,
        rotate: pdf_lib_1.radians(Math.atan2(100, 200)),
    });
    builder.rect({
        width: 200,
        height: 100,
        x: builder.page.getWidth() - builder.options.margins.right - 200,
        y: builder.y,
    });
    builder.text("This text should be wrapped inside rect", {
        maxWidth: 200,
        x: builder.page.getWidth() - builder.options.margins.right - 200,
        y: builder.y,
        color: pdf_lib_1.rgb(0.8, 0.8, 0.8),
    });
    builder.moveDown(5);
    builder.text("This text should be aligned in the center", {
        x: builder.page.getWidth() / 2,
        align: pdf_lib_1.TextAlignment.Center,
    });
    builder.text("This text should be aligned at the right", {
        x: builder.page.getWidth() - builder.options.margins.right,
        align: pdf_lib_1.TextAlignment.Right,
    });
    res.write(await doc.save({ useObjectStreams: true }));
    res.end();
}).listen(port);
console.log(`🚀 Server ready on port ${port}.`);
//# sourceMappingURL=server.js.map