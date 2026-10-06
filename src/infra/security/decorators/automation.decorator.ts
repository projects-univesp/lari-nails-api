import { SetMetadata } from '@nestjs/common';

export const IS_AUTOMATION_KEY = 'isAutomation';
export const Automation = () => SetMetadata(IS_AUTOMATION_KEY, true);
