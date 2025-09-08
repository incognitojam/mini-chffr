import { db } from "./database";

export class Device {
  id: number;
  dongle_id: string;
  user_id: number;
  name: string | null;
  created_at: string;
  updated_at: string;

  static findByDongleId(dongle_id: string): Device | null {
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

export class User {
  id: number;
  email: string;
  provider: string;
  provider_id: string;
  name: string | null;
  created_at: string;
  updated_at: string;

  static findById(id: number): User | null {
    const query = db.query("SELECT * FROM users WHERE id = ?").as(User);
    return query.get(id);
  }

  static findByProviderAndId(provider: string, provider_id: string): User | null {
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
