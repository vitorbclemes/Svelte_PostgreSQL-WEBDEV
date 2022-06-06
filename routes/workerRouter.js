const express = require("express");
const router = express.Router();

const workerModel = require('../model/Worker');

router.get('/selectWorker',workerModel.selectWorker);
router.post('/insertWorker',workerModel.insertWorker);
router.delete('/deleteWorker',workerModel.deleteWorker);
router.put('/updateWorker',workerModel.updateWorker);

module.exports = router;