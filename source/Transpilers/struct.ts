import { APIObject, StructSpec, SuggestedTargetObjectHandler } from 'preql-core';

const transpileStruct: SuggestedTargetObjectHandler = async (obj: APIObject<StructSpec>): Promise<string> => {
    return `CREATE TABLE IF NOT EXISTS ${obj.spec.databaseName}.${obj.spec.name} (__placeholder__ BOOLEAN);`;
};

export default transpileStruct;
