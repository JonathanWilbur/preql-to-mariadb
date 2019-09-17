"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const preql_core_1 = require("preql-core");
const normalizeError_1 = __importDefault(require("../../normalizeError"));
const transpile_1 = __importDefault(require("../../Commands/transpile"));
const ConsoleLogger_1 = __importDefault(require("../../ConsoleLogger"));
const loggy = new ConsoleLogger_1.default();
const handler = async (event, context, callback) => {
    // REVIEW: Handle JSON and YAML strings, too?
    if (!(typeof event === "object"))
        callback(new Error("Event was not of an object type."));
    if (!event.objects)
        callback(new Error("Event was supposed to have an `objects` field."));
    try {
        await Promise.all(event.objects.map(preql_core_1.validateObject));
        const namespaces = await preql_core_1.indexObjects(event.objects);
        await Promise.all(Object.values(namespaces).map(preql_core_1.validateNamespace));
        const transpilation = await transpile_1.default(namespaces[event.namespace || "default"], loggy);
        callback(null, {
            value: transpilation,
        });
    }
    catch (e) {
        callback(normalizeError_1.default(e));
    }
};
exports.default = handler;
//# sourceMappingURL=transpile.js.map