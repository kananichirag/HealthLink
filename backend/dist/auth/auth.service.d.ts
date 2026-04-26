import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
export declare class AuthService {
    private prisma;
    private jwtService;
    private tenantService;
    constructor(prisma: PrismaService, jwtService: JwtService, tenantService: TenantService);
    register(dto: RegisterDto): Promise<Omit<User, 'password'>>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
    validateUser(email: string, password: string): Promise<User | null>;
}
