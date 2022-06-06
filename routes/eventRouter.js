const express = require('express');
const router = express.Router();

const eventModel = require('../model/Event');

router.get('/selectEvent',eventModel.selectEvent);
router.post('/insertEvent',eventModel.insertEvent);
router.delete('/deleteEvent',eventModel.deleteEvent);
router.put('/updateEvent',eventModel.updateEvent);

module.exports = router;