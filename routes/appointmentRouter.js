const express = require("express");
const router = express.Router();

const appointmentModel = require('../model/Appointment');

router.get('/selectAppointment',appointmentModel.selectAppointment);
router.post('/insertAppointment',appointmentModel.insertAppointment);
router.delete('/deleteAppointment',appointmentModel.deleteAppointment);
router.put('/updateAppointment',appointmentModel.updateAppointment);

module.exports = router;