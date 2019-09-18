"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = __importDefault(require("../escape"));
const transpileForeignKeyConstraint = async (obj) => {
    const storedProcedureName = `${obj.spec.databaseName}.create_fk_${obj.spec.name}`;
    const foreignKeyName = `fk_${obj.spec.childStructName}_${obj.spec.parentStructName}`;
    const comment = obj.metadata.labels.comment ? escape_1.default(obj.metadata.labels.comment) : "";
    return `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.childStructName}\r\n`
        + `ADD COLUMN IF NOT EXISTS ${obj.spec.name} `
        + `BIGINT UNSIGNED ${obj.spec.nullable ? "NULL" : "NOT NULL"}`
        + `${comment.length ? "\r\nCOMMENT '" + comment + "'" : ""};\r\n`
        + `DROP PROCEDURE IF EXISTS ${storedProcedureName};\r\n`
        + "DELIMITER ;;\r\n"
        + `CREATE PROCEDURE ${storedProcedureName} ()\r\n`
        + "BEGIN\r\n"
        + "\tDECLARE EXIT HANDLER FOR 1005 DO 0;\r\n"
        + `\tALTER TABLE ${obj.spec.databaseName}.${obj.spec.childStructName}\r\n`
        + `\tADD CONSTRAINT ${foreignKeyName} FOREIGN KEY\r\n`
        + `\tIF NOT EXISTS ${foreignKeyName}_index (${obj.spec.name})\r\n`
        + `\tREFERENCES ${obj.spec.parentStructName} (id)\r\n`
        + `\tON DELETE ${obj.spec.onDeleteAction.toUpperCase() || "RESTRICT"}\r\n`
        + `\tON UPDATE ${obj.spec.onUpdateAction.toUpperCase() || "RESTRICT"};\r\n`
        + "END ;;\r\n"
        + "DELIMITER ;\r\n"
        + `CALL ${storedProcedureName};\r\n`
        + `DROP PROCEDURE IF EXISTS ${storedProcedureName};`;
};
exports.default = transpileForeignKeyConstraint;
//# sourceMappingURL=foreignkey.js.map