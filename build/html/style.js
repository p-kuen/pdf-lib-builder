import { fromRgbString, hexColor } from '../utils/color.js';
import { isTag } from 'domhandler';
export var ListStyleType;
(function (ListStyleType) {
    ListStyleType[ListStyleType["None"] = 0] = "None";
    ListStyleType[ListStyleType["Disc"] = 1] = "Disc";
    ListStyleType[ListStyleType["Decimal"] = 2] = "Decimal";
})(ListStyleType || (ListStyleType = {}));
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
export function getNodeStyle(node) {
    if (!isTag(node)) {
        return;
    }
    if (node.name === 'ol') {
        return { listStyleType: ListStyleType.Decimal };
    }
    else if (node.name === 'ul') {
        return { listStyleType: ListStyleType.Disc };
    }
}
//# sourceMappingURL=style.js.map