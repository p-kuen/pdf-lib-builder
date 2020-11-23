import { createServer } from "http";
import { PDFDocument, StandardFonts } from "pdf-lib";
import fetch from "node-fetch";
import PDFDocumentBuilder from "pdf-lib-builder";

const port = 4000;

createServer(async (req, res) => {
  const doc = await PDFDocument.create();
  const builder = new PDFDocumentBuilder(doc);

  builder.text("This is a test document");
  builder.text("This should be rendered on next line.");
  builder.text("On this text \nwe \nfind \nnew \nlines");

  builder.moveDown(1);

  builder.text("There should be a space between last lines and this line.");

  builder.moveDown(4);

  builder.text("We skipped 5 lines now.");

  const boldFont = doc.embedStandardFont(StandardFonts.HelveticaBold);

  builder.text("This text should be bold", { font: boldFont });
  builder.text("This should be big", { size: 48 });

  // jpg=ArrayBuffer
  const url = "https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg";

  const arrayBuffer = await fetch(url).then((res) => res.arrayBuffer());
  const image = await doc.embedJpg(arrayBuffer);

  builder.moveDown();

  builder.image(image, { fit: { height: 100 } });

  builder.moveDown();

  builder.text("This should show on next page with automatic wrapping");

  res.write(await doc.save());
  res.end();
}).listen(port);

console.log(`🚀 Server ready on port ${port}.`);
