type TokenType = 'PATH' | 'METHOD' | 'CONTENT' | 'SEMICOLON' | 'AND' | 'MIDDLE' | 'HANDLER' | 'GROUP' | 'BODY' | 'QUERY' | 'DESC' | 'MAX_SIZE';
interface Token {
    type: TokenType;
    value: string;
};
class Lexer {
    private cursor: number;
    private readonly input: string;

    constructor(input: string)
    {
        this.cursor = 0;
        this.input  = input;
    };
    public tokens = (): Token[] => 
    {
        let tokens: Token[] = [];

        while (this.cursor < this.input.length)
        {
            let char: string = this.input[this.cursor] as string;
            if (/\s/.test(char))
            {
                this.cursor++;
                continue;
            };
            if (this.input.toLowerCase().startsWith('handler', this.cursor))
            {
                tokens.push({type: 'HANDLER', value: 'handler'});
                this.cursor += 7;
                continue;
            }
            if (this.input.toLowerCase().startsWith('path', this.cursor))
            {
                tokens.push({type: 'PATH', value: 'path'});
                this.cursor += 4;
                continue;
            };
            if (this.input.toLowerCase().startsWith('method', this.cursor))
            {
                tokens.push({type: 'METHOD', value: 'method'});
                this.cursor += 6;
                continue;
            };
            if (this.input.toLowerCase().startsWith('middle', this.cursor))
            {
                tokens.push({type: 'MIDDLE', value: 'middle'});
                this.cursor += 6;
                continue;
            };
            if (this.input.toLowerCase().startsWith('query', this.cursor))
            {
                tokens.push({type: 'QUERY', value: 'query'});
                this.cursor += 5;
                continue;
            }
            if (this.input.toLowerCase().startsWith('group', this.cursor))
            {
                tokens.push({type: 'GROUP', value: 'group'});
                this.cursor += 5;
                continue;
            };
            if (this.input.toLowerCase().startsWith('body', this.cursor))
            {
                tokens.push({type: 'BODY', value: 'body'});
                this.cursor += 4;
                continue;
            };
            if (this.input.toLowerCase().startsWith('desc', this.cursor))
            {
                tokens.push({type: 'DESC', value: 'desc'});
                this.cursor += 4;
                continue;
            };
            if (this.input.toLowerCase().startsWith('max_size', this.cursor))
            {
                tokens.push({type: 'MAX_SIZE', value: 'max_size'});
                continue;
            };
            if (char === ';')
            {
                tokens.push({type: 'SEMICOLON', value: ';'});
                this.cursor++;
                continue;
            };
            if (char === '|')
            {
                tokens.push({type: 'AND', value: '&'});
                this.cursor++;
                continue;
            }
            let content: string = "";
            while (
                this.cursor < this.input.length && 
                this.input[this.cursor] !== ';' && 
                !this.input.toLocaleLowerCase().startsWith("path", this.cursor) &&
                !this.input.toLocaleLowerCase().startsWith("method", this.cursor))
            {
                content += this.input[this.cursor];
                this.cursor++;
            };
            if (content.trim().length > 0)
                tokens.push({type: 'CONTENT', value: content.trim()})
        };

        return tokens;
    };
};
export { Lexer, type Token };