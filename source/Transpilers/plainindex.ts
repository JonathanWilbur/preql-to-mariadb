import { APIObject, PlainIndexSpec } from "preql-core";

const transpilePlainIndex = async (obj: APIObject<PlainIndexSpec>): Promise<string> => {
    const columnString: string = obj.spec.keyAttributes
        .map((key): string => `${key.name} ${(key.ascending ? "ASC" : "DESC")}`)
        .join(", ");
    return (
        `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.structName}\r\n`
        + `ADD INDEX IF NOT EXISTS ${obj.spec.name}\r\n`
        + `PRIMARY KEY (${columnString});`
    );
};

export default transpilePlainIndex;
