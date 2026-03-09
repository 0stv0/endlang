interface Response
{
    status: (code: number) => Response;
    setJson: (body: Record<string, any>) => Response;
    setHeader: (name: string, value: string | string[]) => Response;
    setResponse: (code: number, body: Record<string, any>) => Response;
    setNoCache: () => Response;
    setAuthHeader: (token: string) => Response;
};
export type { Response };