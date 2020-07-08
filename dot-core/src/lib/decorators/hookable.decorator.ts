import { HookManager } from '../hook-manager/hook-manager';
import { Log } from '../logger/log';

import 'reflect-metadata';

const registeredHooks: string[] = [];

export function Hookable(name: string) {
    // Log.debug('Hookable decorator evaluated with name: {0}', name);
    if (registeredHooks.indexOf(name) >= 0) {
        throw new Error('Can not register same hook name [' + name + '] more than once.');
    }
    registeredHooks.push(name);

    return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => any | Promise<any>>) => {
        // Log.debug('Hookable decorator called for property: {0}', propertyKey);
        const isAsync = Reflect.getMetadata('design:returntype', target, propertyKey) === Promise;

        const method = descriptor.value;

        if (isAsync) {
            descriptor.value = async function(...args: any[]): Promise<any> {
                // Log.debug('Hooked function called! Hook name: {0}', name);
                const hook = HookManager.get(name);
                if (hook && typeof(hook.before) === 'function') {
                    try {
                        Log.debug('Calling before hook...');
                        const beforeResult = await hook.before.apply(hook.context || this, args);

                        Log.debug('Before hook result: {0}', beforeResult);
                        if (beforeResult === true) {
                            return;
                        }
                    } catch (ex) {
                        Log.error('Error calling beforeSetServiceType hook: {0}', ex);
                    }
                }

                const result = await method.apply(this, args);

                if (hook && typeof(hook.after) === 'function') {
                    try {
                        Log.debug('Calling after hook...');
                        await hook.after.apply(hook.context || this, args);

                        Log.debug('After hook executed.');
                    } catch (ex) {
                        Log.error('Error calling afterSetServiceType hook: {0}', ex);
                    }
                }

                return result;
            };
        } else {
            descriptor.value = function(...args: any[]): any {
                // Log.debug('Hooked function called! Hook name: {0}', name);
                const hook = HookManager.get(name);
                if (hook && typeof(hook.before) === 'function') {
                    try {
                        Log.debug('Calling before hook...');
                        const beforeResult = hook.before.apply(hook.context || this, args);
                        if (beforeResult instanceof Promise) {
                            throw new Error('Hook [' + name + '] does not allow async hooks.');
                        }

                        Log.debug('Before hook result: {0}', beforeResult);
                        if (beforeResult === true) {
                            return;
                        }
                    } catch (ex) {
                        Log.error('Error calling beforeSetServiceType hook: {0}', ex);
                    }
                }

                const result = method.apply(this, args);

                if (hook && typeof(hook.after) === 'function') {
                    try {
                        Log.debug('Calling after hook...');

                        const afterResult = hook.after.apply(hook.context || this, args);
                        if (afterResult instanceof Promise) {
                            throw new Error('Hook [' + name + '] does not allow async hooks.');
                        }

                        Log.debug('After hook executed.');
                    } catch (ex) {
                        Log.error('Error calling afterSetServiceType hook: {0}', ex);
                    }
                }

                return result;
            };
        }
    };
}
