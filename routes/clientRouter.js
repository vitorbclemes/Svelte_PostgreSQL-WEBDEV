const express = require("express");
const router = express.Router();

const clientModel = require('../model/Client');

router.get('/selectClient',clientModel.selectClient);
router.post('/insertClient',clientModel.insertClient);
router.delete('/deleteClient',clientModel.deleteClient);
router.put('/updateClient',clientModel.updateClient);

module.exports = router;