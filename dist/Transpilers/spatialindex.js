"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transpileSpatialIndex = async (obj) => {
    const schemaName = obj.spec.databaseName;
    const tableName = obj.spec.structName;
    const indexName = obj.spec.name;
    const storedProcedureName = `create_index_${indexName}`;
    const columnString = obj.spec.keyAttributes
        .map((key) => `${key.name} ${(key.ascending ? "ASC" : "DESC")}`)
        .join(", ");
    return [
        `DROP PROCEDURE IF EXISTS ${storedProcedureName}`,
        `CREATE PROCEDURE ${storedProcedureName} ()\r\n`
            + "BEGIN\r\n"
            + "\tDECLARE EXIT HANDLER FOR 1061 DO 0;\r\n"
            + `\tALTER TABLE ${schemaName}.${tableName}\r\n`
            + `\tADD SPATIAL INDEX (${columnString});\r\n`
            + "END",
        `CALL ${storedProcedureName}`,
        `DROP PROCEDURE IF EXISTS ${storedProcedureName}`,
    ];
};
exports.default = transpileSpatialIndex;
//# sourceMappingURL=spatialindex.js.map