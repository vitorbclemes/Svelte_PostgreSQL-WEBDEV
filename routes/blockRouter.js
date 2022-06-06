const express = require('express');
const router = express.Router();

const blockModel = require('../model/Block');

router.get('/selectBlock',blockModel.selectBlock);
router.get('/selectBlockById/:id',blockModel.selectBlockById);
router.post('/insertBlock',blockModel.insertBlock);
router.delete('/deleteBlock/:id',blockModel.deleteBlock);
router.put('/updateBlock',blockModel.updateBlock);

module.exports = router;