import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Database } from "bun:sqlite";
import { UserSchema } from "./userSchema";
import { z } from "zod";

const db = new Database(":memory:");

// Update the table schema to include all fields
db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

const server = new McpServer({
  name: "MCP Demo",
  version: "0.0.1",
});

// Create a Zod schema for the server resource
const UserResourceSchema = z.object({
  firstname: UserSchema.firstname,
  lastname: UserSchema.lastname,
  username: UserSchema.username,
  email: UserSchema.email,
});

server.resource({
  name: "addUser",
  description: "Add a new user to the database",
  parameters: UserResourceSchema,
  handler: async ({ firstname, lastname, username, email }: z.infer<typeof UserResourceSchema>) => {
    try {
      // Validate the input through Zod
      const validationResult = UserResourceSchema.safeParse({ firstname, lastname, username, email });
      
      if (!validationResult.success) {
        return { 
          success: false, 
          message: `Validation failed: ${validationResult.error.message}` 
        };
      }
      
      // Insert the user into the database
      const stmt = db.prepare(
        "INSERT INTO users (firstname, lastname, username, email) VALUES (?, ?, ?, ?)"
      );
      stmt.run(firstname, lastname, username, email);
      
      return { 
        success: true, 
        message: `User ${username} added successfully` 
      };
    } catch (error) {
      console.error("Database error:", error);
      return { 
        success: false, 
        message: `Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
});

// Add a resource to get users
server.resource({
  name: "getUsers",
  description: "Get all users from the database",
  parameters: z.object({}),
  handler: async () => {
    try {
      const users = db.prepare("SELECT * FROM users").all();
      return { success: true, users };
    } catch (error) {
      console.error("Database error:", error);
      return { 
        success: false, 
        message: `Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
});

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

console.log("MCP Server started and ready to accept connections");