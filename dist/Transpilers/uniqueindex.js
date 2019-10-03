"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transpileUniqueIndex = async (obj) => {
    const schemaName = obj.spec.databaseName;
    const tableName = obj.spec.structName;
    const indexName = obj.spec.name;
    const storedProcedureName = `${schemaName}.create_index_${indexName}`;
    const columnString = obj.spec.keyAttributes
        .map((key) => `${key.name} ${(key.ascending ? "ASC" : "DESC")}`)
        .join(", ");
    return [
        `DROP PROCEDURE IF EXISTS ${storedProcedureName}`,
        `CREATE PROCEDURE ${storedProcedureName} ()\r\n`
            + "BEGIN\r\n"
            + "\tDECLARE EXIT HANDLER FOR 1061 DO 0;\r\n"
            + `\tALTER TABLE ${schemaName}.${tableName}\r\n`
            + `\tADD CONSTRAINT ${indexName} UNIQUE KEY (${columnString});\r\n`
            + "END",
        `CALL ${storedProcedureName}`,
        `DROP PROCEDURE IF EXISTS ${storedProcedureName}`,
    ];
};
exports.default = transpileUniqueIndex;
//# sourceMappingURL=uniqueindex.js.map