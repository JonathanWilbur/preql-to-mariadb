import { APIObject, ForeignKeySpec } from "preql-core";
import escape from "../escape";

const transpileForeignKeyConstraint
    = async (obj: APIObject<ForeignKeySpec>): Promise<string[]> => {
        const storedProcedureName: string = `${obj.spec.databaseName}.create_fk_${obj.spec.name}`;
        const foreignKeyName: string = `fk_${obj.spec.childStructName}_${obj.spec.parentStructName}`;
        const comment: string = obj.metadata.labels.comment ? escape(obj.metadata.labels.comment) : "";
        return [
            `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.childStructName}\r\n`
            + `ADD COLUMN IF NOT EXISTS ${obj.spec.name} `
            + `BIGINT UNSIGNED ${obj.spec.nullable ? "NULL" : "NOT NULL"}`
            + `${comment.length ? "\r\nCOMMENT '" + comment + "'" : ""}`,
            `DROP PROCEDURE IF EXISTS ${storedProcedureName}`,
            `CREATE PROCEDURE ${storedProcedureName} ()\r\n`
            + "BEGIN\r\n"
            + "\tDECLARE EXIT HANDLER FOR 1005 DO 0;\r\n"
            + `\tALTER TABLE ${obj.spec.databaseName}.${obj.spec.childStructName}\r\n`
            + `\tADD CONSTRAINT ${foreignKeyName} FOREIGN KEY\r\n`
            + `\tIF NOT EXISTS ${foreignKeyName}_index (${obj.spec.name})\r\n`
            + `\tREFERENCES ${obj.spec.parentStructName} (id)\r\n`
            + `\tON DELETE ${obj.spec.onDeleteAction.toUpperCase() || "RESTRICT"}\r\n`
            + `\tON UPDATE ${obj.spec.onUpdateAction.toUpperCase() || "RESTRICT"};\r\n`
            + "END",
            `CALL ${storedProcedureName}`,
            `DROP PROCEDURE IF EXISTS ${storedProcedureName}`,
        ];
    };

export default transpileForeignKeyConstraint;
