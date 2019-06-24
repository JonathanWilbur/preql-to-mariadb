import { APIObject, ForeignKeyConstraintSpec, SuggestedTargetObjectHandler } from 'preql-core';

const transpileForeignKeyConstraint: SuggestedTargetObjectHandler =
    async (obj: APIObject<ForeignKeyConstraintSpec>): Promise<string> => {
        const storedProcedureName: string = `${obj.spec.databaseName}.create_${obj.spec.name}`;
        return `DROP PROCEDURE IF EXISTS ${storedProcedureName};\r\n`
            + 'DELIMITER $$\r\n'
            + `CREATE PROCEDURE IF NOT EXISTS ${storedProcedureName} ()\r\n`
            + 'BEGIN\r\n'
            + '\tDECLARE EXIT HANDLER FOR 1005 DO 0;\r\n'
            + `\tALTER TABLE ${obj.spec.databaseName}.${obj.spec.child.struct}\r\n`
            + `\tADD CONSTRAINT ${obj.spec.name} FOREIGN KEY\r\n`
            + `\tIF NOT EXISTS ${obj.spec.name}_index\r\n`
            + `\t(\r\n\t\t${obj.spec.child.key.map(k => k.attributeName).join(',\r\n\t\t')}\r\n\t)\r\n`
            + `\tREFERENCES ${obj.spec.parent.struct}\r\n`
            + `\t(\r\n\t\t${obj.spec.parent.key.map(k => k.attributeName).join(',\r\n\t\t')}\r\n\t)\r\n`
            + `\tON DELETE ${obj.spec.onDeleteAction.toUpperCase() || 'RESTRICT'}\r\n`
            + `\tON UPDATE ${obj.spec.onUpdateAction.toUpperCase() || 'RESTRICT'};\r\n`
            + 'END $$\r\n'
            + 'DELIMITER ;\r\n'
            + `CALL ${storedProcedureName};\r\n`
            + `DROP PROCEDURE IF EXISTS ${storedProcedureName};`;
    };

export default transpileForeignKeyConstraint;
