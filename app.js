
const pc=document.getElementById('playerCount');
for(let i=2;i<=10;i++) pc.innerHTML+=`<option>${i}</option>`;

function makeInputs(){
 const n=+pc.value;
 let p='';
 for(let i=1;i<=n;i++) p+=`<label>P${i} 칩</label><input type="number" id="chip${i}" value="${10000*i}">`;
 document.getElementById('playerInputs').innerHTML=p;

 const icm=document.querySelector('input[name=mode]:checked').value==='icm';
 document.getElementById('payoutSection').classList.toggle('hidden',!icm);
 let pay='';
 if(icm){ for(let i=1;i<=n;i++) pay+=`<label>${i}등 상금</label><input type="number" id="pay${i}" value="${Math.max(0,(n-i+1)*10000)}">`; }
 document.getElementById('payoutInputs').innerHTML=pay;
}
pc.onchange=makeInputs;
document.querySelectorAll('input[name=mode]').forEach(x=>x.onchange=makeInputs);
makeInputs();

function icmValues(stacks,payouts){
 const memo=new Map();
 function f(players,pays){
   const key=players.join(',')+'|'+pays.join(',');
   if(memo.has(key)) return memo.get(key);
   const res=Array(stacks.length).fill(0);
   if(pays.length===0){ memo.set(key,res); return res; }
   const total=players.reduce((a,i)=>a+stacks[i],0);
   for(const i of players){
      const prob=stacks[i]/total;
      res[i]+=prob*pays[0];
      const rem=f(players.filter(x=>x!==i),pays.slice(1));
      for(let k=0;k<res.length;k++) res[k]+=prob*rem[k];
   }
   memo.set(key,res); return res;
 }
 return f(stacks.map((_,i)=>i), payouts);
}

document.getElementById('calculateBtn').onclick=()=>{
 const n=+pc.value;
 const mode=document.querySelector('input[name=mode]:checked').value;
 const result=document.getElementById('results');

 let chips=[];
 for(let i=1;i<=n;i++) chips.push(+document.getElementById('chip'+i).value||0);

 let payouts=[];

 if(mode==='chip'){
   const prize=+document.getElementById('totalPrize').value||0;
   const total=chips.reduce((a,b)=>a+b,0);
   payouts=chips.map(c=>Math.floor((prize*c/total)/100)*100);
   const used=payouts.reduce((a,b)=>a+b,0);
   const leader=chips.indexOf(Math.max(...chips));
   payouts[leader]+=prize-used;
 } else {
   let pay=[];
   for(let i=1;i<=n;i++) pay.push(+document.getElementById('pay'+i).value||0);
   payouts=icmValues(chips,pay).map(v=>Math.round(v/100)*100);
   const target=pay.reduce((a,b)=>a+b,0);
   const used=payouts.reduce((a,b)=>a+b,0);
   const leader=chips.indexOf(Math.max(...chips));
   payouts[leader]+=target-used;
 }

 let rows=chips.map((c,i)=>({i:i+1,c,p:payouts[i]}))
 .sort((a,b)=>b.c-a.c);

 result.innerHTML=rows.map((r,idx)=>`<div class="result">${idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':'🏅'} P${r.i}<br>칩 ${r.c.toLocaleString()}<br>상금 ${r.p.toLocaleString()}원</div>`).join('');
};
