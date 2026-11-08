import sql from 'mssql';
import { getPool } from '../../lib/db';
import { logger } from '../../lib/logger';
import { ConflictError, NotFoundError } from '../../middleware/errorHandler';

export interface BookAppointmentInput {
  slotId: number;
  patientId: number;
}

export interface BookAppointmentResult {
  appointmentId: number;
  slotId: number;
  patientId: number;
  bookedAt: string;
}

export class AppointmentService {
  /**
   * Atomically books an appointment slot for a patient.
   * Uses pessimistic row-level locking (UPDLOCK, ROWLOCK, HOLDLOCK) within a
   * dedicated MSSQL transaction to serialize concurrent booking attempts.
   */
  public static async bookAppointment(input: BookAppointmentInput): Promise<BookAppointmentResult> {
    const { slotId, patientId } = input;
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    let isTransactionActive = false;

    try {
      await transaction.begin();
      isTransactionActive = true;

      // 1. Acquire pessimistic lock on the requested slot and check availability atomically
      const slotReq = new sql.Request(transaction);
      slotReq.input('slotId', sql.Int, slotId);

      const slotQuery = `
        SELECT 
          s.SlotId, 
          s.DoctorId,
          a.AppointmentId
        FROM dbo.AppointmentSlots s WITH (UPDLOCK, ROWLOCK, HOLDLOCK)
        LEFT JOIN dbo.Appointments a ON s.SlotId = a.SlotId
        WHERE s.SlotId = @slotId;
      `;
      const slotResult = await slotReq.query(slotQuery);

      if (slotResult.recordset.length === 0) {
        throw new NotFoundError(`Appointment slot with ID ${slotId} was not found.`);
      }

      if (slotResult.recordset[0].AppointmentId !== null) {
        throw new ConflictError(`Appointment slot ${slotId} is already booked.`);
      }

      // 2. Verify patient existence
      const patientReq = new sql.Request(transaction);
      patientReq.input('patientId', sql.Int, patientId);

      const patientQuery = `
        SELECT PatientId
        FROM dbo.Patients
        WHERE PatientId = @patientId;
      `;
      const patientResult = await patientReq.query(patientQuery);

      if (patientResult.recordset.length === 0) {
        throw new NotFoundError(`Patient with ID ${patientId} was not found.`);
      }

      // 3. Atomically insert appointment record
      const insertReq = new sql.Request(transaction);
      insertReq.input('slotId', sql.Int, slotId);
      insertReq.input('patientId', sql.Int, patientId);

      const insertQuery = `
        INSERT INTO dbo.Appointments (SlotId, PatientId, BookedAt)
        OUTPUT INSERTED.AppointmentId, INSERTED.SlotId, INSERTED.PatientId, INSERTED.BookedAt
        VALUES (@slotId, @patientId, SYSUTCDATETIME());
      `;
      const insertResult = await insertReq.query(insertQuery);
      const bookedRow = insertResult.recordset[0];

      // 4. Commit transaction
      await transaction.commit();
      isTransactionActive = false;

      logger.info(
        { appointmentId: bookedRow.AppointmentId, slotId, patientId },
        '[AppointmentService] Appointment successfully booked and committed.'
      );

      return {
        appointmentId: bookedRow.AppointmentId,
        slotId: bookedRow.SlotId,
        patientId: bookedRow.PatientId,
        bookedAt: new Date(bookedRow.BookedAt).toISOString(),
      };
    } catch (error: any) {
      if (isTransactionActive) {
        try {
          await transaction.rollback();
          logger.debug({ slotId, patientId }, '[AppointmentService] Transaction safely rolled back.');
        } catch (rollbackErr) {
          logger.warn({ rollbackErr }, '[AppointmentService] Rollback note: transaction already completed or aborted.');
        }
      }

      // Translate MSSQL concurrency & unique constraint violations into domain ConflictErrors
      if (error?.number === 2601 || error?.number === 2627) {
        logger.warn(
          { slotId, patientId, sqlError: error.number },
          '[AppointmentService] Unique constraint violation prevented duplicate booking.'
        );
        throw new ConflictError(`Appointment slot ${slotId} is already booked.`);
      }

      if (error?.number === 1205) {
        logger.warn(
          { slotId, patientId, sqlError: error.number },
          '[AppointmentService] Transaction was selected as deadlock victim during concurrent booking.'
        );
        throw new ConflictError('Concurrent booking conflict occurred. Please retry your request.');
      }

      throw error;
    }
  }
}
