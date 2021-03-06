"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transpileDatabase = async (obj, logger, etcd) => {
    let ret = [
        `CREATE DATABASE IF NOT EXISTS ${obj.spec.name}`,
    ];
    if (obj.spec.characterSet) {
        const characterSet = etcd.kindIndex.characterset
            .find((cs) => obj.spec.characterSet === cs.spec.name);
        if (characterSet) {
            const mariaDBEquivalent = characterSet.spec.targetEquivalents.mariadb
                || characterSet.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                ret.push(`ALTER DATABASE ${obj.spec.name} DEFAULT CHARACTER SET = '${mariaDBEquivalent}'`);
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
                ret.push(`ALTER DATABASE ${obj.spec.name} DEFAULT COLLATE = '${mariaDBEquivalent}'`);
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
exports.default = transpileDatabase;
//# sourceMappingURL=database.js.map