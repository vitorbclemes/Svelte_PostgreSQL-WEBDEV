<style>
  .events{
    position:relative;
    margin-top: -50px;
  }
  .title{
    padding-bottom: 50px;
  }
</style>
<script>

  import DataStorage from '../../utils/DataStorage.js';
  let clientsPromise = DataStorage.get('clients');

async function removeClient(client){
  await DataStorage.del(`clients/delete/${client.id}`);
  clientsPromise = clientsPromise.then(clients=>clients.filter(filterClient=>filterClient.id!=client.id));
}

</script>

<div class="events">
  <h2 class="title" style="text-align: center;">Todos os Clientes</h2>
  <table class="table">
    <thead>
      <tr>
        <td>NOME</td>
        <td>CPF</td>
        <td>ENDERECO</td>
        <td>REMOVER</td>
      </tr>
    </thead>
    <tbody>
      {#await clientsPromise then clients}
        {#each clients as client}
          <tr>
            <td>{client.nome}</td>
            <td>{client.cpf}</td>
            <td>{client.endereco}</td>
            <td><button on:click={()=>removeClient(client)}>Remover</button></td>
          </tr>
          {:else}
            <tr>
              <td colspan="4" style="text-align: center;">Nenhuma cliente disponível</td>
            </tr>
          {/each}
        {/await}
    </tbody>
  </table>
</div>