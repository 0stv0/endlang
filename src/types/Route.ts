interface Route {
    path: string;
    method: string;
    middles: string[];
    handler: string;
    body: string[];
    query: string[];
    description: string;
    max_size: number;
};
export type {
    Route
};