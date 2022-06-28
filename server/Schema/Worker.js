import pool from "../config/database.js";

const selectWorker = (request,response) => {
  pool.query("SELECT * FROM Funcionario where cargo!='admin'",(error, results) => {
    if(error) 
      throw error;
    response.status(200).json(results.rows);
  })  
};

const selectWorkerById = (request,response) => {
  const id  = request.params.id;
  pool.query(`SELECT * FROM Funcionario where id =  $1`,[id],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const workerLogin = (request,response) => {
  const login = request.query.login;
  const senha = request.query.senha;
  pool.query('SELECT id,cargo,login FROM Funcionario where login=$1 and senha=$2',[login,senha],(error,results) => {
    if(error){
      throw error;
    }
    response.status(200).json(results.rows);
  })
};

const insertWorker = (request,response) => {
  const login = request.body.login;
  const senha = request.body.senha;
  const nome = request.body.nome;
  const cargo = request.body.cargo;
  
  pool.query(`INSERT INTO Funcionario values(default,$1,$2,$3,$4)`,[login,senha,nome,cargo],(error,results) => {
    if(error){
      throw error;
    }
    response.status(201).send({'answer':"Success"});
  })
};

const deleteWorker = (request,response) => {
  const id = parseInt(request.params.id);
  pool.query(`DELETE FROM Funcionario where id = $1`,[id],(error,results) => {
    if(error) throw error;
    response.status(201).send({'answer':"Success"});
  })
}

const updateWorker = (request,response) => {
  const id = parseInt(request.params.id);
  const login = request.body.cpf;
  const senha = request.body.senha;
  const nome = request.body.nome;
  const cargo = request.body.cargo;
  pool.query(`UPDATE Funcionario SET login = '$1',nome='$2',senha='$3',cargo='4' WHERE id = $5`,[login,senha,nome,cargo,id],(error,results) => {
    if(error) throw error
    response.status(201).send('Funcionario atualizado com sucesso');
  })
};

export default {
  selectWorker,
  selectWorkerById,
  workerLogin,
  insertWorker,
  deleteWorker,
  updateWorker,
}