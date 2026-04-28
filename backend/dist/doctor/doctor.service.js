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
var DoctorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let DoctorService = DoctorService_1 = class DoctorService {
    prisma;
    notificationsService;
    logger = new common_1.Logger(DoctorService_1.name);
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async createPatient(dto, userId, tenantId) {
        this.logger.log(`Creating patient: ${dto.name} by doctor: ${userId}`);
        if (dto.email) {
            const existing = await this.prisma.patient.findFirst({
                where: { email: dto.email, tenantId },
            });
            if (existing) {
                throw new common_1.ConflictException('A patient with this email already exists in your tenant');
            }
        }
        try {
            const patient = await this.prisma.patient.create({
                data: {
                    name: dto.name,
                    email: dto.email ?? null,
                    mobile: dto.mobile ?? null,
                    age: dto.age,
                    gender: dto.gender,
                    medicalHistory: dto.medicalHistory ?? null,
                    createdBy: userId,
                    tenantId,
                },
            });
            return patient;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('A patient with this email already exists in your tenant');
            }
            this.logger.error(`Failed to create patient: ${error.message}`);
            throw new common_1.BadRequestException('Failed to create patient');
        }
    }
    async listPatients(query, tenantId) {
        const { page = 1, limit = 10, search } = query;
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [total, patients] = await Promise.all([
            this.prisma.patient.count({ where }),
            this.prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return { data: patients, total, page, limit };
    }
    async createAllergyReport(dto, doctorId, tenantId) {
        this.logger.log(`Creating allergy report for patient: ${dto.patientId} by doctor: ${doctorId}`);
        const patient = await this.prisma.patient.findFirst({
            where: { id: dto.patientId, tenantId },
        });
        if (!patient) {
            throw new common_1.ForbiddenException('Patient does not belong to your tenant');
        }
        const report = await this.prisma.allergyReport.create({
            data: {
                patientId: dto.patientId,
                doctorId,
                allergyType: dto.allergyType,
                symptoms: dto.symptoms,
                severity: dto.severity,
                notes: dto.notes ?? null,
                tenantId,
            },
        });
        return report;
    }
    async getPatientAllergyReports(patientId, tenantId) {
        const patient = await this.prisma.patient.findFirst({
            where: { id: patientId, tenantId },
        });
        if (!patient) {
            throw new common_1.ForbiddenException('Patient does not belong to your tenant');
        }
        const reports = await this.prisma.allergyReport.findMany({
            where: { patientId, tenantId },
            orderBy: { createdAt: 'desc' },
        });
        return reports;
    }
    async createPrescription(dto, doctorId, tenantId) {
        this.logger.log(`Creating prescription for patient: ${dto.patientId} by doctor: ${doctorId}`);
        const patient = await this.prisma.patient.findFirst({
            where: { id: dto.patientId, tenantId },
        });
        if (!patient) {
            throw new common_1.ForbiddenException('Patient does not belong to your tenant');
        }
        const itemsWithMedicineIds = await Promise.all(dto.items.map(async (item) => {
            const medicine = await this.prisma.medicine.findFirst({
                where: { name: item.medicineName, tenantId },
            });
            if (!medicine) {
                throw new common_1.BadRequestException(`Medicine "${item.medicineName}" not found in your tenant`);
            }
            return {
                medicineId: medicine.id,
                quantity: item.quantity,
                dosage: item.dosage,
                frequency: item.frequency,
            };
        }));
        const prescription = await this.prisma.prescription.create({
            data: {
                patientId: dto.patientId,
                doctorId,
                status: 'PENDING',
                tenantId,
                targetPharmacyId: dto.targetPharmacyId ?? null,
                items: {
                    create: itemsWithMedicineIds,
                },
            },
            include: { items: true },
        });
        return prescription;
    }
    async dispatchToPharmacy(prescriptionId, pharmacyId, doctorId, tenantId) {
        this.logger.log(`Dispatching prescription ${prescriptionId} to pharmacy ${pharmacyId}`);
        const prescription = await this.prisma.prescription.findFirst({
            where: { id: prescriptionId, doctorId, tenantId },
            include: { patient: true },
        });
        if (!prescription) {
            throw new common_1.NotFoundException('Prescription not found');
        }
        const connection = await this.prisma.doctorPharmacyConnection.findFirst({
            where: {
                doctorId,
                pharmacyId,
                status: 'ACTIVE',
            },
        });
        if (!connection) {
            throw new common_1.BadRequestException('No active connection exists with the specified pharmacy');
        }
        const updated = await this.prisma.prescription.update({
            where: { id: prescriptionId },
            data: { targetPharmacyId: pharmacyId },
            include: { items: true, patient: true, doctor: true },
        });
        const doctor = await this.prisma.user.findFirst({
            where: { id: doctorId },
        });
        await this.notificationsService.create(pharmacyId, 'PRESCRIPTION_DISPATCHED', `New prescription ${prescriptionId} from Dr. ${doctor?.name ?? 'Unknown'} for patient ${prescription.patient.name}`);
        return updated;
    }
    async requestConnection(dto, doctorId, tenantId) {
        this.logger.log(`Doctor ${doctorId} requesting connection with pharmacy ${dto.pharmacyId}`);
        try {
            const connection = await this.prisma.doctorPharmacyConnection.create({
                data: {
                    doctorId,
                    pharmacyId: dto.pharmacyId,
                    status: 'PENDING',
                    tenantId,
                },
                include: { pharmacy: { select: { id: true, name: true, email: true } } },
            });
            return connection;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('A connection with this pharmacy already exists');
            }
            throw error;
        }
    }
    async listConnections(doctorId) {
        const connections = await this.prisma.doctorPharmacyConnection.findMany({
            where: { doctorId },
            include: { pharmacy: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return connections;
    }
    async listPharmacies(doctorId) {
        const pharmacies = await this.prisma.user.findMany({
            where: { role: 'PHARMACY' },
            select: { id: true, name: true, email: true },
        });
        const connections = await this.prisma.doctorPharmacyConnection.findMany({
            where: { doctorId },
        });
        const connectionMap = new Map(connections.map((c) => [c.pharmacyId, c.status]));
        return pharmacies.map((pharmacy) => ({
            ...pharmacy,
            connectionStatus: connectionMap.get(pharmacy.id) ?? null,
        }));
    }
    async terminateConnection(connectionId, doctorId) {
        const connection = await this.prisma.doctorPharmacyConnection.findFirst({
            where: { id: connectionId, doctorId },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection not found');
        }
        const updated = await this.prisma.doctorPharmacyConnection.update({
            where: { id: connectionId },
            data: { status: 'INACTIVE' },
            include: { pharmacy: { select: { id: true, name: true, email: true } } },
        });
        return updated;
    }
    async acceptConnection(connectionId, pharmacyId) {
        const connection = await this.prisma.doctorPharmacyConnection.findFirst({
            where: { id: connectionId, pharmacyId, status: 'PENDING' },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Pending connection not found');
        }
        const updated = await this.prisma.doctorPharmacyConnection.update({
            where: { id: connectionId },
            data: { status: 'ACTIVE' },
            include: {
                doctor: { select: { id: true, name: true, email: true } },
                pharmacy: { select: { id: true, name: true, email: true } },
            },
        });
        return updated;
    }
    async listAppointments(query, doctorId, tenantId) {
        const { status, startDate, endDate, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = tenantId
            ? { doctorId, tenantId }
            : { doctorId };
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
                    patient: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);
        const enrichedAppointments = appointments.map(appointment => ({
            ...appointment,
            isOverdue: this.isAppointmentOverdue(appointment),
        }));
        return { data: enrichedAppointments, total, page, limit };
    }
    async getSchedule(doctorId, tenantId) {
        const schedules = await this.prisma.doctorSchedule.findMany({
            where: { doctorId },
            select: { dayOfWeek: true, startTime: true, endTime: true },
            orderBy: { dayOfWeek: 'asc' },
        });
        const blockedDates = await this.prisma.blockedDate.findMany({
            where: { doctorId },
            select: { date: true },
        });
        return {
            slots: schedules,
            blockedDates: blockedDates.map((b) => b.date.toISOString().split('T')[0]),
            maxPerDay: 20,
        };
    }
    async setAvailability(dto, doctorId, tenantId) {
        this.logger.log(`Setting availability for doctor: ${doctorId}`);
        await this.prisma.doctorSchedule.deleteMany({
            where: { doctorId, tenantId },
        });
        if (dto.slots.length === 0) {
            return [];
        }
        const schedules = await Promise.all(dto.slots.map((slot) => this.prisma.doctorSchedule.create({
            data: {
                doctorId,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                tenantId,
            },
        })));
        return schedules;
    }
    async blockDate(dto, doctorId, tenantId) {
        this.logger.log(`Blocking date ${dto.date} for doctor: ${doctorId}`);
        try {
            const blocked = await this.prisma.blockedDate.create({
                data: {
                    doctorId,
                    date: new Date(dto.date),
                    tenantId,
                },
            });
            return blocked;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('This date is already blocked');
            }
            throw error;
        }
    }
    async unblockDate(date, doctorId, tenantId) {
        this.logger.log(`Unblocking date ${date} for doctor: ${doctorId}`);
        const blocked = await this.prisma.blockedDate.findFirst({
            where: {
                doctorId,
                date: new Date(date),
                tenantId,
            },
        });
        if (!blocked) {
            throw new common_1.NotFoundException('Blocked date not found');
        }
        await this.prisma.blockedDate.delete({
            where: { id: blocked.id },
        });
        return { message: 'Date unblocked successfully' };
    }
    async setMaxAppointments(dto, doctorId, tenantId) {
        this.logger.log(`Setting max appointments per day to ${dto.maxPerDay} for doctor: ${doctorId}`);
        return { doctorId, maxPerDay: dto.maxPerDay, tenantId };
    }
    async cancelAppointment(appointmentId, doctorId, tenantId) {
        this.logger.log(`Doctor ${doctorId} cancelling appointment ${appointmentId}`);
        const appointment = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctorId,
                tenantId
            },
            include: {
                patient: { select: { id: true, name: true } },
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appointment.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Appointment is already cancelled');
        }
        await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'CANCELLED',
                updatedAt: new Date(),
            },
        });
        this.logger.log(`Appointment ${appointmentId} cancelled successfully by doctor ${doctorId}`);
        return { message: 'Appointment cancelled successfully' };
    }
    async rescheduleAppointment(appointmentId, doctorId, tenantId, newDate, newTimeSlot) {
        this.logger.log(`Doctor ${doctorId} attempting to reschedule appointment ${appointmentId}`);
        const appointment = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctorId,
                tenantId
            },
            include: {
                patient: { select: { id: true, name: true } },
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appointment.status !== 'SCHEDULED') {
            throw new common_1.BadRequestException('Only scheduled appointments can be rescheduled');
        }
        const newAppointmentDate = new Date(newDate);
        const isAvailable = await this.checkSlotAvailability(doctorId, newAppointmentDate, newTimeSlot, tenantId, appointmentId);
        if (!isAvailable) {
            throw new common_1.BadRequestException('The selected time slot is no longer available');
        }
        let updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                date: newAppointmentDate,
                timeSlot: newTimeSlot,
                isRescheduled: true,
                updatedAt: new Date(),
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
            isOverdue: this.isAppointmentOverdue(updatedAppointment),
        };
        this.logger.log(`Appointment ${appointmentId} rescheduled successfully by doctor ${doctorId}`);
        return updatedAppointment;
    }
    isAppointmentOverdue(appointment) {
        if (appointment.status !== 'SCHEDULED') {
            return false;
        }
        if (!appointment.date || !appointment.timeSlot) {
            return false;
        }
        const appointmentDateTime = this.combineDateTime(appointment.date, appointment.timeSlot);
        const now = new Date();
        return appointmentDateTime < now;
    }
    combineDateTime(date, timeSlot) {
        if (!date || !timeSlot) {
            return new Date();
        }
        const appointmentDate = new Date(date);
        let hours;
        let minutes;
        if (timeSlot.includes('AM') || timeSlot.includes('PM')) {
            const [time, period] = timeSlot.split(' ');
            const [hourStr, minuteStr] = time.split(':');
            hours = parseInt(hourStr, 10);
            minutes = parseInt(minuteStr, 10);
            if (period === 'PM' && hours !== 12) {
                hours += 12;
            }
            else if (period === 'AM' && hours === 12) {
                hours = 0;
            }
        }
        else {
            const [hourStr, minuteStr] = timeSlot.split(':');
            hours = parseInt(hourStr, 10);
            minutes = parseInt(minuteStr, 10);
        }
        if (isNaN(hours) || isNaN(minutes)) {
            return new Date();
        }
        appointmentDate.setHours(hours, minutes, 0, 0);
        return appointmentDate;
    }
    async checkSlotAvailability(doctorId, date, timeSlot, tenantId, excludeAppointmentId) {
        const whereClause = {
            doctorId,
            date,
            timeSlot,
            status: 'SCHEDULED',
            tenantId,
        };
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
    async completeAppointment(appointmentId, doctorId, tenantId) {
        this.logger.log(`Doctor ${doctorId} completing appointment ${appointmentId}`);
        const appointment = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctorId,
                tenantId
            },
            include: {
                patient: { select: { id: true, name: true } },
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appointment.status === 'COMPLETED') {
            throw new common_1.BadRequestException('Appointment is already completed');
        }
        if (appointment.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot complete a cancelled appointment');
        }
        const updatedAppointment = await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'COMPLETED',
                updatedAt: new Date(),
            },
            include: {
                patient: { select: { id: true, name: true } },
                doctor: { select: { id: true, name: true } },
            },
        });
        const enrichedAppointment = {
            ...updatedAppointment,
            isOverdue: this.isAppointmentOverdue(updatedAppointment),
        };
        this.logger.log(`Appointment ${appointmentId} completed successfully by doctor ${doctorId}`);
        return enrichedAppointment;
    }
};
exports.DoctorService = DoctorService;
exports.DoctorService = DoctorService = DoctorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], DoctorService);
//# sourceMappingURL=doctor.service.js.map