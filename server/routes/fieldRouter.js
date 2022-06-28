import express from 'express';
import fieldSchema from '../Schema/Field.js';

const fieldRouter = express.Router();

fieldRouter.get('/',fieldSchema.selectField);
fieldRouter.get('/all',fieldSchema.selectAllFields);
fieldRouter.get('/:id',fieldSchema.selectFieldById);
fieldRouter.post('/',fieldSchema.insertField);
fieldRouter.delete('/delete/:id',fieldSchema.deleteField);
fieldRouter.put('/:id',fieldSchema.updateField);

export default fieldRouter;