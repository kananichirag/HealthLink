"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PatientsService", {
    enumerable: true,
    get: function() {
        return PatientsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PatientsService = class PatientsService {
    async createPatient(createPatientDto, createdBy) {
        try {
            this.logger.log(`Creating patient: ${createPatientDto.name} by user: ${createdBy}`);
            // Verify the user exists before creating patient
            const user = await this.prisma.user.findUnique({
                where: {
                    id: createdBy
                }
            });
            if (!user) {
                this.logger.error(`User with ID ${createdBy} not found`);
                throw new _common.BadRequestException('User not found. Please log in again.');
            }
            // Sanitize text inputs
            const sanitizedData = {
                ...createPatientDto,
                name: this.sanitizeText(createPatientDto.name),
                medicalHistory: createPatientDto.medicalHistory ? this.sanitizeText(createPatientDto.medicalHistory) : undefined
            };
            const patient = await this.prisma.patient.create({
                data: {
                    ...sanitizedData,
                    createdBy
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            role: true
                        }
                    }
                }
            });
            return this.transformToResponseDto(patient);
        } catch (error) {
            this.logger.error(`Failed to create patient: ${error.message}`, error.stack);
            // Provide more specific error messages
            if (error instanceof _common.BadRequestException) {
                throw error;
            }
            if (error.code === 'P2003') {
                // Foreign key constraint error
                throw new _common.BadRequestException('User not found. Please log in again.');
            }
            throw new _common.BadRequestException('Failed to create patient');
        }
    }
    async findPatientById(id) {
        try {
            const patient = await this.prisma.patient.findUnique({
                where: {
                    id
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            role: true
                        }
                    }
                }
            });
            if (!patient) {
                throw new _common.NotFoundException(`Patient with ID ${id} not found`);
            }
            return this.transformToResponseDto(patient);
        } catch (error) {
            if (error instanceof _common.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to find patient by ID ${id}: ${error.message}`, error.stack);
            throw new _common.BadRequestException('Failed to retrieve patient');
        }
    }
    async updatePatient(id, updatePatientDto) {
        try {
            this.logger.log(`Updating patient: ${id}`);
            // Check if patient exists
            const existingPatient = await this.prisma.patient.findUnique({
                where: {
                    id
                }
            });
            if (!existingPatient) {
                throw new _common.NotFoundException(`Patient with ID ${id} not found`);
            }
            // Sanitize text inputs
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
                where: {
                    id
                },
                data: sanitizedData,
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            role: true
                        }
                    }
                }
            });
            return this.transformToResponseDto(patient);
        } catch (error) {
            if (error instanceof _common.NotFoundException) {
                throw error;
            }
            this.logger.error(`Failed to update patient ${id}: ${error.message}`, error.stack);
            throw new _common.BadRequestException('Failed to update patient');
        }
    }
    async findAllPatients(page = 1, limit = 10, search) {
        try {
            const skip = (page - 1) * limit;
            // Build search conditions
            const where = {};
            if (search) {
                where.OR = [
                    {
                        name: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    },
                    {
                        medicalHistory: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                ];
            }
            // Get total count and patients in parallel
            const [total, patients] = await Promise.all([
                this.prisma.patient.count({
                    where
                }),
                this.prisma.patient.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                })
            ]);
            const transformedPatients = patients.map((patient)=>this.transformToResponseDto(patient));
            return {
                data: transformedPatients,
                total,
                page,
                limit
            };
        } catch (error) {
            this.logger.error(`Failed to retrieve patients: ${error.message}`, error.stack);
            throw new _common.BadRequestException('Failed to retrieve patients');
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
            recordAge
        };
    }
    calculateAgeGroup(age) {
        if (age < 18) return 'CHILD';
        if (age < 65) return 'ADULT';
        return 'SENIOR';
    }
    calculateRecordAge(createdAt) {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
    }
    sanitizeText(text) {
        // Basic sanitization to prevent injection attacks
        return text.trim().replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['"]/g, '') // Remove quotes that could be used for SQL injection
        .substring(0, 2000); // Ensure max length
    }
    constructor(prisma){
        this.prisma = prisma;
        this.logger = new _common.Logger(PatientsService.name);
    }
};
PatientsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], PatientsService);

//# sourceMappingURL=patients.service.js.map