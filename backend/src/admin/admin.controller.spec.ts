import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: any;

  beforeEach(async () => {
    service = {
      listTenants: jest.fn(),
      activateTenant: jest.fn(),
      deactivateTenant: jest.fn(),
      listUsers: jest.fn(),
      activateUser: jest.fn(),
      deactivateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: service }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call listTenants with query', async () => {
    const query = { page: 1, limit: 10 };
    service.listTenants.mockResolvedValue({ data: [], total: 0 });

    await controller.listTenants(query);

    expect(service.listTenants).toHaveBeenCalledWith(query);
  });

  it('should call activateTenant with id', async () => {
    service.activateTenant.mockResolvedValue({ id: 't1', isActive: true });

    await controller.activateTenant('t1');

    expect(service.activateTenant).toHaveBeenCalledWith('t1');
  });

  it('should call deactivateTenant with id', async () => {
    service.deactivateTenant.mockResolvedValue({ id: 't1', isActive: false });

    await controller.deactivateTenant('t1');

    expect(service.deactivateTenant).toHaveBeenCalledWith('t1');
  });

  it('should call listUsers with query', async () => {
    const query = { page: 1, limit: 10, role: 'DOCTOR' as any };
    service.listUsers.mockResolvedValue({ data: [], total: 0 });

    await controller.listUsers(query);

    expect(service.listUsers).toHaveBeenCalledWith(query);
  });

  it('should call activateUser with id', async () => {
    service.activateUser.mockResolvedValue({ id: 'u1' });

    await controller.activateUser('u1');

    expect(service.activateUser).toHaveBeenCalledWith('u1');
  });

  it('should call deactivateUser with id', async () => {
    service.deactivateUser.mockResolvedValue({ id: 'u1' });

    await controller.deactivateUser('u1');

    expect(service.deactivateUser).toHaveBeenCalledWith('u1');
  });
});
