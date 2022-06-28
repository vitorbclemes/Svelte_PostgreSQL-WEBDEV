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
  export let user;
  let eventsPromise = DataStorage.getByParams(`events/clients/${user.id}`);

  let eventStart = false;
  let eventName = "";

  async function handleEvent(){
    let res = await DataStorage.post('events',{'nome':eventName,'idCliente':user.id});
    if(res.answer == "Success"){
      alert('Sucesso!')
      eventStart = false;
      eventName = "";
      eventsPromise = DataStorage.getByParams(`events/clients/${user.id}`);
    }
  }

  async function deleteEvent(event){
    let res = await DataStorage.del(`events/delete/${event.id}`);
    if(res.answer == "Success")
      eventsPromise = eventsPromise.then(events=>events.filter(filterEvent=>filterEvent.id!=event.id));
  }
</script>

<div class="events">
  <h2 class="title" style="text-align: center;">Meus eventos</h2>
  <table class="table">
    <thead>
      <tr style="justify-content:space-between">
        <td>EVENTO</td>
        <td>EXCLUIR</td>
      </tr>
    </thead>
    <tbody>
      {#await eventsPromise then events}
        {#each events as event}
          <tr>
            <td>{event.nome}</td>
            <td><button on:click={()=>deleteEvent(event)}>EXCLUIR</button></td>
          </tr>
          {:else}
            <tr>
              <td colspan="2">Nenhum evento disponível</td>
            </tr>
          {/each}
        {/await}
    </tbody>
  </table>
  <button class="custom-button" style="margin-left:450px;margin-top:30px" on:click={()=>eventStart = true}>Novo Evento</button>
</div>

{#if eventStart == true}
<div id='login' class="fullscreen-faded" style="z-index:2 ;">
  <div class="dialog-container" style="min-width:1200px; ">
      <div class="dialog-section">
          <div class="left"><span style="color:var(--main-color);font-weight:bold;font-size:18px">RESERVAR</span></div>
          <i class="material-icons right clickable" on:click={()=>eventStart = false}>highlight_off</i>
        </div>
      <div class="hr"></div>
      <div class="flex-column" style="justify-content: center;align-items:center;padding:60px 0 80px 0">
        <form class="field-form flex-column" on:submit|preventDefault={handleEvent}>
          <label class="finput" style="width:350px;">
            <h1>NOME DO EVENTO</h1>
            <input type="text" bind:value={eventName} placeholder="EVENTO XXX" required />
          </label>
          <button class="custom-button" type="submit">SALVAR</button>
        </form>
      </div>
  </div>
</div>
{/if}