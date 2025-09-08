import "./db/database";
import { Device, User } from "./db/models";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/v1/me": {
      GET: (req) => {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }

        const userId = parseInt(authHeader.replace("Bearer ", ""), 10);
        const user = User.findById(userId);

        if (!user) {
          return new Response("User not found", { status: 404 });
        }

        return Response.json(user);
      },
    },
    "/v1/me/devices": {
      GET: (req) => {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }

        const userId = parseInt(authHeader.replace("Bearer ", ""), 10);
        const user = User.findById(userId);

        if (!user) {
          return new Response("User not found", { status: 404 });
        }

        const devices = Device.findByUserId(userId);
        return Response.json(devices);
      },
    },
    "/v1.1/devices/:dongleId": {
      GET: (req) => {
        const { dongleId } = req.params as { dongleId: string };
        const device = Device.findByDongleId(dongleId);

        if (!device) {
          return new Response("Device not found", { status: 404 });
        }

        return Response.json(device);
      },
    },
    "/auth/login/:provider": {
      GET: (req) => {
        const { provider } = req.params as { provider: string };

        const redirectUrls: Record<string, string> = {
          google: `https://accounts.google.com/oauth/authorize?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=${encodeURIComponent(`${req.url.split("/auth")[0]}/auth/callback/google`)}&response_type=code&scope=email%20profile`,
          github: `https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&redirect_uri=${encodeURIComponent(`${req.url.split("/auth")[0]}/auth/callback/github`)}&scope=user:email`,
        };

        const redirectUrl = redirectUrls[provider];
        if (!redirectUrl) {
          return new Response("Provider not supported", { status: 400 });
        }

        return Response.redirect(redirectUrl);
      },
    },
    "/auth/callback/:provider": {
      GET: (req) => {
        const { provider } = req.params as { provider: string };
        const url = new URL(req.url);
        const code = url.searchParams.get("code");

        if (!code) {
          return new Response("Authorization code not provided", { status: 400 });
        }

        return Response.json({
          message: `OAuth callback for ${provider}`,
          code,
          note: "This is a placeholder - implement actual OAuth token exchange here",
        });
      },
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 chffr backend running at http://localhost:${server.port}`);
