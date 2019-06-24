import { APIObject, PostambleSpec, SuggestedTargetObjectHandler } from 'preql-core';
import commentOut from '../commentOut';

const transpilePostamble: SuggestedTargetObjectHandler = async (obj: APIObject<PostambleSpec>): Promise<string> => {
    return commentOut(obj.spec.uncommentedText);
};

export default transpilePostamble;
