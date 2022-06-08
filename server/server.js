import express from 'express';
import path from 'path';
import clientRouter from './routes/clientRouter.js';
import workerRouter from './routes/workerRouter.js';
import blockRouter from './routes/blockRouter.js';
import fieldRouter from './routes/fieldRouter.js';
import eventRouter from './routes/eventRouter.js';
import appointmentRouter from './routes/appointmentRouter.js';

const app = express();
const PORT = process.env.PORT || 27017;

// JSON
app.use(express.json());

// Endpoints
app.use('/clients',clientRouter);
app.use('/workers',workerRouter);
app.use('/blocks',blockRouter);
app.use('/fields',fieldRouter);
app.use('/events',eventRouter);
app.use('/appointments',appointmentRouter);

// Integrate with FrontEnd
app.use(express.static('public'));
app.get('*',(req,res)=> {
  return res.sendFile(path.resolve(path.resolve(),'public','index.html'));
});

// Listen server
 app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));