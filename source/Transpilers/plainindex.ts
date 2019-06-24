import { APIObject, PlainIndexSpec, SuggestedTargetObjectHandler } from 'preql-core';

const transpilePlainIndex: SuggestedTargetObjectHandler = async (obj: APIObject<PlainIndexSpec>): Promise<string> => {
    const columnString: string = obj.spec.keyColumns
        .map((key): string => `${key.name} ${(key.ascending ? 'ASC' : 'DESC')}`)
        .join(', ');
    return (
        `ALTER TABLE ${obj.spec.databaseName}.${obj.spec.structName}\r\n`
        + `ADD INDEX IF NOT EXISTS ${obj.spec.name}\r\n`
        + `PRIMARY KEY (${columnString});`
    );
};

export default transpilePlainIndex;
