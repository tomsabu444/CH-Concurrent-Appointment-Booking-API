import { bookAppointmentValidation } from '../../../src/features/appointments/appointment.validation';

describe('Appointments Feature - Schema Validation (Unit)', () => {
  it('should successfully parse valid slotId and patientId', () => {
    const input = { slotId: 101, patientId: 5001 };
    const result = bookAppointmentValidation.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it('should fail when slotId is missing', () => {
    const input = { patientId: 5001 };
    const result = bookAppointmentValidation.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should fail when patientId is missing', () => {
    const input = { slotId: 101 };
    const result = bookAppointmentValidation.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should fail when values are non-positive integers', () => {
    expect(bookAppointmentValidation.safeParse({ slotId: 0, patientId: 5001 }).success).toBe(false);
    expect(bookAppointmentValidation.safeParse({ slotId: -10, patientId: 5001 }).success).toBe(false);
    expect(bookAppointmentValidation.safeParse({ slotId: 101, patientId: -1 }).success).toBe(false);
  });

  it('should fail when values are floating point numbers', () => {
    expect(bookAppointmentValidation.safeParse({ slotId: 101.5, patientId: 5001 }).success).toBe(false);
    expect(bookAppointmentValidation.safeParse({ slotId: 101, patientId: 5001.2 }).success).toBe(false);
  });

  it('should fail when values are strings or incorrect types', () => {
    expect(bookAppointmentValidation.safeParse({ slotId: '101', patientId: 5001 }).success).toBe(false);
    expect(bookAppointmentValidation.safeParse({ slotId: 101, patientId: '5001' }).success).toBe(false);
    expect(bookAppointmentValidation.safeParse({ slotId: null, patientId: 5001 }).success).toBe(false);
    expect(bookAppointmentValidation.safeParse({ slotId: {}, patientId: [] }).success).toBe(false);
  });
});
