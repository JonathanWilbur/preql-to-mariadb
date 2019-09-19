"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const attribute_1 = __importDefault(require("../Transpilers/attribute"));
const database_1 = __importDefault(require("../Transpilers/database"));
const entry_1 = __importDefault(require("../Transpilers/entry"));
const foreignkey_1 = __importDefault(require("../Transpilers/foreignkey"));
const plainindex_1 = __importDefault(require("../Transpilers/plainindex"));
const postamble_1 = __importDefault(require("../Transpilers/postamble"));
const preamble_1 = __importDefault(require("../Transpilers/preamble"));
const spatialindex_1 = __importDefault(require("../Transpilers/spatialindex"));
const struct_1 = __importDefault(require("../Transpilers/struct"));
const textindex_1 = __importDefault(require("../Transpilers/textindex"));
const uniqueindex_1 = __importDefault(require("../Transpilers/uniqueindex"));
const server_1 = __importDefault(require("../Transpilers/server"));
// This will break once you upgrade to a higher version of MariaDB.
// See: https://dataedo.com/kb/query/mariadb/list-check-constraints-in-database
// https://stackoverflow.com/questions/12637945/how-can-i-delete-all-the-triggers-in-a-mysql-database-using-one-sql-statement
const dropAllPreqlCheckConstraintsForTableTemplate = (db) => {
    const schemaName = db.spec.name;
    const spName = `${schemaName}.dropAllPreqlCheckConstraintsForTable`;
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
const callDropAllPreqlCheckConstraintsForTableTemplate = (struct) => [
    `CALL ${struct.spec.databaseName}.dropAllPreqlCheckConstraintsForTable('${struct.spec.name}')`,
];
const transpile = async (etcd, logger) => {
    let transpilations = [];
    const preambles = etcd.kindIndex.preamble;
    if (preambles && preambles.length > 0) {
        await Promise.all(preambles.map(async (obj) => {
            const statements = await preamble_1.default(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const servers = etcd.kindIndex.server;
    if (servers && servers.length > 0) {
        await Promise.all(servers.map(async (obj) => {
            const statements = await server_1.default(obj, logger, etcd);
            transpilations = transpilations.concat(statements);
        }));
    }
    const databases = etcd.kindIndex.database;
    if (databases && databases.length > 0) {
        await Promise.all(databases.map(async (obj) => {
            const statements = await database_1.default(obj, logger, etcd);
            transpilations = transpilations.concat(statements);
        }));
        await Promise.all(servers.map(async (obj) => {
            const statements = dropAllPreqlCheckConstraintsForTableTemplate(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const structs = etcd.kindIndex.struct;
    if (structs && structs.length > 0) {
        await Promise.all(structs.map(async (obj) => {
            const statements = await struct_1.default(obj, logger, etcd);
            transpilations = transpilations.concat(statements);
        }));
        await Promise.all(structs.map(async (obj) => {
            const statements = callDropAllPreqlCheckConstraintsForTableTemplate(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const attributes = etcd.kindIndex.attribute;
    if (attributes && attributes.length > 0) {
        await Promise.all(attributes.map(async (obj) => {
            const statements = await attribute_1.default(obj, logger, etcd);
            transpilations = transpilations.concat(statements);
        }));
    }
    const plainindexes = etcd.kindIndex.plainindex;
    if (plainindexes && plainindexes.length > 0) {
        await Promise.all(plainindexes.map(async (obj) => {
            const statements = await plainindex_1.default(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const uniqueindexes = etcd.kindIndex.uniqueindex;
    if (uniqueindexes && uniqueindexes.length > 0) {
        await Promise.all(uniqueindexes.map(async (obj) => {
            const statements = await uniqueindex_1.default(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const textindexes = etcd.kindIndex.textindex;
    if (textindexes && textindexes.length > 0) {
        await Promise.all(textindexes.map(async (obj) => {
            const statements = await textindex_1.default(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const spatialindexes = etcd.kindIndex.spatialindex;
    if (spatialindexes && spatialindexes.length > 0) {
        await Promise.all(spatialindexes.map(async (obj) => {
            const statements = await spatialindex_1.default(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const foreignKeys = etcd.kindIndex.foreignkey;
    if (foreignKeys && foreignKeys.length > 0) {
        await Promise.all(foreignKeys.map(async (obj) => {
            const statements = await foreignkey_1.default(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const entries = etcd.kindIndex.entry;
    if (entries && entries.length > 0) {
        await Promise.all(entries.map(async (obj) => {
            const statements = await entry_1.default(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    const postambles = etcd.kindIndex.postamble;
    if (postambles && postambles.length !== 0) {
        await Promise.all(postambles.map(async (obj) => {
            const statements = await postamble_1.default(obj);
            transpilations = transpilations.concat(statements);
        }));
    }
    return transpilations.filter((t) => (t.trim() !== ""));
};
exports.default = transpile;
//# sourceMappingURL=transpile.js.map