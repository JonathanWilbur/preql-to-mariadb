import { APIObject, DatabaseSpec, Logger, APIObjectDatabase } from "preql-core";
declare const transpileDatabase: (obj: APIObject<DatabaseSpec>, logger: Logger, etcd: APIObjectDatabase) => Promise<string[]>;
export default transpileDatabase;
//# sourceMappingURL=database.d.ts.map