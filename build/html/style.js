import { fromRgbString, hexColor } from '../utils/color.js';
export function parseCssStyles(style) {
    const rules = style.split(';');
    const textStyle = {};
    for (const rule of rules) {
        const parsedRule = rule.match(/(.*):\s*(.*)/);
        if (!parsedRule) {
            continue;
        }
        const property = parsedRule[1];
        const value = parsedRule[2];
        switch (property) {
            case 'color':
                textStyle.color = value.match(/^#?[a-f0-9]+/) ? hexColor(value) : fromRgbString(value);
                break;
            default:
                break;
        }
    }
    return textStyle;
}
//# sourceMappingURL=style.js.map