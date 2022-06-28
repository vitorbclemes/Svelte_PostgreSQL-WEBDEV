import express from 'express';
import eventSchema from '../Schema/Event.js';

const eventRouter = express.Router();


eventRouter.get('/',eventSchema.selectEvent);
eventRouter.get('/clients/:idCliente',eventSchema.selectClientEvent);
eventRouter.post('/',eventSchema.insertEvent);
eventRouter.delete('/delete/:id',eventSchema.deleteEvent);
eventRouter.put('/:id',eventSchema.updateEvent);

export default eventRouter;