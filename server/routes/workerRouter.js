import express from 'express';
import workerSchema from '../Schema/Worker.js'

const workerRouter = express.Router();

workerRouter.get('/',workerSchema.selectWorker);
workerRouter.get('/login',workerSchema.workerLogin);
workerRouter.get('/:id',workerSchema.selectWorkerById);
workerRouter.post('/',workerSchema.insertWorker);
workerRouter.delete('/delete/:id',workerSchema.deleteWorker);
workerRouter.put('/:id',workerSchema.updateWorker);

export default workerRouter;