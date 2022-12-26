# pdf-lib-builder

This is an automatic page creation library for [pdf-lib](https://github.com/Hopding/pdf-lib). It is thought to be an alternative to [pdfkit](https://github.com/foliojs/pdfkit) for users that actually had to use both of the libraries (like me 😅).

## Example

Please look at the [example](https://github.com/Patcher56/pdf-lib-builder/tree/main/example) folder for a fully working example with a simple node server.

## Usage

To start you simply create an instance of the document builder class and wrap the doc inside:

```ts
// First create a PDFDocument like you would usually do.
const doc = await PDFDocument.create()

// Now create a PDFDocumentBuilder instance and wrap the doc inside.
const builder = new PDFDocumentBuilder(doc)
```

Next you can use some functions to build up your document.

**For easier layouting the library changes the origin on all functions from bottom left to top left.**

### Create a text

```ts
builder.text('Hello world.')
```

It automatically goes to the next line when writing a text. You can pass the default `pdf-lib`-options to the `text` function.

### Create an image

To create an image pass an already embedded image (either [embedJpg](https://pdf-lib.js.org/docs/api/classes/pdfdocument#embedjpg) or [embedPng](https://pdf-lib.js.org/docs/api/classes/pdfdocument#embedpng)). Additional to the [default options](https://pdf-lib.js.org/docs/api/#const-drawimage) you can pass a `fit` option, which automatically fits the image in the given box.

```ts
builder.image(image)
```

### Render HTML (preview)

This package supports experimental HTML rendering using the document builder methods. Basically it always renders the text contained in the html. Additionally it currently supports rendering

- Paragraphs
- Headers
- Images
- Lists (ordered and unordered)
- Strong Tags
- Colors in style attribute

If a tag is not supported yet, it is just ignored by the library.

To render html, simply run the following **async** method:

```ts
await builder.html(`<h1>This is a header</h1>`)
```

### Moving

```ts
builder.moveDown(1)
```

You can pass the amount of **lines** to move down. This is calculated by the current font size.
