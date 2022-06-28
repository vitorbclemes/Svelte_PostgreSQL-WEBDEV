import pool from "../config/database.js";

const selectClient = (request,response) => {
  pool.query('SELECT * FROM Cliente;',(error, results) => {
    if(error)
      throw error;
    response.status(200).json(results.rows);
  });
};

const selectClientById = (request,response) => {
  const id  = request.params.id;
  pool.query(`SELECT * FROM Cliente where id =  $1`,[id],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const clientLogin = (request,response) => {
  const cpf = request.query.cpf;
  const senha = request.query.senha;
  pool.query('SELECT id FROM Cliente where cpf=$1 and senha=$2',[cpf,senha],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertClient = (request,response) => {
  const cpf =  request.body.cpf;
  const senha = request.body.senha;
  const nome = request.body.nome;
  const idade = parseInt(request.body.idade);
  const ocupacao = request.body.ocupacao;
  const endereco = request.body.endereco

  pool.query(`INSERT INTO Cliente values(default,$1,$2,$3,$4,$5,$6)`,[cpf,senha,nome,idade,ocupacao,endereco],(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send({'answer':"Success"});
  })
};

const deleteClient = (request,response) => {
  const id = parseInt(request.params.id);
  pool.query(`DELETE FROM Cliente where id = $1`,[id],(error,results) => {
    if(error) throw error;
    response.status(201).send({'answer':"Success"});
  })
}

const updateClient = (request,response) => {
  const id = parseInt(request.params.id);
  const cpf = request.body.cpf;
  const senha = request.body.senha;
  const nome = request.body.nome;
  const idade = parseInt(request.body.idade);
  const ocupacao = request.body.ocupacao;
  const endereco = request.body.endereco
  pool.query(`UPDATE Cliente SET cpf = '$1',nome='$2',senha='$3',idade=$4,ocupacao='$5',endereco='$6' WHERE id = $7}`,[cpf,senha,nome,idade,ocupacao,endereco,id],(error,results) => {
    if(error) throw error
    response.status(201).send('Cliente atualizado com sucesso');
  })
};

export default {
  selectClient,
  selectClientById,
  clientLogin,
  insertClient,
  deleteClient,
  updateClient
}