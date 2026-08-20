import { defaultLevelMap, tierLabels } from '../../scripts/utils.js';

const defaultState = {
  players: [],
  numOfPlayers: 10,
};

let state = JSON.parse(JSON.stringify(defaultState));

// ── Persistence ──────────────────────────────────────────────────────────────

const saveState = () => {
  state.players = [];
  document.querySelectorAll('.participant-div').forEach((p) => {
    const name = p.querySelector('.input-participants').value;
    const currentTier = p.querySelector('.current-tier-select').value;
    const peakTier = p.querySelector('.peak-tier-select').value;
    state.players.push({ name, currentTier, peakTier });
  });
  window.localStorage.state = JSON.stringify(state);
};

// ── Validation ───────────────────────────────────────────────────────────────

const validateFindMatch = () => {
  const playerDivs = document.querySelectorAll('.participant-div');
  let allValid = playerDivs.length > 0;
  playerDivs.forEach((p) => {
    const name = p.querySelector('.input-participants').value.trim();
    const currentTier = p.querySelector('.current-tier-select').value;
    const peakTier = p.querySelector('.peak-tier-select').value;
    // name 필수 + 티어는 최소 하나 이상 설정되어야 함
    if (!name || (!currentTier && !peakTier)) allValid = false;
  });
  const btn = document.getElementById('find-match-btn');
  if (btn) btn.disabled = !allValid;
};

// ── Tier select HTML ─────────────────────────────────────────────────────────

const buildTierOptions = (selected = '') => [
  '<option value="">-- 선택 --</option>',
  ...Object.keys(defaultLevelMap).map(
    (k) => `<option value="${k}"${selected === k ? ' selected' : ''}>${k} · ${tierLabels[k]}</option>`,
  ),
].join('');

// ── Player row ────────────────────────────────────────────────────────────────

const getNewParticipant = (index, player = {}) => `
<div id="mix_players__${index}" class="participant-div row mb-2 align-items-center py-2 px-1">
  <div class="col-12 col-xl-4 mb-2 mb-xl-0">
    <input type="text"
      id="mix_players_${index}_name"
      class="form-control input-participants bg-dark text-white border-secondary"
      placeholder="Player ${index + 1}"
      value="${player.name || ''}"
      autocomplete="off">
  </div>
  <div class="col-6 col-xl-4 mb-2 mb-xl-0">
    <label class="text-white-50 small d-xl-none mb-1">현재 티어</label>
    <select class="form-select current-tier-select bg-dark text-white border-secondary"
      id="mix_players_${index}_current_tier">
      ${buildTierOptions(player.currentTier)}
    </select>
  </div>
  <div class="col-6 col-xl-4 mb-2 mb-xl-0">
    <label class="text-white-50 small d-xl-none mb-1">최고 티어</label>
    <select class="form-select peak-tier-select bg-dark text-white border-secondary"
      id="mix_players_${index}_peak_tier">
      ${buildTierOptions(player.peakTier)}
    </select>
  </div>
</div>`;

// ── Add / Remove player rows ──────────────────────────────────────────────────

const addPlayerRow = (index, player = {}) => {
  const container = document.getElementById('mix_players');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = getNewParticipant(index, player);
  container.append(wrapper);

  const currentTierSelect = wrapper.querySelector('.current-tier-select');
  const peakTierSelect = wrapper.querySelector('.peak-tier-select');
  const nameInput = wrapper.querySelector('.input-participants');

  // Req 6: current > peak → auto-bump peak up to current
  currentTierSelect.addEventListener('change', () => {
    const cv = currentTierSelect.value;
    const pv = peakTierSelect.value;
    if (cv && pv && defaultLevelMap[cv] > defaultLevelMap[pv]) {
      peakTierSelect.value = cv;
    }
    saveState();
    validateFindMatch();
  });

  // Req 6 (reverse): if user manually sets peak below current, reset to current
  peakTierSelect.addEventListener('change', () => {
    const cv = currentTierSelect.value;
    const pv = peakTierSelect.value;
    if (cv && pv && defaultLevelMap[pv] < defaultLevelMap[cv]) {
      peakTierSelect.value = cv;
    }
    saveState();
    validateFindMatch();
  });

  nameInput.addEventListener('input', () => {
    saveState();
    validateFindMatch();
  });
};

const removePlayerRow = (index) => {
  const el = document.getElementById(`mix_players__${index}`);
  if (el) el.parentElement.remove();
};

// ── Player count selector ────────────────────────────────────────────────────

const numParticipantsEvent = () => {
  const sel = document.getElementById('nb-participants');
  sel.value = state.numOfPlayers || 10;
  sel.addEventListener('change', () => {
    const current = document.querySelectorAll('.participant-div').length;
    const next = parseInt(sel.value, 10);
    if (current < next) {
      for (let i = current; i < next; i += 1) addPlayerRow(i);
    } else {
      for (let i = current - 1; i >= next; i -= 1) removePlayerRow(i);
    }
    state.numOfPlayers = next;
    saveState();
    validateFindMatch();
  });
};

