<script>
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();
</script>
<style>
  .img{
    height: 330px;
    width:420px
  }
  .description{
    margin-left:50px;
    justify-content: center;
    align-items:center;
    text-align:center;
    font-size: 18px;
    line-height: 10px;
  }

</style>

<div class="flex-row">
  <div>
    <img src="images/event.jpg" alt="event" class="img">
  </div>
  <div class="flex-column description" style="">
    <p>Planejando inventar um campeonato?</p>
    <p>Sonha em colocar um troféu no seu quarto?</p>
    <p>Prepare-se para uma imersão esportiva 100%</p>
    <button class="custom-button" style="margin-top:30px ;" on:click|preventDefault={()=>dispatch('handleLogin',{'status':true,'type':'login'})}>FAÇA O LOGIN</button>
  </div>
</div>