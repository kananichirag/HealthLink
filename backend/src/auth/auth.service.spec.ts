import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role, TenantType } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockTenantService = {
    createTenant: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: TenantService, useValue: mockTenantService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a PATIENT without tenant', async () => {
      const registerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: Role.PATIENT,
      };

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const createdUser = {
        id: '123',
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(registerDto.email);
      expect(result.role).toBe(registerDto.role);
      expect(mockTenantService.createTenant).not.toHaveBeenCalled();
    });

    it('should create a new tenant when DOCTOR registers with tenantName/tenantType', async () => {
      const registerDto = {
        name: 'Dr. Smith',
        email: 'smith@clinic.com',
        password: 'password123',
        role: Role.DOCTOR,
        tenantName: 'Smith Clinic',
        tenantType: TenantType.CLINIC,
      };

      const tenant = { id: 'tenant-1', name: 'Smith Clinic', type: TenantType.CLINIC, isActive: true };
      const createdUser = {
        id: '123',
        name: registerDto.name,
        email: registerDto.email,
        password: 'hashed',
        role: registerDto.role,
        tenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockTenantService.createTenant.mockResolvedValue(tenant);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result.tenantId).toBe('tenant-1');
      expect(mockTenantService.createTenant).toHaveBeenCalledWith({
        name: 'Smith Clinic',
        type: TenantType.CLINIC,
      });
    });

    it('should join existing tenant when PHARMACY registers with tenantId', async () => {
      const tenant = { id: 'tenant-2', name: 'Existing Pharmacy', type: TenantType.PHARMACY, isActive: true };
      const registerDto = {
        name: 'Pharmacy User',
        email: 'user@pharmacy.com',
        password: 'password123',
        role: Role.PHARMACY,
        tenantId: 'tenant-2',
      };

      const createdUser = {
        id: '456',
        name: registerDto.name,
        email: registerDto.email,
        password: 'hashed',
        role: registerDto.role,
        tenantId: 'tenant-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockTenantService.findById.mockResolvedValue(tenant);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result.tenantId).toBe('tenant-2');
      expect(mockTenantService.findById).toHaveBeenCalledWith('tenant-2');
      expect(mockTenantService.createTenant).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when joining a deactivated tenant', async () => {
      const tenant = { id: 'tenant-3', name: 'Inactive', type: TenantType.CLINIC, isActive: false };
      const registerDto = {
        name: 'Dr. Jones',
        email: 'jones@clinic.com',
        password: 'password123',
        role: Role.DOCTOR,
        tenantId: 'tenant-3',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockTenantService.findById.mockResolvedValue(tenant);

      await expect(service.register(registerDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when DOCTOR registers without tenant info', async () => {
      const registerDto = {
        name: 'Dr. No Tenant',
        email: 'notenant@clinic.com',
        password: 'password123',
        role: Role.DOCTOR,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: Role.PATIENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '456',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password with bcrypt before storing', async () => {
      const registerDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: Role.PATIENT,
      };

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const createdUser = {
        id: '123',
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
        tenantId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      await service.register(registerDto);

      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      const storedPassword = createCall.data.password;

      const isValidHash = await bcrypt.compare(registerDto.password, storedPassword);
      expect(isValidHash).toBe(true);
      expect(storedPassword).not.toBe(registerDto.password);
    });
  });

  describe('login', () => {
    it('should return JWT with tenantId for a user with a tenant', async () => {
      const user = {
        id: 'user-1',
        email: 'doc@clinic.com',
        password: await bcrypt.hash('password123', 10),
        role: Role.DOCTOR,
        tenantId: 'tenant-1',
      };
      const tenant = { id: 'tenant-1', isActive: true };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockTenantService.findById.mockResolvedValue(tenant);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({ email: 'doc@clinic.com', password: 'password123' });

      expect(result.access_token).toBe('jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'doc@clinic.com',
        role: Role.DOCTOR,
        tenantId: 'tenant-1',
      });
    });

    it('should return JWT with null tenantId for a PATIENT', async () => {
      const user = {
        id: 'user-2',
        email: 'patient@example.com',
        password: await bcrypt.hash('password123', 10),
        role: Role.PATIENT,
        tenantId: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({ email: 'patient@example.com', password: 'password123' });

      expect(result.access_token).toBe('jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-2',
        email: 'patient@example.com',
        role: Role.PATIENT,
        tenantId: null,
      });
    });

    it('should throw ForbiddenException if tenant is deactivated on login', async () => {
      const user = {
        id: 'user-3',
        email: 'doc@inactive.com',
        password: await bcrypt.hash('password123', 10),
        role: Role.DOCTOR,
        tenantId: 'tenant-inactive',
      };
      const tenant = { id: 'tenant-inactive', isActive: false };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockTenantService.findById.mockResolvedValue(tenant);

      await expect(
        service.login({ email: 'doc@inactive.com', password: 'password123' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
