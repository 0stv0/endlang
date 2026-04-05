interface Route {
    path: string;
    method: string;
    middles: string[];
    handler: string;
    body: string[];
    query: string[];
    description: string;
};
export type {
    Route
};