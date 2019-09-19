import { APIObject, APIObjectDatabase, DatabaseSpec, Logger, StructSpec } from "preql-core";
import transpileAttribute from "../Transpilers/attribute";
import transpileDatabase from "../Transpilers/database";
import transpileEntry from "../Transpilers/entry";
import transpileForeignKey from "../Transpilers/foreignkey";
import transpilePlainIndex from "../Transpilers/plainindex";
import transpilePostamble from "../Transpilers/postamble";
import transpilePreamble from "../Transpilers/preamble";
import transpileSpatialIndex from "../Transpilers/spatialindex";
import transpileStruct from "../Transpilers/struct";
import transpileTextIndex from "../Transpilers/textindex";
import transpileUniqueIndex from "../Transpilers/uniqueindex";
import transpileServer from "../Transpilers/server";

// This will break once you upgrade to a higher version of MariaDB.
// See: https://dataedo.com/kb/query/mariadb/list-check-constraints-in-database
// https://stackoverflow.com/questions/12637945/how-can-i-delete-all-the-triggers-in-a-mysql-database-using-one-sql-statement
const dropAllPreqlCheckConstraintsForTableTemplate = (db: APIObject<DatabaseSpec>): string[] => {
    const schemaName: string = db.spec.name;
    const spName: string = `${schemaName}.dropAllPreqlCheckConstraintsForTable`
    return [
        `DROP PROCEDURE IF EXISTS ${spName}`,
        `CREATE PROCEDURE ${spName} (IN param_table VARCHAR(255))\r\n`
        + "BEGIN\r\n"
        + "\tDECLARE done BOOLEAN DEFAULT FALSE;\r\n"
        + "\tDECLARE dropCommand VARCHAR(255);\r\n"
        + "\tDECLARE dropCur CURSOR FOR\r\n"
        + `\t\tSELECT concat('ALTER TABLE ${schemaName}.', table_name, ' DROP CONSTRAINT ', constraint_name, ';')\r\n`
        + "\t\tFROM information_schema.table_constraints\r\n"
        + "\t\tWHERE\r\n"
        + "\t\t\tconstraint_type = 'CHECK'\r\n"
        + "\t\t\tAND constraint_name LIKE 'preql_'\r\n"
        + `\t\t\tAND table_schema = '${schemaName}'\r\n`
        + "\t\t\tAND table_name = param_table;\r\n"
        + "\tDECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;\r\n"
        + "\tOPEN dropCur;\r\n"
        + "\tread_loop: LOOP\r\n"
        + "\t\tFETCH dropCur\r\n"
        + "\t\tINTO dropCommand;\r\n"
        + "\t\tIF done THEN\r\n"
        + "\t\t\tLEAVE read_loop;\r\n"
        + "\t\tEND IF;\r\n"
        + "\t\tSET @sdropCommand = dropCommand;\r\n"
        + "\t\tPREPARE dropClientUpdateKeyStmt FROM @sdropCommand;\r\n"
        + "\t\tEXECUTE dropClientUpdateKeyStmt;\r\n"
        + "\t\tDEALLOCATE PREPARE dropClientUpdateKeyStmt;\r\n"
        + "\tEND LOOP;\r\n"
        + "\tCLOSE dropCur;\r\n"
        + "END",
    ];
};

const callDropAllPreqlCheckConstraintsForTableTemplate = (struct: APIObject<StructSpec>): string[] => [
    `CALL ${struct.spec.databaseName}.dropAllPreqlCheckConstraintsForTable('${struct.spec.name}')`,
];

const transpile = async (etcd: APIObjectDatabase, logger: Logger): Promise<string[]> => {
    let transpilations: string[] = [];

    const preambles: APIObject[] | undefined = etcd.kindIndex.preamble;
    if (preambles && preambles.length > 0) {
        await Promise.all(preambles.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpilePreamble(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const servers: APIObject[] | undefined = etcd.kindIndex.server;
    if (servers && servers.length > 0) {
        await Promise.all(servers.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileServer(obj, logger, etcd);
            transpilations = transpilations.concat(statements);
        }));
    }

    const databases: APIObject[] | undefined = etcd.kindIndex.database;
    if (databases && databases.length > 0) {
        await Promise.all(databases.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileDatabase(obj, logger, etcd);
            transpilations = transpilations.concat(statements);
        }));
        await Promise.all(servers.map(async (obj: APIObject): Promise<void> => {
            const statements = dropAllPreqlCheckConstraintsForTableTemplate(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const structs: APIObject[] | undefined = etcd.kindIndex.struct;
    if (structs && structs.length > 0) {
        await Promise.all(structs.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileStruct(obj, logger, etcd);
            transpilations = transpilations.concat(statements);
        }));
        await Promise.all(structs.map(async (obj: APIObject): Promise<void> => {
            const statements = callDropAllPreqlCheckConstraintsForTableTemplate(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const attributes: APIObject[] | undefined = etcd.kindIndex.attribute;
    if (attributes && attributes.length > 0) {
        await Promise.all(attributes.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileAttribute(obj, logger, etcd);
            transpilations = transpilations.concat(statements);
        }));
    }

    const plainindexes: APIObject[] | undefined = etcd.kindIndex.plainindex;
    if (plainindexes && plainindexes.length > 0) {
        await Promise.all(plainindexes.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpilePlainIndex(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const uniqueindexes: APIObject[] | undefined = etcd.kindIndex.uniqueindex;
    if (uniqueindexes && uniqueindexes.length > 0) {
        await Promise.all(uniqueindexes.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileUniqueIndex(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const textindexes: APIObject[] | undefined = etcd.kindIndex.textindex;
    if (textindexes && textindexes.length > 0) {
        await Promise.all(textindexes.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileTextIndex(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const spatialindexes: APIObject[] | undefined = etcd.kindIndex.spatialindex;
    if (spatialindexes && spatialindexes.length > 0) {
        await Promise.all(spatialindexes.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileSpatialIndex(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const foreignKeys: APIObject[] | undefined = etcd.kindIndex.foreignkey;
    if (foreignKeys && foreignKeys.length > 0) {
        await Promise.all(foreignKeys.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileForeignKey(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const entries: APIObject[] | undefined = etcd.kindIndex.entry;
    if (entries && entries.length > 0) {
        await Promise.all(entries.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpileEntry(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    const postambles: APIObject[] | undefined = etcd.kindIndex.postamble;
    if (postambles && postambles.length !== 0) {
        await Promise.all(postambles.map(async (obj: APIObject): Promise<void> => {
            const statements = await transpilePostamble(obj);
            transpilations = transpilations.concat(statements);
        }));
    }

    return transpilations.filter((t: string) => (t.trim() !== ""));
};

export default transpile;
