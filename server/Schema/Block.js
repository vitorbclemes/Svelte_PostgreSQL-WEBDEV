import pool from "../config/database.js";

const selectBlock = (request,response) => {
  pool.query('SELECT * FROM Bloco',(error, results) => {
    if(error) 
      throw error;
    response.status(200).json(results.rows);
  })
};

const selectBlockById = (request,response) => {
  const id  = request.params.id;
  pool.query(`SELECT * FROM Bloco where id =  $1`,[id],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertBlock = (request,response) => {
  const nome = request.body.nome;

  pool.query(`INSERT INTO Bloco values(default,'$1')`,[nome],(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send('Bloco inserido com sucesso.')
  })
};

const deleteBlock = (request,response) => {
  const id = parseInt(request.params.id);

  pool.query(`DELETE FROM Bloco where id = $1`,[id],(error,results) => {
    if(error) throw error;
    response.status(201).send('Bloco removido com sucesso');
  })
}

const updateBlock = (request,response) => {
  const id = parseInt(request.params.id);
  const nome = request.body.nome;
  pool.query(`UPDATE Bloco SET nome='$1' WHERE id = $2`,[nome,id],(error,results) => {
    if(error) throw error
    response.status(201).send('Bloco atualizado com sucesso');
  })
};
export default {
  selectBlock,
  selectBlockById,
  insertBlock,
  deleteBlock,
  updateBlock
}