const {pool} = require('../config/database');

const selectWorker = (request,response) => {
  pool.query('SELECT * FROM Funcionario;',(error, results) => {
    if(error) 
      throw error;
    response.status(200).json(results.rows);
  })  
};

const insertWorker = (request,response) => {
  const login = request.body.login;
  const senha = request.body.senha;
  const nome = request.body.nome;
  const cargo = request.body.cargo;
  
  pool.query(`INSERT INTO Funcionario values(default,'${login}','${senha}','${nome}','${cargo}}')`,(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send('Funcionario inserido com sucesso.')
  })
};

const deleteWorker = (request,response) => {
  const id = parseInt(request.body.id);

  pool.query(`DELETE FROM Funcionario where id = ${id}`,(error,results) => {
    if(error) throw error;
    response.status(201).send('Funcionario removido com sucesso');
  })
}

const updateWorker = (request,response) => {
  const id = parseInt(request.body.id);
  const login = request.body.cpf;
  const senha = request.body.senha;
  const nome = request.body.nome;
  const cargo = request.body.cargo;
  pool.query(`UPDATE Funcionario SET login = '${login}',nome='${nome}',senha='${senha}',cargo='${cargo}' WHERE id = ${id}`,(error,results) => {
    if(error) throw error
    response.status(201).send('Funcionario atualizado com sucesso');
  })
};

module.exports = {
  selectWorker,
  insertWorker,
  deleteWorker,
  updateWorker,
}