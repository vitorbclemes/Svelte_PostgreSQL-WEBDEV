const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 27017;

// Integrate with FrontEnd
app.use(express.static('public'));
app.get('*',(req,res)=> {
  return res.sendFile(path.resolve(__dirname,'public','index.html'));
});

// Routers
const clientRouter = require('./routes/clientRouter');
const workerRouter = require('./routes/workerRouter');
const blockRouter = require('./routes/blockRouter');
const fieldRouter = require('./routes/fieldRouter');
const eventRouter = require('./routes/eventRouter');
const appointmentRouter = require('./routes/appointmentRouter');

// Endpoints
app.use('/',clientRouter);
app.use('/',workerRouter);
app.use('/',blockRouter);
app.use('/',fieldRouter);
app.use('/',eventRouter);
app.use('/',appointmentRouter);


// Listen server
 app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));