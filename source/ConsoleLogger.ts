import { Logger } from 'preql-core';

export default
class ConsoleLogger implements Logger {
    debug(event: string): void {
        if (console) console.debug(event);
    }
    info(event: string): void {
        if (console) console.info(event);
    }
    warn(event: string): void {
        if (console) console.warn(event);
    }
    error(event: string): void {
        if (console) console.error(event);
    }
};
