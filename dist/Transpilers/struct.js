"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transpileStruct = async (obj, logger, etcd) => {
    const ret = [
        `CREATE TABLE IF NOT EXISTS ${obj.spec.databaseName}.${obj.spec.name} `
            + "(id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY)",
        `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.name} `
            + "ADD COLUMN IF NOT EXISTS id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY",
    ];
    if (obj.spec.characterSet) {
        const characterSet = etcd.kindNameIndex[`characterset:${obj.spec.characterSet.toLowerCase()}`];
        if (characterSet) {
            // TODO: Make this capitalization-proof.
            const mariaDBEquivalent = characterSet.spec.targetEquivalents.mariadb
                || characterSet.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                ret.push(`ALTER TABLE ${obj.spec.databaseName}.${obj.spec.name} DEFAULT CHARACTER SET = '${mariaDBEquivalent}'`);
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
        const collation = etcd.kindNameIndex[`collation:${obj.spec.collation.toLowerCase()}`];
        if (collation) {
            const mariaDBEquivalent = collation.spec.targetEquivalents.mariadb
                || collation.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                ret.push(`ALTER TABLE ${obj.spec.databaseName}.${obj.spec.name} DEFAULT COLLATE = '${mariaDBEquivalent}'`);
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
    return ret;
};
exports.default = transpileStruct;
//# sourceMappingURL=struct.js.map