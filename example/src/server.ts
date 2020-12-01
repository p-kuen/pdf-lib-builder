import { createServer } from "http";
import { PDFDocument, StandardFonts } from "pdf-lib";
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

  builder.image(image, { fit: { height: 100 } });

  builder.moveDown();

  builder.text("This should show on next page with automatic wrapping");

  builder.text("This should not break", { lineBreak: false });
  builder.text("This should be placed right next to the previous line and should break");
  builder.text("This should be placed on the next line");

  res.write(await doc.save({ useObjectStreams: true }));
  res.end();
}).listen(port);

console.log(`🚀 Server ready on port ${port}.`);
