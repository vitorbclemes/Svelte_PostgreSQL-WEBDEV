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
  let eventsPromise = DataStorage.get('events');

</script>

<div class="events">
  <h2 class="title" style="text-align: center;">Todos os Eventos</h2>
  <table class="table">
    <thead>
      <tr>
        <td>DATA</td>
        <td>EVENTO</td>
      </tr>
    </thead>
    <tbody>
      {#await eventsPromise then events}
        {#each events as event}
          <tr>
            <td>{event.data.replace('T',' ').replace('Z','').substr(0,10)}</td>
            <td>{event.nome}</td>
          </tr>
          {:else}
            <tr>
              <td colspan="2" style="text-align: center;">Nenhuma evento disponível</td>
            </tr>
          {/each}
        {/await}
    </tbody>
  </table>
</div>