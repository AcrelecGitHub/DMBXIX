interface String {

    lpad(padString: string, length: number): string;

    rpad(padString: string, length: number): string;

    trim(): string;

    ltrim(): string;

    rtrim(): string;

    replaceAll(search: string, replacement: string): string;

}

/**
 * Pads the left-side of the string
 *
 * @param padString String to be padded to the left
 * @param length Number of characters to return
 * @return Padded string
 */
String.prototype.lpad = function (padString: string, length: number): string {
    let str: string = this;
    while (str.length < length) {
        str = padString + str;
    }
    return str;
};

/**
 * Pads the right-side of the string
 *
 * @param padString String to be padded to the right
 * @param length Number of characters to return
 * @return Padded string
 */
String.prototype.rpad = function (padString: string, length: number): string {
    let str: string = this;
    while (str.length < length) {
        str = str + padString;
    }
    return str;
};

/**
 * Trims the string
 *
 * @return trimmed string
 */
String.prototype.trim = function (): string {
    const str: string = this;
    return str.replace(/^\s+|\s+$/g, '');
};

/**
 * Left trims the string
 *
 * @return trimmed string
 */
String.prototype.ltrim = function (): string {
    const str: string = this;
    return str.replace(/^\s+/, '');
};

/**
 * Right trims the string
 *
 * @return trimmed string
 */
String.prototype.rtrim = function (): string {
    return this.replace(/\s+$/, '');
};

/**
 * Replaces all strings
 *
 * @return trimmed string
 */
String.prototype.replaceAll = function (search: string, replacement: string = ''): string {
    if (!search) {
        return this;
    }
    return this.split(search).join(replacement);
};

interface StringConstructor {

    compositeFormat(text: string, ...args: any[]): string;

    isNullOrWhitespace(text: string): boolean;

}

String.compositeFormat = function (text: string, ...args: any[]): string {
    const formattedText = text.replace(/{(\d+)}/g, (token, matchIndex) => {
        return (typeof args[matchIndex] !== 'undefined' ? args[matchIndex] : token);
    });

    return formattedText;
};

String.isNullOrWhitespace = function (text: string): boolean {
    return (typeof(text) !== 'string' || text.trim().length === 0);
};
