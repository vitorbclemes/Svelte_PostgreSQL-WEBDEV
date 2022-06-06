const {pool} = require('../config/database');

const selectAppointment = (request,response) => {
  pool.query('SELECT * FROM Agendamento;',(error, results) => {
    if(error) 
      throw error;
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

  pool.query(`INSERT INTO Agendamento values(default,${idEvento},${idCliente},${idQuadra},${idFuncionario},'${data}','${horario}',${recorrente},'${antecedencia}','${status}')`,(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send('Agendamento inserido com sucesso.')
  })
};

const deleteAppointment = (request,response) => {
  const id = parseInt(request.body.id);

  pool.query(`DELETE FROM Agendamento where id = ${id}`,(error,results) => {
    if(error) throw error;
    response.status(201).send('Agendamento removido com sucesso');
  })
}

const updateAppointment = (request,response) => {
  const id = parseInt(request.body.id);
  const idEvento =  request.body.idEvento || null;
  const idCliente = request.body.idCliente;
  const idQuadra = request.body.idQuadra;
  const idFuncionario = request.body.idFuncionario;
  const data = request.body.data;
  const horario = request.body.horario;
  const recorrente = request.body.recorrente;
  const antecedencia = request.body.antecedencia;
  const status = request.body.status; 

  pool.query(`UPDATE Agendamento SET idEvento=${idEvento},idCliente=${idCliente},idQuadra=${idQuadra},idFuncionario=${idFuncionario},
              data='${data}',horario='${horario}',recorrente=${recorrente},antecedencia='${antecedencia}',status='${status}' WHERE id = ${id}`,(error,results) => {
    
              if(error) throw error
              response.status(201).send('Agendamento atualizado com sucesso');
  })
};

module.exports = {
  selectAppointment,
  insertAppointment,
  deleteAppointment,
  updateAppointment
}