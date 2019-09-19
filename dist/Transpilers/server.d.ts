import { APIObject, ServerSpec, Logger, APIObjectDatabase } from "preql-core";
declare const transpileServer: (obj: APIObject<ServerSpec>, logger: Logger, etcd: APIObjectDatabase) => Promise<string[]>;
export default transpileServer;
//# sourceMappingURL=server.d.ts.map