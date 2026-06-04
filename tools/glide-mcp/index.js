#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as glide from "@glideapps/tables";

const token = process.env.GLIDE_TOKEN;
const app = process.env.GLIDE_APP;
if (!token || !app) {
  console.error("GLIDE_TOKEN and GLIDE_APP env vars required");
  process.exit(1);
}

const users1 = glide.table({
  token,
  app,
  table: "native-table-qQtBfW3I3zbQYJd4b3oF",
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

const server = new Server(
  { name: "glide-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
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
        properties: {
          rowID: { type: "string" },
          patch: { type: "object" },
        },
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    let result;
    if (name === "users1_get") result = await users1.get();
    else if (name === "users1_add") result = await users1.add(args);
    else if (name === "users1_edit") result = await users1.update(args.rowID, args.patch);
    else if (name === "users1_delete") result = await users1.delete(args.rowID);
    else throw new Error(`Unknown tool: ${name}`);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    return {
      content: [{ type: "text", text: `Error: ${e.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
