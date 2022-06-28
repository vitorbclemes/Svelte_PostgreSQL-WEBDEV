<script>
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

</script>
<style>
  .about{
    z-index: 2;
    position: relative;
  }
  .about #about{
    max-width: 440px;
    margin-right: 40px;
  }
  .about #about >h1 {
    font-size: 35px;
    font-weight: 800;
    color: #000000;
    margin: 0;
  }
  .about #about > p {
    text-align: justify;
    margin-bottom: 30px;
  }
  p {
      font-size: 16px;
      font-weight: 300;
  }
  .button{
    background:var(--main-color);
    border-radius: 55px;
    font-weight: 800;
    font-size: 16px;
    color: #ffffff;
    text-transform: uppercase;
    text-decoration: none;
    padding: 14px 36px;
    border: none;
    margin-bottom: 20px;
    display: inline-block;
    cursor: pointer;
  }
</style>

<div class="about flex-container">
  <div id="about">
    <h1>Reserva sua quadra</h1>
    <h1>sem sair de casa</h1>
    <p>
      Acesse o sistema de Login para solicitar um agendamento e nossos funcionários confirmarão sua reserva
      sem que você precise se deslocar até o local.
    </p>
      <a class="button" href="/" on:click|preventDefault={()=>dispatch('handleLogin',{'status':true,'type':'login'})}>Acesse o Login</a>
      <a class="button" href="/" on:click|preventDefault={()=>dispatch('handleLogin',{'status':true,'type':'sign-up'})}>Cadastre-se</a>
  </div>
  <div>
    <img src="https://i2.wp.com/direcionalescolas.com.br/wp-content/uploads/2018/10/quadras-poliesportivas.jpg?fit=750%2C406&ssl=1" alt="quadra" style="height: 315px;width:510px">
  </div>
</div>
