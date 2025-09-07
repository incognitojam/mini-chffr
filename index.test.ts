import { test, expect } from "bun:test";

const BASE_URL = "http://localhost:3000";

test("server starts and responds", async () => {
  const response = await fetch(`${BASE_URL}/v1/me`, {
    headers: { "Authorization": "Bearer 999" }
  });
  expect(response.status).toBe(404); // User not found is expected for non-existent user
});

test("GET /v1/me requires authentication", async () => {
  const response = await fetch(`${BASE_URL}/v1/me`);
  expect(response.status).toBe(401);
  expect(await response.text()).toBe("Unauthorized");
});

test("GET /v1/me/devices requires authentication", async () => {
  const response = await fetch(`${BASE_URL}/v1/me/devices`);
  expect(response.status).toBe(401);
  expect(await response.text()).toBe("Unauthorized");
});

test("GET /v1.1/devices/:dongleId returns 404 for non-existent device", async () => {
  const response = await fetch(`${BASE_URL}/v1.1/devices/non-existent-dongle`);
  expect(response.status).toBe(404);
  expect(await response.text()).toBe("Device not found");
});

test("OAuth login redirects for supported providers", async () => {
  const response = await fetch(`${BASE_URL}/auth/login/google`, { 
    redirect: "manual" 
  });
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toContain("accounts.google.com");
});

test("OAuth login returns 400 for unsupported providers", async () => {
  const response = await fetch(`${BASE_URL}/auth/login/unsupported`);
  expect(response.status).toBe(400);
  expect(await response.text()).toBe("Provider not supported");
});

test("OAuth callback requires code parameter", async () => {
  const response = await fetch(`${BASE_URL}/auth/callback/google`);
  expect(response.status).toBe(400);
  expect(await response.text()).toBe("Authorization code not provided");
});

test("OAuth callback with code returns placeholder response", async () => {
  const response = await fetch(`${BASE_URL}/auth/callback/google?code=test-code`);
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.code).toBe("test-code");
  expect(data.message).toBe("OAuth callback for google");
});