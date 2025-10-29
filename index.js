const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const playerEl = document.getElementById('player');
const restartBtn = document.getElementById('restart');

let board = Array(9).fill(null);
let current = 'X';
let running = true;

const wins = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function render() {
  const cells = Array.from(document.querySelectorAll('.cell'));
  cells.forEach((cell,i)=>{
    cell.textContent = board[i] ?? '';
    cell.classList.toggle('disabled',!running || board[i]);
    cell.classList.remove('win');
  });
  playerEl.textContent = current;
}

function checkWin(){
  for(const combo of wins){
    const [a,b,c] = combo;
    if(board[a] && board[a]===board[b] && board[a]===board[c]){
      return {winner:board[a], combo};
    }
  }
  if(board.every(Boolean)) return {winner:null, tie:true};
  return null;
}

function handleClick(e){
  const cell = e.target.closest('.cell');
  if(!cell || !running) return;
  const idx = Number(cell.dataset.index);
  if(board[idx]) return;

  board[idx] = current;
  const result = checkWin();

  if(result){
    running=false;
    if(result.winner){
      // popup
      alert(`🎉 GG ! Le joueur ${result.winner} a gagné !`);
      result.combo.forEach(i=>{
        const c=document.querySelector(`.cell[data-index='${i}']`);
        if(c) c.classList.add('win');
      });
      statusEl.textContent=`Le joueur ${result.winner} a gagné !`;
    } else if(result.tie){
      alert('Match nul ! 🤝');
      statusEl.textContent='Match nul !';
    }
  } else {
    current = current==='X'?'O':'X';
    statusEl.textContent='Tour de : ';
    playerEl.textContent=current;
  }
  render();
}

function reset(){
  board.fill(null);
  current='X';
  running=true;
  statusEl.textContent='Tour de : ';
  playerEl.textContent=current;
  document.querySelectorAll('.cell.win').forEach(c=>c.classList.remove('win'));
  render();
}

boardEl.addEventListener('click',handleClick);
restartBtn.addEventListener('click',reset);

render();
