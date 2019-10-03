import {
    APIObject,
    APIObjectDatabase,
    AttributeSpec,
    CharacterSetSpec,
    CollationSpec,
    DataTypeSpec,
    Logger,
} from "preql-core";

const transpileAttribute = async (
    obj: APIObject<AttributeSpec>,
    logger: Logger,
    etcd: APIObjectDatabase
): Promise<string[]> => {
    const tableName: string = obj.spec.multiValued
        ? `${obj.spec.structName}_${obj.spec.name}`
        : obj.spec.structName;

    let ret: string[] = [];
    if (obj.spec.multiValued) {
        ret.push(
            `CREATE TABLE IF NOT EXISTS ${obj.spec.databaseName}.${tableName} (\r\n`
            + `\t${obj.spec.structName}_id BIGINT UNSIGNED NOT NULL,\r\n`
            + `\tFOREIGN KEY (${obj.spec.structName}_id) REFERENCES ${obj.spec.structName} (id)\r\n`
            + ");\r\n"
        );
    }

    const type: string = obj.spec.type.toLowerCase();
    const datatype: APIObject<DataTypeSpec> | undefined
        = etcd.kindNameIndex[`datatype:${obj.spec.type.toLowerCase()}`];
    if (!datatype) {
        throw new Error(`Data type '${type}' not recognized.`);
    }

    let columnString: string = `ALTER TABLE ${obj.spec.databaseName}.${tableName}\r\n`
        + `ADD COLUMN IF NOT EXISTS \`${obj.spec.name}\` `;
    if (datatype.spec.values) {
        const maxLengthValue: number = datatype.spec.values.sort((a, b) => (b.length - a.length))[0].length;
        columnString += `CHAR(${maxLengthValue})`;
    } else if (datatype.spec.targets.mariadb) {
        columnString += datatype.spec.targets.mariadb.nativeType;
    } else if (datatype.spec.targets.mysql) {
        columnString += datatype.spec.targets.mysql.nativeType;
    } else {
        throw new Error(`DataType '${datatype.metadata.name}' has no MariaDB or MySQL equivalent.`);
    }

    if (obj.spec.characterSet) {
        const characterSet: APIObject<CharacterSetSpec> | undefined = etcd.kindIndex.characterset
            .find((cs): boolean => obj.spec.characterSet === cs.spec.name);
        if (characterSet) {
            const mariaDBEquivalent: string | undefined
                = characterSet.spec.targetEquivalents.mariadb
                || characterSet.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                columnString += ` CHARACTER SET '${mariaDBEquivalent}'`;
            } else {
                logger.warn(
                    "No MariaDB or MySQL equivalent character set for PreQL "
                    + `character set '${characterSet.metadata.name}'.`
                );
            }
        } else {
            logger.error(
                `Expected CharacterSet '${obj.spec.characterSet}' did not exist! `
                + "This is a bug in the PreQL Core library."
            );
        }
    }

    if (obj.spec.collation) {
        const collation: APIObject<CollationSpec> | undefined = etcd.kindIndex.collation
            .find((c): boolean => obj.spec.collation === c.spec.name);
        if (collation) {
            const mariaDBEquivalent: string | undefined
                = collation.spec.targetEquivalents.mariadb
                || collation.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                columnString += ` COLLATE '${mariaDBEquivalent}'`;
            } else {
                logger.warn(
                    "No MariaDB or MySQL equivalent collation for PreQL "
                    + `collation '${collation.metadata.name}'.`
                );
            }
        } else {
            logger.error(
                `Expected Collation '${obj.spec.characterSet}' did not exist! `
                + "This is a bug in the PreQL Core library."
            );
        }
    }

    if (obj.spec.nullable && (!obj.spec.multiValued)) columnString += " NULL";
    else columnString += " NOT NULL";
    // Simply quoting the default value is fine, because MariaDB will cast it.
    if (obj.spec.default) columnString += ` DEFAULT '${obj.spec.default}'`;
    if (obj.metadata.annotations && obj.metadata.annotations.comment) {
        columnString += `\r\nCOMMENT '${obj.metadata.annotations.comment}'`;
    }
    ret.push(columnString);

    if (datatype.spec.values) {
        const storedProcedureName: string = `${obj.spec.databaseName}.add_enum_${datatype.spec.name}`;
        const foreignKeyName: string = `enum_${obj.spec.structName}_${obj.spec.name}`;
        const enumTableName: string = `${datatype.spec.name}_enum`;
        const maxLengthValue: number = datatype.spec.values.sort((a, b) => (b.length - a.length))[0].length;

        // Add Enum Table
        ret.push(
            `CREATE TABLE IF NOT EXISTS ${obj.spec.databaseName}.${enumTableName} (\r\n`
            + `\tvalue CHAR(${maxLengthValue}) NOT NULL PRIMARY KEY\r\n`
            + ")"
        );

        // Insert Enum Values
        ret.push(
            `INSERT IGNORE INTO ${obj.spec.databaseName}.${enumTableName} VALUES\r\n`
            + datatype.spec.values
                .map((v, i) => `\t/* ${obj.spec.databaseName}.${enumTableName}[${i}] */ ('${v}')`)
                .join(",\r\n")
        );

        // Add FKC
        ret.push(`DROP PROCEDURE IF EXISTS ${storedProcedureName}`);
        ret.push(
            + `CREATE PROCEDURE ${storedProcedureName} ()\r\n`
            + "BEGIN\r\n"
            + "\tDECLARE EXIT HANDLER FOR 1005 DO 0;\r\n"
            + `\tALTER TABLE ${obj.spec.databaseName}.${obj.spec.structName}\r\n`
            + `\tADD CONSTRAINT ${foreignKeyName} FOREIGN KEY\r\n`
            + `\tIF NOT EXISTS ${foreignKeyName}_index (\`${obj.spec.name}\`)\r\n`
            + `\tREFERENCES ${enumTableName} (value);\r\n`
            + "END"
        );
        ret.push(`CALL ${storedProcedureName}`);
        ret.push(`DROP PROCEDURE IF EXISTS ${storedProcedureName}`)
        return ret;
    }

    if (datatype.spec.regexes && datatype.spec.regexes.pcre) {
        const checkRegexps: string[] = [];
        const constraintBaseName = `${obj.spec.databaseName}.${tableName}.preql_${obj.spec.name}`;
        // Every regex within a group must match.
        Object.entries(datatype.spec.regexes.pcre).forEach((group): void => {
            const groupRegexps: string[] = [];
            if (!(datatype.spec.regexes)) return; // Just to make TypeScript happy.
            Object.entries(datatype.spec.regexes.pcre[group[0]]).forEach((re): void => {
                groupRegexps.push(`${obj.spec.name} ${re[1].positive ? "" : "NOT"} REGEXP '${re[1].pattern.replace("'", "''")}'`);
            });
            checkRegexps.push(`(${groupRegexps.join(" AND ")})`);
        });
        const qualifiedTableName: string = `${obj.spec.databaseName}.${tableName}`;
        ret.push(`ALTER TABLE ${qualifiedTableName}\r\nDROP CONSTRAINT IF EXISTS ${constraintBaseName}`);
        ret.push(`ALTER TABLE ${qualifiedTableName}\r\nADD CONSTRAINT IF NOT EXISTS ${constraintBaseName}\r\nCHECK (${checkRegexps.join(" OR ")})`);
    }

    if (datatype.spec.setters) {
        const qualifiedTableName: string = `${obj.spec.databaseName}.${tableName}`;
        let previousExpression: string = `NEW.${obj.spec.name}`;
        const triggerBaseName = `${obj.spec.databaseName}.preql_${tableName}_${obj.spec.name}`;
        datatype.spec.setters.forEach((setter): void => {
            // REVIEW: I had some weird issues with this, hence "as string."
            switch ((setter.type as string).toLowerCase()) {
                case ("trim"): {
                    previousExpression = ((): string => {
                        if (!(setter.side)) return `TRIM(${previousExpression})`;
                        if (setter.side.toLowerCase() === "left")  return `LTRIM(${previousExpression})`;
                        if (setter.side.toLowerCase() === "right") return `RTRIM(${previousExpression})`;
                        return `TRIM(${previousExpression})`;
                    })();
                    break;
                }
                case ("substring"): {
                    if (setter.toIndex) {
                        previousExpression = `SUBSTRING(${previousExpression}, ${setter.fromIndex + 1}, ${setter.toIndex + 1})`;
                    } else {
                        previousExpression = `SUBSTRING(${previousExpression}, ${setter.fromIndex + 1})`;
                    }
                    break;
                }
                case ("replace"): {
                    const from = setter.from.replace("'", "''").replace("\\", "\\\\");
                    const to = setter.to.replace("'", "''").replace("\\", "\\\\");
                    previousExpression = `REPLACE(${previousExpression}, ${from}, ${to})`;
                    break;
                }
                case ("case"): {
                    switch (setter.casing) {
                        case ("upper"): previousExpression = `UPPER(${previousExpression})`; break;
                        case ("lower"): previousExpression = `LOWER(${previousExpression})`; break;
                        default: {
                            throw new Error(`Invalid casing: '${setter.casing}'.`);
                        }
                    }
                    break;
                }
                case ("pad"): {
                    const padString = setter.padString.replace("'", "''").replace("\\", "\\\\");
                    switch (setter.side) {
                        case ("left"): {
                            previousExpression = `LPAD(${previousExpression}, ${setter.padLength}, ${padString})`;
                            break;
                        }
                        case ("right"): {
                            previousExpression = `RPAD(${previousExpression}, ${setter.padLength}, '${padString}')`;
                            break;
                        }
                        default: {
                            throw new Error(`Invalid side: '${setter.side}'.`);
                        }
                    }
                    break;
                }
                case ("now"): previousExpression = "NOW()"; break;
                default: {
                    // REVIEW: I had some weird issues with this, hence "as string."
                    throw new Error(`Setter '${(setter.type as string).toLowerCase()}' not understood.`);
                }
            }
        });

        ret.push(`DROP TRIGGER IF EXISTS ${triggerBaseName}_insert`);
        ret.push(`BEFORE INSERT ON ${qualifiedTableName} FOR EACH ROW\r\nSET NEW.${obj.spec.name} = ${previousExpression}`);
        ret.push(
            `CREATE TRIGGER IF NOT EXISTS ${triggerBaseName}_insert\r\n`
            + `BEFORE INSERT ON ${qualifiedTableName} FOR EACH ROW\r\n`
            + `SET NEW.${obj.spec.name} = ${previousExpression}\r\n`
        );
        ret.push(`DROP TRIGGER IF EXISTS ${triggerBaseName}_update`);
        ret.push(
            `CREATE TRIGGER IF NOT EXISTS ${triggerBaseName}_update\r\n`
            + `BEFORE UPDATE ON ${qualifiedTableName} FOR EACH ROW\r\n`
            + `SET NEW.${obj.spec.name} = ${previousExpression}`
        );
    }

    return ret;
};

export default transpileAttribute;
