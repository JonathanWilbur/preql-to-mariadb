import { APIObject, PostambleSpec } from 'preql-core';
import commentOut from '../commentOut';

const transpilePostamble = async (obj: APIObject<PostambleSpec>): Promise<string> => {
    return commentOut(obj.spec.uncommentedText);
};

export default transpilePostamble;
