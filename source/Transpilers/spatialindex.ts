import { APIObject, SpatialIndexSpec } from "preql-core";

const transpileSpatialIndex = async (obj: APIObject<SpatialIndexSpec>): Promise<string[]> => {
    const schemaName: string = obj.spec.databaseName;
    const tableName: string = obj.spec.structName;
    const indexName: string = obj.spec.name;
    const storedProcedureName: string = `${schemaName}.create_index_${indexName}`;
    const columnString: string = obj.spec.keyAttributes
        .map((key): string => `${key.name} ${(key.ascending ? "ASC" : "DESC")}`)
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

export default transpileSpatialIndex;
