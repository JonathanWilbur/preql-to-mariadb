"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tz_offset_1 = require("tz-offset");
const transpileServer = async (obj, logger, etcd) => {
    let ret = `DELIMITER ;;\r\nIF @@hostname = '${obj.spec.hostname}' OR @@logical_server_name = '${obj.spec.name}' THEN\r\n\tDO 0;\r\n`;
    if (obj.spec.timezone) {
        const offsetInMinutes = tz_offset_1.offsetOf(obj.spec.timezone);
        const offsetHourString = Math.floor(Math.abs(offsetInMinutes) / 60).toString().padStart(2, "0");
        const offsetMinuteString = (Math.abs(offsetInMinutes) % 60).toString().padStart(2, "0");
        const offsetString = `${offsetInMinutes < 0 ? "-" : ""}${offsetHourString}:${offsetMinuteString}`;
        ret += `\tSET @@time_zone = '${offsetString}';\r\n`;
    }
    if (obj.spec.characterSet) {
        const characterSet = etcd.kindIndex.characterset
            .find((cs) => obj.spec.characterSet === cs.spec.name);
        if (characterSet) {
            const mariaDBEquivalent = characterSet.spec.targetEquivalents.mariadb
                || characterSet.spec.targetEquivalents.mysql;
            if (mariaDBEquivalent) {
                ret += `\tSET @@character_set_server = '${mariaDBEquivalent}';\r\n`;
                ret += `\tSET @@character_set_database = '${mariaDBEquivalent}';\r\n`;
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
                ret += `\tSET @@collation_server = '${mariaDBEquivalent}';\r\n`;
                ret += `\tSET @@collation_database = '${mariaDBEquivalent}';\r\n`;
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
    ret += "END IF ;;\r\nDELIMITER ;";
    return ret;
};
exports.default = transpileServer;
//# sourceMappingURL=server.js.map