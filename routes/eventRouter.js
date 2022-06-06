const express = require('express');
const router = express.Router();

const eventModel = require('../model/Event');

router.get('/selectEvent',eventModel.selectEvent);
router.get('/selectEventById/:id',eventModel.selectEventById);
router.post('/insertEvent',eventModel.insertEvent);
router.delete('/deleteEvent/:id',eventModel.deleteEvent);
router.put('/updateEvent/:id',eventModel.updateEvent);

module.exports = router;