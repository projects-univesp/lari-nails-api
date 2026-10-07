import {
  Appointment,
  AppointmentStatus,
  AppointmentStatusEvent,
} from './appointment.entity';

export interface IAppointmentRepository {
  create(appointment: Appointment, actorId: string): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  list(
    from: string,
    to: string,
    status?: AppointmentStatus,
  ): Promise<Appointment[]>;
  listPending(): Promise<Appointment[]>;
  transition(
    current: Appointment,
    next: Appointment,
    actorId: string,
  ): Promise<Appointment>;
  reschedule(current: Appointment, next: Appointment, actorId: string): Promise<Appointment>;
  history(id: string): Promise<AppointmentStatusEvent[]>;
}
