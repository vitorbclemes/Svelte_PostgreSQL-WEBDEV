import express from 'express';
import blockSchema from '../Schema/Block.js';

const blockRouter = express.Router();

blockRouter.get('/',blockSchema.selectBlock);
blockRouter.get('/:id',blockSchema.selectBlockById);
blockRouter.post('/',blockSchema.insertBlock);
blockRouter.delete('/:id',blockSchema.deleteBlock);
blockRouter.put('/:id',blockSchema.updateBlock);

export default blockRouter;