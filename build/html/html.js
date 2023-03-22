import { isTag, isText } from 'domhandler';
import { decodeFromBase64DataUri } from 'pdf-lib';
import { ListStyleType } from './style.js';
export async function renderNode(doc, node, options) {
    if (isText(node)) {
        // strip new lines and whitespace if text is not inside a pre tag and if parent tag is not root
        const strippedText = node.parent && !(isTag(node.parent) && node.parent.name === 'pre')
            ? node.data.replace(/\n/g, '').trim()
            : node.data;
        if (strippedText === '') {
            return;
        }
        console.log('write html text with length', strippedText.length, strippedText);
        return doc.text(strippedText, options?.textStyle);
    }
    if (isTag(node) && node.name === 'img' && node.attribs.src?.match(/^data:.*;base64/)) {
        return doc.image(decodeFromBase64DataUri(node.attribs.src));
    }
    if (isTag(node) && node.name === 'li') {
        return renderListNode(doc, node, options);
    }
    // move down on empty p tags
    if (isTag(node) && node.name === 'p' && node.children.length === 1) {
        const firstChildren = node.children[0];
        if (isText(firstChildren) && firstChildren.data === '\n') {
            console.log('print empty p tag');
            doc.moveDown();
        }
    }
}
function renderListNode(doc, node, options) {
    if (options?.style?.listStyleType === ListStyleType.None) {
        return;
    }
    if (options?.style?.listStyleType === ListStyleType.Decimal) {
        // find ol element
        const olElement = findParentElementWithTag(node, 'ol');
        if (olElement) {
            olElement.attribs.count ??= '0';
            olElement.attribs.count = (Number(olElement.attribs.count) + 1).toString();
        }
        const count = Number(olElement?.attribs.count ?? 0);
        doc.text(`${count}. `, { lineBreak: false });
    }
    else if (options?.style?.listStyleType === ListStyleType.Disc) {
        doc.text('- ', { lineBreak: false });
    }
}
function findParentElementWithTag(node, tag) {
    if (node.parent) {
        if (isTag(node.parent) && node.parent.name === tag) {
            return node.parent;
        }
        else {
            return findParentElementWithTag(node.parent, tag);
        }
    }
    return null;
}
//# sourceMappingURL=html.js.map