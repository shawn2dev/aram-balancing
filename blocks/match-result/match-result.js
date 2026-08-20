import { loadCSS } from '../../scripts/aem.js';
import { defaultLevelMap, computeLevel } from '../../scripts/utils.js';

let teamsHistory = [];
let historyIndex = 0;

// ── Balancing algorithm ───────────────────────────────────────────────────────

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const balanceTeams = (players) => {
  const shuffled = shuffle(players);
  const numPerTeam = Math.floor(shuffled.length / 2);
  const team1 = [];
  const team2 = [];
  let total1 = 0;
  let total2 = 0;

  // Greedy initial assignment (alternating)
  for (let i = 0; i < shuffled.length; i += 1) {
    const player = shuffled[i];
    if (i % 2 === 0 && team1.length < numPerTeam) {
      team1.push(player);
      total1 += player.level;
    } else if (team2.length < numPerTeam) {
      team2.push(player);
      total2 += player.level;
    } else {
      team1.push(player);
      total1 += player.level;
    }
  }

  // Iterative swap to minimise score difference
  const tolerance = 0.5;
  const MAX_TRIAL = 200000;
  let trial = 0;

  while (Math.abs(total1 - total2) > tolerance && trial < MAX_TRIAL) {
    let swapped = false;
    for (let i = 0; i < team1.length && !swapped; i += 1) {
      for (let j = 0; j < team2.length && !swapped; j += 1) {
        const newTotal1 = total1 - team1[i].level + team2[j].level;
        const newTotal2 = total2 - team2[j].level + team1[i].level;
        if (Math.abs(newTotal1 - newTotal2) < Math.abs(total1 - total2)) {
          [team1[i], team2[j]] = [team2[j], team1[i]];
          total1 = newTotal1;
          total2 = newTotal2;
          swapped = true;
        }
      }
    }
    if (!swapped) break;
    trial += 1;
  }

  return { team1, team2 };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtScore = (n) => (n % 1 === 0 ? String(n) : n.toFixed(1));

const totalScore = (team) => team.reduce((sum, p) => sum + p.level, 0);

const tierBadge = (tier, type) => {
  if (!tier) return '<span class="badge bg-secondary">?</span>';
  const colorMap = {
    B: 'secondary', S: 'light text-dark', SG: 'light text-dark',
    G: 'warning text-dark', GP: 'warning text-dark',
    P: 'info text-dark', PE: 'info text-dark',
    E: 'success', ED: 'success',
    D: 'primary', DM: 'primary',
    M: 'danger', GM: 'danger', C: 'danger',
  };
  const color = colorMap[tier] || 'secondary';
  const title = type === 'current' ? '현재 티어' : '최고 티어';
  return `<span class="badge bg-${color} tier-badge" title="${title}">${tier}</span>`;
};

// ── HTML generators ───────────────────────────────────────────────────────────

const generatePlayerHtml = (player) => `
<div class="player d-flex justify-content-between align-items-center p-2 mt-2 gap-3"
  data-score="${player.level}" data-name="${player.name}"
  data-current="${player.currentTier}" data-peak="${player.peakTier}">
  <div class="name fw-semibold">${player.name}</div>
  <div class="d-flex align-items-center gap-1 flex-shrink-0">
    <span class="tier-label">현</span>${tierBadge(player.currentTier, 'current')}
    <span class="tier-label ms-1">최</span>${tierBadge(player.peakTier, 'peak')}
    <span class="badge bg-dark border border-secondary ms-1 score-badge"
      title="Score">${fmtScore(player.level)}</span>
  </div>
</div>`;

const generateTeamHtml = (team, teamNum) => {
  const total = totalScore(team);
  return `
<div class="team col-12 col-lg-6 col-xl-5 mb-3 mb-lg-0">
  <h5 class="text-white text-center fw-bold mb-1">Team ${teamNum}</h5>
  <div class="team-players">
    ${team.map((p) => generatePlayerHtml(p)).join('')}
  </div>
  <div class="mt-2 d-flex justify-content-end">
    <span class="text-white fw-bold total-score">Total: ${fmtScore(total)}</span>
  </div>
</div>`;
};

const vsHtml = () => `
<div class="vs col-xl-2 text-white d-none d-xl-flex align-items-center justify-content-center">
  <div class="fs-1 fw-bold opacity-25">VS</div>
</div>`;

// ── Swap interaction ──────────────────────────────────────────────────────────

const recalcTotal = (teamEl) => {
  let sum = 0;
  teamEl.querySelectorAll('.player').forEach((p) => {
    sum += parseFloat(p.dataset.score);
  });
  teamEl.querySelector('.total-score').textContent = `Total: ${fmtScore(sum)}`;
};

const attachSwapHandlers = (resultRow) => {
  resultRow.querySelectorAll('.player').forEach((p) => {
    p.addEventListener('click', () => {
      const swapping = resultRow.querySelector('.player.swap');
      if (!swapping) {
        p.classList.add('swap');
        return;
      }
      if (swapping === p) {
        p.classList.remove('swap');
        return;
      }
      // Swap all content and data attributes
      const attrs = ['data-score', 'data-name', 'data-current', 'data-peak'];
      const tempInner = swapping.innerHTML;
      swapping.innerHTML = p.innerHTML;
      p.innerHTML = tempInner;
      attrs.forEach((attr) => {
        const tmp = swapping.getAttribute(attr);
        swapping.setAttribute(attr, p.getAttribute(attr));
        p.setAttribute(attr, tmp);
      });
      swapping.classList.remove('swap');

      // Update totals
      resultRow.querySelectorAll('.team').forEach(recalcTotal);
    });
  });
};

// ── Copy to clipboard ─────────────────────────────────────────────────────────

const copyTeams = (container) => {
  let text = '';
  container.querySelectorAll('.team').forEach((teamEl, i) => {
    const total = teamEl.querySelector('.total-score').textContent;
    text += `[Team ${i + 1} - ${total}]\n`;
    teamEl.querySelectorAll('.player').forEach((p) => {
      text += `${p.dataset.name}  (${p.dataset.current || '?'} → ${p.dataset.peak || '?'})\n`;
    });
    text += '\n';
  });
  navigator.clipboard.writeText(text).then(() => {
    const msg = container.querySelector('.copy-message');
    if (msg) {
      msg.textContent = 'Copied to clipboard!';
      setTimeout(() => { msg.textContent = ''; }, 2000);
    }
  });
};

// ── Render ────────────────────────────────────────────────────────────────────

const renderTeams = (container, teams) => {
  const resultRow = container.querySelector('#result_row');
  resultRow.innerHTML = generateTeamHtml(teams.team1, 1) + vsHtml() + generateTeamHtml(teams.team2, 2);
  attachSwapHandlers(resultRow);
};

// ── Result shell HTML ─────────────────────────────────────────────────────────

const resultBodyHtml = () => `
<div class="container-fluid py-3 px-3" style="min-width: 300px;">
  <h5 class="text-white text-center mb-3">⚔ Teams</h5>
  <div id="result_row" class="row justify-content-between mb-0"></div>
  <div class="pt-3 pb-2 d-flex flex-column align-items-center gap-2">
    <div class="copy-message text-success small" style="min-height: 18px;"></div>
    <div class="d-flex gap-2">
      <button id="backBtn" class="btn btn-secondary btn-sm disabled" type="button">&lt;</button>
      <button id="rerollBtn" class="btn btn-primary px-4" type="button">
        <i class="fa fa-refresh me-1"></i>Reroll
      </button>
      <button id="nextBtn" class="btn btn-secondary btn-sm disabled" type="button">&gt;</button>
    </div>
    <div class="d-flex gap-2">
      <button id="copyBtn" class="btn btn-dark btn-sm" type="button">
        <i class="fa fa-clipboard me-1"></i>Copy
      </button>
      <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">
        Close
      </button>
    </div>
  </div>
</div>`;

// ── Public: called by team-config when modal opens ────────────────────────────

export const buildMatch = (container) => {
  loadCSS(`${window.hlx.codeBasePath}/blocks/match-result/match-result.css`);
  teamsHistory = [];
  historyIndex = 0;

  const stateRaw = window.localStorage.state;
  if (!stateRaw) return;

  const savedState = JSON.parse(stateRaw);

  // Attach computed level score to each player object
  const players = savedState.players.map((p) => ({
    ...p,
    level: computeLevel(p.currentTier, p.peakTier),
  }));

  container.innerHTML = resultBodyHtml();

  const backBtn = container.querySelector('#backBtn');
  const nextBtn = container.querySelector('#nextBtn');
  const rerollBtn = container.querySelector('#rerollBtn');
  const copyBtn = container.querySelector('#copyBtn');

  // Initial balance
  const teams = balanceTeams(players);
  teamsHistory.push(teams);
  renderTeams(container, teams);

  rerollBtn.addEventListener('click', () => {
    const newTeams = balanceTeams(players);
    teamsHistory.push(newTeams);
    historyIndex = teamsHistory.length - 1;
    renderTeams(container, newTeams);
    backBtn.classList.remove('disabled');
    nextBtn.classList.add('disabled');
  });

  backBtn.addEventListener('click', () => {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    renderTeams(container, teamsHistory[historyIndex]);
    nextBtn.classList.remove('disabled');
    if (historyIndex === 0) backBtn.classList.add('disabled');
  });

  nextBtn.addEventListener('click', () => {
    if (historyIndex >= teamsHistory.length - 1) return;
    historyIndex += 1;
    renderTeams(container, teamsHistory[historyIndex]);
    backBtn.classList.remove('disabled');
    if (historyIndex === teamsHistory.length - 1) nextBtn.classList.add('disabled');
  });

  copyBtn.addEventListener('click', () => copyTeams(container));
};

// ── AEM block entry point (not used directly — block is driven by team-config) ─

export default async function init(block) {
  block.style.display = 'none';
}
