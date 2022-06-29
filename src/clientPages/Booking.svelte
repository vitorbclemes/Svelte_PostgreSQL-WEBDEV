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
  export let user;

  let bookingsPromise = DataStorage.getByParams(`/appointments/clients/${user.id}`);
  let eventsPromise = DataStorage.getByParams(`events/clients/${user.id}`);
  let newBooking = {
    idEvento:null,
    idQuadra:'',
    idCliente:user.id,
    idFuncionario:null,
    data:'2022-06-28',
    horario:'09:00:00',
    recorrente:false,
    antecedencia:'',
    status:'pending'
  }

  let bookingStart = false;
  let fieldsPromise = DataStorage.get('fields',{'data':newBooking.data,'horario':newBooking.horario}) || [];

  async function handleBooking(){
    let res = await DataStorage.post('appointments',newBooking);
    if(res.answer == "Success"){
      alert('Sucesso!')
      bookingStart = false;
      newBooking = {
        idEvento:null,
        idCliente:user.id,
        idQuadra:'',
        idFuncionario:null,
        data:'2022-06-28',
        horario:'09:00:00',
        recorrente:false,
        antecedencia:'',
        status:'pending'
      }
      bookingsPromise = DataStorage.getByParams(`/appointments/clients/${user.id}`);
    }
  }

  async function deleteBooking(booking){
    let res = await DataStorage.del(`appointments/delete/${booking.id}`)
    if(res.answer == 'Success')
      bookingsPromise = bookingsPromise.then(bookings=>bookings.filter(filterBooking=>filterBooking.id!=booking.id));
  }
</script>

<div class="booking">
  <h2 class="title" style="text-align: center;">Minhas reservas</h2>
  <table class="table">
    <thead>
      <tr>
        <td>DATA</td>
        <td>HORARIO</td>
        <td>MODALIDADES</td>
        <td>BLOCO</td>
        <td>RECORRÊNCIA</td>
        <td>STATUS</td>
        <td>EXCLUIR</td>
      </tr>
    </thead>
    <tbody>
      {#await bookingsPromise then booking}
        {#each booking as booked}
          <tr>
            <td>{booked.data.replace('T',' ').replace('Z','').substr(0,10)}</td>
            <td>{booked.horario}</td>
            <td>{booked.modalidade}</td>
            <td>{booked.nome}</td>
            <td>{booked.recorrente == false ? 'Não' : 'Sim'}</td>
            <td>{booked.status == 'approved' ? 'Aprovado' : 'Pendente'}</td>
            <td><button on:click={()=>deleteBooking(booked)}>EXCLUIR</button></td>
          </tr>
          {:else}
          <tr>
            <td colspan="8" style="text-align: center;">Nenhuma reserva disponível</td>
          </tr>
          {/each}
        {/await}
    </tbody>
  </table>
  <button class="custom-button" style="margin-left:450px;margin-top:30px" on:click={()=>bookingStart = true}>Nova Reserva</button>
</div>

{#if bookingStart == true}
<div id='login' class="fullscreen-faded" style="z-index:2 ;">
  <div class="dialog-container" style="min-width:1200px; ">
      <div class="dialog-section">
          <div class="left"><span style="color:var(--main-color);font-weight:bold;font-size:18px">RESERVAR</span></div>
          <i class="material-icons right clickable" on:click={()=>bookingStart = false}>highlight_off</i>
        </div>
      <div class="hr"></div>
      <div class="flex-column" style="justify-content: center;align-items:center;padding:60px 0 80px 0">
        <form class="field-form flex-column" on:submit|preventDefault={handleBooking}>
          <label class="finput" style="width:350px">
            <h1>DATA</h1>
            <input type="date" bind:value={newBooking.data} placeholder="000.000.000-00" required />
          </label>
          <label class="finput" style="width:350px">
            <h1>HORÁRIO</h1>
            <input type="text" bind:value={newBooking.horario} placeholder="HH:MM:SS  " required />
          </label>
          <label class="finput" style="width:350px">
            <h1>ESPORTE</h1>
            <select required bind:value={newBooking.idQuadra}>
              {#await fieldsPromise then fields }
                {#each fields as field }
                  <option value={field.id}>{"[" + field.modalidade + "], " +field.nomebloco}</option>
                {:else}
                  SEM OPÇÕES NESSE HORARIO
                {/each}
              {/await}
            </select>
          </label>
          <label class="finput" style="width:350px">
            <h1>RECORRENTE</h1>
            <select required bind:value={newBooking.recorrente}>
                  <option value={true}>SIM</option>
                  <option value={false}>NÃO</option>
            </select>
          </label>
          <label class="finput" style="width:350px">
            <h1>EVENTO</h1>
            <select required bind:value={newBooking.idEvento}>
              {#await eventsPromise then events }
              <option value={null}>Nenhum</option>
                {#each events as event }
                  <option value={event.id}>{event.nome}</option>
                {/each}
              {/await}
            </select>
          </label>
          <button class="custom-button" style="margin-top: 30px;" type="submit">RESERVAR</button>
        </form>
      </div>
  </div>
 </div>
{/if}