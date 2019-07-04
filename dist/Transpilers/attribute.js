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
var transpileAttribute = function (obj, logger, etcd) { return __awaiter(_this, void 0, void 0, function () {
    var datatypes, columnString, type, matchingTypes, datatype, characterSet, mariaDBEquivalent, collation, mariaDBEquivalent, checkRegexps_1, constraintBaseName, qualifiedTableName, qualifiedTableName, previousExpression_1, triggerBaseName;
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
        if (obj.spec.characterSet) {
            characterSet = etcd.kindIndex.characterset
                .find(function (cs) { return obj.spec.characterSet === cs.spec.name; });
            if (characterSet) {
                mariaDBEquivalent = characterSet.spec.targetEquivalents.mariadb
                    || characterSet.spec.targetEquivalents.mysql;
                if (mariaDBEquivalent) {
                    columnString += " CHARACTER SET '" + mariaDBEquivalent + "'";
                }
                else {
                    logger.warn('No MariaDB or MySQL equivalent character set for PreQL '
                        + ("character set '" + characterSet.metadata.name + "'."));
                }
            }
            else {
                logger.error("Expected CharacterSet '" + obj.spec.characterSet + "' did not exist! "
                    + 'This is a bug in the PreQL Core library.');
            }
        }
        if (obj.spec.collation) {
            collation = etcd.kindIndex.collation
                .find(function (c) { return obj.spec.collation === c.spec.name; });
            if (collation) {
                mariaDBEquivalent = collation.spec.targetEquivalents.mariadb
                    || collation.spec.targetEquivalents.mysql;
                if (mariaDBEquivalent) {
                    columnString += " COLLATE '" + mariaDBEquivalent + "'";
                }
                else {
                    logger.warn('No MariaDB or MySQL equivalent collation for PreQL '
                        + ("collation '" + collation.metadata.name + "'."));
                }
            }
            else {
                logger.error("Expected Collation '" + obj.spec.characterSet + "' did not exist! "
                    + 'This is a bug in the PreQL Core library.');
            }
        }
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
            if (datatype.spec.regexes && datatype.spec.regexes.pcre) {
                checkRegexps_1 = [];
                constraintBaseName = obj.spec.databaseName + "." + obj.spec.structName + ".preql_" + obj.spec.name;
                // Every regex within a group must match.
                Object.entries(datatype.spec.regexes.pcre).forEach(function (group) {
                    var groupRegexps = [];
                    if (!(datatype.spec.regexes))
                        return; // Just to make TypeScript happy.
                    Object.entries(datatype.spec.regexes.pcre[group[0]]).forEach(function (re) {
                        groupRegexps.push(obj.spec.name + " " + (re[1].positive ? '' : 'NOT') + " REGEXP '" + re[1].pattern.replace("'", "''") + "'");
                    });
                    checkRegexps_1.push("(" + groupRegexps.join(' AND ') + ")");
                });
                qualifiedTableName = obj.spec.databaseName + "." + obj.spec.structName;
                columnString += ("\r\nALTER TABLE " + qualifiedTableName + "\r\n"
                    + ("DROP CONSTRAINT IF EXISTS " + constraintBaseName + ";\r\n")
                    + ("ALTER TABLE " + qualifiedTableName + "\r\n")
                    + ("ADD CONSTRAINT IF NOT EXISTS " + constraintBaseName + "\r\n")
                    + ("CHECK (" + checkRegexps_1.join(' OR ') + ");"));
            }
            if (datatype.spec.setters) {
                qualifiedTableName = obj.spec.databaseName + "." + obj.spec.structName;
                previousExpression_1 = "NEW." + obj.spec.name;
                triggerBaseName = obj.spec.databaseName + ".preql_" + obj.spec.structName + "_" + obj.spec.name;
                datatype.spec.setters.forEach(function (setter, index) {
                    switch (setter.type.toLowerCase()) {
                        case ('trim'): {
                            previousExpression_1 = (function () {
                                if (!(setter.side))
                                    return "TRIM(" + previousExpression_1 + ")";
                                if (setter.side.toLowerCase() === 'left')
                                    return "LTRIM(" + previousExpression_1 + ")";
                                if (setter.side.toLowerCase() === 'right')
                                    return "RTRIM(" + previousExpression_1 + ")";
                                return "TRIM(" + previousExpression_1 + ")";
                            })();
                            break;
                        }
                        case ('substring'): {
                            if (setter.toIndex) {
                                previousExpression_1 = "SUBSTRING(" + previousExpression_1 + ", " + (setter.fromIndex + 1) + ", " + (setter.toIndex + 1) + ")";
                            }
                            else {
                                previousExpression_1 = "SUBSTRING(" + previousExpression_1 + ", " + (setter.fromIndex + 1) + ")";
                            }
                            break;
                        }
                        case ('replace'): {
                            var from = setter.from.replace("'", "''").replace('\\', '\\\\');
                            var to = setter.to.replace("'", "''").replace('\\', '\\\\');
                            previousExpression_1 = "REPLACE(" + previousExpression_1 + ", " + from + ", " + to + ")";
                            break;
                        }
                        case ('case'): {
                            switch (setter.casing) {
                                case ('upper'):
                                    previousExpression_1 = "UPPER(" + previousExpression_1 + ")";
                                    break;
                                case ('lower'):
                                    previousExpression_1 = "LOWER(" + previousExpression_1 + ")";
                                    break;
                            }
                            break;
                        }
                        case ('pad'): {
                            var padString = setter.padString.replace("'", "''").replace('\\', '\\\\');
                            switch (setter.side) {
                                case ('left'): {
                                    previousExpression_1 = "LPAD(" + previousExpression_1 + ", " + setter.padLength + ", " + padString + ")";
                                    break;
                                }
                                case ('right'): {
                                    previousExpression_1 = "RPAD(" + previousExpression_1 + ", " + setter.padLength + ", '" + padString + "')";
                                    break;
                                }
                            }
                            break;
                        }
                        case ('now'):
                            previousExpression_1 = "NOW()";
                            break;
                    }
                });
                columnString += ("\r\nDROP TRIGGER IF EXISTS " + triggerBaseName + "_insert;\r\n"
                    + ("CREATE TRIGGER IF NOT EXISTS " + triggerBaseName + "_insert\r\n")
                    + ("BEFORE INSERT ON " + qualifiedTableName + " FOR EACH ROW\r\n")
                    + ("SET NEW." + obj.spec.name + " = " + previousExpression_1 + ";\r\n")
                    + ("DROP TRIGGER IF EXISTS " + triggerBaseName + "_update;\r\n")
                    + ("CREATE TRIGGER IF NOT EXISTS " + triggerBaseName + "_update\r\n")
                    + ("BEFORE UPDATE ON " + qualifiedTableName + " FOR EACH ROW\r\n")
                    + ("SET NEW." + obj.spec.name + " = " + previousExpression_1 + ";"));
            }
        }
        return [2 /*return*/, columnString];
    });
}); };
exports.default = transpileAttribute;
