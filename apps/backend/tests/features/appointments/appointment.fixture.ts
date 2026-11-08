import sql from 'mssql';
import { getPool } from '../../../src/lib/db';

/**
 * Resets bookings for specific test slot IDs to guarantee test isolation.
 */
export async function clearTestSlot(slotId: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('slotId', sql.Int, slotId)
    .query('DELETE FROM dbo.Appointments WHERE SlotId = @slotId;');
}

/**
 * Returns the exact count of appointment records for a slot.
 */
export async function getAppointmentCountForSlot(slotId: number): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('slotId', sql.Int, slotId)
    .query('SELECT COUNT(1) AS total FROM dbo.Appointments WHERE SlotId = @slotId;');

  return result.recordset[0]?.total || 0;
}
