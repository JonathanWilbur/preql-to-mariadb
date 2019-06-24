import { APIObject, PreambleSpec, SuggestedTargetObjectHandler } from 'preql-core';
import commentOut from '../commentOut';

const transpilePreamble: SuggestedTargetObjectHandler = async (obj: APIObject<PreambleSpec>): Promise<string> => {
    return commentOut(obj.spec.uncommentedText);
};

export default transpilePreamble;
