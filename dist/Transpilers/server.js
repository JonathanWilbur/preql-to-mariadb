"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
Object.defineProperty(exports, "__esModule", { value: true });
var tz_offset_1 = require("tz-offset");
var transpileServer = function (obj, logger, etcd) { return __awaiter(void 0, void 0, void 0, function () {
    var ret, offsetInMinutes, offsetHourString, offsetMinuteString, offsetString, characterSet, mariaDBEquivalent, collation, mariaDBEquivalent;
    return __generator(this, function (_a) {
        ret = "DELIMITER $$\r\nIF @@hostname = '" + obj.spec.hostname + "' OR @@logical_server_name = '" + obj.spec.name + "' THEN\r\n\tDO 0;\r\n";
        if (obj.spec.timezone) {
            offsetInMinutes = tz_offset_1.offsetOf(obj.spec.timezone);
            offsetHourString = Math.floor(Math.abs(offsetInMinutes) / 60).toString().padStart(2, "0");
            offsetMinuteString = (Math.abs(offsetInMinutes) % 60).toString().padStart(2, "0");
            offsetString = "" + (offsetInMinutes < 0 ? "-" : "") + offsetHourString + ":" + offsetMinuteString;
            ret += "\tSET @@time_zone = '" + offsetString + "';\r\n";
        }
        if (obj.spec.characterSet) {
            characterSet = etcd.kindIndex.characterset
                .find(function (cs) { return obj.spec.characterSet === cs.spec.name; });
            if (characterSet) {
                mariaDBEquivalent = characterSet.spec.targetEquivalents.mariadb
                    || characterSet.spec.targetEquivalents.mysql;
                if (mariaDBEquivalent) {
                    ret += "\tSET @@character_set_server = '" + mariaDBEquivalent + "';\r\n";
                    ret += "\tSET @@character_set_database = '" + mariaDBEquivalent + "';\r\n";
                }
                else {
                    logger.warn("No MariaDB or MySQL equivalent character set for PreQL "
                        + ("character set '" + characterSet.metadata.name + "'."));
                }
            }
            else {
                logger.error("Expected CharacterSet '" + obj.spec.characterSet + "' did not exist! "
                    + "This is a bug in the PreQL Core library.");
            }
        }
        if (obj.spec.collation) {
            collation = etcd.kindIndex.collation
                .find(function (c) { return obj.spec.collation === c.spec.name; });
            if (collation) {
                mariaDBEquivalent = collation.spec.targetEquivalents.mariadb
                    || collation.spec.targetEquivalents.mysql;
                if (mariaDBEquivalent) {
                    ret += "\tSET @@collation_server = '" + mariaDBEquivalent + "';\r\n";
                    ret += "\tSET @@collation_database = '" + mariaDBEquivalent + "';\r\n";
                }
                else {
                    logger.warn("No MariaDB or MySQL equivalent collation for PreQL "
                        + ("collation '" + collation.metadata.name + "'."));
                }
            }
            else {
                logger.error("Expected Collation '" + obj.spec.characterSet + "' did not exist! "
                    + "This is a bug in the PreQL Core library.");
            }
        }
        ret += "END IF;\r\nDELIMITER ;";
        return [2 /*return*/, ret];
    });
}); };
exports.default = transpileServer;
