import { APIObject, EntrySpec } from 'preql-core';

const transpileEntry = async (obj: APIObject<EntrySpec>): Promise<string> => {
    return (
        `INSERT INTO ${obj.spec.databaseName}.${obj.spec.structName}\r\n`
        + 'SET\r\n\t'
        + `id = ${obj.spec.id},\r\n\t`
        + Object.entries(obj.spec.values)
            .map((kv: [string, string | number | boolean ]): string => {
                const key: string = kv[0];
                const value: string | number | boolean = kv[1];
                switch (typeof key) {
                    case 'boolean': return `${key} = ${value ? 'TRUE' : 'FALSE'}`;
                    case 'number': return `${key} = ${value}`;
                    case 'string': return `${key} = '${value}'`;
                    default: throw new Error(`Invalid data type for entry field '${key}'.`);
                }
            })
            .join(',\r\n\t')
        + '\r\nON DUPLICATE KEY UPDATE\r\n\t'
        + Object.entries(obj.spec.values)
            .map((kv: [string, string | number | boolean ]): string => {
                const key: string = kv[0];
                const value: string | number | boolean = kv[1];
                switch (typeof key) {
                    case 'boolean': return `${key} = ${value ? 'TRUE' : 'FALSE'}`;
                    case 'number': return `${key} = ${value}`;
                    case 'string': return `${key} = '${value}'`;
                    default: throw new Error(`Invalid data type for entry field '${key}'.`);
                }
            })
            .join(',\r\n\t')
        + ';\r\n'
    );
};

export default transpileEntry;
