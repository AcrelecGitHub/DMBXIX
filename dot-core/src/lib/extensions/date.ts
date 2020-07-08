interface Date {
    format(pattern: string): string;
}

/**
 * Format a date with the given pattern. If no pattern provided, default 'toString' will be used.
 *
 * @param pattern Pattern used to format the date.
 * @return Formatted date
 */
Date.prototype.format = function (pattern: string): string {
    if (!pattern) {
        return this.toString();
    }

    let formattedDate = pattern;

    const dateFormatters: { token: string; format: (value: Date) => string }[] = [
        { token: 'yyyy', format: (value: Date) => value.getFullYear().pad(4) },
        { token: 'yy', format: (value: Date) => (value.getFullYear() % 100).pad(2) },
        { token: 'y', format: (value: Date) => value.getFullYear().toString() },
        { token: 'MM', format: (value: Date) => (value.getMonth() + 1).pad(2) },
        { token: 'M', format: (value: Date) => (value.getMonth() + 1).toString() },
        { token: 'dd', format: (value: Date) => value.getDate().pad(2) },
        { token: 'd', format: (value: Date) => value.getDate().toString() },
        { token: 'a', format: (value: Date) => (value.getHours() >= 12) ? 'pm' : 'am' },
        { token: 'HH', format: (value: Date) => value.getHours().pad(2) },
        { token: 'H', format: (value: Date) => value.getHours().toString() },
        {
            token: 'hh',
            format: (value: Date) => {
                const hours = value.getHours();
                return (hours > 12 ? hours - 12 : hours).pad(2);
            }
        },
        {
            token: 'h',
            format: (value: Date) => {
                const hours = value.getHours();
                return (hours > 12 ? hours - 12 : hours).toString();
            }
        },
        { token: 'mm', format: (value: Date) => value.getMinutes().pad(2) },
        { token: 'm', format: (value: Date) => value.getMinutes().toString() },
        { token: 'ss', format: (value: Date) => value.getSeconds().pad(2) },
        { token: 's', format: (value: Date) => value.getSeconds().toString() },
        { token: 'SSS', format: (value: Date) => value.getMilliseconds().pad(3) },
        { token: 'SS', format: (value: Date) => Math.round(value.getMilliseconds() / 10).pad(2) },
        { token: 'S', format: (value: Date) => Math.round(value.getMilliseconds() / 100).pad(1) },
    ];

    for (const formatter of dateFormatters) {
        formattedDate = formattedDate.replace(formatter.token, (_token) => formatter.format(this));
    }

    return formattedDate;
};
