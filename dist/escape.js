"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function escape(str) {
    return str
        .replace("'", "''")
        .replace("\\", "\\\\");
}
exports.default = escape;
