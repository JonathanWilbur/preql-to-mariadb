import { APIObject, DatabaseSpec, SuggestedTargetObjectHandler } from 'preql-core';

const transpileDatabase: SuggestedTargetObjectHandler = async (obj: APIObject<DatabaseSpec>): Promise<string> => {
    return `CREATE DATABASE IF NOT EXISTS ${obj.spec.name};`
};

export default transpileDatabase;
