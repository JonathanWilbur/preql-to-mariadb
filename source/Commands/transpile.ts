import { APIObject, SuggestedTargetIndexHandler, SuggestedTargetObjectHandler, APIObjectDatabase, Logger, DatabaseSpec, StructSpec, AttributeSpec, DataTypeSpec, transpileDataType, printf } from 'preql-core';

// This will break once you upgrade to a higher version of MariaDB.
// See: https://dataedo.com/kb/query/mariadb/list-check-constraints-in-database
// https://stackoverflow.com/questions/12637945/how-can-i-delete-all-the-triggers-in-a-mysql-database-using-one-sql-statement
const dropAllPreqlCheckConstraintsForTableTemplate = (db: APIObject<DatabaseSpec>): string => {
  const schemaName: string = db.spec.name;
  const spName: string = `${schemaName}.dropAllPreqlCheckConstraintsForTable`
  return `DROP PROCEDURE IF EXISTS ${spName};\r\n`
  + 'DELIMITER $$\r\n'
  + `CREATE PROCEDURE ${spName} (IN param_table VARCHAR(255))\r\n`
  + 'BEGIN\r\n'
  + '\tDECLARE done BOOLEAN DEFAULT FALSE;\r\n'
  + '\tDECLARE dropCommand VARCHAR(255);\r\n'
  + '\tDECLARE dropCur CURSOR FOR\r\n'
  + `\t\tSELECT concat('ALTER TABLE ${schemaName}.', table_name, ' DROP CONSTRAINT ', constraint_name, ';')\r\n`
  + '\t\tFROM information_schema.table_constraints\r\n'
  + '\t\tWHERE\r\n'
  + "\t\t\tconstraint_type = 'CHECK'\r\n"
  + "\t\t\tAND constraint_name LIKE 'preql_'\r\n"
  + `\t\t\tAND table_schema = '${schemaName}'\r\n`
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

const transpileDatabase: SuggestedTargetObjectHandler = async (obj: APIObject<DatabaseSpec>): Promise<string> => {
    return `CREATE DATABASE IF NOT EXISTS ${obj.spec.name};`
};

const transpileStruct: SuggestedTargetObjectHandler = async (obj: APIObject<StructSpec>): Promise<string> => {
    return `CREATE TABLE IF NOT EXISTS ${obj.spec.databaseName}.${obj.spec.name} (__placeholder__ BOOLEAN);`;
};

const transpileAttribute = async (obj: APIObject<AttributeSpec>, logger: Logger, etcd: APIObjectDatabase): Promise<string> => {
    const datatypes: APIObject<DataTypeSpec>[] = etcd.kindIndex.datatype || [];
    if (datatypes.length === 0) {
      throw new Error('No data types defined.');
    }
    let columnString = `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.structName}\r\n`
      + `ADD COLUMN IF NOT EXISTS ${obj.spec.name} `;
    const type: string = obj.spec.type.toLowerCase();
    const matchingTypes: APIObject[] = datatypes
      .filter((datatype: APIObject): boolean => datatype.metadata.name.toLowerCase() === type);
    if (matchingTypes.length !== 1) {
      throw new Error(`Data type '${type}' not recognized.`);
    }
    const datatype: APIObject<DataTypeSpec> = matchingTypes[0];
    columnString += transpileDataType('mariadb', datatype, obj);
    if (obj.spec.nullable) columnString += ' NULL';
    else columnString += ' NOT NULL';
    // Simply quoting the default value is fine, because MariaDB will cast it.
    if (obj.spec.default) columnString += ` DEFAULT '${obj.spec.default}'`;
    if (obj.metadata.annotations && obj.metadata.annotations.comment) {
      columnString += `\r\nCOMMENT '${obj.metadata.annotations.comment}'`;
    }
    columnString += ';';
    if (datatype.spec.targets.mariadb) {
      if (datatype.spec.targets.mariadb.check) {
        columnString += '\r\n\r\n';
        columnString += datatype.spec.targets.mariadb.check
          .map((expression: string, index: number): string => {
            const qualifiedTableName: string = `${obj.spec.databaseName}.${obj.spec.structName}`;
            return `ALTER TABLE ${qualifiedTableName}\r\n`
            + `DROP CONSTRAINT IF EXISTS preql_valid_${datatype.metadata.name}_${index};\r\n`
            + `ALTER TABLE ${qualifiedTableName}\r\n`
            + `ADD CONSTRAINT IF NOT EXISTS preql_valid_${datatype.metadata.name}_${index}\r\n`
            + `CHECK (${printf(expression, obj)});`;
          })
          .join('\r\n\r\n')
      }
      if (datatype.spec.targets.mariadb.setters) {
        columnString += '\r\n\r\n';
        columnString += datatype.spec.targets.mariadb.setters
          .map((expression: string, index: number): string => {
            const qualifiedTableName: string = `${obj.spec.databaseName}.${obj.spec.structName}`;
            const formattedExpression: string = printf(expression, obj);
            const triggerBaseName = `${obj.spec.databaseName}.preql_${datatype.metadata.name}_${index}`;
            return (
              `DROP TRIGGER IF EXISTS ${triggerBaseName}_insert;\r\n`
              + `CREATE TRIGGER IF NOT EXISTS ${triggerBaseName}_insert\r\n`
              + `BEFORE INSERT ON ${qualifiedTableName} FOR EACH ROW\r\n`
              + `SET NEW.${obj.spec.name} = ${formattedExpression};\r\n`
              + '\r\n'
              + `DROP TRIGGER IF EXISTS ${triggerBaseName}_update;\r\n`
              + `CREATE TRIGGER IF NOT EXISTS ${triggerBaseName}_update\r\n`
              + `BEFORE UPDATE ON ${qualifiedTableName} FOR EACH ROW\r\n`
              + `SET NEW.${obj.spec.name} = ${formattedExpression};`
            );
          })
          .join('\r\n\r\n');
      }
    }
    return columnString;
};

// TODO: Transpile everything individually, then add DROP COLUMN __placeholder__ at the end.
const transpile: SuggestedTargetIndexHandler = async (etcd: APIObjectDatabase, logger: Logger): Promise<string> => {
    let transpilations: string[] = [];

    const databases: APIObject[] | undefined = etcd.kindIndex.database;
    if (!databases) return '';
    transpilations = await Promise.all(databases.map(
        async (obj: APIObject): Promise<string> => {
            return transpileDatabase(obj, logger);
        }
    ));

    const structs: APIObject[] | undefined = etcd.kindIndex.struct;
    if (!structs) return '';
    transpilations = transpilations.concat(await Promise.all(structs.map(
        async (obj: APIObject): Promise<string> => {
            return transpileStruct(obj, logger);
        }
    )));

    const attributes: APIObject[] | undefined = etcd.kindIndex.attribute;
    if (!attributes) return '';
    transpilations = transpilations.concat(await Promise.all(attributes.map(
        async (obj: APIObject): Promise<string> => {
            return transpileAttribute(obj, logger, etcd);
        }
    )));

    // const primaryIndexes: APIObject[] | undefined = etcd.kindIndex.primaryindex;
    // if (!primaryIndexes) return '';
    // transpilations = await Promise.all(primaryIndexes.map(
    //     async (obj: APIObject): Promise<string> => {
    //         return transpileAttribute(obj, logger, etcd);
    //     }
    // ));

    transpilations = transpilations.concat(await Promise.all(structs.map(
        (struct: APIObject<StructSpec>) => (
            `ALTER TABLE ${struct.spec.databaseName}.${struct.spec.name} `
            + 'DROP COLUMN IF EXISTS __placeholder__;'
        )
    )));

    return 'START TRANSACTION;\r\n\r\n'
        + `${(etcd.kindIndex.database || []).map(dropAllPreqlCheckConstraintsForTableTemplate)}`
        + `${(etcd.kindIndex.struct || [])
            .map((apiObject: APIObject<StructSpec>): string => (
            `CALL ${apiObject.spec.databaseName}`
            + `.dropAllPreqlCheckConstraintsForTable('${apiObject.spec.name}');\r\n\r\n`
            + `DROP PROCEDURE ${apiObject.spec.databaseName}.dropAllPreqlCheckConstraintsForTable;\r\n\r\n`
            )).join('')}`
        + `${transpilations.filter((t: string) => (t !== '')).join('\r\n\r\n')}\r\n\r\n`
        + 'COMMIT;\r\n';
};

export default transpile;
