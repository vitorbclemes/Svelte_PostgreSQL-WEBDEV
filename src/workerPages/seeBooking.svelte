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
  let bookingsPromise = DataStorage.get('appointments');
  export let user;

  async function handleApproved(booking){
    let res = await DataStorage.put(`appointments/${booking.id}`,{'status': booking.status == 'pending' ? 'approved' : 'pending','id':booking.id,'idFuncionario':user.id});
    if(res.answer == 'Success')
      bookingsPromise = DataStorage.get('appointments');
  }

</script>

<div class="booking flex-column">
  <h2 class="title" style="text-align: center;">Todas as reservas</h2>
  <table class="table">
    <thead>
      <tr>
        <td>DATA</td>
        <td>HORARIO</td>
        <td>MODALIDADES</td>
        <td>BLOCO</td>
        <td>RECORRÊNCIA</td>
        <td>STATUS</td>
        <td>APROVAÇÃO</td>
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
            <td><button on:click={()=>handleApproved(booked)}>{booked.status == 'approved' ? 'Desaprovar' : 'Aprovar'}</button></td>
          </tr>
          {:else}
          <tr>
            <td colspan="7" style="text-align: center;">Nenhuma reserva disponível</td>
          </tr>
          {/each}
        {/await}
    </tbody>
  </table>
  <!-- <button class="custom-button" style="margin-left:450px;margin-top:30px">Nova Reserva</button> -->
</div>