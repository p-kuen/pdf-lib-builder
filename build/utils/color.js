import { rgb } from '@patcher56/pdf-lib';
export function hexColor(hex) {
    const result = /^#?([a-f\d]{2})?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? rgb(parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255, parseInt(result[4], 16) / 255)
        : rgb(0, 0, 0);
}
export function fromRgbString(str) {
    const result = str.match(/(?:rgb\()?(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)?/);
    return result ? rgb(Number(result[1]) / 255, Number(result[2]) / 255, Number(result[3]) / 255) : rgb(0, 0, 0);
}
//# sourceMappingURL=color.js.map