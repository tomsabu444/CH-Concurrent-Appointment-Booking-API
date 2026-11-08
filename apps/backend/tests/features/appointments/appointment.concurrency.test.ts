import request from 'supertest';
import app from '../../../src/app';
import { clearTestSlot, getAppointmentCountForSlot } from './appointment.fixture';

describe('Appointments Feature - Concurrency Control (Race Conditions)', () => {
  const TARGET_SLOT_ID = 101;
  const PATIENT_A = 5001;
  const PATIENT_B = 5002;

  beforeEach(async () => {
    await clearTestSlot(TARGET_SLOT_ID);
  });

  afterAll(async () => {
    await clearTestSlot(TARGET_SLOT_ID);
  });

  it('Scenario 1 (Assessment Requirement): 2 simultaneous requests serialize safely (1 success, 1 conflict)', async () => {
    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/appointments/book')
        .send({ slotId: TARGET_SLOT_ID, patientId: PATIENT_A }),
      request(app)
        .post('/api/appointments/book')
        .send({ slotId: TARGET_SLOT_ID, patientId: PATIENT_B }),
    ]);

    const statuses = [resA.status, resB.status];
    const successCount = statuses.filter((s) => s === 201).length;
    const conflictCount = statuses.filter((s) => s === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);

    const dbCount = await getAppointmentCountForSlot(TARGET_SLOT_ID);
    expect(dbCount).toBe(1);
  });

  it('Scenario 2 (High Contention): 6 simultaneous requests result in exactly 1 success and 5 conflicts', async () => {
    const totalRequests = 6;
    const patientIds = [PATIENT_A, PATIENT_B, PATIENT_A, PATIENT_B, PATIENT_A, PATIENT_B];

    const responses = await Promise.all(
      patientIds.map((patientId) =>
        request(app)
          .post('/api/appointments/book')
          .send({ slotId: TARGET_SLOT_ID, patientId })
      )
    );

    const statuses = responses.map((r) => r.status);
    const successCount = statuses.filter((s) => s === 201).length;
    const conflictCount = statuses.filter((s) => s === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(totalRequests - 1);

    const dbCount = await getAppointmentCountForSlot(TARGET_SLOT_ID);
    expect(dbCount).toBe(1);
  });
});
