import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { BusinessHoursUseCase } from '../../agenda/application/business-hours.usecase';
import { FindAvailabilityUseCase } from '../../agenda/application/find-availability.usecase';
import { AvailabilityQueryDto } from '../../agenda/presentation/dtos/agenda-block.dto';
import { AppointmentUseCase } from '../../appointments/application/appointment.usecase';
import { AppointmentDomainFilter } from '../../appointments/presentation/filters/appointment.domain.filter';
import { AutomationDomainFilter } from './filters/automation-event.domain.filter';
import { AppointmentPresenter } from '../../appointments/presentation/presenters/appointment.presenter';
import { FindClientUseCase } from '../../clients/application/find.client.usecase';
import { ResolveAutomationClientUseCase } from '../../clients/application/resolve-automation-client.usecase';
import { ClientPresenter } from '../../clients/presentation/presenters/clients.presenter';
import { Automation } from '../../infra/security/decorators/automation.decorator';
import { FindAllCatalogItemUseCase } from '../../catalog/application/find-all.catalog-item.usecase';
import { CatalogItemPresenter } from '../../catalog/presentation/presenters/catalog-item.presenter';
import {
  CreateAutomationAppointmentDto,
  ResolveAutomationClientDto,
} from './dtos/automation.dto';
import { VerifyAutomationEventDto } from './dtos/automation.dto';
import { VerifyAutomationEventUseCase } from '../application/verify-automation-event.usecase';

@Automation()
@Controller('automation')
@UseFilters(AppointmentDomainFilter, AutomationDomainFilter)
export class AutomationController {
  constructor(
    private readonly services: FindAllCatalogItemUseCase,
    private readonly hours: BusinessHoursUseCase,
    private readonly availability: FindAvailabilityUseCase,
    private readonly resolveClient: ResolveAutomationClientUseCase,
    private readonly findClient: FindClientUseCase,
    private readonly appointments: AppointmentUseCase,
    private readonly verifyEvent: VerifyAutomationEventUseCase,
  ) {}

  @Get('catalog')
  async listServices() {
    return (await this.services.execute(true)).map((service) =>
      CatalogItemPresenter.toHTTP(service),
    );
  }

  @Get('business-hours')
  listHours() {
    return this.hours.list();
  }

  @Get('availability')
  listAvailability(@Query() query: AvailabilityQueryDto) {
    return this.availability.execute(query.serviceId, query.from, query.to);
  }

  @Post('clients/resolve')
  async resolve(@Body() body: ResolveAutomationClientDto) {
    const result = await this.resolveClient.execute(body.nome, body.telefone);
    return {
      client: ClientPresenter.toHTTP(result.client),
      created: result.created,
    };
  }

  @Get('clients/:id')
  async client(@Param('id') id: string) {
    const client = await this.findClient.execute(id);
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return ClientPresenter.toHTTP(client);
  }

  @Post('appointments')
  async createAppointment(@Body() body: CreateAutomationAppointmentDto) {
    return AppointmentPresenter.toHTTP(
      await this.appointments.create(
        {
          ...body,
          source: 'WHATSAPP_BOT',
        },
        'automation:n8n',
      ),
    );
  }

  @Get('appointments/:id')
  async appointment(@Param('id') id: string) {
    return AppointmentPresenter.toHTTP(await this.appointments.find(id));
  }

  @Post('events/verify')
  verify(@Body() body: VerifyAutomationEventDto) {
    return this.verifyEvent.execute(body.id, body.timestamp, body.signature);
  }
}
