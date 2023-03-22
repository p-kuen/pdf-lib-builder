import { createServer } from 'http';
import { PDFDocument, radians, rgb, StandardFonts, TextAlignment, degrees, degreesToRadians } from 'pdf-lib';
import { request } from 'undici';
import { PDFDocumentBuilder, RectangleAlignment } from 'pdf-lib-builder';
const port = 4000;
const html = `
<h1>My First Heading</h1>
<h2>My Second Heading</h2>
<h3>My Third Heading</h3>
<p>My first paragraph.</p>
<ul>
  <li>First bulletpoint</li>
  <li>Second bulletpoint</li>
</ul>
<p />
<ul>
  <li><p>First bulletpoint</p></li>
  <li><p>Second bulletpoint</p></li>
</ul>
<p />
<p />
<ol>
  <li>First <strong>bold</strong> ordered</li>
  <li><a href="https://pdf-lib.js.org/">PDF-Lib Link</a><em> italic</em> ordered</li>
</ol>
<p />
<p />
<p>End paragraph</p>
`;
createServer(async (req, res) => {
    const doc = await PDFDocument.create();
    const builder = new PDFDocumentBuilder(doc, {
        margins: { top: 32, right: 25, left: 70, bottom: 50 },
    });
    // create top left margin lines
    builder.line({
        start: { x: builder.options.margins.left, y: builder.options.margins.top },
        end: { x: builder.options.margins.left + 10, y: builder.options.margins.top },
    });
    builder.line({
        start: { x: builder.options.margins.left, y: builder.options.margins.top },
        end: { x: builder.options.margins.left, y: builder.options.margins.top + 10 },
    });
    // create bottom right margin lines
    builder.line({
        start: { x: builder.maxX, y: builder.maxY },
        end: { x: builder.maxX - 10, y: builder.maxY },
    });
    builder.line({
        start: { x: builder.maxX, y: builder.maxY },
        end: { x: builder.maxX, y: builder.maxY - 10 },
    });
    builder.rect({
        x: builder.options.margins.left,
        y: builder.options.margins.top,
        height: builder.lineHeight,
        width: 10,
        opacity: 0.2,
        color: rgb(1, 0, 0),
    });
    builder.ellipse({ x: builder.options.margins.left, y: builder.options.margins.top, xScale: 5, yScale: 5, opacity: 0.5 });
    builder.text('This is a test document');
    builder.text('This should be rendered on next line.');
    builder.text('On this text \nwe \nfind \nnew \nlines');
    builder.moveDown(1);
    builder.text('There should be a space between last lines and this line.');
    builder.moveDown(4);
    builder.text('We skipped 4 lines now.');
    const boldFont = doc.embedStandardFont(StandardFonts.HelveticaBold);
    builder.text('This text should be bold', { font: boldFont });
    builder.text('This should be big', { size: 48 });
    // jpg=ArrayBuffer
    const url = 'https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg';
    const buffer = await request(url).then((res) => res.body.arrayBuffer());
    const image = await doc.embedJpg(buffer);
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
        color: rgb(1, 0, 0),
        thickness: 2,
    });
    builder.line({
        start,
        end,
        color: rgb(1, 1, 1),
    });
    const [font] = builder.getFont();
    const text = 'I am on the line';
    const rotation = radians(Math.atan2(100, 200));
    builder.rect({
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        width: font.widthOfTextAtSize(text, 8),
        height: font.heightAtSize(8),
        color: rgb(1, 1, 1),
        opacity: 0.5,
        rotate: rotation,
        align: RectangleAlignment.Center,
    });
    builder.text(text, {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        color: rgb(1, 1, 1),
        size: 8,
        rotate: rotation,
        align: TextAlignment.Center,
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
        color: rgb(0.8, 0.8, 0.8),
    });
    builder.moveDown(5);
    builder.text('This text should be aligned in the center', {
        x: builder.page.getWidth() / 2,
        align: TextAlignment.Center,
    });
    builder.text('This text should be aligned at the right', {
        x: builder.maxX,
        align: TextAlignment.Right,
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
    const halfY = builder.y;
    builder.text('This_text_is_cut_off_at_half_of_the_page_because_maxLines_is_set_to_2', {
        maxWidth: builder.page.getWidth() / 2 - builder.options.margins.left - builder.options.margins.right,
        maxLines: 2,
        wordBreaks: [' ', '_'],
    });
    builder.x = builder.page.getWidth() / 2;
    builder.y = halfY;
    builder.text('This_text_is_cut_off_at_the_other_half_of_the_page_because_maxLines_is_set_to_2', {
        maxWidth: builder.page.getWidth() / 2 - builder.options.margins.left - builder.options.margins.right,
        maxLines: 2,
        wordBreaks: [' ', '_'],
    });
    builder.svgPath('M 10,10 L 10,20 L 20,10 L 10,10', { x: 10, y: 10 });
    builder.nextPage();
    // we will draw a coordinate system here
    const size = 300;
    const x = builder.x;
    const y = builder.y;
    builder.line({
        start: { x: x, y: y + size / 2 },
        end: { x: x + size, y: y + size / 2 },
        color: rgb(0, 0, 0),
    });
    builder.line({
        start: { x: x + size / 2, y: y },
        end: { x: x + size / 2, y: y + size },
        color: rgb(0, 0, 0),
    });
    // we will now draw a rectangle
    builder.rect({
        x: x + size / 2,
        y: y + size / 2,
        align: RectangleAlignment.Center,
        width: 30,
        height: 10,
        color: rgb(0, 0, 0),
        opacity: 0.4,
    });
    const width = 30;
    const height = 10;
    const angle = 90;
    const angleRad = degreesToRadians(angle);
    builder.rect({
        x: x + size / 2,
        y: y + size / 2,
        align: RectangleAlignment.Center,
        width,
        height,
        color: rgb(1, 0, 0),
        opacity: 0.4,
        rotate: degrees(angle),
    });
    builder.moveDown(10);
    await builder.html(html);
    builder.y += size;
    builder.moveDown(3);
    res.write(await doc.save({ useObjectStreams: true }));
    res.end();
}).listen(port);
console.log(`🚀 Server ready on port ${port}.`);
//# sourceMappingURL=server.js.map