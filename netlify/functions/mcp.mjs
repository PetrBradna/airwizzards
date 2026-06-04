// Remote MCP server for the PLANiX Glide "Users1" table, packaged as a single
// Netlify Function. Speaks the MCP protocol (JSON-RPC over HTTP) directly so it
// can be added to Claude as a custom connector and used from the phone app.
//
// Auth: a shared secret passed as ?key=... in the URL (set MCP_SECRET on Netlify).
// Required env vars on Netlify: GLIDE_TOKEN, GLIDE_APP, MCP_SECRET.

import * as glide from "@glideapps/tables";

const TABLE_ID = "native-table-qQtBfW3I3zbQYJd4b3oF";

function getTable() {
  const token = process.env.GLIDE_TOKEN;
  const app = process.env.GLIDE_APP;
  if (!token || !app) throw new Error("GLIDE_TOKEN and GLIDE_APP env vars required");
  return glide.table({
    token,
    app,
    table: TABLE_ID,
    columns: {
      name: { type: "string", name: "Name" },
      osloven: { type: "string", name: "GX4nC" },
      email: { type: "email-address", name: "Email" },
      phone: { type: "phone-number", name: "zY8Xs" },
      photo: { type: "image-uri", name: "Photo" },
      role: { type: "string", name: "rbQJZ" },
      adminAccess: { type: "string", name: "XCC7R" },
      profeseProfese: { type: "string", name: "r9N2D" },
      requireLocation: { type: "boolean", name: "T8vWh" },
      companyName: { type: "string", name: "Role" },
    },
  });
}

const TOOLS = [
  {
    name: "users1_get",
    description: "Get all rows from the Users1 table (requires Glide Business plan).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "users1_add",
    description: "Add a row to Users1. Pass any subset of column fields.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        osloven: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        photo: { type: "string" },
        role: { type: "string" },
        adminAccess: { type: "string" },
        profeseProfese: { type: "string" },
        requireLocation: { type: "boolean" },
        companyName: { type: "string" },
      },
    },
  },
  {
    name: "users1_edit",
    description: "Edit a row in Users1 by rowID.",
    inputSchema: {
      type: "object",
      properties: { rowID: { type: "string" }, patch: { type: "object" } },
      required: ["rowID", "patch"],
    },
  },
  {
    name: "users1_delete",
    description: "Delete a row in Users1 by rowID.",
    inputSchema: {
      type: "object",
      properties: { rowID: { type: "string" } },
      required: ["rowID"],
    },
  },
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

const rpcResult = (id, result) => ({ jsonrpc: "2.0", id, result });
const rpcError = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

async function handleMessage(m) {
  const { id, method, params } = m;

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: params?.protocolVersion || "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "glide-mcp", version: "0.1.0" },
    });
  }
  if (method === "ping") return rpcResult(id, {});
  if (typeof method === "string" && method.startsWith("notifications/")) return null;
  if (method === "tools/list") return rpcResult(id, { tools: TOOLS });

  if (method === "tools/call") {
    const name = params?.name;
    const args = params?.arguments || {};
    try {
      const users1 = getTable();
      let result;
      if (name === "users1_get") result = await users1.get();
      else if (name === "users1_add") result = await users1.add(args);
      else if (name === "users1_edit") result = await users1.update(args.rowID, args.patch);
      else if (name === "users1_delete") result = await users1.delete(args.rowID);
      else throw new Error(`Unknown tool: ${name}`);
      return rpcResult(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (e) {
      return rpcResult(id, {
        content: [{ type: "text", text: `Error: ${e.message}` }],
        isError: true,
      });
    }
  }

  if (id === undefined) return null; // unknown notification
  return rpcError(id, -32601, `Method not found: ${method}`);
}

export default async (request) => {
  if (request.method === "OPTIONS") return new Response("", { status: 204, headers: CORS });

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!process.env.MCP_SECRET || key !== process.env.MCP_SECRET) {
    return json(rpcError(null, -32001, "Unauthorized"), 401);
  }

  if (request.method !== "POST") {
    return json(rpcError(null, -32000, "Use POST with JSON-RPC"), 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error"));
  }

  // Support JSON-RPC batches as well as single messages.
  if (Array.isArray(payload)) {
    const responses = (await Promise.all(payload.map(handleMessage))).filter(Boolean);
    return responses.length ? json(responses) : new Response("", { status: 202, headers: CORS });
  }

  const response = await handleMessage(payload);
  if (response === null) return new Response("", { status: 202, headers: CORS });
  return json(response);
};

export const config = { path: "/mcp" };
