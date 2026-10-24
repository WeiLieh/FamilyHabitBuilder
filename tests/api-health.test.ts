// =============================================================================
// tests/api-health.test.ts: tests for GET /api/health (see api/health.ts)
//
// Test-Driven Development (TDD): this file was written BEFORE api/health.ts.
// It first failed (red) because the handler did not exist, then passed (green)
// once the handler was written. The tests are the agreed "contract": what the
// endpoint must do, checked automatically on every `npm run check`.
//
// Approach: start the REAL handler on a temporary local web server, then call
// it with fetch(), exactly as a browser or Telegram would. No fakes, so we test
// real behaviour, not internal wiring.
// =============================================================================

// Node's built-in tool for running a small web server.
import { createServer, type Server } from "node:http";
// Type that describes a server's address (we need its port number).
import type { AddressInfo } from "node:net";
// Vitest's building blocks:
//   describe = a group of related tests
//   it       = one test ("it should ...")
//   expect   = a check; if it is false, the test fails
//   beforeAll / afterAll = setup before all tests, clean-up after all tests
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// The real code under test. (".js" is required by Node's module rules even
// though the source file is .ts; TypeScript maps it correctly.)
import handler from "../api/health.js";

// Shared between the tests below, filled in by beforeAll.
let server: Server;
let baseUrl: string;

// SETUP: runs once before the tests.
beforeAll(async () => {
  // Wrap our handler in a real web server.
  server = createServer(handler);
  // listen(0) asks the computer for any free port, so tests never clash with
  // something already running. We wait ("await") until the server is ready.
  await new Promise<void>((resolve) => server.listen(0, resolve));
  // Build the address to call, e.g. http://127.0.0.1:54321 (127.0.0.1 = this computer).
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

// CLEAN-UP: runs once after all tests, so no server is left running.
afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("GET /api/health", () => {
  // Test 1: the normal, happy path.
  it("answers 200 with ok: true and the app's name", async () => {
    const res = await fetch(`${baseUrl}/api/health`); // a plain GET request
    expect(res.status).toBe(200); // 200 = OK
    expect(res.headers.get("content-type")).toContain("application/json"); // reply is JSON
    // toEqual checks the whole reply matches exactly (no extra or missing fields).
    expect(await res.json()).toEqual({ ok: true, service: "family-habit-builder" });
  });

  // Test 2: the guard. Sending data (POST) must be refused.
  it("refuses anything other than GET with 405", async () => {
    const res = await fetch(`${baseUrl}/api/health`, { method: "POST" });
    expect(res.status).toBe(405); // 405 = Method Not Allowed
    expect(res.headers.get("allow")).toBe("GET"); // and it says what IS allowed
  });
});
