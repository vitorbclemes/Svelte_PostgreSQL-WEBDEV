const express = require("express");
const router = express.Router();

const clientModel = require('../model/Client');

router.get('/selectClient',clientModel.selectClient);
router.get('/selectClientById/:id',clientModel.selectClientById);
router.post('/insertClient',clientModel.insertClient);
router.delete('/deleteClient/:id',clientModel.deleteClient);
router.put('/updateClient',clientModel.updateClient);

module.exports = router;