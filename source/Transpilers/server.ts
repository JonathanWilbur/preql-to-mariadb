import { APIObject, ServerSpec, Logger, APIObjectDatabase, CharacterSetSpec, CollationSpec } from "preql-core";
import { offsetOf, Timezone } from "tz-offset";

const transpileServer = async (obj: APIObject<ServerSpec>, logger: Logger, etcd: APIObjectDatabase): Promise<string> => {
    let ret = `DELIMITER $$\r\nIF @@hostname = '${obj.spec.hostname}' OR @@logical_server_name = '${obj.spec.name}' THEN\r\n\tDO 0;\r\n`;

    if (obj.spec.timezone) {
        const offsetInMinutes: number = offsetOf(obj.spec.timezone as Timezone);
        const offsetHourString: string = Math.floor(Math.abs(offsetInMinutes) / 60).toString().padStart(2, "0");
        const offsetMinuteString: string = (Math.abs(offsetInMinutes) % 60).toString().padStart(2, "0");
        const offsetString: string = `${offsetInMinutes < 0 ? "-" : ""}${offsetHourString}:${offsetMinuteString}`;
        ret += `\tSET @@time_zone = '${offsetString}';\r\n`;
    }

    if (obj.spec.characterSet) {
        const characterSet: APIObject<CharacterSetSpec> | undefined = etcd.kindIndex.characterset
            .find((cs): boolean => obj.spec.characterSet === cs.spec.name);
        if (characterSet) {
            const mariaDBEquivalent: string | undefined
                = characterSet.spec.targetEquivalents.mariadb
                || characterSet.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                ret += `\tSET @@character_set_server = '${mariaDBEquivalent}';\r\n`;
                ret += `\tSET @@character_set_database = '${mariaDBEquivalent}';\r\n`;
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
                ret += `\tSET @@collation_server = '${mariaDBEquivalent}';\r\n`;
                ret += `\tSET @@collation_database = '${mariaDBEquivalent}';\r\n`;
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

    ret += "END IF;\r\nDELIMITER ;";
    return ret;
};

export default transpileServer;
