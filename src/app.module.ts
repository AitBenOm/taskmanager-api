import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersService } from './users/users.service';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from './tasks/tasks.module';
import { GroupsModule } from './groups/groups.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { CalendarModule } from './calendar/calendar.module';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TasksModule,
    GroupsModule,
    WorkspaceModule,
    CalendarModule,
    NotificationsModule,
    ActivityModule,
  ],
  controllers: [AppController, NotificationsController],
  providers: [AppService, UsersService, NotificationsService],
})
export class AppModule {}
