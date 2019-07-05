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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var attribute_1 = __importDefault(require("../Transpilers/attribute"));
var database_1 = __importDefault(require("../Transpilers/database"));
var entry_1 = __importDefault(require("../Transpilers/entry"));
var foreignkey_1 = __importDefault(require("../Transpilers/foreignkey"));
var plainindex_1 = __importDefault(require("../Transpilers/plainindex"));
var postamble_1 = __importDefault(require("../Transpilers/postamble"));
var preamble_1 = __importDefault(require("../Transpilers/preamble"));
var spatialindex_1 = __importDefault(require("../Transpilers/spatialindex"));
var struct_1 = __importDefault(require("../Transpilers/struct"));
var textindex_1 = __importDefault(require("../Transpilers/textindex"));
var uniqueindex_1 = __importDefault(require("../Transpilers/uniqueindex"));
var server_1 = __importDefault(require("../Transpilers/server"));
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
        + 'DELIMITER ;';
};
var callDropAllPreqlCheckConstraintsForTableTemplate = function (struct) {
    return "CALL " + struct.spec.databaseName + ".dropAllPreqlCheckConstraintsForTable('" + struct.spec.name + "');";
};
var transpile = function (etcd, logger) { return __awaiter(_this, void 0, void 0, function () {
    var transpilations, preambles, _a, _b, servers, _c, _d, databases, _e, _f, _g, _h, structs, _j, _k, _l, _m, attributes, _o, _p, plainindexes, _q, _r, uniqueindexes, _s, _t, textindexes, _u, _v, spatialindexes, _w, _x, foreignKeys, _y, _z, entries, _0, _1, postambles, _2, _3;
    var _this = this;
    return __generator(this, function (_4) {
        switch (_4.label) {
            case 0:
                transpilations = [];
                preambles = etcd.kindIndex.preamble;
                if (!(preambles && preambles.length > 0)) return [3 /*break*/, 2];
                _b = (_a = transpilations).concat;
                return [4 /*yield*/, Promise.all(preambles.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, preamble_1.default(obj, logger)];
                        });
                    }); }))];
            case 1:
                transpilations = _b.apply(_a, [_4.sent()]);
                _4.label = 2;
            case 2:
                servers = etcd.kindIndex.server;
                if (!(servers && servers.length > 0)) return [3 /*break*/, 4];
                _d = (_c = transpilations).concat;
                return [4 /*yield*/, Promise.all(servers.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, server_1.default(obj, logger, etcd)];
                        });
                    }); }))];
            case 3:
                transpilations = _d.apply(_c, [_4.sent()]);
                _4.label = 4;
            case 4:
                databases = etcd.kindIndex.database;
                if (!(databases && databases.length > 0)) return [3 /*break*/, 7];
                _f = (_e = transpilations).concat;
                return [4 /*yield*/, Promise.all(databases.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, database_1.default(obj, logger, etcd)];
                        });
                    }); }))];
            case 5:
                transpilations = _f.apply(_e, [_4.sent()]);
                _h = (_g = transpilations).concat;
                return [4 /*yield*/, Promise.all(databases.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, dropAllPreqlCheckConstraintsForTableTemplate(obj)];
                        });
                    }); }))];
            case 6:
                transpilations = _h.apply(_g, [_4.sent()]);
                _4.label = 7;
            case 7:
                structs = etcd.kindIndex.struct;
                if (!(structs && structs.length > 0)) return [3 /*break*/, 10];
                _k = (_j = transpilations).concat;
                return [4 /*yield*/, Promise.all(structs.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, struct_1.default(obj, logger, etcd)];
                        });
                    }); }))];
            case 8:
                transpilations = _k.apply(_j, [_4.sent()]);
                _m = (_l = transpilations).concat;
                return [4 /*yield*/, Promise.all(structs.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, callDropAllPreqlCheckConstraintsForTableTemplate(obj)];
                        });
                    }); }))];
            case 9:
                transpilations = _m.apply(_l, [_4.sent()]);
                _4.label = 10;
            case 10:
                attributes = etcd.kindIndex.attribute;
                if (!(attributes && attributes.length > 0)) return [3 /*break*/, 12];
                _p = (_o = transpilations).concat;
                return [4 /*yield*/, Promise.all(attributes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, attribute_1.default(obj, logger, etcd)];
                        });
                    }); }))];
            case 11:
                transpilations = _p.apply(_o, [_4.sent()]);
                _4.label = 12;
            case 12:
                plainindexes = etcd.kindIndex.plainindex;
                if (!(plainindexes && plainindexes.length > 0)) return [3 /*break*/, 14];
                _r = (_q = transpilations).concat;
                return [4 /*yield*/, Promise.all(plainindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, plainindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 13:
                transpilations = _r.apply(_q, [_4.sent()]);
                _4.label = 14;
            case 14:
                uniqueindexes = etcd.kindIndex.uniqueindex;
                if (!(uniqueindexes && uniqueindexes.length > 0)) return [3 /*break*/, 16];
                _t = (_s = transpilations).concat;
                return [4 /*yield*/, Promise.all(uniqueindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, uniqueindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 15:
                transpilations = _t.apply(_s, [_4.sent()]);
                _4.label = 16;
            case 16:
                textindexes = etcd.kindIndex.textindex;
                if (!(textindexes && textindexes.length > 0)) return [3 /*break*/, 18];
                _v = (_u = transpilations).concat;
                return [4 /*yield*/, Promise.all(textindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, textindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 17:
                transpilations = _v.apply(_u, [_4.sent()]);
                _4.label = 18;
            case 18:
                spatialindexes = etcd.kindIndex.spatialindex;
                if (!(spatialindexes && spatialindexes.length > 0)) return [3 /*break*/, 20];
                _x = (_w = transpilations).concat;
                return [4 /*yield*/, Promise.all(spatialindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, spatialindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 19:
                transpilations = _x.apply(_w, [_4.sent()]);
                _4.label = 20;
            case 20:
                foreignKeys = etcd.kindIndex.foreignkey;
                if (!(foreignKeys && foreignKeys.length > 0)) return [3 /*break*/, 22];
                _z = (_y = transpilations).concat;
                return [4 /*yield*/, Promise.all(foreignKeys.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, foreignkey_1.default(obj, logger)];
                        });
                    }); }))];
            case 21:
                transpilations = _z.apply(_y, [_4.sent()]);
                _4.label = 22;
            case 22:
                entries = etcd.kindIndex.entry;
                if (!(entries && entries.length > 0)) return [3 /*break*/, 24];
                _1 = (_0 = transpilations).concat;
                return [4 /*yield*/, Promise.all(entries.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, entry_1.default(obj, logger)];
                        });
                    }); }))];
            case 23:
                transpilations = _1.apply(_0, [_4.sent()]);
                _4.label = 24;
            case 24:
                postambles = etcd.kindIndex.postamble;
                if (!(postambles && postambles.length !== 0)) return [3 /*break*/, 26];
                _3 = (_2 = transpilations).concat;
                return [4 /*yield*/, Promise.all(postambles.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, postamble_1.default(obj, logger)];
                        });
                    }); }))];
            case 25:
                transpilations = _3.apply(_2, [_4.sent()]);
                _4.label = 26;
            case 26: return [2 /*return*/, 'START TRANSACTION;\r\n\r\n'
                    + (transpilations.filter(function (t) { return (t !== ''); }).join('\r\n\r\n') + "\r\n\r\n")
                    + 'COMMIT;\r\n'];
        }
    });
}); };
exports.default = transpile;
