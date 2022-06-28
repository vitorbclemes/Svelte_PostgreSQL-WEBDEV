<script>
  import DataStorage from '../../utils/DataStorage.js'
  let availableSports = ['Futebol','Volei','Handebol','Basquete']

  let date;
  let time;
  let selectedSport;

  let search;

  function searchField(){
    //DataStorage.get()...
    search = 'no-return';
    return availableFields;
  }
</script>
<style>
.available{
    position:relative;
    z-index: 2;
    margin-top: -50px;
  }
  .title{
    padding-bottom: 50px;
  }
  .field-form{
    margin-left: 130px;
  }
</style>


<div class="available">
  <h2 class="title center">Encontre sua Quadra</h2>
  <div class="flex-row" style="padding: 25px;">
    <form class="field-form flex-column" on:submit|preventDefault={searchField}>
      <label class="finput" style="width:250px">
        <h1>DATA</h1>
        <input type="date" bind:value={date} required />
      </label>
      <label class="finput" style="width:250px">
        <h1>HORÁRIO</h1>
        <input type="time" bind:value={time} required />
      </label>
      <label class="finput" style="width:250px">
        <h1>ESPORTE</h1>
        <select required bind:value={selectedSport}>
          {#each availableSports as sport }
            <option value={sport}>{sport}</option>
          {/each}
        </select>
      </label>
      <button class="custom-button" type="submit">BUSCAR</button>
    </form>

    <div style="width: 250px;margin-left:200px;display">
      {#if !search}
        <p style="margin-top: 70px;font-size:24px;text-align:center">Encontre o momento perfeito para o esporte!</p>
      {:else if search == 'no-return'}
        <p style="margin-top: 70px;font-size:24px;color:#ff6000">Não foi possível encontrar nenhuma quadra disponível nas condições escolhidas.</p>
      {:else}
        <table></table>
      {/if}
    </div>
  </div>

</div>