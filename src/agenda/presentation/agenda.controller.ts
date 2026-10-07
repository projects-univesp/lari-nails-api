import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseFilters,
} from '@nestjs/common';
import { Roles } from '../../infra/security/decorators/roles.decorator';
import { AgendaBlockUseCase } from '../application/agenda-block.usecase';
import { BusinessHoursUseCase } from '../application/business-hours.usecase';
import { FindAvailabilityUseCase } from '../application/find-availability.usecase';
import { AgendaDomainFilter } from './filters/agenda.domain.filter';
import {
  AvailabilityQueryDto,
  CreateAgendaBlockDto,
  DateRangeDto,
  IdAgendaBlockDto,
  UpdateAgendaBlockDto,
} from './dtos/agenda-block.dto';
import { ReplaceBusinessHoursDto } from './dtos/business-hours.dto';

@Controller()
@UseFilters(AgendaDomainFilter)
export class AgendaController {
  constructor(
    private readonly hours: BusinessHoursUseCase,
    private readonly blocks: AgendaBlockUseCase,
    private readonly availability: FindAvailabilityUseCase,
  ) {}

  @Get('business-hours')
  listHours() {
    return this.hours.list();
  }

  @Roles('admin')
  @Put('business-hours')
  replaceHours(@Body() body: ReplaceBusinessHoursDto) {
    return this.hours.replace(
      body.days.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        isOpen: day.isOpen,
        openTime: day.openTime ?? null,
        closeTime: day.closeTime ?? null,
        lunchStart: day.lunchStart ?? null,
        lunchEnd: day.lunchEnd ?? null,
      })),
    );
  }

  @Get('agenda-blocks')
  listBlocks(@Query() query: DateRangeDto) {
    return this.blocks.list(query.from, query.to);
  }

  @Roles('admin')
  @Post('agenda-blocks')
  createBlock(@Body() body: CreateAgendaBlockDto) {
    return this.blocks.create(body);
  }

  @Roles('admin')
  @Patch('agenda-blocks/:id')
  updateBlock(
    @Param() params: IdAgendaBlockDto,
    @Body() body: UpdateAgendaBlockDto,
  ) {
    return this.blocks.update(params.id, body);
  }

  @Roles('admin')
  @Delete('agenda-blocks/:id')
  @HttpCode(204)
  deleteBlock(@Param() params: IdAgendaBlockDto) {
    return this.blocks.delete(params.id);
  }

  @Get('availability')
  findAvailability(@Query() query: AvailabilityQueryDto) {
    return this.availability.execute(query.serviceId, query.from, query.to, new Date(), query.excludeAppointmentId);
  }
}
