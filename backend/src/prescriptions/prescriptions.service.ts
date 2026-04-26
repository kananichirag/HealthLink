import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionStatusDto } from './dto/update-prescription-status.dto';
import {
  PrescriptionResponseDto,
  PaginatedPrescriptionsResponseDto,
} from './dto/prescription-response.dto';
import {
  PRESCRIPTION_CREATED,
  PRESCRIPTION_CANCELLED,
  PrescriptionCreatedPayload,
} from './events/prescription.events';
import { PrescriptionStatus } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);
  private readonly LOW_STOCK_THRESHOLD = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPrescription(
    dto: CreatePrescriptionDto,
    doctorId: string,
  ): Promise<PrescriptionResponseDto> {
    this.logger.log(`Creating prescription for patient ${dto.patientId} by doctor ${doctorId}`);

    // Validate patient exists (outside transaction — no need to hold a tx open for this)
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
    }

    // Fetch all medicines in a single query (outside transaction to avoid timeout)
    const medicineIds = dto.items.map((i) => i.medicineId);
    const medicines = await this.prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      select: { id: true, name: true, quantity: true },
    });

    // Validate all medicines exist
    for (const item of dto.items) {
      const medicine = medicines.find((m) => m.id === item.medicineId);
      if (!medicine) {
        throw new NotFoundException(`Medicine with ID ${item.medicineId} not found`);
      }
      if (medicine.quantity < item.quantity) {
        throw new UnprocessableEntityException(
          `Insufficient stock for "${medicine.name}": available ${medicine.quantity}, requested ${item.quantity}`,
        );
      }
    }

    // Build the medicine update payload for the event (pre-calculate new quantities)
    const medicineUpdates: PrescriptionCreatedPayload['medicines'] = dto.items.map((item) => {
      const medicine = medicines.find((m) => m.id === item.medicineId)!;
      return {
        medicineId: medicine.id,
        name: medicine.name,
        newQuantity: medicine.quantity - item.quantity,
      };
    });

    // Atomic writes only — keep the transaction as short as possible
    const prescription = await this.prisma.$transaction(
      async (tx) => {
        // Decrement stock for each medicine
        await Promise.all(
          dto.items.map((item) =>
            tx.medicine.update({
              where: { id: item.medicineId },
              data: { quantity: { decrement: item.quantity } },
            }),
          ),
        );

        // Create prescription with items
        return tx.prescription.create({
          data: {
            patient: { connect: { id: dto.patientId } },
            doctor: { connect: { id: doctorId } },
            status: PrescriptionStatus.PENDING,
            items: {
              create: dto.items.map((item) => ({
                medicine: { connect: { id: item.medicineId } },
                quantity: item.quantity,
              })),
            },
          },
          include: {
            items: {
              include: {
                medicine: { select: { name: true } },
              },
            },
          },
        });
      },
      { timeout: 30000 }, // 30 second timeout for remote DBs
    );

    // Emit event after successful commit
    this.eventEmitter.emit(PRESCRIPTION_CREATED, {
      prescriptionId: prescription.id,
      doctorId,
      patientId: dto.patientId,
      medicines: medicineUpdates,
    } satisfies PrescriptionCreatedPayload);

    return this.toResponseDto(prescription);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedPrescriptionsResponseDto> {
    const skip = (page - 1) * limit;

    const [total, prescriptions] = await Promise.all([
      this.prisma.prescription.count(),
      this.prisma.prescription.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      }),
    ]);

    return {
      data: prescriptions.map((p) => ({
        id: p.id,
        patientId: p.patientId,
        doctorId: p.doctorId,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        itemCount: p._count.items,
      })),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<PrescriptionResponseDto> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            medicine: { select: { name: true } },
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    return this.toResponseDto(prescription);
  }

  async updateStatus(
    id: string,
    dto: UpdatePrescriptionStatusDto,
  ): Promise<PrescriptionResponseDto> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${id} not found`);
    }

    if (dto.status === PrescriptionStatus.CANCELLED) {
      // Restore stock atomically — parallel updates + timeout for remote DB
      await this.prisma.$transaction(
        async (tx) => {
          await Promise.all(
            prescription.items.map((item) =>
              tx.medicine.update({
                where: { id: item.medicineId },
                data: { quantity: { increment: item.quantity } },
              }),
            ),
          );

          await tx.prescription.update({
            where: { id },
            data: { status: PrescriptionStatus.CANCELLED },
          });
        },
        { timeout: 30000 },
      );

      this.eventEmitter.emit(PRESCRIPTION_CANCELLED, { prescriptionId: id });
    } else {
      await this.prisma.prescription.update({
        where: { id },
        data: { status: dto.status },
      });
    }

    return this.findById(id);
  }

  private toResponseDto(prescription: any): PrescriptionResponseDto {
    return {
      id: prescription.id,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      status: prescription.status,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
      items: prescription.items?.map((item: any) => ({
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicine?.name ?? '',
        quantity: item.quantity,
        createdAt: item.createdAt,
      })),
      itemCount: prescription._count?.items,
    };
  }
}
