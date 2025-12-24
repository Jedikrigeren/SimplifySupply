import bcrypt from 'bcrypt';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { SessionModel, User, UserModel } from '../models/User.ts';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  warehouseLocation?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string | null;
    warehouseLocation: string | null;
  };
}

export const AuthService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { username, email, password, fullName, warehouseLocation } = data;

    // Check if username already exists
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash the password
    const passwordHash = await this.hashPassword(password);

    // Create the user
    const user = await UserModel.create({
      username,
      email,
      password_hash: passwordHash,
      full_name: fullName || null,
      warehouse_location: warehouseLocation || null,
      is_active: true,
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    
    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        warehouseLocation: user.warehouse_location,
      },
    };
  },

  /**
   * Authenticate a user and generate a JWT token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    const { username, password } = credentials;

    // Find user by username
    const user = await UserModel.findByUsername(username);

    if (!user) {
      return null;
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    
    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        warehouseLocation: user.warehouse_location,
      },
    };
  },

  /**
   * Generate an access token (short-lived)
   */
  generateAccessToken(user: User): string {
    const jwtSecret = Deno.env.get('JWT_SECRET');
    const accessTokenExpiry = Deno.env.get('ACCESS_TOKEN_EXPIRY') || '15m';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    return jwt.sign(payload, jwtSecret, { expiresIn: accessTokenExpiry });
  },

  /**
   * Generate a refresh token (long-lived, random string)
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  },

  /**
   * Store refresh token in database
   */
  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Delete old refresh tokens for this user
    await SessionModel.deleteByUserId(userId);

    // Store new refresh token
    await SessionModel.create({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    // Find session by token hash
    const session = await SessionModel.findByTokenHash(tokenHash);
    
    if (!session) {
      return null;
    }

    // Check if token is expired
    if (new Date(session.expires_at) < new Date()) {
      await SessionModel.deleteByTokenHash(tokenHash);
      return null;
    }

    // Get user
    const user = await UserModel.findById(session.user_id);
    
    if (!user || !user.is_active) {
      return null;
    }

    // Generate new tokens (token rotation)
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken();
    
    // Delete old refresh token and store new one
    await SessionModel.deleteByTokenHash(tokenHash);
    await this.storeRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  /**
   * Generate a JWT token for a user (legacy - kept for backwards compatibility)
   */
  generateToken(user: User): string {
    return this.generateAccessToken(user);
  },

  /**
   * Verify a JWT token
   */
  verifyToken(token: string): jwt.JwtPayload | string {
    const jwtSecret = Deno.env.get('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return jwt.verify(token, jwtSecret);
  },

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  },

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
