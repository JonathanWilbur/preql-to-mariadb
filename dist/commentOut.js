"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function commentOut(uncommentedText) {
    return ("-- " + uncommentedText.replace(/--/gu, "\\-\\-").replace(/\r?\n/gu, "\r\n-- "));
}
exports.default = commentOut;
//# sourceMappingURL=commentOut.js.map