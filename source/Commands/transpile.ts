import { APIObject, APIObjectDatabase, DatabaseSpec, Logger, StructSpec, SuggestedTargetIndexHandler } from 'preql-core';
import transpileAttribute from '../Transpilers/attribute';
import transpileDatabase from '../Transpilers/database';
import transpileEntry from '../Transpilers/entry';
import transpileForeignKeyConstraint from '../Transpilers/foreignkeyconstraint';
import transpilePlainIndex from '../Transpilers/plainindex';
import transpilePostamble from '../Transpilers/postamble';
import transpilePreamble from '../Transpilers/preamble';
import transpilePrimaryIndex from '../Transpilers/primaryindex';
import transpileSpatialIndex from '../Transpilers/spatialindex';
import transpileStruct from '../Transpilers/struct';
import transpileTextIndex from '../Transpilers/textindex';
import transpileUniqueIndex from '../Transpilers/uniqueindex';

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

const transpile: SuggestedTargetIndexHandler = async (etcd: APIObjectDatabase, logger: Logger): Promise<string> => {
    let transpilations: string[] = [];

    const preambles: APIObject[] | undefined = etcd.kindIndex.preamble;
    if (preambles && preambles.length > 0) {
        transpilations = transpilations.concat(await Promise.all(preambles.map(
            async (obj: APIObject): Promise<string> => {
                return transpilePreamble(obj, logger);
            }
        )));
    }

    const databases: APIObject[] | undefined = etcd.kindIndex.database;
    if (databases && databases.length > 0) {
        transpilations = transpilations.concat(await Promise.all(databases.map(
            async (obj: APIObject): Promise<string> => {
                return transpileDatabase(obj, logger);
            }
        )));
    }

    const structs: APIObject[] | undefined = etcd.kindIndex.struct;
    if (structs && structs.length > 0) {
        transpilations = transpilations.concat(await Promise.all(structs.map(
            async (obj: APIObject): Promise<string> => {
                return transpileStruct(obj, logger);
            }
        )));
    }

    const attributes: APIObject[] | undefined = etcd.kindIndex.attribute;
    if (attributes && attributes.length > 0) {
        transpilations = transpilations.concat(await Promise.all(attributes.map(
            async (obj: APIObject): Promise<string> => {
                return transpileAttribute(obj, logger, etcd);
            }
        )));
    }

    const primaryindexes: APIObject[] | undefined = etcd.kindIndex.primaryindex;
    if (primaryindexes && primaryindexes.length > 0) {
        transpilations = transpilations.concat(await Promise.all(primaryindexes.map(
            async (obj: APIObject): Promise<string> => {
                return transpilePrimaryIndex(obj, logger);
            }
        )));
    }

    const plainindexes: APIObject[] | undefined = etcd.kindIndex.plainindex;
    if (plainindexes && plainindexes.length > 0) {
        transpilations = transpilations.concat(await Promise.all(plainindexes.map(
            async (obj: APIObject): Promise<string> => {
                return transpilePlainIndex(obj, logger);
            }
        )));
    }

    const uniqueindexes: APIObject[] | undefined = etcd.kindIndex.uniqueindex;
    if (uniqueindexes && uniqueindexes.length > 0) {
        transpilations = transpilations.concat(await Promise.all(uniqueindexes.map(
            async (obj: APIObject): Promise<string> => {
                return transpileUniqueIndex(obj, logger);
            }
        )));
    }

    const textindexes: APIObject[] | undefined = etcd.kindIndex.textindex;
    if (textindexes && textindexes.length > 0) {
        transpilations = transpilations.concat(await Promise.all(textindexes.map(
            async (obj: APIObject): Promise<string> => {
                return transpileTextIndex(obj, logger);
            }
        )));
    }

    const spatialindexes: APIObject[] | undefined = etcd.kindIndex.spatialindex;
    if (spatialindexes && spatialindexes.length > 0) {
        transpilations = transpilations.concat(await Promise.all(spatialindexes.map(
            async (obj: APIObject): Promise<string> => {
                return transpileSpatialIndex(obj, logger);
            }
        )));
    }

    const foreignKeyConstraints: APIObject[] | undefined = etcd.kindIndex.foreignkeyconstraint;
    if (foreignKeyConstraints && foreignKeyConstraints.length > 0) {
        transpilations = transpilations.concat(await Promise.all(foreignKeyConstraints.map(
            async (obj: APIObject): Promise<string> => {
                return transpileForeignKeyConstraint(obj, logger);
            }
        )));
    }

    const entries: APIObject[] | undefined = etcd.kindIndex.entry;
    if (entries && entries.length > 0) {
        transpilations = transpilations.concat(await Promise.all(entries.map(
            async (obj: APIObject): Promise<string> => {
                return transpileEntry(obj, logger);
            }
        )));
    }

    transpilations = transpilations.concat(await Promise.all(structs.map(
        (struct: APIObject<StructSpec>) => (
            `ALTER TABLE ${struct.spec.databaseName}.${struct.spec.name} `
            + 'DROP COLUMN IF EXISTS __placeholder__;'
        )
    )));

    const postambles: APIObject[] | undefined = etcd.kindIndex.postamble;
    if (postambles && postambles.length !== 0) {
        transpilations = transpilations.concat(await Promise.all(postambles.map(
            async (obj: APIObject): Promise<string> => {
                return transpilePostamble(obj, logger);
            }
        )));
    }

    return 'START TRANSACTION;\r\n\r\n'
        + `${(etcd.kindIndex.database || []).map(dropAllPreqlCheckConstraintsForTableTemplate)}`
        + `${(etcd.kindIndex.struct || []).map((obj: APIObject<StructSpec>): string => (
                `CALL ${obj.spec.databaseName}.dropAllPreqlCheckConstraintsForTable('${obj.spec.name}');\r\n\r\n`
            )).join('')}`
        + `${transpilations.filter((t: string) => (t !== '')).join('\r\n\r\n')}\r\n\r\n`
        + 'COMMIT;\r\n';
};

export default transpile;
