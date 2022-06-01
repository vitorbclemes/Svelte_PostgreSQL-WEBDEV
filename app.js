const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 27017;

const clients = require('./model/Client');

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended:true
  })
);

app.get('/',(req,res)=> {
  res.status(200).json({
    info: 'Api roda'
  })
});

app.get('/listarAlunos',clients.selectClients);

app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));