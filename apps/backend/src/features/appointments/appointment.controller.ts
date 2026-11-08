import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from './appointment.service';
import { bookAppointmentValidation } from './appointment.validation';

export class AppointmentController {
  /**
   * Handles POST /api/appointments/book
   */
  public static async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = bookAppointmentValidation.parse(req.body);
      const result = await AppointmentService.bookAppointment(data);

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}


