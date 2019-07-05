import { APIObject, ForeignKeySpec, SuggestedTargetObjectHandler } from 'preql-core';
import escape from '../escape';

const transpileForeignKeyConstraint: SuggestedTargetObjectHandler =
    async (obj: APIObject<ForeignKeySpec>): Promise<string> => {
        const storedProcedureName: string = `${obj.spec.databaseName}.create_fk_${obj.spec.attributeName}`;
        const foreignKeyName: string = `fk_${obj.spec.childStruct}_${obj.spec.parentStruct}`;
        const comment: string = ('comment' in obj.metadata && typeof obj.metadata['comment'] === 'string') ? escape(obj.metadata['comment']) : '';
        return `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.childStruct}\r\n`
            + `ADD COLUMN IF NOT EXISTS ${obj.spec.attributeName} `
            + `BIGINT UNSIGNED ${obj.spec.nullable ? 'NULL' : 'NOT NULL'}`
            + `${comment.length ? "\r\nCOMMENT '" + comment + "'" : ''};\r\n`
            + `DROP PROCEDURE IF EXISTS ${storedProcedureName};\r\n`
            + 'DELIMITER $$\r\n'
            + `CREATE PROCEDURE IF NOT EXISTS ${storedProcedureName} ()\r\n`
            + 'BEGIN\r\n'
            + '\tDECLARE EXIT HANDLER FOR 1005 DO 0;\r\n'
            + `\tALTER TABLE ${obj.spec.databaseName}.${obj.spec.childStruct}\r\n`
            + `\tADD CONSTRAINT ${foreignKeyName} FOREIGN KEY\r\n`
            + `\tIF NOT EXISTS ${foreignKeyName}_index (${obj.spec.attributeName})\r\n`
            + `\tREFERENCES ${obj.spec.parentStruct} (id)\r\n`
            + `\tON DELETE ${obj.spec.onDeleteAction.toUpperCase() || 'RESTRICT'}\r\n`
            + `\tON UPDATE ${obj.spec.onUpdateAction.toUpperCase() || 'RESTRICT'};\r\n`
            + 'END $$\r\n'
            + 'DELIMITER ;\r\n'
            + `CALL ${storedProcedureName};\r\n`
            + `DROP PROCEDURE IF EXISTS ${storedProcedureName};`;
    };

export default transpileForeignKeyConstraint;
