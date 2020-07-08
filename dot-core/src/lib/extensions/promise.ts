
interface PromiseConstructor {
    runSerial(promises: (() => Promise<any>)[]): Promise<any>;
    retry(task: () => Promise<any>, delay?: number | ((retry: number) => number), maxRetry?: number,
        retryCallback?: (error: any, retry: number) => void): Promise<any>;
}

Promise.runSerial = function (tasks: (() => Promise<any>)[]): Promise<any[]> {
    return tasks.reduce((previusPromise, currentPromise) => {
        return previusPromise.then((results) => {
            return currentPromise().then((currentResult) => {
                return results.concat(currentResult);
            });
        });
    }, Promise.resolve([]));
};

Promise.retry = function(task: () => Promise<any>, delay?: number | ((retry: number) => number), maxRetry?: number,
    retryCallback?: (error: any, retry: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
        let error;
        let retry = 0;

        const attempt = function() {
            if (typeof maxRetry === 'number' && maxRetry > 0 && retry >= maxRetry) {
                reject(error);
                return;
            }

            task().then(resolve).catch((e) => {
                retry++;
                error = e;
                if (typeof retryCallback === 'function') {
                    retryCallback(e, retry);
                }

                const currentDelay = typeof delay === 'function' ? delay(retry) : delay || 0;
                setTimeout(() => { attempt(); }, currentDelay);
            });
        };
        attempt();
    });
};
