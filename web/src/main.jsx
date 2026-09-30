import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import{createWalletClient,createPublicClient,custom,http,parseEther,formatEther}from'viem';
import artifact from './generated/BakedBeans.json';
import'./style.css';

const OWNER='0x0F8C77d66BE897ded49b2793b71f2A3Eb63CCaA8';

const chain={
  id:56,
  name:'BNB Smart Chain',
  nativeCurrency:{name:'BNB',symbol:'BNB',decimals:18},
  rpcUrls:{default:{http:['https://bsc-dataseed.bnbchain.org']}},
  blockExplorers:{default:{name:'BscScan',url:'https://bscscan.com'}}
};

const pc=createPublicClient({
  chain,
  transport:http(chain.rpcUrls.default.http[0])
});

function App(){
  const[account,setAccount]=useState();
  const[contract,setContract]=useState('');
  const[msg,setMsg]=useState('Connect the deployment wallet.');
  const[amount,setAmount]=useState('0.01');
  const[referrer,setReferrer]=useState('');
  const[stats,setStats]=useState({});

  const wallet=()=>{
    if(!window.ethereum)throw Error('No injected wallet found. Open this site inside your wallet browser.');
    return createWalletClient({chain,transport:custom(window.ethereum)});
  };

  async function ensure(){
    if(!window.ethereum)throw Error('No injected wallet found. Open this site inside your wallet browser.');

    await window.ethereum.request({
      method:'wallet_switchEthereumChain',
      params:[{chainId:'0x38'}]
    }).catch(async()=>{
      await window.ethereum.request({
        method:'wallet_addEthereumChain',
        params:[{
          chainId:'0x38',
          chainName:'BNB Smart Chain',
          nativeCurrency:{name:'BNB',symbol:'BNB',decimals:18},
          rpcUrls:chain.rpcUrls.default.http,
          blockExplorerUrls:[chain.blockExplorers.default.url]
        }]
      });
    });

    const[a]=await wallet().requestAddresses();
    setAccount(a);
    return a;
  }

  async function connect(){
    try{
      const a=await ensure();
      setMsg(
        a.toLowerCase()===OWNER.toLowerCase()
          ?'Correct deployment wallet connected.'
          :'Wrong wallet. Deployment is locked to the configured owner address.'
      );
    }catch(e){
      setMsg(e.shortMessage||e.message);
    }
  }

  async function deploy(){
    try{
      const a=await ensure();

      if(a.toLowerCase()!==OWNER.toLowerCase()){
        throw Error('Connected wallet does not match configured deployment wallet.');
      }

      setMsg('Approve the contract deployment in your wallet…');

      const hash=await wallet().deployContract({
        account:a,
        abi:artifact.abi,
        bytecode:artifact.bytecode
      });

      setMsg(`Deployment submitted: ${hash}`);

      const r=await pc.waitForTransactionReceipt({hash});

      setContract(r.contractAddress);

      try{
        localStorage.setItem('hiveContract',r.contractAddress);
      }catch{}

      setMsg(`Deployed: ${r.contractAddress}`);
    }catch(e){
      setMsg(e.shortMessage||e.message);
    }
  }

  async function write(fn,args=[],value){
    try{
      if(!contract)throw Error('Deploy the contract first.');

      const a=await ensure();

      setMsg(`Approve ${fn} in your wallet…`);

      const hash=await wallet().writeContract({
        account:a,
        address:contract,
        abi:artifact.abi,
        functionName:fn,
        args,
        value
      });

      setMsg(`Submitted: ${hash}`);

      await pc.waitForTransactionReceipt({hash});

      setMsg(`${fn} confirmed.`);
      refresh();
    }catch(e){
      setMsg(e.shortMessage||e.message);
    }
  }

  async function refresh(){
    if(!contract||!account)return;

    try{
      const[bal,miners,eggs,owner]=await Promise.all([
        pc.readContract({
          address:contract,
          abi:artifact.abi,
          functionName:'getBalance'
        }),
        pc.readContract({
          address:contract,
          abi:artifact.abi,
          functionName:'getMyMiners',
          args:[account]
        }),
        pc.readContract({
          address:contract,
          abi:artifact.abi,
          functionName:'getMyEggs',
          args:[account]
        }),
        pc.readContract({
          address:contract,
          abi:artifact.abi,
          functionName:'owner'
        })
      ]);

      const rewards=miners===0n?0n:await pc.readContract({
        address:contract,
        abi:artifact.abi,
        functionName:'beanRewards',
        args:[account]
      });

      setStats({
        bal:formatEther(bal),
        miners:String(miners),
        eggs:String(eggs),
        rewards:formatEther(rewards),
        owner
      });
    }catch(e){
      setMsg(e.shortMessage||e.message);
    }
  }

  useEffect(()=>{
    try{
      const saved=localStorage.getItem('hiveContract');
      if(saved)setContract(saved);
    }catch{}
  },[]);

  useEffect(()=>{
    refresh();
  },[contract,account]);

  return(
    <main>
      <h1>🐝 BnBeeHive</h1>

      <p className="tag">
        Build the Hive. Compound the Honey.
      </p>

      <div className="warn">
        BNB SMART CHAIN · BNB · ORIGINAL BAKEDBEANS LOGIC · NOT AUDITED
      </div>

      <section>
        <button onClick={connect}>Connect Wallet</button>
        <p>{account||'Not connected'}</p>
        <p className="small">
          Required deployer: {OWNER}
        </p>
      </section>

      <section>
        <h2>1. Deploy</h2>

        <button onClick={deploy}>
          Deploy BakedBeans
        </button>

        <p className="mono">
          {contract||'No contract deployed yet'}
        </p>

        {contract&&(
          <a
            href={`${chain.blockExplorers.default.url}/address/${contract}`}
            target="_blank"
            rel="noreferrer"
          >
            View on BscScan
          </a>
        )}
      </section>

      <section>
        <h2>2. Seed Market</h2>

        <input
          value={amount}
          onChange={e=>setAmount(e.target.value)}
          inputMode="decimal"
        />

        <span> BNB</span>

        <button
          onClick={()=>write('seedMarket',[],parseEther(amount))}
        >
          Seed Market
        </button>

        <p className="small">
          Owner-only and one-time. The entered BNB becomes contract liquidity.
        </p>
      </section>

      <section>
        <h2>3. BnBeeHive</h2>

        <input
          value={amount}
          onChange={e=>setAmount(e.target.value)}
          inputMode="decimal"
        />

        <input
          value={referrer}
          onChange={e=>setReferrer(e.target.value)}
          placeholder="Referral wallet (optional)"
        />

        <span> BNB</span>

        <button
          onClick={()=>write(
            'buyEggs',
            [referrer.trim() || '0x0000000000000000000000000000000000000000'],
            parseEther(amount)
          )}
        >
          Hire Bees
        </button>

        <button
          onClick={()=>write(
            'hatchEggs',
            ['0x0000000000000000000000000000000000000000']
          )}
        >
          Compound Honey
        </button>

        <button onClick={()=>write('sellEggs')}>
          Harvest Honey
        </button>

        <button onClick={refresh}>
          Refresh
        </button>

        <div className="grid">
          <b>Bees</b>
          <span>{stats.miners??'—'}</span>

          <b>Honey (eggs)</b>
          <span>{stats.eggs??'—'}</span>

          <b>Harvest value</b>
          <span>{stats.rewards??'—'} BNB</span>

          <b>Hive balance</b>
          <span>{stats.bal??'—'} BNB</span>

          <b>Owner</b>
          <span className="mono">{stats.owner??'—'}</span>
        </div>
      </section>

      <section className="status">
        <b>Status</b>
        <p>{msg}</p>
      </section>

      <footer>
       This contract does not generate external yield. Withdrawals depend on BNB held by the contract. .
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
