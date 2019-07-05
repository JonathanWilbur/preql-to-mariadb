// import { APIObject, PrimaryIndexSpec, SuggestedTargetObjectHandler } from 'preql-core';

// const transpilePrimaryIndex: SuggestedTargetObjectHandler = async (obj: APIObject<PrimaryIndexSpec>): Promise<string> => {
//     const schemaName: string = obj.spec.databaseName;
//     const tableName: string = obj.spec.structName;
//     const indexName: string = obj.spec.name;
//     const storedProcedureName: string = `create_index_${indexName}`;
//     const columnString: string = obj.spec.keyColumns
//         .map((key): string => `${key.name} ${(key.ascending ? 'ASC' : 'DESC')}`)
//         .join(', ');
//     return (
//         `DROP PROCEDURE IF EXISTS ${schemaName}.${storedProcedureName};\r\n`
//         + 'DELIMITER $$\r\n'
//         + `CREATE PROCEDURE IF NOT EXISTS ${schemaName}.${storedProcedureName} ()\r\n`
//         + 'BEGIN\r\n'
//         + '\tDECLARE EXIT HANDLER FOR 1068 DO 0;\r\n'
//         + `\tALTER TABLE ${schemaName}.${tableName}\r\n`
//         + `\tADD CONSTRAINT ${indexName} PRIMARY KEY (${columnString});\r\n`
//         + 'END $$\r\n'
//         + 'DELIMITER ;\r\n'
//         + `CALL ${schemaName}.${storedProcedureName};\r\n`
//         + `DROP PROCEDURE IF EXISTS ${schemaName}.${storedProcedureName};`
//     );
// };

// export default transpilePrimaryIndex;
