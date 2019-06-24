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
var foreignkeyconstraint_1 = __importDefault(require("../Transpilers/foreignkeyconstraint"));
var plainindex_1 = __importDefault(require("../Transpilers/plainindex"));
var postamble_1 = __importDefault(require("../Transpilers/postamble"));
var preamble_1 = __importDefault(require("../Transpilers/preamble"));
var primaryindex_1 = __importDefault(require("../Transpilers/primaryindex"));
var spatialindex_1 = __importDefault(require("../Transpilers/spatialindex"));
var struct_1 = __importDefault(require("../Transpilers/struct"));
var textindex_1 = __importDefault(require("../Transpilers/textindex"));
var uniqueindex_1 = __importDefault(require("../Transpilers/uniqueindex"));
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
var transpile = function (etcd, logger) { return __awaiter(_this, void 0, void 0, function () {
    var transpilations, preambles, _a, _b, databases, _c, _d, structs, _e, _f, attributes, _g, _h, primaryindexes, _j, _k, plainindexes, _l, _m, uniqueindexes, _o, _p, textindexes, _q, _r, spatialindexes, _s, _t, foreignKeyConstraints, _u, _v, entries, _w, _x, _y, _z, postambles, _0, _1;
    var _this = this;
    return __generator(this, function (_2) {
        switch (_2.label) {
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
                transpilations = _b.apply(_a, [_2.sent()]);
                _2.label = 2;
            case 2:
                databases = etcd.kindIndex.database;
                if (!(databases && databases.length > 0)) return [3 /*break*/, 4];
                _d = (_c = transpilations).concat;
                return [4 /*yield*/, Promise.all(databases.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, database_1.default(obj, logger)];
                        });
                    }); }))];
            case 3:
                transpilations = _d.apply(_c, [_2.sent()]);
                _2.label = 4;
            case 4:
                structs = etcd.kindIndex.struct;
                if (!(structs && structs.length > 0)) return [3 /*break*/, 6];
                _f = (_e = transpilations).concat;
                return [4 /*yield*/, Promise.all(structs.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, struct_1.default(obj, logger)];
                        });
                    }); }))];
            case 5:
                transpilations = _f.apply(_e, [_2.sent()]);
                _2.label = 6;
            case 6:
                attributes = etcd.kindIndex.attribute;
                if (!(attributes && attributes.length > 0)) return [3 /*break*/, 8];
                _h = (_g = transpilations).concat;
                return [4 /*yield*/, Promise.all(attributes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, attribute_1.default(obj, logger, etcd)];
                        });
                    }); }))];
            case 7:
                transpilations = _h.apply(_g, [_2.sent()]);
                _2.label = 8;
            case 8:
                primaryindexes = etcd.kindIndex.primaryindex;
                if (!(primaryindexes && primaryindexes.length > 0)) return [3 /*break*/, 10];
                _k = (_j = transpilations).concat;
                return [4 /*yield*/, Promise.all(primaryindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, primaryindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 9:
                transpilations = _k.apply(_j, [_2.sent()]);
                _2.label = 10;
            case 10:
                plainindexes = etcd.kindIndex.plainindex;
                if (!(plainindexes && plainindexes.length > 0)) return [3 /*break*/, 12];
                _m = (_l = transpilations).concat;
                return [4 /*yield*/, Promise.all(plainindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, plainindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 11:
                transpilations = _m.apply(_l, [_2.sent()]);
                _2.label = 12;
            case 12:
                uniqueindexes = etcd.kindIndex.uniqueindex;
                if (!(uniqueindexes && uniqueindexes.length > 0)) return [3 /*break*/, 14];
                _p = (_o = transpilations).concat;
                return [4 /*yield*/, Promise.all(uniqueindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, uniqueindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 13:
                transpilations = _p.apply(_o, [_2.sent()]);
                _2.label = 14;
            case 14:
                textindexes = etcd.kindIndex.textindex;
                if (!(textindexes && textindexes.length > 0)) return [3 /*break*/, 16];
                _r = (_q = transpilations).concat;
                return [4 /*yield*/, Promise.all(textindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, textindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 15:
                transpilations = _r.apply(_q, [_2.sent()]);
                _2.label = 16;
            case 16:
                spatialindexes = etcd.kindIndex.spatialindex;
                if (!(spatialindexes && spatialindexes.length > 0)) return [3 /*break*/, 18];
                _t = (_s = transpilations).concat;
                return [4 /*yield*/, Promise.all(spatialindexes.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, spatialindex_1.default(obj, logger)];
                        });
                    }); }))];
            case 17:
                transpilations = _t.apply(_s, [_2.sent()]);
                _2.label = 18;
            case 18:
                foreignKeyConstraints = etcd.kindIndex.foreignkeyconstraint;
                if (!(foreignKeyConstraints && foreignKeyConstraints.length > 0)) return [3 /*break*/, 20];
                _v = (_u = transpilations).concat;
                return [4 /*yield*/, Promise.all(foreignKeyConstraints.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, foreignkeyconstraint_1.default(obj, logger)];
                        });
                    }); }))];
            case 19:
                transpilations = _v.apply(_u, [_2.sent()]);
                _2.label = 20;
            case 20:
                entries = etcd.kindIndex.entry;
                if (!(entries && entries.length > 0)) return [3 /*break*/, 22];
                _x = (_w = transpilations).concat;
                return [4 /*yield*/, Promise.all(entries.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, entry_1.default(obj, logger)];
                        });
                    }); }))];
            case 21:
                transpilations = _x.apply(_w, [_2.sent()]);
                _2.label = 22;
            case 22:
                _z = (_y = transpilations).concat;
                return [4 /*yield*/, Promise.all(structs.map(function (struct) { return ("ALTER TABLE " + struct.spec.databaseName + "." + struct.spec.name + " "
                        + 'DROP COLUMN IF EXISTS __placeholder__;'); }))];
            case 23:
                transpilations = _z.apply(_y, [_2.sent()]);
                postambles = etcd.kindIndex.postamble;
                if (!(postambles && postambles.length !== 0)) return [3 /*break*/, 25];
                _1 = (_0 = transpilations).concat;
                return [4 /*yield*/, Promise.all(postambles.map(function (obj) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, postamble_1.default(obj, logger)];
                        });
                    }); }))];
            case 24:
                transpilations = _1.apply(_0, [_2.sent()]);
                _2.label = 25;
            case 25: return [2 /*return*/, 'START TRANSACTION;\r\n\r\n'
                    + ("" + (etcd.kindIndex.database || []).map(dropAllPreqlCheckConstraintsForTableTemplate))
                    + ("" + (etcd.kindIndex.struct || []).map(function (obj) { return ("CALL " + obj.spec.databaseName + ".dropAllPreqlCheckConstraintsForTable('" + obj.spec.name + "');\r\n\r\n"); }).join(''))
                    + (transpilations.filter(function (t) { return (t !== ''); }).join('\r\n\r\n') + "\r\n\r\n")
                    + 'COMMIT;\r\n'];
        }
    });
}); };
exports.default = transpile;
