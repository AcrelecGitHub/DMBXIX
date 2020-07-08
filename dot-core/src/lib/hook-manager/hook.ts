export interface Hook {
    context?: any;
    before?: (...args: any[]) => void | boolean | Promise<void> | Promise<boolean>;
    after?: (...args: any[]) => void | Promise<void>;
}
