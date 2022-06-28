import express from 'express';
import clientSchema from '../Schema/Client.js'

const clientRouter = express.Router();

clientRouter.get('/',clientSchema.selectClient);
clientRouter.get('/login',clientSchema.clientLogin);
clientRouter.get('/:id',clientSchema.selectClientById);
clientRouter.post('/',clientSchema.insertClient);
clientRouter.delete('/delete/:id',clientSchema.deleteClient);
clientRouter.put('/:id',clientSchema.updateClient);

export default clientRouter;