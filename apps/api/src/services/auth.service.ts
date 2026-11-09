import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository, Role, User } from '../repositories/user.repository';
import { ConflictError, UnauthorizedError } from '../errors/app.error';
import { RegisterDTO, LoginDTO } from '../validations/auth.validation';

export interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUserResponse;
}

export class AuthService {
  private readonly saltRounds = 10;

  /**
   * Register a new customer account
   * Security: Public registration can NEVER grant elevated roles (agent/admin).
   */
  async register(dto: RegisterDTO): Promise<{ user: AuthUserResponse }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // 1. Check if email is already taken
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError(`User with email '${normalizedEmail}' already exists`);
    }

    // 2. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    // 3. Create user with default role: customer
    const user = await userRepository.create({
      name: dto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: Role.customer,
    });

    return {
      user: this.toSafeUser(user),
    };
  }

  /**
   * Authenticate user credentials and issue signed JWT
   * Security: Uses generic error message to prevent user enumeration attacks.
   */
  async login(dto: LoginDTO): Promise<LoginResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // 1. Find user by email
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled. Please contact support.');
    }

    // 3. Compare password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 4. Sign JWT with minimal necessary claims
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
      accessToken,
      user: this.toSafeUser(user),
    };
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): { id: number; email: string; role: Role } {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: number;
        email: string;
        role: Role;
      };
      return decoded;
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }
  }

  /**
   * Strip sensitive fields (passwordHash, etc.) before returning to client
   */
  private toSafeUser(user: User): AuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

export const authService = new AuthService();
