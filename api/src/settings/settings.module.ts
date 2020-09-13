import { forwardRef, Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JiraSettingsSchema } from 'src/plugins/jira/schemas/jira.schema';
import { JiraModule } from 'src/plugins/jira/jira.module';
import { SmtpModule } from 'src/plugins/smtp/smtp.module';
import { SlackModule } from 'src/plugins/slack/slack.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'JiraSettings', schema: JiraSettingsSchema },
    ]),
    forwardRef(() => UsersModule),
    JiraModule,
    SmtpModule,
    SlackModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
