import { Injectable } from '@angular/core';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';


@Injectable({
    providedIn: 'root'
})
export class AtpFilesSystemService {

    constructor() { }

    /**
     *
     * @param folderName: string
     */
    async createDirectory(folderName: string) {
        return MBirdSdk.Directory.Create(folderName);
    }

    /**
     *
     * @param folderName: string
     */
    async deleteDirectory(folderName: string) {
        return MBirdSdk.Directory.Delete(folderName);
    }

    /**
     *
     * @param filePath: string
     * @param fileContent: string
     */
    async writeFile(filePath: string, fileContent: string, append: boolean = false) {
        return MBirdSdk.File.Write(filePath, fileContent, append);
    }

    /**
     *
     * @param filePath: string
     */
    async deleteFile(filePath: string) {
        return MBirdSdk.File.Delete(filePath);
    }

    /**
     *
     * @param path: string
     * @param url: string
     */
    async downloadFileFromPath(path: string, url: string) {
        return MBirdSdk.File.DownloadUrlTo(path, url);
    }

    /**
     *
     * @param path: string
     * @param filter: string
     */
    async getFileList(path: string, filter: string) {
        return MBirdSdk.Directory.List(path, filter);
    }

}
