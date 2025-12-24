import { db } from '../config/database.ts';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  warehouse_location: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export const UserModel = {
  async findById(id: string): Promise<User | undefined> {
    return await db('users').where({ id }).first();
  },

  async findByUsername(username: string): Promise<User | undefined> {
    return await db('users').where({ username }).first();
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return await db('users').where({ email }).first();
  },

  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const [user] = await db('users').insert(userData).returning('*');
    return user;
  },

  async update(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db('users')
      .where({ id })
      .update({ ...userData, updated_at: new Date() })
      .returning('*');
    return user;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db('users').where({ id }).delete();
    return deleted > 0;
  },
};

export const SessionModel = {
  async create(sessionData: Omit<UserSession, 'id' | 'created_at'>): Promise<UserSession> {
    const [session] = await db('user_sessions').insert(sessionData).returning('*');
    return session;
  },

  async findByTokenHash(tokenHash: string): Promise<UserSession | undefined> {
    return await db('user_sessions').where({ token_hash: tokenHash }).first();
  },

  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    const deleted = await db('user_sessions').where({ token_hash: tokenHash }).delete();
    return deleted > 0;
  },

  async deleteExpired(): Promise<number> {
    return await db('user_sessions').where('expires_at', '<', new Date()).delete();
  },

  async deleteByUserId(userId: string): Promise<number> {
    return await db('user_sessions').where({ user_id: userId }).delete();
  },
};
