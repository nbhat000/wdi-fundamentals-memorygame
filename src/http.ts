import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { server } from "./index.js";

const secret=process.env.MCP_BEARER_TOKEN ?? "";
if(secret.length < 32) throw Error("Set MCP_BEARER_TOKEN to a random 32+ character value.");
const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
await server.connect(transport);
function authorized(header: string | undefined): boolean {
 const received=(header ?? "").replace(/^Bearer /i,"");
 const a=Buffer.from(received),b=Buffer.from(secret);
 return a.length===b.length && timingSafeEqual(a,b);
}
http.createServer(async(req,res)=>{
 if(req.url==="/health" && req.method==="GET"){res.writeHead(200,{"Content-Type":"application/json"});res.end('{"ok":true}');return;}
 if(req.url!=="/mcp" || !["POST","GET","DELETE"].includes(req.method ?? "")){res.writeHead(404);res.end();return;}
 if(!authorized(req.headers.authorization)){res.writeHead(401);res.end("Unauthorized");return;}
 try {
  let body="";
  for await(const chunk of req){body+=chunk.toString();if(body.length>2_000_000)throw Error("Too large");}
  await transport.handleRequest(req,res,body?JSON.parse(body):undefined);
 } catch(e) {
  console.error("HTTP MCP error",e instanceof Error?e.message:e);
  if(!res.headersSent){res.writeHead(400);res.end("Bad request");}
 }
}).listen(Number(process.env.PORT ?? 3000),"0.0.0.0",()=>console.error("ESPN MCP listening"));
