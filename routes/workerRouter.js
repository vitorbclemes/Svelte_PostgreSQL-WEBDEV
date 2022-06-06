const express = require("express");
const router = express.Router();

const workerModel = require('../model/Worker');

router.get('/selectWorker',workerModel.selectWorker);
router.get('/selectWorkerById/:id',workerModel.selectWorkerById);
router.post('/insertWorker',workerModel.insertWorker);
router.delete('/deleteWorker/:id',workerModel.deleteWorker);
router.put('/updateWorker/:id',workerModel.updateWorker);

module.exports = router;