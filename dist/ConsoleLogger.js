"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConsoleLogger {
    debug(event) {
        if (console)
            console.debug(event);
    }
    info(event) {
        if (console)
            console.info(event);
    }
    warn(event) {
        if (console)
            console.warn(event);
    }
    error(event) {
        if (console)
            console.error(event);
    }
}
exports.default = ConsoleLogger;
//# sourceMappingURL=ConsoleLogger.js.map