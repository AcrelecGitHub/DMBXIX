export interface ToastMessage {
    type: 'info' | 'warning' | 'error';
    value: string;
    timeout: number;
}
