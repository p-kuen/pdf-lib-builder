import {cleanText, escapedNewlineChars, escapeRegExp, isNewlineChar} from 'pdf-lib'

const buildWordBreakRegex = (wordBreaks: string[]) => {
  const newlineCharUnion = escapedNewlineChars.join('|')

  const escapedRules: string[] = ['$']
  for (let idx = 0, len = wordBreaks.length; idx < len; idx++) {
    const wordBreak = wordBreaks[idx]
    if (isNewlineChar(wordBreak)) {
      throw new TypeError(`\`wordBreak\` must not include ${newlineCharUnion}`)
    }
    escapedRules.push(wordBreak === '' ? '.' : escapeRegExp(wordBreak))
  }

  const breakRules = escapedRules.join('|')
  return new RegExp(`(${newlineCharUnion})|((.*?)(${breakRules}))`, 'gm')
}

export const breakTextIntoLines = (
  text: string,
  wordBreaks: string[],
  maxWidth: (line: number) => number,
  computeWidthOfText: (t: string) => number
): string[] => {
  const regex = buildWordBreakRegex(wordBreaks)

  const words = cleanText(text).match(regex)!

  let currLine = ''
  let currWidth = 0
  const lines: string[] = []

  const pushCurrLine = () => {
    if (currLine !== '') lines.push(currLine)
    currLine = ''
    currWidth = 0
  }

  for (let idx = 0, len = words.length; idx < len; idx++) {
    const word = words[idx]
    if (isNewlineChar(word)) {
      pushCurrLine()
    } else {
      const width = computeWidthOfText(word)
      if (currWidth + width > maxWidth(lines.length + 1)) pushCurrLine()
      currLine += word
      currWidth += width
    }
  }
  pushCurrLine()

  return lines
}
