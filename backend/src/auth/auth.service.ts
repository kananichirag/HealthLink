import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role, TenantType, User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tenantService: TenantService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password with bcrypt (salt round >= 10)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let tenantId: string | undefined;

    // Determine tenant assignment based on role
    if (dto.role === Role.DOCTOR || dto.role === Role.PHARMACY) {
      if (dto.tenantId) {
        // Joining an existing tenant — verify it exists and is active
        const tenant = await this.tenantService.findById(dto.tenantId);
        if (!tenant.isActive) {
          throw new ForbiddenException('Cannot join a deactivated tenant');
        }
        tenantId = dto.tenantId;
      } else if (dto.tenantName && dto.tenantType) {
        // Create a new tenant
        const tenant = await this.tenantService.createTenant({
          name: dto.tenantName,
          type: dto.tenantType,
        });
        tenantId = tenant.id;
      } else {
        throw new BadRequestException(
          'Doctor and Pharmacy registrations require either tenantId or tenantName and tenantType',
        );
      }
    }
    // PATIENT and ADMIN roles don't require a tenant

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    // Validate user credentials
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If user has a tenant, check that the tenant is active
    if (user.tenantId) {
      const tenant = await this.tenantService.findById(user.tenantId);
      if (!tenant.isActive) {
        throw new ForbiddenException('Your tenant has been deactivated');
      }
    }

    // Create JWT payload with tenantId
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? null,
    };

    // Sign and return JWT
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
