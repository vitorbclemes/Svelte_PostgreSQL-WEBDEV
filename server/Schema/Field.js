import pool from "../config/database.js";

const selectField = (request,response) => {
  pool.query('SELECT * FROM Quadra;',(error, results) => {
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
  const idBloco = request.body.nome;
  const modalidade = request.body.modalidade;

  pool.query(`INSERT INTO Quadra values(default,$1,'$2')`,[idBloco,modalidade],(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send('Quadra inserida com sucesso.')
  })
};

const deleteField = (request,response) => {
  const id = parseInt(request.params.id);

  pool.query(`DELETE FROM Quadra where id = $1`,[id],(error,results) => {
    if(error) throw error;
    response.status(201).send('Bloco removido com sucesso');
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
  selectField,
  selectFieldById,
  insertField,
  deleteField,
  updateField
}