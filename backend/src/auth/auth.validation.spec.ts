import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('ValidationPipe - Unknown Fields Stripping (Task 8.1)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Register global ValidationPipe with whitelist and forbidNonWhitelisted
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Clean up database after each test
    await prismaService.user.deleteMany({});
  });

  describe('POST /auth/register - Unknown fields stripping', () => {
    it('should strip unknown fields from request body before handler', async () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'DOCTOR',
        unknownField: 'should be stripped',
        anotherUnknown: 'also stripped',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(201);

      // Verify the response does not contain unknown fields
      expect(response.body).not.toHaveProperty('unknownField');
      expect(response.body).not.toHaveProperty('anotherUnknown');
      
      // Verify the response contains expected fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'John Doe');
      expect(response.body).toHaveProperty('email', 'john@example.com');
      expect(response.body).toHaveProperty('role', 'DOCTOR');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 when forbidNonWhitelisted is true and unknown fields are present', async () => {
      const payload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'PATIENT',
        extraField: 'this should cause 400',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(400);

      // Verify error response structure
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('POST /auth/register - Validation constraint violations', () => {
    it('should return 400 when email is invalid', async () => {
      const payload = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        role: 'DOCTOR',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 when password is too short', async () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short',
        role: 'DOCTOR',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 when role is invalid', async () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'INVALID_ROLE',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 when name is missing', async () => {
      const payload = {
        email: 'john@example.com',
        password: 'password123',
        role: 'DOCTOR',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('POST /auth/login - Validation constraint violations', () => {
    it('should return 400 when email is invalid', async () => {
      const payload = {
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 when password is missing', async () => {
      const payload = {
        email: 'john@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should strip unknown fields from login request', async () => {
      // First register a user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'DOCTOR',
        })
        .expect(201);

      // Then login with unknown fields
      const payload = {
        email: 'john@example.com',
        password: 'password123',
        unknownField: 'should be stripped',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)
        .expect(400); // Should fail because forbidNonWhitelisted is true

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });
});
