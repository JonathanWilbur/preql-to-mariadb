import { APIObject, DatabaseSpec, Logger, APIObjectDatabase, CharacterSetSpec, CollationSpec } from "preql-core";

const transpileDatabase = async (obj: APIObject<DatabaseSpec>, logger: Logger, etcd: APIObjectDatabase): Promise<string[]> => {
    let ret: string[] = [
        `CREATE DATABASE IF NOT EXISTS ${obj.spec.name}`,
    ];

    if (obj.spec.characterSet) {
        const characterSet: APIObject<CharacterSetSpec> | undefined = etcd.kindIndex.characterset
            .find((cs): boolean => obj.spec.characterSet === cs.spec.name);
        if (characterSet) {
            const mariaDBEquivalent: string | undefined
                = characterSet.spec.targetEquivalents.mariadb
                || characterSet.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                ret.push(`ALTER DATABASE ${obj.spec.name} DEFAULT CHARACTER SET = '${mariaDBEquivalent}'`);
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
                ret.push(`ALTER DATABASE ${obj.spec.name} DEFAULT COLLATE = '${mariaDBEquivalent}'`);
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

export default transpileDatabase;
