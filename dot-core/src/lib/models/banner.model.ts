export interface Banner {
    readonly media: string;
    readonly mimeType?: 'image' | 'video';
    readonly active: boolean;
    readonly interval: number;
    readonly order: number;
    readonly skin: string;
    readonly type: string;
}
