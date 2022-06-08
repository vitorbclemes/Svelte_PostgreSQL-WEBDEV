import express from 'express';
import appointmentSchema from '../Schema/Appointment.js';

const appointmentRouter = express.Router();

appointmentRouter.get('/',appointmentSchema.selectAppointment);
appointmentRouter.get('/:id',appointmentSchema.selectAppointmentById);
appointmentRouter.post('/',appointmentSchema.insertAppointment);
appointmentRouter.delete('/:id',appointmentSchema.deleteAppointment);
appointmentRouter.put('/:id',appointmentSchema.updateAppointment);

export default appointmentRouter;