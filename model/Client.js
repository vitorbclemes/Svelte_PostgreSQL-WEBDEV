const {pool} = require('../config/database');

const selectClients = (request,response) => {
  pool.query('SELECT * FROM Cliente',(error, results) => {
    if(error) {
      throw error;
    }
    response.status(200).json(results.rows);
  })  
}

module.exports = {
  selectClients
}