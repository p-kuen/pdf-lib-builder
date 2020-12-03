import { createServer } from "http";
import { degrees, PDFDocument, radians, rgb, StandardFonts } from "pdf-lib";
import fetch from "node-fetch";
import PDFDocumentBuilder from "pdf-lib-builder";

const port = 4000;

createServer(async (req, res) => {
  const doc = await PDFDocument.create();
  const builder = new PDFDocumentBuilder(doc, { margins: { top: 32, right: 25, left: 70, bottom: 50 } });

  builder.text("This is a test document");
  builder.text("This should be rendered on next line.");
  builder.text("On this text \nwe \nfind \nnew \nlines");

  builder.moveDown(1);

  builder.text("There should be a space between last lines and this line.");

  builder.moveDown(4);

  builder.text("We skipped 4 lines now.");

  const boldFont = doc.embedStandardFont(StandardFonts.HelveticaBold);

  builder.text("This text should be bold", { font: boldFont });
  builder.text("This should be big", { size: 48 });

  // jpg=ArrayBuffer
  const url = "https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg";

  const arrayBuffer = await fetch(url).then((res) => res.arrayBuffer());
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

  builder.line({
    start: {
      x: builder.options.margins.left,
      y: builder.y + 100,
    },
    end: {
      x: builder.options.margins.left + 200,
      y: builder.y,
    },
    color: rgb(1, 1, 1),
  });

  const [font] = builder.getFont();
  const text = "I am on the line";
  builder.text(text, {
    x: builder.options.margins.left + 100 - font.widthOfTextAtSize(text, 8) / 2,
    y: builder.y + 50,
    color: rgb(1, 1, 1),
    size: 8,
    rotate: radians(Math.atan2(100, 200)),
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
    color: rgb(0.8, 0.8, 0.8),
  });

  res.write(await doc.save({ useObjectStreams: true }));
  res.end();
}).listen(port);

console.log(`🚀 Server ready on port ${port}.`);
