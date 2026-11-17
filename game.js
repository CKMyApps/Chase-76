'use strict';
// CHASE '76: new JavaScript implementation of the classic 1970s BASIC game.
// Board has 20 columns and 10 rows, perimeter X walls and 5 chasing robots.
const W=20,H=10,COUNT=5,POSTS=20;
const $=id=>document.getElementById(id);
const dirs={1:[-1,1],2:[0,1],3:[1,1],4:[-1,0],6:[1,0],7:[-1,-1],8:[0,-1],9:[1,-1]};
const STORE='ckmyapps-chase76-v1';let settings={sound:true,contrast:false,wins:0,losses:0};
try{Object.assign(settings,JSON.parse(localStorage.getItem(STORE)||'{}'))}catch{}
const persist=()=>{try{localStorage.setItem(STORE,JSON.stringify(settings))}catch{}};
let game=null,seedSnapshot=null,round=1,locked=false,audio=null;
function sound(kind){if(!settings.sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const notes={move:[[540,.045],[650,.025]],robot:[[220,.04]],jump:[[300,.07],[800,.13]],win:[[480,.09],[650,.09],[830,.17],[1040,.26]],lose:[[380,.10],[250,.13],[150,.28]],fence:[[90,.12],[70,.12]],menu:[[680,.06]]}[kind]||[];let t=audio.currentTime;for(const [freq,dur] of notes){const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.045,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+dur);t+=dur*.94}}catch{}}
const inside=(x,y)=>x>0&&x<W-1&&y>0&&y<H-1;
const id=(x,y)=>y*W+x;
const pt=i=>({x:i%W,y:Math.floor(i/W)});
const rand=n=>Math.floor(Math.random()*n);
function generate(){const fences=new Set();for(let x=0;x<W;x++){fences.add(id(x,0));fences.add(id(x,H-1))}for(let y=0;y<H;y++){fences.add(id(0,y));fences.add(id(W-1,y))}const spots=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)spots.push(id(x,y));for(let i=spots.length-1;i>0;i--){const j=rand(i+1);[spots[i],spots[j]]=[spots[j],spots[i]];}const player=spots.pop();const robots=spots.splice(0,COUNT);for(const cell of spots.splice(0,POSTS))fences.add(cell);return {player,robots,fences:[...fences],moves:0,done:false,result:'',note:'FIVE INTERCEPTOR ROBOTS ARE CLOSING IN.'}}
const clone=o=>JSON.parse(JSON.stringify(o));
function start(same=false){if(!same||!seedSnapshot)seedSnapshot=generate();game=clone(seedSnapshot);locked=false;show('game');render();sound('menu')}
function show(name){document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===name));$('game').classList.toggle('active',name==='game');if(name==='menu')$('menuStats').textContent=`YOUR RECORD: ${settings.wins} WIN${settings.wins===1?'':'S'} · ${settings.losses} LOSS${settings.losses===1?'':'ES'}`;window.scrollTo({top:0,behavior:'instant'});}
const sign=x=>Math.sign(x);
function finish(won,message){if(game.done)return;game.done=true;game.result=won?'win':'lose';game.note=message;if(won)settings.wins++;else settings.losses++;persist();sound(won?'win':'lose')}
function collidePlayer(){return game.fences.includes(game.player)||game.robots.includes(game.player)}
function turn(code){if(!game||game.done||locked)return;
if(code===-1){finish(false,'YOU GAVE UP. THE ROBOTS WIN.');render();return}
if(code===10){locked=true;game.note='NO MORE MOVES — RUNNING THE ROBOTS...';render();let i=0;function tick(){if(!game||game.done){locked=false;render();return}advance();i++;render();if(i<300&&!game.done)setTimeout(tick,65);else{locked=false;if(!game.done)finish(false,'NO ESCAPE — YOU ARE TRAPPED.');render()}}tick();return}
const old=pt(game.player);if(code===0){let x=1+rand(W-2),y=1+rand(H-2);game.player=id(x,y);sound('jump')}else{const d=dirs[code];if(!d)return;const x=old.x+d[0],y=old.y+d[1];if(!inside(x,y)){game.note='THE OUTER WALL BLOCKS YOUR WAY.';sound('fence');render();return;}game.player=id(x,y);sound('move')}
game.moves++;
if(collidePlayer()){finish(false,'HIGH VOLTAGE! YOU HAVE BEEN DESTROYED.');render();return}
advance();render()}
function advance(){if(game.done)return;const oldBots=game.robots.map(pt),target=pt(game.player);const next=oldBots.map(({x,y})=>id(x+sign(target.x-x),y+sign(target.y-y)));const freq=new Map();next.forEach(n=>freq.set(n,(freq.get(n)||0)+1));const fences=new Set(game.fences);let destroyed=0,remaining=[];for(const n of next){if(fences.has(n)||freq.get(n)>1){destroyed++;if(freq.get(n)>1)fences.add(n)}else remaining.push(n)}game.fences=[...fences];game.robots=remaining;
if(remaining.includes(game.player)){finish(false,'AN INTERCEPTOR CAUGHT YOU! GAME OVER.');return}
if(!remaining.length){finish(true,'ALL FIVE INTERCEPTORS DESTROYED — YOU WIN!');return}
if(destroyed){game.note=`${destroyed} ROBOT${destroyed>1?'S':''} DESTROYED! KEEP MOVING.`;sound('fence')}else game.note='INTERCEPTORS MOVING CLOSER...'}
function render(){if(!game)return;const grid=$('board');if(!grid.childElementCount){const fragment=document.createDocumentFragment();for(let i=0;i<W*H;i++){const c=document.createElement('div');c.className='cell';c.setAttribute('role','gridcell');fragment.appendChild(c)}grid.appendChild(fragment)}const fences=new Set(game.fences),robots=new Set(game.robots);[...grid.children].forEach((c,i)=>{let char=' ',cls='cell';if(fences.has(i)){char='X';cls+=' post'}if(robots.has(i)){char='+';cls+=' bot'}if(i===game.player){char='*';cls+=' player'}if(i%W===0||i%W===W-1||i<W||i>=W*(H-1))cls+=' wall';c.textContent=char;c.className=cls});$('botLabel').textContent=`ROBOTS: ${game.robots.length} / ${COUNT}`;$('moveLabel').textContent=`MOVES: ${game.moves}`;$('levelLabel').textContent=`MAZE ${String(round).padStart(2,'0')}`;$('status').textContent=game.note;$('status').classList.toggle('bad',game.result==='lose');document.querySelectorAll('[data-move]').forEach(b=>b.disabled=game.done||locked)}
$('newGame').onclick=()=>{round++;start(false)};
$('sameGame').onclick=()=>start(true);
$('instructions').onclick=()=>show('instructionsScreen');$('settings').onclick=()=>{syncSettings();show('settingsScreen')};
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show('menu'));
$('backGame').onclick=()=>show('menu');$('restartGame').onclick=()=>{round++;start(false)};$('replayGame').onclick=()=>start(true);
document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>turn(Number(b.dataset.move))));
function syncSettings(){$('soundToggle').textContent=settings.sound?'ON':'OFF';$('contrastToggle').textContent=settings.contrast?'ON':'OFF';document.documentElement.style.setProperty('--accent',settings.contrast?'#ffffff':'#9cf5b0');document.documentElement.style.setProperty('--line',settings.contrast?'#aabbb0':'#3b5e4b')}
$('soundToggle').onclick=()=>{settings.sound=!settings.sound;persist();syncSettings();sound('menu')};$('contrastToggle').onclick=()=>{settings.contrast=!settings.contrast;persist();syncSettings()};
window.addEventListener('keydown',e=>{if(!$('game').classList.contains('active'))return;const arrows={ArrowUp:8,ArrowDown:2,ArrowLeft:4,ArrowRight:6},k=e.code.startsWith('Numpad')?e.code.slice(6):e.key;let n=arrows[e.key]??(/^[-]?[0-9]+$/.test(k)?Number(k):null);if(n===null&&e.key==='Escape'){show('menu');return}if(n!==null&&[...Object.keys(dirs).map(Number),0].includes(n)){e.preventDefault();turn(n)}});
let sx=0,sy=0;const board=$('board');board.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY},{passive:true});board.addEventListener('touchend',e=>{if(!e.changedTouches.length)return;const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.hypot(dx,dy)<25)return;const x=Math.abs(dx)<Math.abs(dy)*.35?0:sign(dx),y=Math.abs(dy)<Math.abs(dx)*.35?0:sign(dy);const match=Object.entries(dirs).find(([,d])=>d[0]===x&&d[1]===y);if(match){e.preventDefault();turn(Number(match[0]))}},{passive:false});
syncSettings();show('menu');
