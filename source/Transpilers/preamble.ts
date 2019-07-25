import { APIObject, PreambleSpec } from 'preql-core';
import commentOut from '../commentOut';

const transpilePreamble = async (obj: APIObject<PreambleSpec>): Promise<string> => {
    return commentOut(obj.spec.uncommentedText);
};

export default transpilePreamble;
