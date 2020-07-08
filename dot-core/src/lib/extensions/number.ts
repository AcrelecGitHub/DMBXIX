interface Number {
    pad(length: number): string;
}

/**
 * Pads the number to the required number of digits
 *
 * @param length Number of characters to return
 * @return Padded string
 */
Number.prototype.pad = function (length: number): string {
    const str: string = this.toString();
    return str.lpad('0', length);
};
