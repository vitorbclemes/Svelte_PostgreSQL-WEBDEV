const {pool} = require('../config/database');

const selectEvent = (request,response) => {
  pool.query('SELECT * FROM Evento;',(error, results) => {
    if(error) 
      throw error;
    response.status(200).json(results.rows);
  })  
};


const selectEventById = (request,response) => {
  const id  = request.params.id;
  pool.query(`SELECT * FROM Evento where id =  ${id}`,(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertEvent = (request,response) => {
  const nome = request.body.nome;

  pool.query(`INSERT INTO Evento values(default,'${nome}')`,(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send('Bloco inserido com sucesso.')
  })
};

const deleteEvent = (request,response) => {
  const id = parseInt(request.params.id);

  pool.query(`DELETE FROM Evento where id = ${id}`,(error,results) => {
    if(error) throw error;
    response.status(201).send('Evento removido com sucesso');
  })
}

const updateEvent = (request,response) => {
  const id = parseInt(request.params.id);
  const nome = request.body.nome;
  pool.query(`UPDATE Evento SET nome='${nome}' WHERE id = ${id}`,(error,results) => {
    if(error) throw error
    response.status(201).send('Evento atualizado com sucesso');
  })
};

module.exports = {
  selectEvent,
  selectEventById,
  insertEvent,
  deleteEvent,
  updateEvent
}