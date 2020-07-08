export class LogLevel {

    // values
    static OFF = new LogLevel('OFF', 0);
    static ERROR = new LogLevel('ERR', 1);
    static WARN = new LogLevel('WRN', 2);
    static INFO = new LogLevel('INF', 3);
    static DEBUG = new LogLevel('DBG', 4);

    toString(): string {
        return this.text;
    }

    get priority(): number {
        return this._priority;
    }

    private constructor(private text: string,
        private _priority: number) {
    }
}

LogLevel[0] = LogLevel.OFF;
LogLevel[1] = LogLevel.ERROR;
LogLevel[2] = LogLevel.WARN;
LogLevel[3] = LogLevel.INFO;
LogLevel[4] = LogLevel.DEBUG;
