import request from 'supertest';
import app from '../../../src/app';
import { clearTestSlot } from './appointment.fixture';

describe('Appointments Feature - API & HTTP Validation (Integration)', () => {
  const TEST_SLOT_ID = 102;
  const VALID_PATIENT_ID = 5001;
  const NON_EXISTENT_SLOT_ID = 999999;
  const NON_EXISTENT_PATIENT_ID = 999999;

  beforeEach(async () => {
    await clearTestSlot(TEST_SLOT_ID);
  });

  afterAll(async () => {
    await clearTestSlot(TEST_SLOT_ID);
  });

  describe('HTTP Validation Failures (400 Bad Request)', () => {
    it('should return 400 when request body is empty', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when slotId is missing', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({ patientId: 5001 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when patientId is missing', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: 101 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for non-integer string values', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: 'invalid-id', patientId: 5001 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for zero or negative values', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: 0, patientId: 5001 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for 32-bit integer overflow values', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: 9999999999999, patientId: 5001 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for malformed JSON payload', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .set('Content-Type', 'application/json')
        .send('{"slotId": 101, "patientId": ');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Domain Flow & Booking Lifecycle', () => {
    it('should return 404 when slot does not exist', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: NON_EXISTENT_SLOT_ID, patientId: VALID_PATIENT_ID });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    it('should return 404 when patient does not exist', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: TEST_SLOT_ID, patientId: NON_EXISTENT_PATIENT_ID });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    it('should successfully book an available slot (201 Created)', async () => {
      const res = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: TEST_SLOT_ID, patientId: VALID_PATIENT_ID });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('appointmentId');
      expect(res.body.data.slotId).toBe(TEST_SLOT_ID);
      expect(res.body.data.patientId).toBe(VALID_PATIENT_ID);
      expect(res.body.data).toHaveProperty('bookedAt');
    });

    it('should return 409 Conflict when attempting to book an already booked slot sequentially', async () => {
      // First booking
      const firstRes = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: TEST_SLOT_ID, patientId: VALID_PATIENT_ID });

      expect(firstRes.status).toBe(201);

      // Second booking on same slot
      const secondRes = await request(app)
        .post('/api/appointments/book')
        .send({ slotId: TEST_SLOT_ID, patientId: 5002 });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.message).toContain('already booked');
    });
  });
});
