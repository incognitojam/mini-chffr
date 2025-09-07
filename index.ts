import { Database } from "bun:sqlite";

const db = new Database("chffr.sqlite", { create: true });

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dongle_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

class User {
  id: number;
  email: string;
  provider: string;
  provider_id: string;
  name: string | null;
  created_at: string;
  updated_at: string;

  static findById(id: number): User | undefined {
    const query = db.query("SELECT * FROM users WHERE id = ?").as(User);
    return query.get(id);
  }

  static findByProviderAndId(provider: string, provider_id: string): User | undefined {
    const query = db.query("SELECT * FROM users WHERE provider = ? AND provider_id = ?").as(User);
    return query.get(provider, provider_id);
  }

  static create(data: { email: string; provider: string; provider_id: string; name?: string }): User {
    const query = db
      .query(`
      INSERT INTO users (email, provider, provider_id, name)
      VALUES (?, ?, ?, ?)
      RETURNING *
    `)
      .as(User);
    return query.get(data.email, data.provider, data.provider_id, data.name || null);
  }
}

class Device {
  id: number;
  dongle_id: string;
  user_id: number;
  name: string | null;
  created_at: string;
  updated_at: string;

  static findByDongleId(dongle_id: string): Device | undefined {
    const query = db.query("SELECT * FROM devices WHERE dongle_id = ?").as(Device);
    return query.get(dongle_id);
  }

  static findByUserId(user_id: number): Device[] {
    const query = db.query("SELECT * FROM devices WHERE user_id = ?").as(Device);
    return query.all(user_id);
  }

  static create(data: { dongle_id: string; user_id: number; name?: string }): Device {
    const query = db
      .query(`
      INSERT INTO devices (dongle_id, user_id, name)
      VALUES (?, ?, ?)
      RETURNING *
    `)
      .as(Device);
    return query.get(data.dongle_id, data.user_id, data.name || null);
  }
}

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
