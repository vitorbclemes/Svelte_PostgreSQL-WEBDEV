import pool from "../config/database.js";

const selectAppointment = (request,response) => {
  pool.query('SELECT * FROM Agendamento;',(error, results) => {
    if(error) 
      throw error;
    response.status(200).json(results.rows);
  })  
};

const selectAppointmentById = (request,response) => {
  const id  = request.params.id;
  pool.query(`SELECT * FROM Agendamentos where id =  $1`,[id],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertAppointment = (request,response) => {
  const idEvento =  request.body.idEvento || null;
  const idCliente = request.body.idCliente;
  const idQuadra = request.body.idQuadra;
  const idFuncionario = request.body.idFuncionario;
  const data = request.body.data;
  const horario = request.body.horario;
  const recorrente = request.body.recorrente;
  const antecedencia = request.body.antecedencia;
  const status = request.body.status;

  pool.query(`INSERT INTO Agendamento values(default,$1,$2,$3,$4,'$5','$5',$6,'$7','$8')`,[idEvento,idCliente,idQuadra,idFuncionario,data,horario,recorrente,antecedencia,status],(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send('Agendamento inserido com sucesso.')
  })
};

const deleteAppointment = (request,response) => {
  const id = parseInt(request.params.id);

  pool.query(`DELETE FROM Agendamento where id = $1`,[id],(error,results) => {
    if(error) throw error;
    response.status(201).send('Agendamento removido com sucesso');
  })
}

const updateAppointment = (request,response) => {
  const id = parseInt(request.params.id);
  const idEvento =  request.body.idEvento || null;
  const idCliente = request.body.idCliente;
  const idQuadra = request.body.idQuadra;
  const idFuncionario = request.body.idFuncionario;
  const data = request.body.data;
  const horario = request.body.horario;
  const recorrente = request.body.recorrente;
  const antecedencia = request.body.antecedencia;
  const status = request.body.status; 

  pool.query(`UPDATE Agendamento SET idEvento=$1,idCliente=$2,idQuadra=$3,idFuncionario=$4,data='$5',horario='$6',recorrente=$7,antecedencia='$8',status='$9' WHERE id = $10`,
              [idEvento,idCliente,idQuadra,idFuncionario,data,horario,recorrente,antecedencia,status,id],          
              (error,results) => {
    
              if(error) throw error
              response.status(201).send('Agendamento atualizado com sucesso');
  })
};

export default {
  selectAppointment,
  selectAppointmentById,
  insertAppointment,
  deleteAppointment,
  updateAppointment
}