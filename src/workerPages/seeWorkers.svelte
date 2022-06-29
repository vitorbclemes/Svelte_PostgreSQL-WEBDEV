<style>
  .booking{
    position:relative;
    margin-top: -50px;
  }
  .title{
    padding-bottom: 50px;
  }
</style>
<script>
  import DataStorage from '../../utils/DataStorage.js';
  let workersPromise = DataStorage.get('workers');

  let workerStart = false;
  let newWorker = {
    login:'',
    senha:'',
    nome:'',
    cargo:''
  };

  async function handleWorker(){
    let res = await DataStorage.post('workers',newWorker);
    if(res.answer == 'Success'){
      alert('Sucesso!');
      newWorker = {
        login:'',
        senha:'',
        nome:'',
        cargo:'SERVIDOR'
      };
      workerStart = false;
      workersPromise = DataStorage.get('workers');
    }
  }

  async function removeWorker(worker){
    await DataStorage.del(`workers/delete/${worker.id}`);
    workersPromise = workersPromise.then(workers=>workers.filter(filterWorker=>filterWorker.id!=worker.id));
  }
  
</script>

<div class="booking flex-column">
  <h2 class="title" style="text-align: center;">Todos os funcionários</h2>
  <table class="table">
    <thead>
      <tr>
        <td>NOME</td>
        <td>LOGIN</td>
        <td>CARGO</td>
        <td>REMOVER</td>
      </tr>
    </thead>
    <tbody>
      {#await workersPromise then workers}
        {#each workers as worker}
          <tr>
            <td>{worker.nome}</td>
            <td>{worker.login}</td>
            <td>{worker.cargo}</td>
            <td><button on:click={()=>removeWorker(worker)}>REMOVER</button></td>
          </tr>
          {:else}
          <tr>
            <td colspan="7" style="text-align: center;">Nenhuma funcionário disponível</td>
          </tr>
          {/each}
        {/await}
    </tbody>
  </table>
  <button class="custom-button" style="margin-top:30px" on:click={()=>workerStart = true}>Novo funcionário</button>
</div>

{#if workerStart == true}
<div id='login' class="fullscreen-faded" style="z-index:2 ;">
  <div class="dialog-container" style="min-width:1200px; ">
      <div class="dialog-section">
          <div class="left"><span style="color:var(--main-color);font-weight:bold;font-size:18px">RESERVAR</span></div>
          <i class="material-icons right clickable" on:click={()=>workerStart = false}>highlight_off</i>
        </div>
      <div class="hr"></div>
      <div class="flex-column" style="justify-content: center;align-items:center;padding:60px 0 80px 0">
        <form class="field-form flex-column" on:submit|preventDefault={handleWorker}>
          <label class="finput" style="width:350px;">
            <h1>LOGIN</h1>
            <input type="text" bind:value={newWorker.login} placeholder="Username" required/>
          </label>
          <label class="finput" style="width:350px;">
            <h1>SENHA</h1>
            <input type="password" bind:value={newWorker.senha} placeholder="****" required />
          </label>
          <label class="finput" style="width:350px;">
            <h1>NOME</h1>
            <input type="text" bind:value={newWorker.nome} placeholder="João da Silva" required />
          </label>
          <label class="finput" style="width:350px">
            <h1>CARGO</h1>
            <select required bind:value={newWorker.cargo}>
                <option value={'Servidor'}>SERVIDOR</option>
                <option value={'Bolsista'}>BOLSISTA</option>
                <option value={'admin'}>ADMINISTRADOR</option>
            </select>
          </label>
          <button class="custom-button" type="submit">SALVAR</button>
        </form>
      </div>
  </div>
</div>
{/if}