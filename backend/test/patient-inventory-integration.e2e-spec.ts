import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Patient and Inventory Integration Tests (e2e)', () => {
  jest.setTimeout(30000); // 30 second timeout for all tests
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let doctorToken: string;
  let adminToken: string;
  let patientToken: string;
  let pharmacyToken: string;
  let createdPatientId: string;
  let createdMedicineId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.patient.deleteMany({});
    await prisma.medicine.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'doctor@test.com',
            'admin@test.com',
            'patient@test.com',
            'pharmacy@test.com',
          ],
        },
      },
    });

    // Create test users and get tokens
    await createTestUsers();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.patient.deleteMany({});
    await prisma.medicine.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'doctor@test.com',
            'admin@test.com',
            'patient@test.com',
            'pharmacy@test.com',
          ],
        },
      },
    });

    await app.close();
  });

  async function createTestUsers() {
    // Register and login doctor
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test Doctor',
        email: 'doctor@test.com',
        password: 'password123',
        role: 'DOCTOR',
      });
    
    const doctorLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'doctor@test.com',
        password: 'password123',
      });
    doctorToken = doctorLoginRes.body.access_token;

    // Register and login admin
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'ADMIN',
      });
    
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    adminToken = adminLoginRes.body.access_token;

    // Register and login patient
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test Patient User',
        email: 'patient@test.com',
        password: 'password123',
        role: 'PATIENT',
      });
    
    const patientLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'patient@test.com',
        password: 'password123',
      });
    patientToken = patientLoginRes.body.access_token;

    // Register and login pharmacy
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test Pharmacy',
        email: 'pharmacy@test.com',
        password: 'password123',
        role: 'PHARMACY',
      });
    
    const pharmacyLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'pharmacy@test.com',
        password: 'password123',
      });
    pharmacyToken = pharmacyLoginRes.body.access_token;
  }

  describe('Patient Management Workflows', () => {
    describe('1. Create Patient', () => {
      it('should allow doctor to create a patient', async () => {
        const response = await request(app.getHttpServer())
          .post('/patients')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            name: 'John Doe',
            age: 35,
            gender: 'MALE',
            medicalHistory: 'No known allergies',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('John Doe');
        expect(response.body.age).toBe(35);
        expect(response.body.gender).toBe('MALE');
        expect(response.body.medicalHistory).toBe('No known allergies');
        expect(response.body).toHaveProperty('createdBy');
        expect(response.body).toHaveProperty('createdAt');

        createdPatientId = response.body.id;
      });

      it('should allow admin to create a patient', async () => {
        const response = await request(app.getHttpServer())
          .post('/patients')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Jane Smith',
            age: 28,
            gender: 'FEMALE',
            medicalHistory: 'Diabetes Type 2',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Jane Smith');
      });

      it('should reject patient creation with invalid data', async () => {
        await request(app.getHttpServer())
          .post('/patients')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            name: '',
            age: -5,
            gender: 'INVALID',
          })
          .expect(400);
      });

      it('should reject patient creation with age out of range', async () => {
        await request(app.getHttpServer())
          .post('/patients')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            name: 'Test Patient',
            age: 200,
            gender: 'MALE',
          })
          .expect(400);
      });
    });

    describe('2. Read Patient', () => {
      it('should retrieve patient by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/patients/${createdPatientId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.id).toBe(createdPatientId);
        expect(response.body.name).toBe('John Doe');
        expect(response.body.age).toBe(35);
      });

      it('should return 404 for non-existent patient', async () => {
        await request(app.getHttpServer())
          .get('/patients/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(404);
      });
    });

    describe('3. Update Patient', () => {
      it('should update patient information', async () => {
        const response = await request(app.getHttpServer())
          .put(`/patients/${createdPatientId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            age: 36,
            medicalHistory: 'No known allergies. Recent checkup normal.',
          })
          .expect(200);

        expect(response.body.age).toBe(36);
        expect(response.body.medicalHistory).toBe(
          'No known allergies. Recent checkup normal.',
        );
        expect(response.body.name).toBe('John Doe'); // Unchanged
      });

      it('should preserve createdBy field on update', async () => {
        const beforeUpdate = await request(app.getHttpServer())
          .get(`/patients/${createdPatientId}`)
          .set('Authorization', `Bearer ${doctorToken}`);

        const originalCreatedBy = beforeUpdate.body.createdBy;

        await request(app.getHttpServer())
          .put(`/patients/${createdPatientId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            age: 37,
          })
          .expect(200);

        const afterUpdate = await request(app.getHttpServer())
          .get(`/patients/${createdPatientId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(afterUpdate.body.createdBy).toBe(originalCreatedBy);
      });
    });

    describe('4. List and Search Patients', () => {
      it('should list all patients with pagination', async () => {
        const response = await request(app.getHttpServer())
          .get('/patients?page=1&limit=10')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should search patients by name', async () => {
        const response = await request(app.getHttpServer())
          .get('/patients?search=John')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].name).toContain('John');
      });

      it('should return empty results for non-matching search', async () => {
        const response = await request(app.getHttpServer())
          .get('/patients?search=NonExistentName12345')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.data.length).toBe(0);
      });
    });
  });

  describe('Inventory Management Workflows', () => {
    describe('1. Create Medicine', () => {
      it('should create a new medicine item', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 365);

        const response = await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Paracetamol',
            batchNumber: 'BATCH001',
            expiryDate: futureDate.toISOString(),
            quantity: 100,
            supplier: 'PharmaCorp',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Paracetamol');
        expect(response.body.batchNumber).toBe('BATCH001');
        expect(response.body.quantity).toBe(100);
        expect(response.body.supplier).toBe('PharmaCorp');

        createdMedicineId = response.body.id;
      });

      it('should reject duplicate batch numbers', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 365);

        await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Aspirin',
            batchNumber: 'BATCH001', // Duplicate
            expiryDate: futureDate.toISOString(),
            quantity: 50,
            supplier: 'MediSupply',
          })
          .expect(409);
      });

      it('should reject medicine with past expiry date', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Expired Medicine',
            batchNumber: 'BATCH999',
            expiryDate: pastDate.toISOString(),
            quantity: 50,
            supplier: 'TestSupplier',
          })
          .expect(400);
      });

      it('should reject medicine with negative quantity', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 365);

        await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test Medicine',
            batchNumber: 'BATCH888',
            expiryDate: futureDate.toISOString(),
            quantity: -10,
            supplier: 'TestSupplier',
          })
          .expect(400);
      });
    });

    describe('2. Read Medicine', () => {
      it('should retrieve medicine by ID with status indicators', async () => {
        const response = await request(app.getHttpServer())
          .get(`/inventory/${createdMedicineId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.id).toBe(createdMedicineId);
        expect(response.body.name).toBe('Paracetamol');
        expect(response.body).toHaveProperty('stockStatus');
        expect(response.body).toHaveProperty('expiryStatus');
        expect(response.body).toHaveProperty('daysUntilExpiry');
      });

      it('should return 404 for non-existent medicine', async () => {
        await request(app.getHttpServer())
          .get('/inventory/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('3. Update Medicine', () => {
      it('should update medicine information', async () => {
        const response = await request(app.getHttpServer())
          .put(`/inventory/${createdMedicineId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            quantity: 150,
            supplier: 'PharmaCorp Updated',
          })
          .expect(200);

        expect(response.body.quantity).toBe(150);
        expect(response.body.supplier).toBe('PharmaCorp Updated');
        expect(response.body.name).toBe('Paracetamol'); // Unchanged
      });

      it('should preserve createdAt timestamp on update', async () => {
        const beforeUpdate = await request(app.getHttpServer())
          .get(`/inventory/${createdMedicineId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        const originalCreatedAt = beforeUpdate.body.createdAt;

        await request(app.getHttpServer())
          .put(`/inventory/${createdMedicineId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            quantity: 160,
          })
          .expect(200);

        const afterUpdate = await request(app.getHttpServer())
          .get(`/inventory/${createdMedicineId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(afterUpdate.body.createdAt).toBe(originalCreatedAt);
      });
    });

    describe('4. Delete Medicine', () => {
      it('should delete a medicine item', async () => {
        // Create a medicine to delete
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 365);

        const createResponse = await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'To Be Deleted',
            batchNumber: 'BATCH_DELETE',
            expiryDate: futureDate.toISOString(),
            quantity: 50,
            supplier: 'TestSupplier',
          })
          .expect(201);

        const medicineId = createResponse.body.id;

        // Delete the medicine
        await request(app.getHttpServer())
          .delete(`/inventory/${medicineId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(204);

        // Verify it's deleted
        await request(app.getHttpServer())
          .get(`/inventory/${medicineId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('5. List, Search, and Filter Inventory', () => {
      beforeAll(async () => {
        // Create test medicines with different statuses
        const now = new Date();

        // Low stock medicine
        await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Low Stock Medicine',
            batchNumber: 'BATCH_LOW',
            expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            quantity: 5,
            supplier: 'TestSupplier',
          });

        // Expiring soon medicine
        await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Expiring Soon Medicine',
            batchNumber: 'BATCH_EXPIRING',
            expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            quantity: 50,
            supplier: 'TestSupplier',
          });
      });

      it('should list all medicines with pagination', async () => {
        const response = await request(app.getHttpServer())
          .get('/inventory?page=1&limit=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('stats');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should include inventory statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.stats).toHaveProperty('lowStock');
        expect(response.body.stats).toHaveProperty('expiring');
        expect(response.body.stats).toHaveProperty('expired');
        expect(response.body.stats.lowStock).toBeGreaterThan(0);
      });

      it('should search medicines by name', async () => {
        const response = await request(app.getHttpServer())
          .get('/inventory?search=Paracetamol')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0].name).toContain('Paracetamol');
      });

      it('should filter by low stock status', async () => {
        const response = await request(app.getHttpServer())
          .get('/inventory?stockStatus=LOW')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        response.body.data.forEach((medicine: any) => {
          expect(medicine.stockStatus).toBe('LOW');
          expect(medicine.quantity).toBeLessThan(10);
        });
      });

      it('should filter by expiring status', async () => {
        const response = await request(app.getHttpServer())
          .get('/inventory?expiryStatus=EXPIRING')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        response.body.data.forEach((medicine: any) => {
          expect(medicine.expiryStatus).toBe('EXPIRING');
          expect(medicine.daysUntilExpiry).toBeLessThanOrEqual(30);
          expect(medicine.daysUntilExpiry).toBeGreaterThan(0);
        });
      });

      it('should search by supplier', async () => {
        const response = await request(app.getHttpServer())
          .get('/inventory?search=PharmaCorp')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Role-Based Access Control', () => {
    describe('Patient Endpoints', () => {
      it('should allow DOCTOR role to access patient endpoints', async () => {
        await request(app.getHttpServer())
          .get('/patients')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);
      });

      it('should allow ADMIN role to access patient endpoints', async () => {
        await request(app.getHttpServer())
          .get('/patients')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });

      it('should deny PATIENT role access to patient endpoints', async () => {
        await request(app.getHttpServer())
          .get('/patients')
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);
      });

      it('should deny PHARMACY role access to patient endpoints', async () => {
        await request(app.getHttpServer())
          .get('/patients')
          .set('Authorization', `Bearer ${pharmacyToken}`)
          .expect(403);
      });

      it('should deny unauthenticated access to patient endpoints', async () => {
        await request(app.getHttpServer())
          .get('/patients')
          .expect(401);
      });
    });

    describe('Inventory Endpoints', () => {
      it('should allow authenticated users to access inventory endpoints', async () => {
        await request(app.getHttpServer())
          .get('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        await request(app.getHttpServer())
          .get('/inventory')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);
      });

      it('should deny unauthenticated access to inventory endpoints', async () => {
        await request(app.getHttpServer())
          .get('/inventory')
          .expect(401);
      });
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    describe('Patient Error Handling', () => {
      it('should handle missing required fields', async () => {
        const response = await request(app.getHttpServer())
          .post('/patients')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            name: 'Test',
            // Missing age and gender
          })
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });

      it('should handle invalid UUID format', async () => {
        await request(app.getHttpServer())
          .get('/patients/invalid-uuid')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(404); // NestJS returns 404 for invalid UUID format
      });

      it('should handle very long medical history', async () => {
        const longHistory = 'A'.repeat(3000);

        await request(app.getHttpServer())
          .post('/patients')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            name: 'Test Patient',
            age: 30,
            gender: 'MALE',
            medicalHistory: longHistory,
          })
          .expect(400);
      });
    });

    describe('Inventory Error Handling', () => {
      it('should handle missing required fields', async () => {
        const response = await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test Medicine',
            // Missing other required fields
          })
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });

      it('should handle invalid date format', async () => {
        await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test Medicine',
            batchNumber: 'BATCH_INVALID_DATE',
            expiryDate: 'invalid-date',
            quantity: 50,
            supplier: 'TestSupplier',
          })
          .expect(400);
      });

      it('should handle zero quantity', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 365);

        const response = await request(app.getHttpServer())
          .post('/inventory')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Zero Quantity Medicine',
            batchNumber: 'BATCH_ZERO',
            expiryDate: futureDate.toISOString(),
            quantity: 0,
            supplier: 'TestSupplier',
          })
          .expect(201);

        expect(response.body.quantity).toBe(0);
        expect(response.body.stockStatus).toBe('LOW');
      });
    });

    describe('Pagination Edge Cases', () => {
      it('should handle page beyond available data', async () => {
        const response = await request(app.getHttpServer())
          .get('/patients?page=9999&limit=10')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body.data).toEqual([]);
        expect(response.body.page).toBe(9999);
      });

      it('should handle invalid pagination parameters', async () => {
        // The API corrects invalid pagination parameters instead of returning 400
        const response = await request(app.getHttpServer())
          .get('/patients?page=-1&limit=0')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        // Should correct to valid defaults
        expect(response.body.page).toBeGreaterThanOrEqual(1);
        expect(response.body.limit).toBeGreaterThanOrEqual(1);
      });

      it('should handle very large limit', async () => {
        // The API caps the limit at a maximum value instead of returning 400
        const response = await request(app.getHttpServer())
          .get('/patients?page=1&limit=10000')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        // Should cap at maximum (100)
        expect(response.body.limit).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should respond within acceptable time for patient list', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/patients?page=1&limit=10')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // E2E tests include network overhead, so we use a more realistic threshold
      expect(responseTime).toBeLessThan(2000); // 2 second threshold for e2e
    });

    it('should respond within acceptable time for inventory list', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/inventory?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // E2E tests include network overhead, so we use a more realistic threshold
      expect(responseTime).toBeLessThan(2000); // 2 second threshold for e2e
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/patients')
            .set('Authorization', `Bearer ${doctorToken}`),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
