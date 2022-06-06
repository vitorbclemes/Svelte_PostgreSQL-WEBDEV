const {pool} = require('../config/database');

const selectClient = (request,response) => {
  pool.query('SELECT * FROM Cliente;',(error, results) => {
    if(error)
      throw error;
    response.status(200).json(results.rows);
  })  
};

const selectClientById = (request,response) => {
  const id  = request.params.id;
  pool.query(`SELECT * FROM Cliente where id =  ${id}`,(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertClient = (request,response) => {
  const cpf = request.body.cpf;
  const senha = request.body.senha;
  const nome = request.body.nome;
  const idade = parseInt(request.body.idade);
  const ocupacao = request.body.ocupacao;
  const endereco = request.body.endereco
  
  pool.query(`INSERT INTO Cliente values(default,'${cpf}','${senha}','${nome}',${idade},'${ocupacao}','${endereco}')`,(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send('Cliente inserido com sucesso.')
  })
};

const deleteClient = (request,response) => {
  const id = parseInt(request.params.id);

  pool.query(`DELETE FROM Cliente where id = ${id}`,(error,results) => {
    if(error) throw error;
    response.status(201).send('Cliente removido com sucesso');
  })
}

const updateClient = (request,response) => {
  const id = parseInt(request.body.id);
  const cpf = request.body.cpf;
  const senha = request.body.senha;
  const nome = request.body.nome;
  const idade = parseInt(request.body.idade);
  const ocupacao = request.body.ocupacao;
  const endereco = request.body.endereco
  pool.query(`UPDATE Cliente SET cpf = '${cpf}',nome='${nome}',senha='${senha}',idade=${idade},ocupacao='${ocupacao}',endereco='${endereco}' WHERE id = ${id}`,(error,results) => {
    if(error) throw error
    response.status(201).send('Cliente atualizado com sucesso');
  })
};

module.exports = {
  selectClient,
  selectClientById,
  insertClient,
  deleteClient,
  updateClient
}