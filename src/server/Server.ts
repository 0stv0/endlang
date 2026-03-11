import path from "path";
import type { Route } from "../types/Route.js";
import fs from 'fs/promises';
import { Lexer } from "../lang/lexer.js";
import { Parser } from "../lang/parser.js";
import { Interpreter } from "../lang/interpreter.js";
import http, { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from "../types/Request.js";
import type { Response } from "../types/Response.js";
import type { ServerConfig } from "./ServerConfig.js";

type Handler = (req: Request, res: Response) => Promise<void>;
type Middle  = (req: Request) => Promise<[boolean, Record<string, any>]>
class Server {
    private readonly port: number;
    private readonly cb: () => Promise<void>;
    private routes: Route[];
    private readonly config?: ServerConfig;
    constructor(port: number, cb: () => Promise<void>, config?: ServerConfig)
    {
        this.port   = port;
        this.routes = [];
        this.cb     = cb;
        if (config)
            this.config = config;
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
    private getBody = (req: IncomingMessage, max?: number): Promise<[boolean, string]> => new Promise((resolve, reject) =>
    {
        let body         = '';
        let size: number = -1;
        req.on('data', (chunk) =>
        {
            body += chunk.toString();
            size += chunk.length;
            if (max && size > max)
                resolve([false, body]);
        });
        req.on('end', () =>
        {
            resolve([true, body]);
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

        // CORS
        if (this.config && this.config.cors)
            res.setHeader('Access-Control-Allow-Origin', this.config.cors);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
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
                const raw: [boolean, string] = route.max_size ? 
                    await this.getBody(req, route.max_size) :
                    await this.getBody(req);
                if (raw[0])
                    return this.writeResponse(res, 403, {error: 'Payload too big.'}, {});
                else
                    body = JSON.parse(raw[1]);
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

        // Query Checker
        if (route.query.length > 0)
        {
            let sent: string[] = Object.keys(query);
            let rqd: string[]  = route.query;
            
            let missing: string[] = rqd.filter(f => !sent.includes(f));
            let extra: string[]   = sent.filter(f => !rqd.includes(f));

            if (extra.length > 0 || missing.length > 0)
            {
                this.writeResponse(res, 403, {error: 'Invalid request query.'}, {});
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
    private createDocs = async(method: string) =>
    {
        let added: number   = 0;
        let content: string = `## ${method} Endpoints`;
        let routes: Route[] = this.routes.filter(r => r.method === method);
        if (routes.length > 0)
        {
            for (let route of routes)
            {
                let part: string = `\n\n### [#${++added}] ${route.path}`;

                part += `\nHandler: ${route.handler}`;
                
                if (route.middles.length > 0)
                    part += `\nMiddlewares: [${route.middles.join(',')}]`;
                if (route.description !== '')
                    part += `\nDescription: ${route.description}`;
                if (route.query.length > 0)
                    part += `\nQuery Scheme: [${route.query.join(',')}]`;
                if (route.body.length > 0)
                    part += `\nBody Scheme: [${route.body.join(',')}]`;

                content += part;
            };
        };
        if (added > 0)
            await fs.writeFile(path.join(process.cwd(), "docs", `${method}.md`), content);
    };
    private dirExists = async(url: string): Promise<boolean> =>
    {
        try
        {
            await fs.access(url);
            return true;
        }
        catch
        {
            return false;
        }
    };
    public listen = async(): Promise<void> =>
    {
        let sv: http.Server = http.createServer(this.handleRoute);
        sv.listen(this.port, async() => 
        {
            let url: string     = path.join(process.cwd(), "endpoints");
            let files: string[] = (await fs.readdir(url, {recursive: true})).filter(f => f.endsWith(".endpoint"));
            
            for (let file of files)
            {
                let input: string  = (await fs.readFile(path.join(url, file))).toString();
                let lexer: Lexer   = new Lexer(input);
                let parser: Parser = new Parser(lexer.tokens());
                await (new Interpreter(parser.parse()).interprete(this));
                console.log(`Loaded endpoint from: ${file}`);
            };

            if (this.config && this.config.generateDocs)
            {
                let dir: string = path.join(process.cwd(), "docs");
                if (!(await this.dirExists(dir)))
                    await fs.mkdir(dir);
                this.createDocs('GET');
                this.createDocs('POST');
                this.createDocs('PUT');
                this.createDocs('DELETE');
            };
            await this.cb();
        });
    };
};
export { Server, type Handler, type Middle };