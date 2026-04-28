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
var PatientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PatientService = PatientService_1 = class PatientService {
    prisma;
    logger = new common_1.Logger(PatientService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async bookAppointment(dto, userId, tenantId) {
        this.logger.log(`Patient ${userId} attempting to book appointment with doctor ${dto.doctorId}`);
        const doctor = await this.prisma.user.findFirst({
            where: { id: dto.doctorId, role: 'DOCTOR' },
        });
        if (!doctor) {
            throw new common_1.BadRequestException('Doctor not found');
        }
        const appointmentTenantId = doctor.tenantId;
        if (!appointmentTenantId) {
            throw new common_1.BadRequestException('Doctor is not associated with a clinic');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const patientRecord = await this.prisma.patient.findFirst({
            where: { email: user.email },
        });
        if (!patientRecord) {
            throw new common_1.BadRequestException('No patient record found for your account. Please ask your doctor to register you as a patient first.');
        }
        const patientId = patientRecord.id;
        const appointmentDate = new Date(dto.date);
        const isAvailable = await this.checkSlotAvailability(dto.doctorId, appointmentDate, dto.timeSlot, appointmentTenantId);
        if (!isAvailable) {
            throw new common_1.BadRequestException('The selected time slot is no longer available');
        }
        const appointment = await this.prisma.appointment.create({
            data: {
                patientId,
                doctorId: dto.doctorId,
                date: appointmentDate,
                timeSlot: dto.timeSlot,
                status: client_1.AppointmentStatus.SCHEDULED,
                tenantId: appointmentTenantId,
            },
            include: {
                patient: { select: { id: true, name: true } },
                doctor: { select: { id: true, name: true } },
            },
        });
        this.logger.log(`Appointment ${appointment.id} created successfully`);
        return appointment;
    }
    async validateCancellationWindow(appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        const minutesUntil = this.calculateTimeUntilAppointment(appointment);
        if (minutesUntil < 30) {
            throw new common_1.BadRequestException('Cannot cancel appointment within 30 minutes of scheduled time');
        }
        return true;
    }
    calculateTimeUntilAppointment(appointment) {
        const appointmentDateTime = this.combineDateTime(appointment.date, appointment.timeSlot);
        const now = new Date();
        const minutesUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
        return minutesUntil;
    }
    combineDateTime(date, timeSlot) {
        const appointmentDate = new Date(date);
        const [time, period] = timeSlot.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) {
            hour24 = hours + 12;
        }
        else if (period === 'AM' && hours === 12) {
            hour24 = 0;
        }
        appointmentDate.setHours(hour24, minutes, 0, 0);
        return appointmentDate;
    }
    async listAppointments(userId, tenantId, filters) {
        const { status, startDate, endDate, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user) {
            return { data: [], total: 0, page, limit, totalPages: 0 };
        }
        const patientRecord = await this.prisma.patient.findFirst({
            where: { email: user.email },
        });
        if (!patientRecord) {
            return { data: [], total: 0, page, limit, totalPages: 0 };
        }
        const patientId = patientRecord.id;
        const where = { patientId };
        if (status) {
            where.status = status;
        }
        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                where.date.gte = new Date(startDate);
            }
            if (endDate) {
                where.date.lte = new Date(endDate);
            }
        }
        const [total, appointments] = await Promise.all([
            this.prisma.appointment.count({ where }),
            this.prisma.appointment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'asc' },
                select: {
                    id: true,
                    patientId: true,
                    doctorId: true,
                    date: true,
                    timeSlot: true,
                    status: true,
                    isRescheduled: true,
                    tags: true,
                    tenantId: true,
                    createdAt: true,
                    updatedAt: true,
                    doctor: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);
        const enrichedAppointments = await Promise.all(appointments.map(appointment => this.enrichAppointmentWithTags(appointment)));
        return {
            data: enrichedAppointments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    async cancelAppointment(appointmentId, userId, tenantId) {
        this.logger.log(`Patient ${userId} attempting to cancel appointment ${appointmentId}`);
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        const patientRecord = user ? await this.prisma.patient.findFirst({ where: { email: user.email } }) : null;
        if (!patientRecord) {
            throw new common_1.ForbiddenException('Appointment not found or does not belong to you');
        }
        const patientId = patientRecord.id;
        const appointment = await this.prisma.appointment.findFirst({
            where: { id: appointmentId, patientId },
        });
        if (!appointment) {
            throw new common_1.ForbiddenException('Appointment not found or does not belong to you');
        }
        if (appointment.status !== client_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Only scheduled appointments can be cancelled');
        }
        await this.validateCancellationWindow(appointmentId);
        await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: client_1.AppointmentStatus.CANCELLED },
        });
        this.logger.log(`Appointment ${appointmentId} cancelled successfully`);
    }
    async checkSlotAvailability(doctorId, date, timeSlot, tenantId, excludeAppointmentId) {
        const whereClause = {
            doctorId,
            date,
            timeSlot,
            status: client_1.AppointmentStatus.SCHEDULED,
        };
        if (tenantId) {
            whereClause.tenantId = tenantId;
        }
        if (excludeAppointmentId) {
            whereClause.id = { not: excludeAppointmentId };
        }
        const conflictingAppointment = await this.prisma.appointment.findFirst({
            where: whereClause,
        });
        return !conflictingAppointment;
    }
    async addRescheduledTag(appointmentId) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { tags: true },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        const tags = appointment.tags || [];
        if (!tags.includes('Rescheduled')) {
            return await this.prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                    tags: {
                        push: 'Rescheduled',
                    },
                },
            });
        }
        return appointment;
    }
    async enrichAppointmentWithTags(appointment) {
        const enriched = { ...appointment };
        const tags = appointment.tags || [];
        if (appointment.isRescheduled && !tags.includes('Rescheduled')) {
            enriched.tags = [...tags, 'Rescheduled'];
        }
        else {
            enriched.tags = tags;
        }
        return enriched;
    }
    async rescheduleAppointment(appointmentId, userId, tenantId, newDate, newTimeSlot) {
        this.logger.log(`Patient ${userId} attempting to reschedule appointment ${appointmentId}`);
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        const patientRecord = user ? await this.prisma.patient.findFirst({ where: { email: user.email } }) : null;
        if (!patientRecord) {
            throw new common_1.ForbiddenException('Appointment not found or does not belong to you');
        }
        const patientId = patientRecord.id;
        const appointment = await this.prisma.appointment.findFirst({
            where: { id: appointmentId, patientId },
        });
        if (!appointment) {
            throw new common_1.ForbiddenException('Appointment not found or does not belong to you');
        }
        if (appointment.status !== client_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Only scheduled appointments can be rescheduled');
        }
        const minutesUntil = this.calculateTimeUntilAppointment(appointment);
        if (minutesUntil < 30) {
            throw new common_1.BadRequestException('Cannot reschedule appointment within 30 minutes of scheduled time');
        }
        const newAppointmentDate = new Date(newDate);
        const isAvailable = await this.checkSlotAvailability(appointment.doctorId, newAppointmentDate, newTimeSlot, tenantId, appointmentId);
        if (!isAvailable) {
            throw new common_1.BadRequestException('The selected time slot is no longer available');
        }
        let updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                date: newAppointmentDate,
                timeSlot: newTimeSlot,
                isRescheduled: true,
            },
            include: {
                doctor: { select: { id: true, name: true } },
                patient: { select: { id: true, name: true } },
            },
        });
        const taggedAppointment = await this.addRescheduledTag(appointmentId);
        updatedAppointment = {
            ...updatedAppointment,
            tags: taggedAppointment.tags || updatedAppointment.tags,
        };
        this.logger.log(`Appointment ${appointmentId} rescheduled successfully`);
        return updatedAppointment;
    }
};
exports.PatientService = PatientService;
exports.PatientService = PatientService = PatientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientService);
//# sourceMappingURL=patient.service.js.map