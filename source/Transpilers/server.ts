import { APIObject, ServerSpec, Logger, APIObjectDatabase, CharacterSetSpec, CollationSpec } from "preql-core";
// import { offsetOf, Timezone } from "tz-offset";

const transpileServer = async (obj: APIObject<ServerSpec>, logger: Logger, etcd: APIObjectDatabase): Promise<string[]> => {
    /**
     * I don't know if IF statements count as a multiple statement or just one,
     * but using the IF statement method may be undesirable anyway. For now,
     * this just returns nothing. It may be wiser to conditionally configure
     * the server outside of the transpiled SQL.
     */
    return [];
};

export default transpileServer;
