import { APIObject, APIObjectDatabase, AttributeSpec, DataTypeSpec, Logger, printf, transpileDataType } from 'preql-core';

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

      if (datatype.spec.regexes && datatype.spec.regexes.pcre) {
        const checkRegexps: string[] = [];
        const constraintBaseName = `${obj.spec.databaseName}.${obj.spec.structName}.preql_${obj.spec.name}`;
        // Every regex within a group must match.
        Object.entries(datatype.spec.regexes.pcre).forEach((group): void => {
          const groupRegexps: string[] = [];
          if (!(datatype.spec.regexes)) return; // Just to make TypeScript happy.
          Object.entries(datatype.spec.regexes.pcre[group[0]]).forEach((re): void => {
            groupRegexps.push(`${obj.spec.name} ${re[1].positive ? '' : 'NOT'} REGEXP '${re[1].pattern.replace("'", "''")}'`);
          });
          checkRegexps.push(`(${groupRegexps.join(' AND ')})`);
        });
        const qualifiedTableName: string = `${obj.spec.databaseName}.${obj.spec.structName}`;
        columnString += (
          `\r\nALTER TABLE ${qualifiedTableName}\r\n`
          + `DROP CONSTRAINT IF EXISTS ${constraintBaseName};\r\n`
          + `ALTER TABLE ${qualifiedTableName}\r\n`
          + `ADD CONSTRAINT IF NOT EXISTS ${constraintBaseName}\r\n`
          + `CHECK (${checkRegexps.join(' OR ')});`
        );
      }

      if (datatype.spec.setters) {
        const qualifiedTableName: string = `${obj.spec.databaseName}.${obj.spec.structName}`;
        let previousExpression: string = `NEW.${obj.spec.name}`;
        const triggerBaseName = `${obj.spec.databaseName}.preql_${obj.spec.structName}_${obj.spec.name}`;
        datatype.spec.setters.forEach((setter, index): void => {
          switch (setter.type.toLowerCase()) {
            case ('trim'): {
              previousExpression = ((): string => {
                if (!(setter.side)) return `TRIM(${previousExpression})`;
                if (setter.side.toLowerCase() === 'left')  return `LTRIM(${previousExpression})`;
                if (setter.side.toLowerCase() === 'right') return `RTRIM(${previousExpression})`;
                return `TRIM(${previousExpression})`;
              })();
              break;
            }
            case ('substring'): {
              if (setter.toIndex) {
                previousExpression = `SUBSTRING(${previousExpression}, ${setter.fromIndex + 1}, ${setter.toIndex + 1})`;
              } else {
                previousExpression = `SUBSTRING(${previousExpression}, ${setter.fromIndex + 1})`;
              }
              break;
            }
            case ('replace'): {
              const from = setter.from.replace("'", "''").replace('\\', '\\\\');
              const to = setter.to.replace("'", "''").replace('\\', '\\\\');
              previousExpression = `REPLACE(${previousExpression}, ${from}, ${to})`;
              break;
            }
            case ('case'): {
              switch (setter.casing) {
                case ('upper'): previousExpression = `UPPER(${previousExpression})`; break;
                case ('lower'): previousExpression = `LOWER(${previousExpression})`; break;
              }
              break;
            }
            case ('pad'): {
              const padString = setter.padString.replace("'", "''").replace('\\', '\\\\');
              switch (setter.side) {
                case ('left'): {
                  previousExpression = `LPAD(${previousExpression}, ${setter.padLength}, ${padString})`;
                  break;
                }
                case ('right'): {
                  previousExpression = `RPAD(${previousExpression}, ${setter.padLength}, '${padString}')`;
                  break;
                }
              }
              break;
            }
            case ('now'): previousExpression = `NOW()`; break;
          }
        });

        columnString += (
          `\r\nDROP TRIGGER IF EXISTS ${triggerBaseName}_insert;\r\n`
          + `CREATE TRIGGER IF NOT EXISTS ${triggerBaseName}_insert\r\n`
          + `BEFORE INSERT ON ${qualifiedTableName} FOR EACH ROW\r\n`
          + `SET NEW.${obj.spec.name} = ${previousExpression};\r\n`
          + `DROP TRIGGER IF EXISTS ${triggerBaseName}_update;\r\n`
          + `CREATE TRIGGER IF NOT EXISTS ${triggerBaseName}_update\r\n`
          + `BEFORE UPDATE ON ${qualifiedTableName} FOR EACH ROW\r\n`
          + `SET NEW.${obj.spec.name} = ${previousExpression};`
        );
      }
    }
    return columnString;
};

export default transpileAttribute;
