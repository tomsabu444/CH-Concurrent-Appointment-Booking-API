import { Router } from 'express';
import { AppointmentController } from './appointment.controller';

const router = Router();

/**
 * @openapi
 * /api/appointments/book:
 *   post:
 *     summary: Book an appointment slot
 *     description: Atomically reserves an available appointment slot for a patient. Enforces strict concurrency control using pessimistic locks and database unique constraints.
 *     tags:
 *       - Appointments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotId
 *               - patientId
 *             properties:
 *               slotId:
 *                 type: integer
 *                 example: 101
 *                 description: Unique identifier of the appointment slot.
 *               patientId:
 *                 type: integer
 *                 example: 5001
 *                 description: Unique identifier of the patient.
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Appointment booked successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointmentId:
 *                       type: integer
 *                       example: 1
 *                     slotId:
 *                       type: integer
 *                       example: 101
 *                     patientId:
 *                       type: integer
 *                       example: 5001
 *                     bookedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-11-06T18:00:00.000Z
 *       400:
 *         description: Bad Request - Missing or invalid payload parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: slotId must be a positive integer.
 *       404:
 *         description: Not Found - Slot or Patient does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Appointment slot with ID 101 was not found.
 *       409:
 *         description: Conflict - Slot is already booked by another patient
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Appointment slot 101 is already booked.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: An unexpected internal error occurred.
 */
router.post('/book', AppointmentController.bookAppointment);

export default router;
