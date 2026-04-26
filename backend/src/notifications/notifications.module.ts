import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsListener } from './notifications.listener';
import { EmailService } from './email.service';
import { ExpiryCheckScheduler } from './scheduler/expiry-check.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsListener,
    EmailService,
    ExpiryCheckScheduler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
