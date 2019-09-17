import { APIObject, APIObjectDatabase, AttributeSpec, Logger } from "preql-core";
declare const transpileAttribute: (obj: APIObject<AttributeSpec>, logger: Logger, etcd: APIObjectDatabase) => Promise<string>;
export default transpileAttribute;
//# sourceMappingURL=attribute.d.ts.map