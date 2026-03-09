interface Request
{
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, string>;
    body: Record<string, any>;
};
export type { Request };