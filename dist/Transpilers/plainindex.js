"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transpilePlainIndex = async (obj) => {
    const columnString = obj.spec.keyAttributes
        .map((key) => `${key.name} ${(key.ascending ? "ASC" : "DESC")}`)
        .join(", ");
    return [
        `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.structName}\r\n`
            + `ADD INDEX IF NOT EXISTS ${obj.spec.name}\r\n`
            + `PRIMARY KEY (${columnString});`,
    ];
};
exports.default = transpilePlainIndex;
//# sourceMappingURL=plainindex.js.map