import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';
import { userRepository, Role } from '../../repositories/user.repository';
import { ConflictError, UnauthorizedError } from '../../errors/app.error';

jest.mock('../../repositories/user.repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  const mockedUserRepo = jest.mocked(userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user with hashed password and role=customer', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd_123');
      mockedUserRepo.create.mockResolvedValue({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_pwd_123',
        role: Role.customer,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register({
        name: 'John Doe',
        email: 'JOHN@example.com',
        password: 'Password123!',
      });

      expect(mockedUserRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(result.user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: Role.customer,
      });
    });

    it('should throw ConflictError if email already exists', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue({
        id: 2,
        name: 'Existing',
        email: 'taken@example.com',
        passwordHash: 'hashed',
        role: Role.customer,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authService.register({
          name: 'Jane',
          email: 'taken@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should authenticate valid user credentials and issue signed token', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_pwd',
        role: Role.customer,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mocked.jwt.token');

      const result = await authService.login({
        email: 'john@example.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(result.user.email).toBe('john@example.com');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'missing@example.com', password: 'pwd' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password does not match', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        passwordHash: 'hashed',
        role: Role.customer,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'john@example.com', password: 'wrong' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if account is inactive', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue({
        id: 1,
        name: 'John',
        email: 'john@example.com',
        passwordHash: 'hashed',
        role: Role.customer,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authService.login({ email: 'john@example.com', password: 'pwd' })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('verifyToken', () => {
    it('should decode valid token payload', () => {
      const decodedPayload = { id: 1, email: 'john@example.com', role: Role.customer };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      const res = authService.verifyToken('valid.token');
      expect(res).toEqual(decodedPayload);
    });

    it('should throw UnauthorizedError on invalid token signature or expiry', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid signature');
      });

      expect(() => authService.verifyToken('tampered.token')).toThrow(UnauthorizedError);
    });
  });
});
