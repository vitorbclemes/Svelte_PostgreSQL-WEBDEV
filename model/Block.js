const {pool} = require('../config/database');

const selectBlock = (request,response) => {
  pool.query('SELECT * FROM Bloco;',(error, results) => {
    if(error) 
      throw error;
    response.status(200).json(results.rows);
  })  
};

const insertBlock = (request,response) => {
  const nome = request.body.nome;

  pool.query(`INSERT INTO Bloco values(default,'${nome}')`,(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send('Bloco inserido com sucesso.')
  })
};

const deleteBlock = (request,response) => {
  const id = parseInt(request.body.id);

  pool.query(`DELETE FROM Bloco where id = ${id}`,(error,results) => {
    if(error) throw error;
    response.status(201).send('Bloco removido com sucesso');
  })
}

const updateBlock = (request,response) => {
  const id = parseInt(request.body.id);
  const nome = request.body.nome;
  pool.query(`UPDATE Bloco SET nome='${nome}' WHERE id = ${id}`,(error,results) => {
    if(error) throw error
    response.status(201).send('Bloco atualizado com sucesso');
  })
};

module.exports = {
  selectBlock,
  insertBlock,
  deleteBlock,
  updateBlock
}