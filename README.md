## Project Setup
1. Setup TypeScript project
2. ``npm i @0stv0/endlang``
3. Setup project with this scheme:
```
root/
├── endpoints/
│   └── user.endpoint
├── src/
│   ├── handlers/
│   │   └── testHandler.ts
│   ├── middlewares/
│   │   └── testMiddle.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Example .endpoint file
```bash
GROUP /user/v1; # parent path (Optional)

PATH /test; # last part of path or full if group not setted
METHOD POST; # GET | POST | PUT | DELETE

HANDLER testHandler.handler; # file in handlers directory and exported handler function name (file.function)
MIDDLE testMiddle.middle1 & testMiddle.middle2; # middlewares in the same format as handler (add as many you want) (Optional)

BODY { name, lastname, email }; # verify wheter the payload contains all these specific fields (no less, no more) (Optional)
```

## Dev Mode
Test only in build, because endpoints and handlers are loaded from dist directory.

## Server Startup
```ts
import { Server } from '@0stv0/endlang';

let sv: Server = new Server(4000, async() =>
{
    console.log('API listening on http://localhost:4000/');
});
await sv.listen();
```

## First Handler
```ts
import { Handler } from "@0stv0/endlang";

const handler: Handler = async(req, res) =>
{
    res.status(200).setJson({message: '123'});
};
export { handler };
```

## First Middleware
```ts
import { Middle } from "@0stv0/endlang";

const middle: Middle = async(req) =>
{
    if (1 > 2)
        return [false, {error: 'check math'}];
    return [true, {}];  
};
export { middle };
```

## Request Interface
```ts
path: string // request path
method: string // request method
headers: Record<string, string | string[] | undefined> // request headers
query: Record<string, string> // All params after ?
body: Record<string, any> // request payload
```

## Response Interface
```ts
status: (code: number) => Response; // response code
setJson: (body: Record<string, any>) => Response; // responde body
setHeader: (name: string, value: string | string[]) => Response; // set header
setResponse: (code: number, body: Record<string, any>) => Response; // set code and body
setNoCache: () => Response; // set no cache in return
setAuthHeader: (token: string) => Response; // set token in Bearer {token}
```