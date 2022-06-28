<script>
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();
  export let user;
</script>
<style>
  .header{
    margin: 32px 10px 60px 10px;
    justify-content: center;
    align-items: c;
  }
  .header nav{
    justify-content: space-between;
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    align-self: flex-end;
    margin-bottom: 10px;
  }
  .header nav > span{
    font-size: 16px;
    margin: 4px 16px;
    white-space: nowrap;
    cursor: pointer;
  }
  .img{
    height: 50px;
    width: 150px;
    margin-left: -200px;
    margin-right: 120px;
}
</style>

<div class="header flex-row flex-expand">
  <nav>
    <img src="images/logo.png" alt="logo" class="img"/>
    {#if !user}
      <span on:click={()=>dispatch('handleEvents','about')}>Início</span>
      <!-- <span on:click={()=>dispatch('handleEvents','field')}>Quadras disponíveis</span> -->
      <span on:click={()=>dispatch('handleEvents','events')}>Eventos</span>
      <span style="color: var(--main-color);" on:click={()=>dispatch('handleLogin',true)}>Login</span>
    {:else if user && !user.cargo}
      <span on:click={()=>dispatch('handleEvents','booking')}>Minhas reservas</span>
      <span on:click={()=>dispatch('handleEvents','myevents')}>Meus eventos</span>
      <span style="color: var(--main-color);" on:click={()=>dispatch('handleLogout',null)}>Sair</span>
    {:else if user && user.cargo}
      <span on:click={()=>dispatch('handleEvents','seeBooking')}>Listar reservas</span>
      <span on:click={()=>dispatch('handleEvents','seeEvents')}>Listar eventos</span>
      {#if user.cargo == 'admin'}
        <span on:click={()=>dispatch('handleEvents','seeClients')}>Listar clientes</span>
        <span on:click={()=>dispatch('handleEvents','seeWorkers')}>Listar funcionários</span>
        <span on:click={()=>dispatch('handleEvents','seeFields')}>Listar Quadras</span>
        <span style="color: var(--main-color);" on:click={()=>dispatch('handleLogout',null)}>Sair</span>
      {/if}
    {/if}
  </nav>
</div>