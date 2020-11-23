import { createServer } from "http";
import { PDFDocument, StandardFonts } from "pdf-lib";
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

  builder.moveDown(5);

  builder.text("We skipped 5 lines now.");

  const boldFont = doc.embedStandardFont(StandardFonts.HelveticaBold);

  builder.text("This text should be bold", { font: boldFont });
  builder.text("This should be big", { size: 48 });
  builder.moveDown(6);
  builder.text("This should show on next page with automatic wrapping");

  res.write(await doc.save());
  res.end();
}).listen(port);

console.log(`🚀 Server ready on port ${port}.`);
