"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PatientsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PatientsService = PatientsService_1 = class PatientsService {
    prisma;
    logger = new common_1.Logger(PatientsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPatient(createPatientDto, createdBy) {
        try {
            this.logger.log(`Creating patient: ${createPatientDto.name} by user: ${createdBy}`);
            const user = await this.prisma.user.findUnique({
                where: { id: createdBy },
            });
            if (!user) {
                this.logger.error(`User with ID ${createdBy} not found`);
                throw new common_1.BadRequestException('User not found. Please log in again.');
            }
            const sanitizedData = {
                ...createPatientDto,
                name: this.sanitizeText(createPatientDto.name),
                medicalHistory: createPatientDto.medicalHistory ? this.sanitizeText(createPatientDto.medicalHistory) : undefined,
            };
            const patient = await this.prisma.patient.create({
                data: {
                    ...sanitizedData,
                    createdBy,
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            });
            return this.transformToResponseDto(patient);
        }
        catch (error) {
            this.logger.error(`Failed to create patient: ${error.message}`, error.stack);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            if (error.code === 'P2003') {
                throw new common_1.BadRequestException('User not found. Please log in again.');
            }
            throw new common_1.BadRequestException('Failed to create patient');
        }
    }
    async findPatientById(id) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: { id },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            });
            if (!patient) {
                throw new common_1.NotFoundException(`Patient with ID ${id} not found`);
            }
            return this.transformToResponseDto(patient);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find patient by ID ${id}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to retrieve patient');
        }
    }
    async updatePatient(id, updatePatientDto) {
        try {
            this.logger.log(`Updating patient: ${id}`);
            const existingPatient = await this.prisma.patient.findUnique({
                where: { id },
            });
            if (!existingPatient) {
                throw new common_1.NotFoundException(`Patient with ID ${id} not found`);
            }
            const sanitizedData = {};
            if (updatePatientDto.name) {
                sanitizedData.name = this.sanitizeText(updatePatientDto.name);
            }
            if (updatePatientDto.medicalHistory !== undefined) {
                sanitizedData.medicalHistory = updatePatientDto.medicalHistory ? this.sanitizeText(updatePatientDto.medicalHistory) : undefined;
            }
            if (updatePatientDto.age !== undefined) {
                sanitizedData.age = updatePatientDto.age;
            }
            if (updatePatientDto.gender !== undefined) {
                sanitizedData.gender = updatePatientDto.gender;
            }
            const patient = await this.prisma.patient.update({
                where: { id },
                data: sanitizedData,
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            });
            return this.transformToResponseDto(patient);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to update patient ${id}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to update patient');
        }
    }
    async findAllPatients(page = 1, limit = 10, search) {
        try {
            const skip = (page - 1) * limit;
            const where = {};
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { medicalHistory: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [total, patients] = await Promise.all([
                this.prisma.patient.count({ where }),
                this.prisma.patient.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                }),
            ]);
            const transformedPatients = patients.map(patient => this.transformToResponseDto(patient));
            return {
                data: transformedPatients,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            this.logger.error(`Failed to retrieve patients: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Failed to retrieve patients');
        }
    }
    transformToResponseDto(patient) {
        const ageGroup = this.calculateAgeGroup(patient.age);
        const recordAge = this.calculateRecordAge(patient.createdAt);
        return {
            id: patient.id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            medicalHistory: patient.medicalHistory || undefined,
            createdBy: patient.createdBy,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
            creator: patient.creator,
            ageGroup,
            recordAge,
        };
    }
    calculateAgeGroup(age) {
        if (age < 18)
            return 'CHILD';
        if (age < 65)
            return 'ADULT';
        return 'SENIOR';
    }
    calculateRecordAge(createdAt) {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    sanitizeText(text) {
        return text
            .trim()
            .replace(/[<>]/g, '')
            .replace(/['"]/g, '')
            .substring(0, 2000);
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = PatientsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map