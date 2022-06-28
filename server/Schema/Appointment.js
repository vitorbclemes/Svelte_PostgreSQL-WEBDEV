import pool from "../config/database.js";

const selectAppointment = (request,response) => {
  pool.query('SELECT * FROM Bloco b JOIN Quadra q ON q.idBloco = b.id JOIN Agendamento a ON a.idQuadra= q.id ',(error, results) => {
    if(error)
      throw error;
    response.status(200).json(results.rows);
  })
};

const clientAppointment = (request,response) => {
  const idCliente = request.params.idCliente;
  pool.query(`SELECT * FROM Bloco b JOIN Quadra q ON q.idBloco = b.id JOIN Agendamento a ON a.idQuadra= q.id where a.idCliente=$1`,[idCliente],(error,results)=>{
    if(error)
     throw error;
    response.status(200).json(results.rows);
  })
};

const selectAppointmentById = (request,response) => {
  const id  = request.query.id;
  pool.query(`SELECT * FROM Agendamento where id =  $1`,[id],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertAppointment = (request,response) => {
  const idEvento =  request.body.idEvento;
  const idCliente = request.body.idCliente;
  const idQuadra = request.body.idQuadra;
  const idFuncionario = request.body.idFuncionario;
  const data =  request.body.data;
  const horario = request.body.horario;
  const recorrente = request.body.recorrente;
  const antecedencia = request.body.antecedencia || null;
  const status = request.body.status;

  pool.query(`INSERT INTO Agendamento values(default,$1,$2,$3,$4,CAST($5 AS DATE),$6,$7,$8,$9)`,[idEvento,idCliente,idQuadra,idFuncionario,data,horario,recorrente,antecedencia,status],(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send({'answer':'Success'});
  })
};

const deleteAppointment = (request,response) => {
  const id = parseInt(request.params.id);
  pool.query(`DELETE FROM Agendamento where id = $1`,[id],(error,results) => {
    if(error) throw error;
    response.status(201).send({'answer':'Success'});
  })
}

const updateAppointment = (request,response) => {
  const id =request.body.id;
  const status = request.body.status;
  pool.query(`UPDATE Agendamento SET status=$1 WHERE id = $2`,[status,id],(error,results) => {
    if(error) throw error
    response.status(201).send({'answer':'Success'});
  })
};

export default {
  selectAppointment,
  clientAppointment,
  selectAppointmentById,
  insertAppointment,
  deleteAppointment,
  updateAppointment
}