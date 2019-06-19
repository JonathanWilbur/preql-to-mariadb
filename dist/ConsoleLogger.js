"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ConsoleLogger = /** @class */ (function () {
    function ConsoleLogger() {
    }
    ConsoleLogger.prototype.debug = function (event) {
        if (console)
            console.debug(event);
    };
    ConsoleLogger.prototype.info = function (event) {
        if (console)
            console.info(event);
    };
    ConsoleLogger.prototype.warn = function (event) {
        if (console)
            console.warn(event);
    };
    ConsoleLogger.prototype.error = function (event) {
        if (console)
            console.error(event);
    };
    return ConsoleLogger;
}());
exports.default = ConsoleLogger;
;
