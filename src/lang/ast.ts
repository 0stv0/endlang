// NODES
interface PathNode
{
    type: 'PathStatement';
    path: string;
};
interface MethodNode
{
    type: 'MethodStatement';
    method: string;
};
interface MiddleNode
{
    type: 'MiddleStatement';
    handlers: string[]
};
interface HandlerNode
{
    type: 'HandlerStatement';
    handler: string;
};
interface GroupNode
{
    type: 'GroupStatement';
    group: string;
};
interface BodyNode
{
    type: 'BodyStatement';
    required: string[]
};
interface QueryNode
{
    type: 'QueryStatement',
    required: string[]
};
interface DescNode
{
    type: 'DescStatement',
    description: string;
};
interface MaxSizeNode
{
    type: 'MaxSizeStatement';
    size: number;
};

// LOGIC
interface AST {
    statements: (
        PathNode | 
        MethodNode | 
        MiddleNode |
        HandlerNode |
        GroupNode |
        BodyNode |
        QueryNode |
        DescNode |
        MaxSizeNode
    )[]
};
const getDefaultAST = (): AST =>
{
    let ast: AST = {
        statements: []
    };
    return ast;
};
export { getDefaultAST };
export type {
    AST,
    PathNode,
    MethodNode,
    MiddleNode,
    HandlerNode,
    GroupNode,
    BodyNode,
    QueryNode,
    DescNode,
    MaxSizeNode
};