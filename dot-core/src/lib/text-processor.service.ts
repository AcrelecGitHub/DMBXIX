import { Injectable } from '@angular/core';
import { Log } from './logger/log';


@Injectable({
  providedIn: 'root'
})
export class TextProcessorService {

    private readonly replaceMap = {
        '|': '<br/>'
    };

    constructor() {}

    processText(input: string): string {
        try {
            Object.keys(this.replaceMap).forEach(key => {
                input = input.replaceAll(key, this.replaceMap[key]);
            });
        } catch (error) {
            Log.debug('error when replace text: {0}', error);
        }
        return input;
    }
}
