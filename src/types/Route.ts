interface Route {
    path: string;
    method: string;
    middles: string[];
    handler: string;
    body: string[]
};
export type {
    Route
};