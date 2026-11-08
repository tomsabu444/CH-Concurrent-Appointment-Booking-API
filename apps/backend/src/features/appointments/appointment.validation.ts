import { z } from 'zod';

const MAX_INT32 = 2147483647;

export const bookAppointmentValidation = z.object({
  slotId: z.int().positive().max(MAX_INT32, 'slotId must not exceed 32-bit integer range.'),
  patientId: z.int().positive().max(MAX_INT32, 'patientId must not exceed 32-bit integer range.'),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentValidation>;
