async function get(table,obj){
  let response = await fetch(`/${table}?${new URLSearchParams(obj)}`);
  return response.ok? await response.json() : null;
}

async function getByParams(params){
  let response = await fetch(params);
  return response.ok? await response.json() : null;
}

async function post(table,obj){
  let response = await fetch (`/${table}`,{
    method:'post',
    body:JSON.stringify(obj),
    headers:{
      'content-type':'application/json'
    }
  });
  return response.ok? await response.json() : null;
};

async function del(params){
  let response = await fetch(params,{
    method:'delete',
    headers:{
      'content-type':'application/json'
    }
  });
  return response.ok? await response.json() : null;
}

async function put(table,obj){
  let response = await fetch(`/${table}`,{
    method:'put',
    body:JSON.stringify(obj),
    headers:{
      'content-type':'application/json'
    }
  });
  return response.ok? await response.json() : null;
}

export default {
  get,
  getByParams,
  post,
  del,
  put
}