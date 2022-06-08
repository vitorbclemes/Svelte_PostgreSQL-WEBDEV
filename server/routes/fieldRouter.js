import express from 'express';
import fieldSchema from '../Schema/Field.js';

const fieldRouter = express.Router();

fieldRouter.get('/',fieldSchema.selectField);
fieldRouter.get('/:id',fieldSchema.selectFieldById);
fieldRouter.post('/',fieldSchema.insertField);
fieldRouter.delete('/:id',fieldSchema.deleteField);
fieldRouter.put('/:id',fieldSchema.updateField);

export default fieldRouter;