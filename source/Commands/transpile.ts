import { APIObject, SuggestedTargetIndexHandler, SuggestedTargetObjectHandler, APIObjectDatabase, Logger, DatabaseSpec, StructSpec } from 'preql-core';

// This will break once you upgrade to a higher version of MariaDB.
// See: https://dataedo.com/kb/query/mariadb/list-check-constraints-in-database
// https://stackoverflow.com/questions/12637945/how-can-i-delete-all-the-triggers-in-a-mysql-database-using-one-sql-statement
const dropAllPreqlCheckConstraintsForTableTemplate = (db: APIObject<DatabaseSpec>): string => {
  const schemaName: string = db.spec.name;
  const spName: string = `${schemaName}.dropAllPreqlCheckConstraintsForTable`
  return `DROP PROCEDURE IF EXISTS ${spName};\r\n`
  + 'DELIMITER $$\r\n'
  + `CREATE PROCEDURE ${spName} (IN param_table VARCHAR(255))\r\n`
  + 'BEGIN\r\n'
  + '\tDECLARE done BOOLEAN DEFAULT FALSE;\r\n'
  + '\tDECLARE dropCommand VARCHAR(255);\r\n'
  + '\tDECLARE dropCur CURSOR FOR\r\n'
  + `\t\tSELECT concat('ALTER TABLE ${schemaName}.', table_name, ' DROP CONSTRAINT ', constraint_name, ';')\r\n`
  + '\t\tFROM information_schema.table_constraints\r\n'
  + '\t\tWHERE\r\n'
  + "\t\t\tconstraint_type = 'CHECK'\r\n"
  + "\t\t\tAND constraint_name LIKE 'preql_'\r\n"
  + `\t\t\tAND table_schema = '${schemaName}'\r\n`
  + '\t\t\tAND table_name = param_table;\r\n'
  + '\tDECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;\r\n'
  + '\tOPEN dropCur;\r\n'
  + '\tread_loop: LOOP\r\n'
  + '\t\tFETCH dropCur\r\n'
  + '\t\tINTO dropCommand;\r\n'
  + '\t\tIF done THEN\r\n'
  + '\t\t\tLEAVE read_loop;\r\n'
  + '\t\tEND IF;\r\n'
  + '\t\tSET @sdropCommand = dropCommand;\r\n'
  + '\t\tPREPARE dropClientUpdateKeyStmt FROM @sdropCommand;\r\n'
  + '\t\tEXECUTE dropClientUpdateKeyStmt;\r\n'
  + '\t\tDEALLOCATE PREPARE dropClientUpdateKeyStmt;\r\n'
  + '\tEND LOOP;\r\n'
  + '\tCLOSE dropCur;\r\n'
  + 'END $$\r\n'
  + 'DELIMITER ;\r\n\r\n';
};

const transpileDatabase: SuggestedTargetObjectHandler = async (obj: APIObject<DatabaseSpec>, logger: Logger): Promise<string> => {
    return `CREATE DATABASE IF NOT EXISTS ${obj.spec.name};`
};

const transpile: SuggestedTargetIndexHandler = async (etcd: APIObjectDatabase, logger: Logger): Promise<string> => {
    const transactionTranspilations: string[] = await Promise.all([
        'database',
        // 'entity',
        'struct',
        // 'attribute',
        // 'index',
        'primaryindex',
        'foreignkeyconstraint',
        // 'link',
    ].map(async (kindName: string): Promise<string> => { // Transpile that kind.
        const objectsOfMatchingKind: APIObject[] | undefined = etcd.kindIndex[kindName];
        if (!objectsOfMatchingKind) return '';
        let objectTranspiler: SuggestedTargetObjectHandler;
        switch (kindName) {
            case 'database': objectTranspiler = transpileDatabase; break;
            default: return ''; // REVIEW
        }
        const transpilations: string[] = await Promise.all(
            objectsOfMatchingKind.map(
                async (obj: APIObject): Promise<string> => {
                    return objectTranspiler(obj, logger);
                }
            )
        );
        return transpilations
            .filter((transpilation: string): boolean => transpilation !== '')
            .join('\r\n\r\n');
    }));
    return 'START TRANSACTION;\r\n\r\n'
        + `${(etcd.kindIndex.database || []).map(dropAllPreqlCheckConstraintsForTableTemplate)}`
        + `${(etcd.kindIndex.struct || [])
            .map((apiObject: APIObject<StructSpec>): string => (
            `CALL ${apiObject.spec.databaseName}`
            + `.dropAllPreqlCheckConstraintsForTable('${apiObject.spec.name}');\r\n\r\n`
            )).join('')}`
        + `${transactionTranspilations.filter((tt: string) => (tt !== '')).join('\r\n\r\n')}\r\n\r\n`
        + 'COMMIT;\r\n';
};

export default transpile;
