import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Patch,
  UseFilters,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../infra/security/decorators/roles.decorator';
import { AppointmentUseCase } from '../application/appointment.usecase';
import {
  CreateAppointmentDto,
  DecideAppointmentDto,
  IdAppointmentDto,
  ListAppointmentsDto,
  RescheduleAppointmentDto,
} from './dtos/appointment.dto';
import { AppointmentDomainFilter } from './filters/appointment.domain.filter';
import { AppointmentPresenter } from './presenters/appointment.presenter';

interface AuthenticatedUser {
  sub: string;
  role: string;
}

@Controller('appointments')
@UseFilters(AppointmentDomainFilter)
export class AppointmentController {
  constructor(private readonly appointments: AppointmentUseCase) {}

  @Post()
  async create(@Body() body: CreateAppointmentDto, @Req() request: Request) {
    const actor = request.user as AuthenticatedUser;
    return AppointmentPresenter.toHTTP(
      await this.appointments.create(body, actor.sub),
    );
  }

  @Get()
  async list(@Query() query: ListAppointmentsDto) {
    const records = await this.appointments.list(
      query.from,
      query.to,
      query.status,
    );
    return records.map((record) => AppointmentPresenter.toHTTP(record));
  }

  @Get('pending')
  async listPending() {
    const records = await this.appointments.listPending();
    return records.map((record) => AppointmentPresenter.toHTTP(record));
  }

  @Get(':id')
  async find(@Param() params: IdAppointmentDto) {
    return AppointmentPresenter.toHTTP(await this.appointments.find(params.id));
  }

  @Get(':id/history')
  history(@Param() params: IdAppointmentDto) {
    return this.appointments.history(params.id);
  }

  @Roles('admin')
  @Patch(':id/reschedule')
  async reschedule(@Param() params: IdAppointmentDto, @Body() body: RescheduleAppointmentDto, @Req() request: Request) {
    const actor = request.user as AuthenticatedUser;
    return AppointmentPresenter.toHTTP(await this.appointments.reschedule(params.id, body.requestedDate, body.requestedTime, actor.sub));
  }

  @Roles('admin')
  @Post(':id/status')
  @HttpCode(200)
  async decide(
    @Param() params: IdAppointmentDto,
    @Body() body: DecideAppointmentDto,
    @Req() request: Request,
  ) {
    const actor = request.user as AuthenticatedUser;
    return AppointmentPresenter.toHTTP(
      await this.appointments.decide(params.id, body, actor.sub),
    );
  }
}
