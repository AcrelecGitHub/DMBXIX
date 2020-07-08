export interface CODProduct {
    code: string;
    name: string;
    media: string;
    quantity: number;
    price: {
        value: number;
        type: 'points' | 'currency'
    };
    items: CODProduct[];
    type: 'product' | 'choice';
    selected?: boolean;
}
