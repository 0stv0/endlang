import path from "path";
import type { Route } from "../types/Route.js";
import fs from 'fs/promises';
import { Lexer } from "../lang/lexer.js";
import { Parser } from "../lang/parser.js";
import { Interpreter } from "../lang/interpreter.js";
import http, { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from "../types/Request.js";
import type { Response } from "../types/Response.js";

type Handler = (req: Request, res: Response) => Promise<void>;
type Middle  = (req: Request) => Promise<[boolean, Record<string, any>]>
class Server {
    private readonly port: number;
    private readonly cb: () => Promise<void>;
    private routes: Route[];
    constructor(port: number, cb: () => Promise<void>)
    {
        this.port   = port;
        this.routes = [];
        this.cb     = cb;
    };
    public addRoute = async(route: Route): Promise<void> =>
    {
        this.routes.push(route);
    };
    private writeResponse = (res: ServerResponse, code: number, body: Record<string, any>, headers: Record<string, string | string[]>): void =>
    {
        res.writeHead(code, { ...headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
    };
    private getBody = (req: IncomingMessage): Promise<string> => new Promise((resolve, reject) =>
    {
        let body = '';
        req.on('data', (chunk) =>
        {
            body += chunk.toString();
        });
        req.on('end', () =>
        {
            resolve(body);
        });
        req.on('error', (e) =>
        {
            reject();
        });
    });
    private handleRoute = async(req: IncomingMessage, res: ServerResponse): Promise<void> =>
    {
        let { method, url } = req;
        let urlPart: string = (url as string).split("?")[0] as string;
        let route: Route | undefined = this.routes.find(r => r.path === urlPart && r.method === method);
        if (!route)
        {
            this.writeResponse(res, 404, {error: 'Not Found'}, {});
            return;
        };
        
        // Query Params
        let query: Record<string, string> = {};
        let furl: string                  = url as string;
        if (furl.split("?").length > 1)
        {
            let queryPart: string = furl.split("?")[1] as string;
            let parts: string[]   = queryPart.split("&");
            for (let part of parts)
            {
                let items: string[] = part.split("=");
                if (items.length !== 2 || items[1] === '')
                    continue;
                query[items[0] as string] = items[1] as string;
            };
        };

        // Body
        let body: Record<string, any> = {};
        if (method !== 'GET')
            try
            {
                const raw: string = await this.getBody(req);
                body = JSON.parse(raw);
            }
            catch
            {
                return this.writeResponse(res, 400, {error: 'Invalid JSON'}, {});
            }

        // Request
        let reqObj: Request = {
            path: urlPart,
            method: method as string,
            headers: req.headers,
            body: body,
            query: query
        };

        // Response
        let headers: Record<string, string | string[]> = {};

        let resCode: number              = 404;
        let resBody: Record<string, any> = {};
        let resObj: Response = {
            setResponse: (code, body) =>
            {
                resCode = code;
                resBody = body;
                return resObj;
            },
            status: (code) =>
            {
                resCode = code;
                return resObj;
            },
            setJson: (body) =>
            {
                resBody = body;
                return resObj;
            },
            setHeader: (name, value) =>
            {
                headers[name] = value;
                return resObj;
            },
            setNoCache: () =>
            {
                headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
                headers['Pragma']        = 'no-cache';
                headers['Expires']       = '0';
                return resObj;
            },
            setAuthHeader: (token: string) =>
            {
                headers['Authorization'] = `Bearer ${token}`;
                return resObj;
            }
        };

        // Body Checker
        if (route.body.length > 0 && route.method !== 'GET')
        {
            let sent: string[] = Object.keys(body);
            let rqd: string[]  = route.body;
            
            let missing: string[] = rqd.filter(f => !sent.includes(f));
            let extra: string[]   = sent.filter(f => !rqd.includes(f));

            if (extra.length > 0 || missing.length > 0)
            {
                this.writeResponse(res, 403, {error: 'Invalid request body.'}, {});
                return;
            }
        };

        // Middles
        if (route.middles.length > 0)
            for (let middle of route.middles)
            {
                let parts: string[] = middle.split('.');
                let module          = await import(path.join(process.cwd(), "dist", "middlewares", (parts[0] as string) + ".js"));

                let output: [boolean, Record<string, any>] = await module[parts[1] as string](reqObj);
                if (!output[0])
                {
                    this.writeResponse(res, 403, output[1], {});
                    return;
                }
            };
            

        // Handler
        let parts: string[] = route.handler.split('.');
        let module          = await import(path.join(process.cwd(), "dist", "handlers", (parts[0] as string) + ".js"));
        await module[parts[1] as string](reqObj, resObj);

        this.writeResponse(res, resCode, resBody, headers);
    };
    public listen = async(): Promise<void> =>
    {
        let sv: http.Server = http.createServer(this.handleRoute);
        sv.listen(this.port, async() => 
        {
            let url: string     = path.join(process.cwd(), "endpoints");
            let files: string[] = (await fs.readdir(url)).filter(f => f.endsWith(".endpoint"));
            
            for (let file of files)
            {
                let input: string  = (await fs.readFile(path.join(url, file))).toString();
                let lexer: Lexer   = new Lexer(input);
                let parser: Parser = new Parser(lexer.tokens());
                await (new Interpreter(parser.parse()).interprete(this));
                console.log(`Loaded endpoint from: ${file}`);
            };

            await this.cb();
        });
    };
};
export { Server, type Handler, type Middle };