const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 27017;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended:true
  })
);

app.get('/',(req,res)=> {
  res.status(200).send({
    info: 'Acesse aos endpoints'
  })
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