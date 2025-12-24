import crypto from 'node:crypto';
import { db } from '../config/database.ts';

export interface BlacklistedToken {
  id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export const TokenBlacklistModel = {
  /**
   * Hash a token for storage
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Add a token to the blacklist
   */
  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    const tokenHash = this.hashToken(token);
    
    await db('token_blacklist').insert({
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  },

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    
    const result = await db('token_blacklist')
      .where({ token_hash: tokenHash })
      .where('expires_at', '>', new Date())
      .first();
    
    return !!result;
  },

  /**
   * Clean up expired blacklisted tokens
   */
  async cleanupExpired(): Promise<number> {
    return await db('token_blacklist')
      .where('expires_at', '<', new Date())
      .delete();
  },
};
