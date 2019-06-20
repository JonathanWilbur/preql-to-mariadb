"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var preql_core_1 = require("preql-core");
// This will break once you upgrade to a higher version of MariaDB.
// See: https://dataedo.com/kb/query/mariadb/list-check-constraints-in-database
// https://stackoverflow.com/questions/12637945/how-can-i-delete-all-the-triggers-in-a-mysql-database-using-one-sql-statement
var dropAllPreqlCheckConstraintsForTableTemplate = function (db) {
    var schemaName = db.spec.name;
    var spName = schemaName + ".dropAllPreqlCheckConstraintsForTable";
    return "DROP PROCEDURE IF EXISTS " + spName + ";\r\n"
        + 'DELIMITER $$\r\n'
        + ("CREATE PROCEDURE " + spName + " (IN param_table VARCHAR(255))\r\n")
        + 'BEGIN\r\n'
        + '\tDECLARE done BOOLEAN DEFAULT FALSE;\r\n'
        + '\tDECLARE dropCommand VARCHAR(255);\r\n'
        + '\tDECLARE dropCur CURSOR FOR\r\n'
        + ("\t\tSELECT concat('ALTER TABLE " + schemaName + ".', table_name, ' DROP CONSTRAINT ', constraint_name, ';')\r\n")
        + '\t\tFROM information_schema.table_constraints\r\n'
        + '\t\tWHERE\r\n'
        + "\t\t\tconstraint_type = 'CHECK'\r\n"
        + "\t\t\tAND constraint_name LIKE 'preql_'\r\n"
        + ("\t\t\tAND table_schema = '" + schemaName + "'\r\n")
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
var transpileDatabase = function (obj) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, "CREATE DATABASE IF NOT EXISTS " + obj.spec.name + ";"];
    });
}); };
var transpileStruct = function (obj) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, "CREATE TABLE IF NOT EXISTS " + obj.spec.databaseName + "." + obj.spec.name + " (__placeholder__ BOOLEAN);"];
    });
}); };
var transpileAttribute = function (obj, logger, etcd) { return __awaiter(_this, void 0, void 0, function () {
    var datatypes, columnString, type, matchingTypes, datatype;
    return __generator(this, function (_a) {
        datatypes = etcd.kindIndex.datatype || [];
        if (datatypes.length === 0) {
            throw new Error('No data types defined.');
        }
        columnString = "ALTER TABLE " + obj.spec.databaseName + "." + obj.spec.structName + "\r\n"
            + ("ADD COLUMN IF NOT EXISTS " + obj.spec.name + " ");
        type = obj.spec.type.toLowerCase();
        matchingTypes = datatypes
            .filter(function (datatype) { return datatype.metadata.name.toLowerCase() === type; });
        if (matchingTypes.length !== 1) {
            throw new Error("Data type '" + type + "' not recognized.");
        }
        datatype = matchingTypes[0];
        columnString += preql_core_1.transpileDataType('mariadb', datatype, obj);
        if (obj.spec.nullable)
            columnString += ' NULL';
        else
            columnString += ' NOT NULL';
        // Simply quoting the default value is fine, because MariaDB will cast it.
        if (obj.spec.default)
            columnString += " DEFAULT '" + obj.spec.default + "'";
        if (obj.metadata.annotations && obj.metadata.annotations.comment) {
            columnString += "\r\nCOMMENT '" + obj.metadata.annotations.comment + "'";
        }
        columnString += ';';
        if (datatype.spec.targets.mariadb) {
            if (datatype.spec.targets.mariadb.check) {
                columnString += '\r\n\r\n';
                columnString += datatype.spec.targets.mariadb.check
                    .map(function (expression, index) {
                    var qualifiedTableName = obj.spec.databaseName + "." + obj.spec.structName;
                    return "ALTER TABLE " + qualifiedTableName + "\r\n"
                        + ("DROP CONSTRAINT IF EXISTS preql_valid_" + datatype.metadata.name + "_" + index + ";\r\n")
                        + ("ALTER TABLE " + qualifiedTableName + "\r\n")
                        + ("ADD CONSTRAINT IF NOT EXISTS preql_valid_" + datatype.metadata.name + "_" + index + "\r\n")
                        + ("CHECK (" + preql_core_1.printf(expression, obj) + ");");
                })
                    .join('\r\n\r\n');
            }
            if (datatype.spec.targets.mariadb.setters) {
                columnString += '\r\n\r\n';
                columnString += datatype.spec.targets.mariadb.setters
                    .map(function (expression, index) {
                    var qualifiedTableName = obj.spec.databaseName + "." + obj.spec.structName;
                    var formattedExpression = preql_core_1.printf(expression, obj);
                    var triggerBaseName = obj.spec.databaseName + ".preql_" + datatype.metadata.name + "_" + index;
                    return ("DROP TRIGGER IF EXISTS " + triggerBaseName + "_insert;\r\n"
                        + ("CREATE TRIGGER IF NOT EXISTS " + triggerBaseName + "_insert\r\n")
                        + ("BEFORE INSERT ON " + qualifiedTableName + " FOR EACH ROW\r\n")
                        + ("SET NEW." + obj.spec.name + " = " + formattedExpression + ";\r\n")
                        + '\r\n'
                        + ("DROP TRIGGER IF EXISTS " + triggerBaseName + "_update;\r\n")
                        + ("CREATE TRIGGER IF NOT EXISTS " + triggerBaseName + "_update\r\n")
                        + ("BEFORE UPDATE ON " + qualifiedTableName + " FOR EACH ROW\r\n")
                        + ("SET NEW." + obj.spec.name + " = " + formattedExpression + ";"));
                })
                    .join('\r\n\r\n');
            }
        }
        return [2 /*return*/, columnString];
    });
}); };
// TODO: Transpile everything individually, then add DROP COLUMN __placeholder__ at the end.
var transpile = function (etcd, logger) { return __awaiter(_this, void 0, void 0, function () {
    var transpilations, databases, structs, _a, _b, attributes, _c, _d, _e, _f;
    var _this = this;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                transpilations = [];
                databases = etcd.kindIndex.database;
                if (!databases)
                    return [2 /*return*/, ''];
                return [4 /*yield*/, Promise.all(databases.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, transpileDatabase(obj, logger)];
                        });
                    }); }))];
            case 1:
                transpilations = _g.sent();
                structs = etcd.kindIndex.struct;
                if (!structs)
                    return [2 /*return*/, ''];
                _b = (_a = transpilations).concat;
                return [4 /*yield*/, Promise.all(structs.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, transpileStruct(obj, logger)];
                        });
                    }); }))];
            case 2:
                transpilations = _b.apply(_a, [_g.sent()]);
                attributes = etcd.kindIndex.attribute;
                if (!attributes)
                    return [2 /*return*/, ''];
                _d = (_c = transpilations).concat;
                return [4 /*yield*/, Promise.all(attributes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, transpileAttribute(obj, logger, etcd)];
                        });
                    }); }))];
            case 3:
                transpilations = _d.apply(_c, [_g.sent()]);
                _f = (_e = transpilations).concat;
                return [4 /*yield*/, Promise.all(structs.map(function (struct) { return ("ALTER TABLE " + struct.spec.databaseName + "." + struct.spec.name + " "
                        + 'DROP COLUMN IF EXISTS __placeholder__;'); }))];
            case 4:
                // const primaryIndexes: APIObject[] | undefined = etcd.kindIndex.primaryindex;
                // if (!primaryIndexes) return '';
                // transpilations = await Promise.all(primaryIndexes.map(
                //     async (obj: APIObject): Promise<string> => {
                //         return transpileAttribute(obj, logger, etcd);
                //     }
                // ));
                transpilations = _f.apply(_e, [_g.sent()]);
                return [2 /*return*/, 'START TRANSACTION;\r\n\r\n'
                        + ("" + (etcd.kindIndex.database || []).map(dropAllPreqlCheckConstraintsForTableTemplate))
                        + ("" + (etcd.kindIndex.struct || [])
                            .map(function (apiObject) { return ("CALL " + apiObject.spec.databaseName
                            + (".dropAllPreqlCheckConstraintsForTable('" + apiObject.spec.name + "');\r\n\r\n")
                            + ("DROP PROCEDURE " + apiObject.spec.databaseName + ".dropAllPreqlCheckConstraintsForTable;\r\n\r\n")); }).join(''))
                        + (transpilations.filter(function (t) { return (t !== ''); }).join('\r\n\r\n') + "\r\n\r\n")
                        + 'COMMIT;\r\n'];
        }
    });
}); };
exports.default = transpile;
