const express = require('express');
const router = express.Router();

const fieldModel = require('../model/Field');

router.get('/selectField',fieldModel.selectField);
router.get('/selectFieldById/:id',fieldModel.selectFieldById);
router.post('/insertField',fieldModel.insertField);
router.delete('/deleteField/:id',fieldModel.deleteField);
router.put('/updateField',fieldModel.updateField);

module.exports = router;