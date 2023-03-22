import { cleanText, escapedNewlineChars, escapeRegExp, isNewlineChar } from 'pdf-lib';
const buildWordBreakRegex = (wordBreaks) => {
    const newlineCharUnion = escapedNewlineChars.join('|');
    const escapedRules = ['$'];
    for (let idx = 0, len = wordBreaks.length; idx < len; idx++) {
        const wordBreak = wordBreaks[idx];
        if (isNewlineChar(wordBreak)) {
            throw new TypeError(`\`wordBreak\` must not include ${newlineCharUnion}`);
        }
        escapedRules.push(wordBreak === '' ? '.' : escapeRegExp(wordBreak));
    }
    const breakRules = escapedRules.join('|');
    return new RegExp(`(${newlineCharUnion})|((.*?)(${breakRules}))`, 'gm');
};
export const breakTextIntoLines = (text, wordBreaks, maxWidth, computeWidthOfText) => {
    const regex = buildWordBreakRegex(wordBreaks);
    const words = cleanText(text).match(regex);
    let currLine = '';
    let currWidth = 0;
    const lines = [];
    const pushCurrLine = () => {
        if (currLine !== '')
            lines.push(currLine);
        currLine = '';
        currWidth = 0;
    };
    for (const word of words) {
        if (isNewlineChar(word)) {
            pushCurrLine();
        }
        else {
            const width = computeWidthOfText(word);
            if (currWidth + width > maxWidth(lines.length + 1))
                pushCurrLine();
            currLine += word;
            currWidth += width;
        }
    }
    pushCurrLine();
    return lines;
};
//# sourceMappingURL=lines.js.map