// ── Clear all ────────────────────────────────────────────────────────────────

const clearAll = () => {
  document.getElementById('mix_players').innerHTML = '';
  state = JSON.parse(JSON.stringify(defaultState));
  window.localStorage.removeItem('state');
  // Re-init without restoring state
  const { numOfPlayers } = state;
  for (let i = 0; i < numOfPlayers; i += 1) addPlayerRow(i);
  document.getElementById('nb-participants').value = numOfPlayers;
  validateFindMatch();
};

// ── Init ─────────────────────────────────────────────────────────────────────

const initTeam = () => {
  // Restore from localStorage
  if (window.localStorage.state) {
    try {
      const saved = JSON.parse(window.localStorage.state);
      state = { ...defaultState, ...saved };
    } catch (e) {
      state = JSON.parse(JSON.stringify(defaultState));
    }
  }

  const { players, numOfPlayers } = state;
  if (players.length) {
    players.forEach((p, i) => addPlayerRow(i, p));
    // Sync nb-participants to restored count
    const sel = document.getElementById('nb-participants');
    if (sel) sel.value = players.length;
  } else {
    for (let i = 0; i < numOfPlayers; i += 1) addPlayerRow(i);
  }

  numParticipantsEvent();

  document.getElementById('clean-all')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearAll();
  });

  // Req 7: Find Match triggers modal; modal show event fires match-result rendering
  const modal = document.getElementById('matchResultModal');
  if (modal) {
    modal.addEventListener('show.bs.modal', () => {
      saveState();
      import('../match-result/match-result.js').then((mod) => {
        mod.buildMatch(modal.querySelector('#match-result-content'));
      });
    });
  }

  validateFindMatch();
};

// ── AEM block entry point ─────────────────────────────────────────────────────

export default async function init(block) {
  const configBody = document.createElement('div');
  configBody.innerHTML = teamConfigBody;
  block.prepend(configBody);

  // Move the doc's H1 into the site-header instead of hardcoded text
  const h1 = block.querySelector('h1');
  const headerTitle = configBody.querySelector('.site-header-title');
  if (h1 && headerTitle) {
    h1.classList.add('text-white', 'mb-0', 'fw-bold', 'fs-4');
    h1.style.display = 'block'; // override "main h1 { display: none }" in styles.css
    headerTitle.replaceWith(h1);
  }

  // Move modal to <body> — keeps it outside the block's stacking context
  // so Bootstrap's backdrop (z-index:1050) doesn't cover the modal (z-index:1055)
  const modal = configBody.querySelector('#matchResultModal');
  if (modal) document.body.append(modal);

  initTeam();
}

// ── Inline HTML template ──────────────────────────────────────────────────────

/* eslint-disable no-unused-vars */
const teamConfigBody = `
<div class="container-fluid px-0">
  <div class="site-header bg-dark-grey-opacity py-3">
    <div class="container d-flex justify-content-between align-items-center">
      <span class="site-header-title"></span>
    </div>
  </div>

  <div class="bg-grey-opacity">
    <div class="container pb-5 pt-3">

      <!-- General config row -->
      <div class="general-config row align-items-center py-3 mb-3 border-bottom border-secondary">
        <div class="col-12 d-flex gap-3 align-items-center flex-wrap">
          <select class="form-select form-select-sm w-auto bg-dark text-white border-secondary"
            id="nb-participants">
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="10" selected>10</option>
          </select>
          <label for="nb-participants" class="text-white mb-0">Participants</label>
          <button id="clean-all" class="btn btn-sm btn-outline-danger ms-auto" type="button">
            <i class="fa fa-trash me-1"></i>Clear All
          </button>
        </div>
      </div>

      <!-- Column headers (desktop only) -->
      <div class="row mb-1 px-1 d-none d-xl-flex">
        <div class="col-xl-4 text-white-50 small">Player Name</div>
        <div class="col-xl-4 text-white-50 small">현재 티어 (Current Tier)</div>
        <div class="col-xl-4 text-white-50 small">최고 티어 (Peak Tier)</div>
      </div>

      <!-- Player rows injected here -->
      <div id="mix_players"></div>

      <!-- Find Match button -->
      <div class="text-center mt-4">
        <button id="find-match-btn"
          class="btn btn-primary btn-lg px-5"
          type="button"
          disabled
          data-bs-toggle="modal"
          data-bs-target="#matchResultModal">
          Find Match
        </button>
      </div>

    </div>
  </div>
</div>

<!-- Match Result Modal -->
<div class="modal fade" id="matchResultModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"
    style="max-width: min(95vw, 900px);">
    <div class="modal-content border border-white border-2 rounded-4"
      style="background-color: #070e23ee;">
      <div class="modal-body p-0">
        <div id="match-result-content"></div>
      </div>
    </div>
  </div>
</div>
`;
