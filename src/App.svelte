<script>
	import Header from './static/Header.svelte'
  import Field from './Pages/Field.svelte';
  import About from './Pages/About.svelte';
  import Events from './Pages/Events.svelte';
  //Client Pages
  import Booking from './clientPages/Booking.svelte';
  import MyEvents from './clientPages/MyEvents.svelte';
  //Worker Pages
  import SeeBooking from './workerPages/seeBooking.svelte'
  import SeeEvents from './workerPages/seeEvents.svelte';
  import SeeClients from './workerPages/seeClients.svelte';
  import SeeWorkers from './workerPages/seeWorkers.svelte';
  import SeeFieldsAndBlock from './workerPages/seeFieldsAndBlock.svelte';

  import DataStorage from '../utils/DataStorage.js';

  let headerOption = 'about';

	let loginIn = false;
  let loginOption = ['Cliente','Funcionário'];
  let loginType;

  let login = {
    cpf:'',
    password:'',
    type:'Cliente'
  };
  let newUser = {
    cpf:'',
    senha:'',
    nome:'',
    idade:null,
    ocupacao:'',
    endereco:''
  }
  let user;

  async function handleLogin(){
    let requestedUser;
    if(login.type == 'Cliente')
      requestedUser = await DataStorage.get(`clients/login`,{'cpf':login.cpf,'senha':login.password});
    else
      requestedUser = await DataStorage.get(`workers/login`,{'login':login.cpf,'senha':login.password});

    if(requestedUser.length > 0){
      user = requestedUser[0];
      alert('Sucesso!')
      login.type == 'Cliente' ? headerOption = 'booking' : headerOption = 'seeBooking';
      loginIn = false;
    }
    else
      alert('Dados invalidos');
  }

  async function handleSignUp(){
    let res = await DataStorage.post('clients',newUser);
    if (res.answer == 'Success'){
      alert('Sucesso!Faca o login');
      loginType = 'login'
      newUser = {
        cpf:'',
        senha:'',
        nome:'',
        idade:null,
        ocupacao:'',
        endereco:''
      }
    }
  };

  async function handleLogout(){
    user = null;
    login.cpf = '';
    login.password = '',
    login.type = 'Cliente'
    headerOption = 'about'
  }

</script>

<style>
    .root{
      overflow: hidden;
      max-width: 1100px;
      margin: 0 auto;
      padding: 80px 20px;
  }
</style>

<main>
	<Header user={user} on:handleEvents={(e)=> {headerOption = e.detail }} on:handleLogin={(e)=>{loginIn = e.detail}} on:handleLogout={handleLogout}/>
  <div class="root">
      {#if headerOption == 'about'}
        <About on:handleLogin={(e)=> {loginIn = e.detail.status;loginType = e.detail.type}}/>
      {:else if headerOption == 'field'}
          <Field />
      {:else if headerOption == 'events'}
          <Events on:handleLogin={(e)=> {loginIn = e.detail.status;loginType = e.detail.type}} />
      {:else if headerOption == 'booking'}
          <Booking user = {user}/>
      {:else if headerOption == 'myevents'}
          <MyEvents user = {user}/>
      {:else if headerOption == 'seeBooking'}
          <SeeBooking/>
      {:else if headerOption == 'seeEvents'}
          <SeeEvents/>
      {:else if headerOption == 'seeClients'}
          <SeeClients/>
      {:else if headerOption == 'seeWorkers'}
          <SeeWorkers/>
      {:else if headerOption == 'seeFields'}
          <SeeFieldsAndBlock />
      {/if}
  </div>
</main>

{#if loginIn != false}
<div id='login' class="fullscreen-faded" style="z-index:2 ;">
  <div class="dialog-container" style="min-width:1200px; ">
    {#if loginType == 'sign-up'}
      <div class="dialog-section">
          <div class="left"><span style="color:var(--main-color);font-weight:bold;font-size:18px">CADASTRO</span></div>
          <i class="material-icons right clickable" on:click={()=>loginIn = false}>highlight_off</i>
        </div>
      <div class="hr"></div>
      <div class="flex-column" style="justify-content: center;align-items:center;padding:60px 0 80px 0">
        <form class="field-form flex-column" on:submit|preventDefault={handleSignUp}>
          <label class="finput" style="width:350px">
            <h1>CPF</h1>
            <input type="text" bind:value={newUser.cpf} placeholder="000.000.000-00" required />
          </label>
          <label class="finput" style="width:350px">
            <h1>SENHA</h1>
            <input type="password" bind:value={newUser.senha} placeholder="******" required />
          </label>
          <label class="finput" style="width:350px">
            <h1>NOME</h1>
            <input type="text" bind:value={newUser.nome} placeholder="João da Silva" required />
          </label>
          <label class="finput" style="width:350px">
            <h1>IDADE</h1>
            <input type="number" bind:value={newUser.idade} placeholder=18 required />
          </label>
          <label class="finput" style="width:350px">
            <h1>OCUPAÇÃO</h1>
            <input type="text" bind:value={newUser.ocupacao} placeholder="Estudante" required />
          </label>
          <label class="finput" style="width:350px">
            <h1>ENDEREÇO</h1>
            <input type="text" bind:value={newUser.endereco} placeholder="Rua Paulo Malchitzki,100" required />
          </label>
          <button class="custom-button" style="margin-top: 30px;" type="submit">CADASTRAR</button>
        </form>
      </div>
      {:else}
          <div class="dialog-section">
            <div class="left"><span style="color:var(--main-color);font-weight:bold;font-size:18px">ENTRAR</span></div>
            <i class="material-icons right clickable" on:click={()=>loginIn = false}>highlight_off</i>
          </div>
        <div class="hr"></div>
        <div class="flex-column" style="justify-content: center;align-items:center;padding:60px 0 80px 0">
          <form class="field-form flex-column" on:submit|preventDefault={handleLogin}>
            <label class="finput" style="width:350px">
              <h1>CPF OU LOGIN</h1>
              <input type="text" bind:value={login.cpf} placeholder="000.000.000-00" required />
            </label>
            <label class="finput" style="width:350px">
              <h1>SENHA</h1>
              <input type="password" bind:value={login.password} placeholder="******" required />
            </label>
            <label class="finput" style="width:350px">
              <h1>TIPO</h1>
              <select required bind:value={login.type}>
                {#each loginOption as option }
                  <option value={option}>{option}</option>
                {/each}
              </select>
            </label>
            <button class="custom-button" style="margin-top: 30px;" type="submit">ENTRAR</button>
          </form>
        </div>
      {/if}
  </div>
</div>
{/if}
