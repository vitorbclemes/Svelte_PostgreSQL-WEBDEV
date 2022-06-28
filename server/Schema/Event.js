import pool from "../config/database.js";

const selectEvent = (request,response) => {
  pool.query('SELECT e.nome,a.data FROM Evento e JOIN Agendamento a ON a.idEvento = e.id',(error, results) => {
    if(error)
      throw error;
    response.status(200).json(results.rows);
  })
};

const selectClientEvent = (request,response) => {
  const idCliente  = request.params.idCliente;
  pool.query(`SELECT id,nome FROM Evento where idCliente=$1`,[idCliente],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertEvent = (request,response) => {
  const nome = request.body.nome;
  const idCliente = request.body.idCliente;
  pool.query(`INSERT INTO Evento values(default,$1,$2)`,[idCliente,nome],(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send({'answer':'Success'})
  })
};

const deleteEvent = (request,response) => {
  const id = parseInt(request.params.id);
  pool.query(`DELETE FROM Evento where id = ${id}`,(error,results) => {
    if(error) throw error;
    response.status(201).send({'answer':'Success'});
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

export default {
  selectEvent,
  selectClientEvent,
  insertEvent,
  deleteEvent,
  updateEvent
}