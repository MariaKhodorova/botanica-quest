/* quest.js — общая логика для всех точек-растений */

const TOTAL_POINTS = 7;

/* ── localStorage helpers ── */
function getProgress() {
  try { return JSON.parse(localStorage.getItem('quest_progress') || '[]'); }
  catch { return []; }
}

function markDone(id) {
  const p = getProgress();
  if (!p.includes(id)) {
    p.push(id);
    localStorage.setItem('quest_progress', JSON.stringify(p));
  }
}

/* ── HUD ── */
function updateHUD(currentPoint) {
  const done = getProgress().length;
  document.getElementById('done-count').textContent = done;

  // dots
  const dotsEl = document.getElementById('dots');
  if (!dotsEl) return;
  dotsEl.innerHTML = '';
  for (let i = 1; i <= TOTAL_POINTS; i++) {
    const d = document.createElement('div');
    d.className = 'dot' +
      (getProgress().includes(i) ? ' done' : (i === currentPoint ? ' current' : ''));
    dotsEl.appendChild(d);
  }
}

/* ── AR scene logic ── */
function initPoint(cfg) {
  /*
    cfg = {
      pointId:      Number,   // 1–7
      targetIndex:  Number,   // 0–6
      correctAns:   Number,   // 1–4
      nextUrl:      String,
      plantName:    String,
      plantLatin:   String,
      plantEmoji:   String,
      hasVideo:     Boolean,
    }
  */

  const target      = document.getElementById('ar-target');
  const hint        = document.getElementById('hint');
  const factPanel   = document.getElementById('fact-panel');
  const quizPanel   = document.getElementById('quiz-panel');
  const stampPanel  = document.getElementById('stamp-panel');
  const resultMsg   = document.getElementById('result-msg');
  const placeholder = document.getElementById('placeholder');

  let answered = false;
  let alreadyDone = getProgress().includes(cfg.pointId);

  updateHUD(cfg.pointId);

  /* placeholder content */
  if (!cfg.hasVideo) {
    document.querySelector('#placeholder .ph-icon').textContent = cfg.plantEmoji;
    document.querySelector('#placeholder .ph-name').textContent = cfg.plantName;
    document.querySelector('#placeholder .ph-latin').textContent = cfg.plantLatin;
  }

  /* если точка уже пройдена — сразу показываем штамп */
  if (alreadyDone) {
    hint.style.opacity = '0';
    stampPanel.style.display = 'block';
  }

  /* ── targetFound ── */
  target.addEventListener('targetFound', () => {
    hint.style.opacity = '0';
    if (alreadyDone) return; // уже пройдено

    if (cfg.hasVideo) {
      const vid = document.getElementById('plant-video');
      vid.muted = false;
      vid.play().catch(() => { vid.muted = true; vid.play(); });
      vid.addEventListener('ended', showFact, { once: true });
    } else {
      placeholder.style.display = 'flex';
      setTimeout(showFact, 1800);
    }
  });

  /* ── targetLost ── */
  target.addEventListener('targetLost', () => {
    if (!alreadyDone) hint.style.opacity = '1';
    placeholder.style.display = 'none';
    if (cfg.hasVideo) {
      const vid = document.getElementById('plant-video');
      vid.pause();
    }
  });

  /* ── screens ── */
  function showFact() {
    placeholder.style.display = 'none';
    factPanel.style.display = 'block';
  }

  window.showQuiz = function () {
    factPanel.style.display = 'none';
    quizPanel.style.display = 'block';
  };

  window.checkAnswer = function (btn, num) {
    if (answered) return;
    answered = true;

    document.querySelectorAll('.btn-answer').forEach(b => b.setAttribute('disabled', ''));

    if (num === cfg.correctAns) {
      btn.classList.add('correct');
      btn.removeAttribute('disabled');
      resultMsg.className = 'ok';
      resultMsg.innerHTML = cfg.correctText;
      resultMsg.style.display = 'block';
      markDone(cfg.pointId);
      alreadyDone = true;
      updateHUD(cfg.pointId);
      setTimeout(() => {
        quizPanel.style.display = 'none';
        stampPanel.style.display = 'block';
      }, 1800);
    } else {
      btn.classList.add('wrong');
      btn.removeAttribute('disabled');
      resultMsg.className = 'fail';
      resultMsg.innerHTML = cfg.wrongText;
      resultMsg.style.display = 'block';
      setTimeout(() => {
        btn.classList.remove('wrong');
        document.querySelectorAll('.btn-answer').forEach(b => b.removeAttribute('disabled'));
        resultMsg.style.display = 'none';
        answered = false;
      }, 1200);
    }
  };

  window.goNext = function () {
    window.location.href = cfg.nextUrl;
  };
}
