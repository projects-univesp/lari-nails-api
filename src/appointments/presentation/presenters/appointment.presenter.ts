import { Appointment } from '../../domain/appointment.entity';

export class AppointmentPresenter {
  static toHTTP(appointment: Appointment) {
    return {
      id: appointment.id,
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      requestedDate: appointment.requestedDate,
      requestedTime: appointment.requestedTime,
      endTime: appointment.endTime,
      durationMinutes: appointment.durationMinutes,
      priceCents: appointment.priceCents,
      source: appointment.source,
      status: appointment.status,
      denialReason: appointment.denialReason,
      proposedDate: appointment.proposedDate,
      proposedTime: appointment.proposedTime,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      _links: {
        self: { href: `/appointments/${appointment.id}` },
        history: { href: `/appointments/${appointment.id}/history` },
        collection: { href: '/appointments' },
      },
    };
  }
}
