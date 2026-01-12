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
import { ContextService } from './context/context.service';
import { ContextController } from './context/context.controller';
import { GroupsController } from './groups/groups.controller';
import { GroupsService } from './groups/groups.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    TasksModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TasksModule,
    GroupsModule,
    WorkspaceModule,
    CalendarModule,
    NotificationsModule,
    ActivityModule,
    GroupsModule,
  ],
  controllers: [
    AppController,
    NotificationsController,
    ContextController,
    GroupsController,
  ],
  providers: [
    AppService,
    UsersService,
    NotificationsService,
    ContextService,
    GroupsService,
  ],
})
export class AppModule {}
