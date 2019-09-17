"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transpileEntry = async (obj) => (`INSERT INTO ${obj.spec.databaseName}.${obj.spec.structName}\r\n`
    + "SET\r\n\t"
    + `id = ${obj.spec.id},\r\n\t`
    + Object.entries(obj.spec.values)
        .map((kv) => {
        const key = kv[0];
        const value = kv[1];
        switch (typeof key) {
            case "boolean": return `${key} = ${value ? "TRUE" : "FALSE"}`;
            case "number": return `${key} = ${value}`;
            case "string": return `${key} = '${value}'`;
            default: throw new Error(`Invalid data type for entry field '${key}'.`);
        }
    })
        .join(",\r\n\t")
    + "\r\nON DUPLICATE KEY UPDATE\r\n\t"
    + Object.entries(obj.spec.values)
        .map((kv) => {
        const key = kv[0];
        const value = kv[1];
        switch (typeof key) {
            case "boolean": return `${key} = ${value ? "TRUE" : "FALSE"}`;
            case "number": return `${key} = ${value}`;
            case "string": return `${key} = '${value}'`;
            default: throw new Error(`Invalid data type for entry field '${key}'.`);
        }
    })
        .join(",\r\n\t")
    + ";\r\n");
exports.default = transpileEntry;
//# sourceMappingURL=entry.js.map