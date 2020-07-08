interface Array<T> {
    groupBy(selector: string | ((value: T) => any)): T[][];

    distinct(): T[];

    first(): T;

    last(): T;

    remove(value: T): void;

    clone(): T[];

    contains(value: T): boolean;

    next(current: T): T;

    previous(current: T): T;

    replace(searchValue: T, replaceValue: T): boolean;
}

interface ArrayConstructor {
    sequenceEquals<T, U>(a: T[], b: U[], compareFunction?: (a: T, b: U) => boolean): boolean;
}

/**
 * Groups an array using a defined selector keeping the order of the selector on the source
 *
 * @param Array to be grouped
 * @param selector to group the items. Must be a property name of the array item or a function that returns it
 * @return Array of arrays of grouped items
 */
Array.prototype.groupBy = function (selector: string | ((value: any) => any)): any[][] {
    const groups = [];
    const order = [];
    const result = [];
    let functionSelector: (value: any) => any;

    if (typeof selector === 'string') {
        functionSelector = (value: any) => value[selector];
    } else {
        functionSelector = selector as (value: any) => any;
    }

    this.forEach(function (item) {
        const group = functionSelector(item);

        if (order[order.length - 1] !== group) {
            order.push(group);
        }

        groups[group] = groups[group] || [];
        groups[group].push(item);
    });

    order.forEach(function (property) {
        result.push(groups[property]);
    });

    return result;
};

Array.prototype.distinct = function(): any[] {
    const distinct = this.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
    return distinct;
};

Array.prototype.first = function(): any {
    return this.length > 0 ? this[0] : undefined;
};

Array.prototype.last = function(): any {
    return this.length > 0 ? this[this.length - 1] : undefined;
};

Array.prototype.remove = function(value: any): void {
    const index = this.indexOf(value);
    if (index >= 0) {
        this.splice(index, 1);
    }
};

Array.prototype.clone = function(): any[] {
    return this.slice(0);
};

Array.prototype.contains = function(value: any): boolean {
    return this.indexOf(value) >= 0;
};

Array.prototype.next = function(current: any): any {
    if (this.length === 0) {
        return undefined;
    }

    const index = this.indexOf(current);
    return this[(index + 1) % this.length];
};

Array.prototype.previous = function(current: any): any {
    if (this.length === 0) {
        return undefined;
    }

    let index = this.indexOf(current);
    if (index - 1 < 0) {
        index = this.length;
    }
    return this[index - 1];
};

Array.prototype.replace = function(searchValue: any, replaceValue: any): boolean {
    const index = this.indexOf(searchValue);
    if (index >= 0) {
        this.splice(index, 1, replaceValue);
        return true;
    }
    return false;
};

Array.sequenceEquals = function(a: any[], b: any[], compareFunction?: (a: any, b: any) => boolean): boolean {
    if (typeof(compareFunction) !== 'function') {
        compareFunction = (_a, _b) => _a === _b;
    }

    if (!(a instanceof Array) || !(b instanceof Array)) {
        return false;
    }

    if (a.length !== b.length) {
        return false;
    }

    const count = a.length;

    for (let i = 0; i < count; i++) {
        if (!compareFunction(a[i], b[i])) {
            return false;
        }
    }

    return true;
};
