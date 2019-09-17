"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transpileAttribute = async (obj, logger, etcd) => {
    const tableName = obj.spec.multiValued
        ? `${obj.spec.structName}_${obj.spec.name}`
        : obj.spec.structName;
    let columnString = "";
    if (obj.spec.multiValued) {
        columnString = (`CREATE TABLE IF NOT EXISTS ${obj.spec.databaseName}.${tableName} (\r\n`
            + `\t${obj.spec.structName}_id BIGINT UNSIGNED NOT NULL,\r\n`
            + `\tFOREIGN KEY (${obj.spec.structName}_id) REFERENCES ${obj.spec.structName} (id)\r\n`
            + ");\r\n");
    }
    const type = obj.spec.type.toLowerCase();
    const datatype = (etcd.kindIndex.datatype || [])
        .find((dt) => dt.metadata.name.toLowerCase() === type);
    if (!datatype) {
        throw new Error(`Data type '${type}' not recognized.`);
    }
    columnString += `ALTER TABLE ${obj.spec.databaseName}.${tableName}\r\n`
        + `ADD COLUMN IF NOT EXISTS \`${obj.spec.name}\` `;
    if (datatype.spec.values) {
        const maxLengthValue = datatype.spec.values.sort((a, b) => (b.length - a.length))[0].length;
        columnString += `CHAR(${maxLengthValue})`;
    }
    else if (datatype.spec.targets.mariadb) {
        columnString += datatype.spec.targets.mariadb.nativeType;
    }
    else if (datatype.spec.targets.mysql) {
        columnString += datatype.spec.targets.mysql.nativeType;
    }
    else {
        throw new Error(`DataType '${datatype.metadata.name}' has no MariaDB or MySQL equivalent.`);
    }
    if (obj.spec.characterSet) {
        const characterSet = etcd.kindIndex.characterset
            .find((cs) => obj.spec.characterSet === cs.spec.name);
        if (characterSet) {
            const mariaDBEquivalent = characterSet.spec.targetEquivalents.mariadb
                || characterSet.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                columnString += ` CHARACTER SET '${mariaDBEquivalent}'`;
            }
            else {
                logger.warn("No MariaDB or MySQL equivalent character set for PreQL "
                    + `character set '${characterSet.metadata.name}'.`);
            }
        }
        else {
            logger.error(`Expected CharacterSet '${obj.spec.characterSet}' did not exist! `
                + "This is a bug in the PreQL Core library.");
        }
    }
    if (obj.spec.collation) {
        const collation = etcd.kindIndex.collation
            .find((c) => obj.spec.collation === c.spec.name);
        if (collation) {
            const mariaDBEquivalent = collation.spec.targetEquivalents.mariadb
                || collation.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                columnString += ` COLLATE '${mariaDBEquivalent}'`;
            }
            else {
                logger.warn("No MariaDB or MySQL equivalent collation for PreQL "
                    + `collation '${collation.metadata.name}'.`);
            }
        }
        else {
            logger.error(`Expected Collation '${obj.spec.characterSet}' did not exist! `
                + "This is a bug in the PreQL Core library.");
        }
    }
    if (obj.spec.nullable && (!obj.spec.multiValued))
        columnString += " NULL";
    else
        columnString += " NOT NULL";
    // Simply quoting the default value is fine, because MariaDB will cast it.
    if (obj.spec.default)
        columnString += ` DEFAULT '${obj.spec.default}'`;
    if (obj.metadata.annotations && obj.metadata.annotations.comment) {
        columnString += `\r\nCOMMENT '${obj.metadata.annotations.comment}'`;
    }
    columnString += ";";
    if (datatype.spec.values) {
        columnString += "\r\n";
        const storedProcedureName = `${obj.spec.databaseName}.add_enum_${datatype.spec.name}`;
        const foreignKeyName = `enum_${obj.spec.structName}_${obj.spec.name}`;
        const enumTableName = `${datatype.spec.name}_enum`;
        const maxLengthValue = datatype.spec.values.sort((a, b) => (b.length - a.length))[0].length;
        // Add Enum Table
        columnString += (`CREATE TABLE IF NOT EXISTS ${obj.spec.databaseName}.${enumTableName} (\r\n`
            + `\tvalue CHAR(${maxLengthValue}) NOT NULL PRIMARY KEY\r\n`
            + ");\r\n");
        // Insert Enum Values
        columnString += (`INSERT IGNORE INTO ${obj.spec.databaseName}.${enumTableName} VALUES\r\n`
            + datatype.spec.values
                .map((v, i) => `\t/* ${obj.spec.databaseName}.${enumTableName}[${i}] */ ('${v}')`)
                .join(",\r\n")
            + "\r\n;\r\n");
        // Add FKC
        columnString += (`DROP PROCEDURE IF EXISTS ${storedProcedureName};\r\n`
            + "DELIMITER $$\r\n"
            + `CREATE PROCEDURE ${storedProcedureName} ()\r\n`
            + "BEGIN\r\n"
            + "\tDECLARE EXIT HANDLER FOR 1005 DO 0;\r\n"
            + `\tALTER TABLE ${obj.spec.databaseName}.${obj.spec.structName}\r\n`
            + `\tADD CONSTRAINT ${foreignKeyName} FOREIGN KEY\r\n`
            + `\tIF NOT EXISTS ${foreignKeyName}_index (\`${obj.spec.name}\`)\r\n`
            + `\tREFERENCES ${enumTableName} (value);\r\n`
            + "END $$\r\n"
            + "DELIMITER ;\r\n"
            + `CALL ${storedProcedureName};\r\n`
            + `DROP PROCEDURE IF EXISTS ${storedProcedureName};`);
        return columnString;
    }
    if (datatype.spec.regexes && datatype.spec.regexes.pcre) {
        const checkRegexps = [];
        const constraintBaseName = `${obj.spec.databaseName}.${tableName}.preql_${obj.spec.name}`;
        // Every regex within a group must match.
        Object.entries(datatype.spec.regexes.pcre).forEach((group) => {
            const groupRegexps = [];
            if (!(datatype.spec.regexes))
                return; // Just to make TypeScript happy.
            Object.entries(datatype.spec.regexes.pcre[group[0]]).forEach((re) => {
                groupRegexps.push(`${obj.spec.name} ${re[1].positive ? "" : "NOT"} REGEXP '${re[1].pattern.replace("'", "''")}'`);
            });
            checkRegexps.push(`(${groupRegexps.join(" AND ")})`);
        });
        const qualifiedTableName = `${obj.spec.databaseName}.${tableName}`;
        columnString += (`\r\nALTER TABLE ${qualifiedTableName}\r\n`
            + `DROP CONSTRAINT IF EXISTS ${constraintBaseName};\r\n`
            + `ALTER TABLE ${qualifiedTableName}\r\n`
            + `ADD CONSTRAINT IF NOT EXISTS ${constraintBaseName}\r\n`
            + `CHECK (${checkRegexps.join(" OR ")});`);
    }
    if (datatype.spec.setters) {
        const qualifiedTableName = `${obj.spec.databaseName}.${tableName}`;
        let previousExpression = `NEW.${obj.spec.name}`;
        const triggerBaseName = `${obj.spec.databaseName}.preql_${tableName}_${obj.spec.name}`;
        datatype.spec.setters.forEach((setter) => {
            // REVIEW: I had some weird issues with this, hence "as string."
            switch (setter.type.toLowerCase()) {
                case ("trim"): {
                    previousExpression = (() => {
                        if (!(setter.side))
                            return `TRIM(${previousExpression})`;
                        if (setter.side.toLowerCase() === "left")
                            return `LTRIM(${previousExpression})`;
                        if (setter.side.toLowerCase() === "right")
                            return `RTRIM(${previousExpression})`;
                        return `TRIM(${previousExpression})`;
                    })();
                    break;
                }
                case ("substring"): {
                    if (setter.toIndex) {
                        previousExpression = `SUBSTRING(${previousExpression}, ${setter.fromIndex + 1}, ${setter.toIndex + 1})`;
                    }
                    else {
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
                        case ("upper"):
                            previousExpression = `UPPER(${previousExpression})`;
                            break;
                        case ("lower"):
                            previousExpression = `LOWER(${previousExpression})`;
                            break;
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
                case ("now"):
                    previousExpression = "NOW()";
                    break;
                default: {
                    // REVIEW: I had some weird issues with this, hence "as string."
                    throw new Error(`Setter '${setter.type.toLowerCase()}' not understood.`);
                }
            }
        });
        columnString += (`\r\nDROP TRIGGER IF EXISTS ${triggerBaseName}_insert;\r\n`
            + `CREATE TRIGGER IF NOT EXISTS ${triggerBaseName}_insert\r\n`
            + `BEFORE INSERT ON ${qualifiedTableName} FOR EACH ROW\r\n`
            + `SET NEW.${obj.spec.name} = ${previousExpression};\r\n`
            + `DROP TRIGGER IF EXISTS ${triggerBaseName}_update;\r\n`
            + `CREATE TRIGGER IF NOT EXISTS ${triggerBaseName}_update\r\n`
            + `BEFORE UPDATE ON ${qualifiedTableName} FOR EACH ROW\r\n`
            + `SET NEW.${obj.spec.name} = ${previousExpression};`);
    }
    return columnString;
};
exports.default = transpileAttribute;
//# sourceMappingURL=attribute.js.map