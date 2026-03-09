import { getDefaultAST, type AST } from "./ast.js";
import type { Token } from "./lexer.js";

class Parser {
    private tokens: Token[];
    private cursor: number;

    constructor(tokens: Token[])
    {
        this.tokens = tokens;
        this.cursor = 0;
    };
    public parse = (): AST =>
    {
        let ast: AST = getDefaultAST();
        while (this.cursor < this.tokens.length)
        {
            let statement: any = this.parseStatement();
            if (statement)
                ast.statements.push(statement);
        };
        return ast;
    };
    private parseStatement = (): any =>
    {
        let currentToken: Token = this.tokens[this.cursor] as Token;
        if (currentToken.type === 'PATH')
        {
            this.cursor++;
            let pathToken: Token = this.tokens[this.cursor] as Token;
            if (!pathToken || pathToken.type !== 'CONTENT')
                throw new Error('Parser error: Expected content after path statement!');
            this.cursor++;

            let semicolon: Token = this.tokens[this.cursor] as Token;
            if (!semicolon || semicolon.type !== 'SEMICOLON')
                throw new Error('Parser error: Expected semicolon after path content!');
            this.cursor++;

            return {
                type: 'PathStatement',
                path: pathToken.value
            };
        }
        else if (currentToken.type === 'METHOD')
        {
            this.cursor++;
            let methodToken: Token = this.tokens[this.cursor] as Token;
            if (!methodToken || methodToken.type !== 'CONTENT' || !['GET', 'POST', 'DELETE', 'PUT'].includes(methodToken.value))
                throw new Error('Parser error: Wrong type of method!');
            this.cursor++;

            let semicolon: Token = this.tokens[this.cursor] as Token;
            if (!semicolon || semicolon.type !== 'SEMICOLON')
                throw new Error('Parser error: Expected semicolon after method type!');
            this.cursor++;

            return {
                type: 'MethodStatement',
                method: methodToken.value
            };  
        }
        else if (currentToken.type === 'MIDDLE')
        {
            this.cursor++;
            let middlesToken: Token = this.tokens[this.cursor] as Token;
            if (!middlesToken || middlesToken.type !== 'CONTENT')
                throw new Error('Parser error: Expected middleware handlers after middle statement!');
            this.cursor++;
            let semicolon: Token = this.tokens[this.cursor] as Token;
            if (!semicolon || semicolon.type !== 'SEMICOLON')
                throw new Error('Parser error: Expected semicolon after middle handlers!');
            this.cursor++;

            return {
                type: 'MiddleStatement',
                handlers: middlesToken.value.replaceAll(' ', '').split('&')
            };
        }
        else if (currentToken.type === 'HANDLER')
        {
            this.cursor++;
            let handlerToken: Token = this.tokens[this.cursor] as Token;
            if (!handlerToken || handlerToken.type !== 'CONTENT')
                throw new Error('Parser error: Expected path to function after handler statement!');
            this.cursor++;
            let semicolon: Token = this.tokens[this.cursor] as Token;
            if (!semicolon || semicolon.type !== 'SEMICOLON')
                throw new Error('Parser error: Expected semicolon after handler function!');
            this.cursor++;

            return {
                type: 'HandlerStatement',
                handler: handlerToken.value
            };
        }
        else if (currentToken.type === 'GROUP')
        {
            this.cursor++;
            let groupToken: Token = this.tokens[this.cursor] as Token;
            if (!groupToken || groupToken.type !== 'CONTENT')
                throw new Error('Parser error: Expected group name after group statement!');
            this.cursor++;
            let semicolon: Token = this.tokens[this.cursor] as Token;
            if (!semicolon || semicolon.type !== 'SEMICOLON')
                throw new Error('Parser error: Expected semicolon after group statement!');
            this.cursor++;

            return {
                type: 'GroupStatement',
                group: groupToken.value
            };
        }
        else if (currentToken.type === 'DESC')
        {
            this.cursor++;
            let descToken: Token = this.tokens[this.cursor] as Token;
            if (!descToken || descToken.type !== 'CONTENT')
                throw new Error('Parser error: Expected content after desc statement!');
            this.cursor++;
            let semicolon: Token = this.tokens[this.cursor] as Token;
            if (!semicolon || semicolon.type !== 'SEMICOLON')
                throw new Error('Parser error: Expected semicolon after desc statement!');
            this.cursor++;

            return {
                type: 'DescStatement',
                description: descToken.value
            };
        }
        else if (currentToken.type === 'BODY')
        {
            this.cursor++;
            let bodyToken: Token = this.tokens[this.cursor] as Token;
            if (!bodyToken || bodyToken.type !== 'CONTENT')
                throw new Error('Parser error: Expected body after body statement!');
            this.cursor++;
            let semicolon: Token = this.tokens[this.cursor] as Token;
            if (!semicolon || semicolon.type !== 'SEMICOLON')
                throw new Error('Parser error: Expected semicolon after body statement!');
            this.cursor++;

            let body: string = bodyToken.value;
            return {
                type: 'BodyStatement',
                required: body.replaceAll('{', '').replaceAll('}', '').replaceAll(' ', '').split(',').filter(i => i !== '')
            };
        }
        else if (currentToken.type === 'QUERY')
        {
            this.cursor++;
            let queryToken: Token = this.tokens[this.cursor] as Token;
            if (!queryToken || queryToken.type !== 'CONTENT')
                throw new Error('Parser error: Expected body after query statement!');
            this.cursor++;
            let semicolon: Token = this.tokens[this.cursor] as Token;
            if (!semicolon || semicolon.type !== 'SEMICOLON')
                throw new Error('Parser error: Expected semicolon after query statement!');
            this.cursor++;

            let body: string = queryToken.value;
            return {
                type: 'QueryStatement',
                required: body.replaceAll('{', '').replaceAll('}', '').replaceAll(' ', '').split(',').filter(i => i !== '')
            };
        };
        this.cursor++;
        return null;
    };
};
export { Parser };