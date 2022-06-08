export default {
  async get(table,obj){
    let response = await fetch(`/${table}?${new URLSearchParams(obj)}`);
    return response.ok? await response.json() : null;
  },
  
  async post(table,obj){
    let response = await fetch (`/${table}`,{
      method:'post',
      body:JSON.stringify(obj),
      headers:{
        'content-type':'application/json'
      }
    });
    return response.ok? await response.json() : null;
  },
  
  async put(table,obj){
    let response = await fetch(`/${table}`,{
      method:'put',
      body:JSON.stringify(obj),
      headers:{
        'content-type':'application/json'
      }
    });
    return response.ok? await response.json() : null;
  }
};

