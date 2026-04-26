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
var PatientPortalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientPortalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const DAY_OF_WEEK_MAP = {
    0: client_1.DayOfWeek.SUNDAY,
    1: client_1.DayOfWeek.MONDAY,
    2: client_1.DayOfWeek.TUESDAY,
    3: client_1.DayOfWeek.WEDNESDAY,
    4: client_1.DayOfWeek.THURSDAY,
    5: client_1.DayOfWeek.FRIDAY,
    6: client_1.DayOfWeek.SATURDAY,
};
let PatientPortalService = PatientPortalService_1 = class PatientPortalService {
    prisma;
    notificationsService;
    logger = new common_1.Logger(PatientPortalService_1.name);
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async getOrCreatePatientRecord(userId) {
        let patient = await this.prisma.patient.findFirst({
            where: { createdBy: userId },
        });
        if (!patient) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            patient = await this.prisma.patient.create({
                data: {
                    name: user.name,
                    email: user.email,
                    age: 0,
                    gender: 'OTHER',
                    createdBy: userId,
                    tenantId: null,
                },
            });
        }
        return patient;
    }
    async listDoctors() {
        const doctors = await this.prisma.user.findMany({
            where: { role: 'DOCTOR' },
            select: {
                id: true,
                name: true,
                email: true,
                tenant: { select: { id: true, name: true } },
                doctorSchedules: {
                    select: { dayOfWeek: true, startTime: true, endTime: true },
                },
            },
        });
        return doctors.map((doctor) => ({
            id: doctor.id,
            name: doctor.name,
            email: doctor.email,
            clinicName: doctor.tenant?.name ?? null,
            availability: doctor.doctorSchedules,
        }));
    }
    async connectWithDoctor(doctorId, userId) {
        const doctor = await this.prisma.user.findFirst({
            where: { id: doctorId, role: 'DOCTOR' },
        });
        if (!doctor) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        await this.getOrCreatePatientRecord(userId);
        return { message: 'Connected with doctor successfully', doctorId };
    }
    async getAvailableSlots(doctorId, date) {
        const requestedDate = new Date(date);
        const dayOfWeek = DAY_OF_WEEK_MAP[requestedDate.getDay()];
        const blockedDate = await this.prisma.blockedDate.findFirst({
            where: {
                doctorId,
                date: requestedDate,
            },
        });
        if (blockedDate) {
            return { date, dayOfWeek, slots: [] };
        }
        const schedules = await this.prisma.doctorSchedule.findMany({
            where: { doctorId, dayOfWeek },
            select: { startTime: true, endTime: true },
        });
        if (schedules.length === 0) {
            return { date, dayOfWeek, slots: [] };
        }
        const startOfDay = new Date(requestedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);
        const bookedAppointments = await this.prisma.appointment.findMany({
            where: {
                doctorId,
                date: { gte: startOfDay, lte: endOfDay },
                status: 'SCHEDULED',
            },
            select: { timeSlot: true },
        });
        const bookedSlots = new Set(bookedAppointments.map((a) => a.timeSlot));
        const availableSlots = schedules
            .map((s) => `${s.startTime}-${s.endTime}`)
            .filter((slot) => !bookedSlots.has(slot));
        return { date, dayOfWeek, slots: availableSlots };
    }
    async bookAppointment(dto, userId) {
        const { doctorId, date, timeSlot } = dto;
        const appointmentDate = new Date(date);
        const dayOfWeek = DAY_OF_WEEK_MAP[appointmentDate.getDay()];
        const doctor = await this.prisma.user.findFirst({
            where: { id: doctorId, role: 'DOCTOR' },
        });
        if (!doctor) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        const blockedDate = await this.prisma.blockedDate.findFirst({
            where: { doctorId, date: appointmentDate },
        });
        if (blockedDate) {
            throw new common_1.ConflictException('This date is blocked by the doctor');
        }
        const [slotStart, slotEnd] = timeSlot.split('-');
        const scheduleSlot = await this.prisma.doctorSchedule.findFirst({
            where: {
                doctorId,
                dayOfWeek,
                startTime: slotStart,
                endTime: slotEnd,
            },
        });
        if (!scheduleSlot) {
            throw new common_1.BadRequestException('This time slot is not in the doctor\'s schedule');
        }
        const startOfDay = new Date(appointmentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(appointmentDate);
        endOfDay.setHours(23, 59, 59, 999);
        const existingAppointment = await this.prisma.appointment.findFirst({
            where: {
                doctorId,
                date: { gte: startOfDay, lte: endOfDay },
                timeSlot,
                status: 'SCHEDULED',
            },
        });
        if (existingAppointment) {
            throw new common_1.ConflictException('This time slot is already booked');
        }
        const maxPerDay = 20;
        const dayAppointmentCount = await this.prisma.appointment.count({
            where: {
                doctorId,
                date: { gte: startOfDay, lte: endOfDay },
                status: 'SCHEDULED',
            },
        });
        if (dayAppointmentCount >= maxPerDay) {
            throw new common_1.ConflictException('Maximum appointments for this day has been reached');
        }
        const patient = await this.getOrCreatePatientRecord(userId);
        const appointment = await this.prisma.appointment.create({
            data: {
                patientId: patient.id,
                doctorId,
                date: appointmentDate,
                timeSlot,
                status: 'SCHEDULED',
                tenantId: doctor.tenantId ?? '',
            },
            include: {
                patient: { select: { id: true, name: true } },
                doctor: { select: { id: true, name: true } },
            },
        });
        await Promise.all([
            this.notificationsService.create(userId, 'APPOINTMENT_BOOKED', `Your appointment with Dr. ${doctor.name} on ${date} at ${timeSlot} has been confirmed`),
            this.notificationsService.create(doctorId, 'APPOINTMENT_BOOKED', `New appointment with patient ${patient.name} on ${date} at ${timeSlot}`),
        ]);
        return appointment;
    }
    async cancelAppointment(appointmentId, userId) {
        const patient = await this.getOrCreatePatientRecord(userId);
        const appointment = await this.prisma.appointment.findFirst({
            where: { id: appointmentId, patientId: patient.id, status: 'SCHEDULED' },
            include: {
                doctor: { select: { id: true, name: true } },
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Scheduled appointment not found');
        }
        const updated = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CANCELLED' },
            include: {
                patient: { select: { id: true, name: true } },
                doctor: { select: { id: true, name: true } },
            },
        });
        return updated;
    }
    async listAppointments(query, userId) {
        const patient = await this.getOrCreatePatientRecord(userId);
        const { status, startDate, endDate, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = { patientId: patient.id };
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
                include: {
                    doctor: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);
        return { data: appointments, total, page, limit };
    }
    async listPrescriptions(query, userId) {
        const patient = await this.getOrCreatePatientRecord(userId);
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = { patientId: patient.id };
        const [total, prescriptions] = await Promise.all([
            this.prisma.prescription.count({ where }),
            this.prisma.prescription.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    doctor: { select: { id: true, name: true } },
                    items: {
                        include: {
                            medicine: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
        ]);
        const data = await Promise.all(prescriptions.map(async (rx) => {
            let pharmacy = null;
            if (rx.targetPharmacyId) {
                const pharmacyUser = await this.prisma.user.findUnique({
                    where: { id: rx.targetPharmacyId },
                    select: { id: true, name: true },
                });
                pharmacy = pharmacyUser ?? null;
            }
            return { ...rx, pharmacy };
        }));
        return { data, total, page, limit };
    }
    async getPrescriptionDetail(prescriptionId, userId) {
        const patient = await this.getOrCreatePatientRecord(userId);
        const prescription = await this.prisma.prescription.findFirst({
            where: { id: prescriptionId, patientId: patient.id },
            include: {
                doctor: { select: { id: true, name: true, email: true } },
                items: {
                    include: {
                        medicine: {
                            select: { id: true, name: true, batchNumber: true },
                        },
                    },
                },
            },
        });
        if (!prescription) {
            throw new common_1.NotFoundException('Prescription not found');
        }
        let pharmacy = null;
        if (prescription.targetPharmacyId) {
            const pharmacyUser = await this.prisma.user.findUnique({
                where: { id: prescription.targetPharmacyId },
                select: { id: true, name: true },
            });
            pharmacy = pharmacyUser ?? null;
        }
        return { ...prescription, pharmacy };
    }
};
exports.PatientPortalService = PatientPortalService;
exports.PatientPortalService = PatientPortalService = PatientPortalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], PatientPortalService);
//# sourceMappingURL=patient-portal.service.js.map