async function get(table,obj){
  let response = await fetch(`/${table}?${new URLSearchParams(obj)}`);
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