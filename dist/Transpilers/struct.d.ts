import { APIObject, StructSpec, Logger, APIObjectDatabase } from "preql-core";
declare const transpileStruct: (obj: APIObject<StructSpec>, logger: Logger, etcd: APIObjectDatabase) => Promise<string>;
export default transpileStruct;
//# sourceMappingURL=struct.d.ts.map