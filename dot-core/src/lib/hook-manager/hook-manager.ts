import { Hook } from './hook';
import { Log } from '../logger/log';

export class HookManager {
    private static hooks: {
        [name: string]: Hook;
    } = {};

    public static register(name: string, hook: Hook): void {
        if (HookManager.hooks.hasOwnProperty(name)) {
            Log.warn('Existing definition for hook {0} will be replaced!', name);
        }

        HookManager.hooks[name] = hook;
        Log.info('Hook {0} registered!', name);
    }

    public static get(name: string): Hook {
        return HookManager.hooks[name];
    }
}
