"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const pdf_lib_1 = require("pdf-lib");
const gibma_1 = require("gibma");
const pdf_lib_builder_1 = require("pdf-lib-builder");
const port = 4000;
(0, http_1.createServer)(async (req, res) => {
    const doc = await pdf_lib_1.PDFDocument.create();
    const builder = new pdf_lib_builder_1.PDFDocumentBuilder(doc, {
        margins: { top: 32, right: 25, left: 70, bottom: 50 },
    });
    builder.text('This is a test document');
    builder.text('This should be rendered on next line.');
    builder.text('On this text \nwe \nfind \nnew \nlines');
    builder.moveDown(1);
    builder.text('There should be a space between last lines and this line.');
    builder.moveDown(4);
    builder.text('We skipped 4 lines now.');
    const boldFont = doc.embedStandardFont(pdf_lib_1.StandardFonts.HelveticaBold);
    builder.text('This text should be bold', { font: boldFont });
    builder.text('This should be big', { size: 48 });
    // jpg=ArrayBuffer
    const url = 'https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg';
    const string = await (0, gibma_1.request)(url).then((res) => res.data);
    const image = await doc.embedJpg(Buffer.from(string));
    builder.image(image, { x: 10, y: 10, fit: { height: 100 }, opacity: 0.2 });
    builder.image(image, { fit: { height: 100 } });
    builder.text('Image centered:');
    builder.image(image, { fit: { height: 50 }, align: 'center' });
    builder.text('Image align right:');
    builder.image(image, { fit: { height: 50 }, align: 'right' });
    builder.moveDown();
    builder.text('This should show on next page with automatic wrapping');
    builder.text('This should not break', { lineBreak: false });
    builder.text('This should be placed right next to the previous line and should break');
    builder.x = builder.options.margins.left;
    builder.text('This should be placed on the next line');
    builder.rect({
        width: 200,
        height: 100,
        color: builder.hexColor('#ff203040'),
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
        color: (0, pdf_lib_1.rgb)(1, 0, 0),
        thickness: 2,
    });
    builder.line({
        start,
        end,
        color: (0, pdf_lib_1.rgb)(1, 1, 1),
    });
    const [font] = builder.getFont();
    let text = 'I am on the line';
    const rotation = (0, pdf_lib_1.radians)(Math.atan2(100, 200));
    builder.rect({
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        width: font.widthOfTextAtSize(text, 8),
        height: font.heightAtSize(8),
        color: (0, pdf_lib_1.rgb)(1, 1, 1),
        opacity: 0.5,
        rotate: rotation,
        align: pdf_lib_builder_1.RectangleAlignment.Center,
    });
    builder.text(text, {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        color: (0, pdf_lib_1.rgb)(1, 1, 1),
        size: 8,
        rotate: rotation,
        align: pdf_lib_1.TextAlignment.Center,
    });
    builder.rect({
        width: 200,
        height: 100,
        x: builder.page.getWidth() - builder.options.margins.right - 200,
        y: builder.y,
    });
    builder.text('This text should be wrapped inside rect', {
        maxWidth: 200,
        x: builder.page.getWidth() - builder.options.margins.right - 200,
        y: builder.y,
        color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8),
    });
    builder.moveDown(5);
    builder.text('This text should be aligned in the center', {
        x: builder.page.getWidth() / 2,
        align: pdf_lib_1.TextAlignment.Center,
    });
    builder.text('This text should be aligned at the right', {
        x: builder.page.getWidth() - builder.options.margins.right,
        align: pdf_lib_1.TextAlignment.Right,
    });
    builder.moveDown(1);
    builder.ellipse({ xScale: 10, yScale: 10 });
    builder.moveDown(1);
    builder.rect({
        x: builder.x - 3,
        y: builder.y,
        width: builder.page.getWidth() / 2 - builder.options.margins.left + 6,
        height: font.heightAtSize(builder.fontSize) + 6,
        opacity: 0.3,
    });
    builder.text('This text is cut off at half of the page because there maxLines is set to 1', {
        maxWidth: builder.page.getWidth() / 2 - builder.options.margins.left,
        maxLines: 1,
    });
    builder.svgPath('M 10,10 L 10,20 L 20,10 L 10,10', { x: 10, y: 10 });
    builder.nextPage();
    builder.x = builder.options.margins.left;
    builder.y = builder.options.margins.top;
    // we will draw a coordinate system here
    const size = 300;
    const x = builder.x;
    const y = builder.y;
    builder.line({
        start: { x: x, y: y + size / 2 },
        end: { x: x + size, y: y + size / 2 },
        color: (0, pdf_lib_1.rgb)(0, 0, 0),
    });
    builder.line({
        start: { x: x + size / 2, y: y },
        end: { x: x + size / 2, y: y + size },
        color: (0, pdf_lib_1.rgb)(0, 0, 0),
    });
    // we will now draw a rectangle
    builder.rect({
        x: x + size / 2,
        y: y + size / 2,
        align: pdf_lib_builder_1.RectangleAlignment.Center,
        width: 30,
        height: 10,
        color: (0, pdf_lib_1.rgb)(0, 0, 0),
        opacity: 0.4,
    });
    const width = 30;
    const height = 10;
    const angle = 90;
    const angleRad = (0, pdf_lib_1.degreesToRadians)(angle);
    builder.rect({
        x: x + size / 2,
        y: y + size / 2,
        align: pdf_lib_builder_1.RectangleAlignment.Center,
        width,
        height,
        color: (0, pdf_lib_1.rgb)(1, 0, 0),
        opacity: 0.4,
        rotate: (0, pdf_lib_1.degrees)(angle),
    });
    builder.y += size;
    builder.moveDown(3);
    const point = {
        x: builder.x,
        y: builder.y,
    };
    builder.line({ start: point, end: { x: point.x, y: point.y + 30 }, color: (0, pdf_lib_1.rgb)(1, 0, 0) });
    // builder.ellipse({x: point.x, y: point.y, color: rgb(1, 0, 0), xScale: 10, yScale: 10})
    text = (99999999999999).toFixed(2);
    const textWidth = builder.font.widthOfTextAtSize(text, 12);
    builder.text(text, { x: point.x - textWidth / 2, y: point.y, size: 12 });
    res.write(await doc.save({ useObjectStreams: true }));
    res.end();
}).listen(port);
console.log(`🚀 Server ready on port ${port}.`);
//# sourceMappingURL=server.js.map