"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commentOut_1 = __importDefault(require("../commentOut"));
const transpilePreamble = async (obj) => [commentOut_1.default(obj.spec.uncommentedText)];
exports.default = transpilePreamble;
//# sourceMappingURL=preamble.js.map