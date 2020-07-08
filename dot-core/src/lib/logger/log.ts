import { LogLevel } from './log-level';

type Logger = (message?: any, ...optionalParams: any[]) => void;

/**
 * Log responsable for logging messages through entire application.
 */
export class Log {
    private static lastTime = 0;

    private static level: LogLevel = LogLevel.DEBUG;

    private static formatDate(date: Date): string {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const milliseconds = date.getMilliseconds();

        const formatedTime = [hours.pad(2), minutes.pad(2), seconds.pad(2), '.', milliseconds.pad(3)].join('');

        const month = date.getMonth() + 1;
        const day = date.getDate();

        const formatedDate = [date.getFullYear(), month.pad(2), day.pad(2)].join('');
        return `${formatedDate} ${formatedTime}`;
    }

    private static formatData(data: any): string {
        if (data instanceof Error) {
            return data.stack;
        }

        if (typeof data === 'object') {
            try {
                return JSON.stringify(data);
            } catch {
                return data;
            }
        }

        if (typeof data === 'string') {
            return data;
        }

        return String(data);
    }

    private static log(level: LogLevel, logger: Logger, message: any, args: any[]): void {
        try {
            if (level.priority > this.level.priority) {
                return;
            }

            const timestamp = new Date();
            const formattedTimestamp = this.formatDate(timestamp);
            const formattedMessage = String.compositeFormat(this.formatData(message), ...args.map(this.formatData));

            const logMessage = String.compositeFormat('{0} {1}: {2}',
                formattedTimestamp, level, formattedMessage);

            logger(logMessage);
        } catch {
            // Nothing to do if failed to log the message
        }
    }

    public static error(message: any, ...args: any[]): void {
        // tslint:disable-next-line: no-console
        this.log(LogLevel.ERROR, console.error, message, args);
    }

    public static warn(message: any, ...args: any[]): void {
        // tslint:disable-next-line: no-console
        this.log(LogLevel.WARN, console.warn, message, args);
    }

    public static info(message: any, ...args: any[]): void {
        // tslint:disable-next-line: no-console
        this.log(LogLevel.INFO, console.info, message, args);
    }

    public static debug(message: any, ...args: any[]): void {
        // tslint:disable-next-line: no-console
        this.log(LogLevel.DEBUG, console.debug, message, args);
    }

    public static timestamp(message: string, ...args: any[]) {
        const currentTime = new Date().getTime();
        const diffTime = currentTime - Log.lastTime;
        // tslint:disable-next-line: no-console
        this.log(LogLevel.DEBUG, console.debug, 'Elapsed - ' + diffTime + ' : ' + message, args);
        Log.lastTime = currentTime;

    }
}
