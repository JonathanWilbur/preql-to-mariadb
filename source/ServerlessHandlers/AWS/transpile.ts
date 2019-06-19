import { Handler, Context, Callback } from 'aws-lambda';
import { APIObject, validateObject, validateNamespace, indexObjects, getEntries } from 'preql-core';
import normalizeError from '../../normalizeError';
import transpile from '../../Commands/transpile';
import ConsoleLogger from '../../ConsoleLogger';

const loggy: ConsoleLogger = new ConsoleLogger();

const handler: Handler = async (
  event: { objects: APIObject[], namespace?: string },
  context: Context,
  callback: Callback<object>,
) => {
  // REVIEW: Handle JSON and YAML strings, too?
  if (!(typeof event === 'object')) callback(new Error('Event was not of an object type.'));
  if (!event.objects) callback(new Error('Event was supposed to have an `objects` field.'));
  try {
    await Promise.all(event.objects.map(validateObject));
    const namespaces = await indexObjects(event.objects);
    await Promise.all(Object.values(namespaces).map(validateNamespace));
    const transpilation: string = await transpile(namespaces[event.namespace || 'default'], loggy);
    callback(null, {
        value: transpilation,
    });
  } catch (e) {
    callback(normalizeError(e));
  }
};

export default handler;
