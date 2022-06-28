import pool from "../config/database.js";


const selectAllFields = (request,response) => {
  pool.query('Select * from Quadra',(error, results) => {
    if(error)
      throw error;
    response.status(200).json(results.rows);
  })
}

const selectField = (request,response) => {
  const data = request.query.data;
  const horario = request.query.horario;
  pool.query('SELECT q.id,q.modalidade,b.nome as nomeBloco FROM Quadra q JOIN Bloco b ON q.idBloco=b.id WHERE NOT EXISTS (SELECT * FROM Agendamento a WHERE a.data!=$1 and a.horario!=$2);',[data,horario],(error, results) => {
    if(error)
      throw error;
    response.status(200).json(results.rows);
  })
};

const selectFieldById = (request,response) => {
  const id  = request.params.id;
  pool.query(`SELECT * FROM Quadra where id =  $1`,[id],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertField = (request,response) => {
  const idBloco = request.body.idBloco;
  const modalidade = request.body.modalidade;
  console.log(modalidade);
  pool.query(`INSERT INTO Quadra values(default,$1,$2)`,[idBloco,modalidade],(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send({'answer':'Success'});
  })
};

const deleteField = (request,response) => {
  const id = parseInt(request.params.id);

  pool.query(`DELETE FROM Quadra where id = $1`,[id],(error,results) => {
    if(error) throw error;
    response.status(201).send({'answer':'Success'});
  })
}

const updateField = (request,response) => {
  const id = parseInt(request.params.id);
  const modalidade = request.body.modalidade;
  pool.query(`UPDATE Quadra SET modalidade='$1' WHERE id = $2`,[modalidade,id],(error,results) => {
    if(error) throw error
    response.status(201).send('Bloco atualizado com sucesso');
  })
};

export default {
  selectAllFields,
  selectField,
  selectFieldById,
  insertField,
  deleteField,
  updateField
}