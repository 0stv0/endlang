import type { Server } from "../server/Server.js";
import type { Route } from "../types/Route.js";
import type { AST, BodyNode, DescNode, GroupNode, HandlerNode, MethodNode, MiddleNode, PathNode, QueryNode } from "./ast.js";

class Interpreter {
    private readonly ast: AST;
    constructor(ast: AST)
    {
        this.ast = ast;
    };
    public interprete = async(server: Server): Promise<void> =>
    {
        let path: PathNode | undefined     = this.ast.statements.find(s => s.type === 'PathStatement');
        let method: MethodNode | undefined = this.ast.statements.find(s => s.type === 'MethodStatement');
        if (!path || !method)
            throw new Error(`Interpeter error: No path or method!`);

        let handler: HandlerNode | undefined = this.ast.statements.find(s => s.type === 'HandlerStatement');
        if (!handler)
            throw new Error(`Interpeter error: No handler in route! (${path.path})`);

        let middles: MiddleNode | undefined = this.ast.statements.find(s => s.type === 'MiddleStatement');
        let mHandlers: string[] = middles ? middles.handlers : [];

        let fullPath: string = path.path;
        let group: GroupNode | undefined = this.ast.statements.find(s => s.type === 'GroupStatement');
        if (group)
            fullPath = group.group + fullPath;

        let body: BodyNode | undefined    = this.ast.statements.find(s => s.type === 'BodyStatement');
        let query: QueryNode | undefined  = this.ast.statements.find(s => s.type === 'QueryStatement');
        let desc: DescNode | undefined    = this.ast.statements.find(s => s.type === 'DescStatement');
        let route: Route = {
            path: fullPath,
            method: method.method,
            handler: handler.handler,
            middles: mHandlers,
            body: body?.required ?? [],
            query: query?.required ?? [],
            description: desc?.description ?? ''
        };
        server.addRoute(route);
    };
};
export { Interpreter };