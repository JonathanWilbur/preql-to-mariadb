import { APIObject, StructSpec, Logger, APIObjectDatabase, CharacterSetSpec, CollationSpec } from "preql-core";

const transpileStruct = async (obj: APIObject<StructSpec>, logger: Logger, etcd: APIObjectDatabase): Promise<string[]> => {
    const ret: string[] = [
        `CREATE TABLE IF NOT EXISTS ${obj.spec.databaseName}.${obj.spec.name} `
        + "(id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY)",
        `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.name} `
        + "ADD COLUMN IF NOT EXISTS id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY",
    ];

    if (obj.spec.characterSet) {
        const characterSet: APIObject<CharacterSetSpec> | undefined
            = etcd.kindNameIndex[`characterset:${obj.spec.characterSet.toLowerCase()}`];
        if (characterSet) {
            // TODO: Make this capitalization-proof.
            const mariaDBEquivalent: string | undefined = characterSet.spec.targetEquivalents.mariadb
                || characterSet.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                ret.push(`ALTER TABLE ${obj.spec.databaseName}.${obj.spec.name} DEFAULT CHARACTER SET = '${mariaDBEquivalent}'`);
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
        const collation: APIObject<CharacterSetSpec> | undefined
            = etcd.kindNameIndex[`collation:${obj.spec.collation.toLowerCase()}`];
        if (collation) {
            const mariaDBEquivalent: string | undefined = collation.spec.targetEquivalents.mariadb
                || collation.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                ret.push(`ALTER TABLE ${obj.spec.databaseName}.${obj.spec.name} DEFAULT COLLATE = '${mariaDBEquivalent}'`);
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
    return ret;
};

export default transpileStruct;
