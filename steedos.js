/*
 * ╔══════════════════════════════════════════════════╗
 * ║         STEEDOS.JS — Personal OS v1.0          ║
 * ╚══════════════════════════════════════════════════╝
 *
 * Standalone JavaScript file for SteedOS.
 * To use: add <script src="steedos.js"></script> to the HTML.
 *
 * HOW THIS FILE IS ORGANIZED
 * ──────────────────────────
 * A. CONSTANTS & CONFIG   — card weights, session times
 * B. STATE                — S{} holds all live app data  
 * C. STORAGE              — localStorage read/write
 * D. UTILITIES            — tiny helpers
 * E. INIT                 — page load setup
 * F. CLOCK                — topbar + cover time
 * G. GREETING & COVER     — welcome, cover photo
 * H. AGE CLOCK            — live age display
 * I. QUARTER TRACKER      — quarterly progress
 * J. QUARTERLY GOALS
 * K. LIFE GOALS
 * L. TODAY'S GOALS        — 3pts write, 7pts complete
 * M. PRIMARY MOVE         — #1 objective card
 * N. METRICS              — outreach / connections / posts
 * O. SLEEP
 * P. WORKOUT CHIPS
 * Q. TIMELOG
 * R. NEGATIVITY JOURNAL
 * S. SESSIONS             — 4 daily check-in blocks
 * T. MOOD
 * U. SCORE                — calcScore(), recalc()
 * V. SUBMIT               — lock in the day
 * W. DAY SUMMARY
 * X. HISTORY & STREAKS
 * Y. SIDEBAR TOGGLE
 * Z. RESTORE FIELDS
 *    PLANNING MODE
 *    REFLECT (TYPEFORM)
 *    UI MODES             — Focus / Plan / Reflect
 *    REMINDERS
 *    MOMENTUM
 */

/*
 * ╔══════════════════════════════════════════════════╗
 * ║              STEEDOS — JAVASCRIPT               ║
 * ║         Personal Operating System v1.0         ║
 * ╚══════════════════════════════════════════════════╝
 *
 * HOW THIS FILE IS ORGANIZED
 * ──────────────────────────
 * A. CONSTANTS & CONFIG   — unchanging values, card weights, session definitions
 * B. STATE                — the single object (S) that holds all app data
 * C. STORAGE              — read/write to localStorage so data survives refresh
 * D. UTILITIES            — tiny helper functions used everywhere
 * E. INIT                 — runs once on page load, sets everything up
 * F. CLOCK                — live topbar time + cover photo time
 * G. GREETING & COVER     — welcome text, cover photo upload
 * H. AGE CLOCK            — live age display in sidebar
 * I. QUARTER TRACKER      — Q1/Q2/Q3/Q4 progress arc
 * J. QUARTERLY GOALS      — 3 goals per quarter
 * K. LIFE GOALS           — 4 big-picture goal cards
 * L. TODAY'S GOALS        — daily goal list (max 5, 3pts write + 7pts complete)
 * M. PRIMARY MOVE         — the #1 objective card
 * N. METRICS              — outreach / connections / posts counters
 * O. SLEEP                — wake + bed time logging
 * P. WORKOUT              — workout type chips
 * Q. TIMELOG              — focused work block entries
 * R. NEGATIVITY JOURNAL   — entries to clear your head
 * S. SESSIONS             — 4 daily check-in blocks (9AM / 12PM / 3PM / 7PM)
 * T. MOOD                 — mental state chip
 * U. SCORE                — calculates daily score, updates all displays
 * V. SUBMIT               — locks in the day, saves to history
 * W. DAY SUMMARY          — end-of-day recap card
 * X. HISTORY & STREAKS    — 30-day grid, streak counters
 * Y. SIDEBAR              — toggle open/closed
 * Z. RESTORE              — fills fields from saved state on load
 *    PLANNING MODE        — tomorrow's goals, blocks, workout
 *    TYPEFORM REFLECT     — sequential end-of-day questionnaire
 *    UI MODES             — Focus / Plan / Reflect switcher
 *    REMINDERS            — bell icon, timed alerts
 *    MOMENTUM             — sparkline + trend calculation
 */


// ══════════════════════════════════════════════════════
// SECTION A · CONSTANTS & CONFIG
// ══════════════════════════════════════════════════════
const BIRTH        = new Date('1999-07-01T00:00:00');
const DEFAULT_COVER= 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80&auto=format&fit=crop';

// Session definitions — 4 daily check-ins
const SESS_DEF = [
  { id:'s9',  time:'9 AM',  hour:9,  name:'Morning Set',     sub:'Outreach · LinkedIn · Content',      cards:['outreach','linkedin','posted']           },
  { id:'s12', time:'12 PM', hour:12, name:'Midday Check',    sub:'Client work · Music · Deep work',    cards:['client_value','music_move','deep_work']  },
  { id:'s3',  time:'3 PM',  hour:15, name:'Afternoon Pulse', sub:'Connections · Pipeline · Content',   cards:['connections','pipeline_move','content_review'] },
  { id:'s7',  time:'7 PM',  hour:19, name:'Evening Close',   sub:'Workout · Reflect · Plan tomorrow',  cards:['workout','reflection','planning']        },
];

// Card definitions — each check-in item
const CARDS = {
  outreach:      { p:'agency',  e:'📩', l:'Client outreach',       s:'Prospected, pitched, or followed up?',        w:22, q:'What kind of outreach?',       c:['Cold DM / email','Follow-up on proposal','Discovery call','LinkedIn prospect','Referral ask','Re-engaged old lead']          },
  linkedin:      { p:'content', e:'✍️', l:'LinkedIn move',          s:'Wrote, posted, or engaged strategically?',    w:12, q:'What did you do?',              c:['Published a post','Left strategic comments','Sent connections','Shared a story','Replied to comments','Wrote a draft']       },
  posted:        { p:'content', e:'🎬', l:'Posted content',         s:'Video, reel, or post went live?',             w:18, q:'What kind of content?',          c:['Short-form video','LinkedIn post','Instagram reel','Behind-the-scenes','AI / business take','Music content']                },
  client_value:  { p:'agency',  e:'⚙️', l:'Delivered client value', s:'Made progress on a STEED deliverable?',       w:14, q:'What did you build?',             c:['Automation build','Strategy deck','Client call','Workflow audit','Onboarding','Reporting / recap']                      },
  music_move:    { p:'music',   e:'🎵', l:'Music move',             s:'Wrote, recorded, promoted, or connected?',    w:12, q:'What music work?',               c:['Wrote lyrics','Recording session','Promoted a release','Connected with producer','Fan touchpoint','Social content']      },
  deep_work:     { p:'agency',  e:'🧠', l:'Deep work block',        s:'90+ min of uninterrupted focus?',             w:10, q:'What did you work on?',           c:['STEED systems','Content creation','Music project','Brand strategy','Research','Financial planning']                    },
  connections:   { p:'content', e:'🤝', l:'New connection',         s:'Met or messaged someone who moves things?',   w:8,  q:'What kind of connection?',        c:['Potential client','Collaborator','Mentor / advisor','Fellow founder','Media / press','Creative']                        },
  pipeline_move: { p:'agency',  e:'💼', l:'Pipeline move',          s:'Advanced a deal or proposal?',                w:10, q:'What stage?',                    c:['Sent proposal','Followed up','Negotiated','Closed deal','Scheduled demo','Updated CRM']                                 },
  content_review:{ p:'content', e:'📊', l:'Content audit',          s:'Reviewed analytics or refined strategy?',     w:6,  q:'What did you analyze?',           c:['LinkedIn analytics','IG insights','Content repurposing','Competitor research','Captions','Distribution']               },
  workout:       { p:'health',  e:'🏋️', l:'Worked out',             s:'Did you train today?',                        w:10, q:'What was your workout?',          c:['Weights','Cardio','Yoga / mobility','Basketball','Walk / run','Sport / rec']                                          },
  reflection:    { p:'health',  e:'🪞', l:'Reflected on the day',   s:'Took stock of what worked and what didn\'t?', w:5,  q:'How did you reflect?',            c:['Journaled','Voice memo','Mental review','Talked to someone','Gratitude','Planned tomorrow']                          },
  planning:      { p:'agency',  e:'📋', l:'Planned tomorrow',        s:'Intentional plan for the next day?',          w:3,  q:'What did you plan?',              c:['Top 3 priorities','Blocked calendar','STEED tasks','Content schedule','Reviewed goals','Set wake time']               },
};

// Score weights (primary = 30pts, rest distributed here)
const W = { outreach:16, linkedin:8, posted:14, client_value:10, music_move:10, deep_work:8, connections:6, content_review:4, pipeline_move:8, workout:8, reflection:3, planning:3 };
const PRIMARY_PTS = 30;

// Life goals — 4 static goals with editable text + why
const LIFE_GOALS_DEF = [
  { id:'lg1', icon:'🏗️', title:'Build a brand.',                             sub:'STEED · Personal brand · Content empire',           why:'' },
  { id:'lg2', icon:'💰', title:'Make more money.',                           sub:'Revenue, assets, financial freedom',                 why:'' },
  { id:'lg3', icon:'🚀', title:'Expand your business, SuperDope.',           sub:'Scale the vision beyond agency work',                why:'' },
  { id:'lg4', icon:'🎙️', title:'Be an authority voice in tech, capital & culture.', sub:'Packy × Trapital × your own lane',          why:'' },
];

const BRIEFS = {
  high:["Three pillars moving simultaneously is rare. Most optimize one and quietly neglect the other two. You're building all three at 25. That's the bet.","Outreach + content + health on the same day is how you compound. Note what made today possible. Replicate the conditions.","STEED doesn't grow from thinking. Days like this are the actual work. Protect tomorrow morning — it starts tonight."],
  mid:["Which pillar got ignored today — agency, content, or music? Name it. The avoidance always has a reason worth understanding.","Partial days are data. The pattern of what you skip is more revealing than what you complete.","You're building three things simultaneously. Aggressive and correct. But every pillar needs a daily touch."],
  low:["Low days aren't failure — they're diagnostic. What broke down: energy, no clear plan, or avoidance?","High upside at 25 only converts through daily, logged action. Write down one thing different tomorrow. One.","The gap between who you are and who you're building toward closes only through repeated daily action. Reset tonight."],
};

// ─────────────────────────────────────────────────────
// SECTION B: STATE
// Everything SteedOS knows about you today
// ─────────────────────────────────────────────────────
let S = {
  // Daily tracking
  cards: {},           // check-in answers (yes/no + details)
  cardCounts: {},      // "how many?" answers per card
  mood: null,          // mental state
  intention: '',       // morning intention
  win: '',             // biggest win
  avoid: '',           // what you avoided
  primaryMove: '',     // #1 objective
  primaryShipped: null,// yes/no did it ship

  // Sessions
  sessions: {},        // objectives + locked state per session
  submitted: false,    // has day been submitted?

  // Time logging
  timelogEntries: [],  // [{id, time, note}]
  negEntries: [],      // [{id, time, note}] negativity journal

  // Sleep
  wakeTime: '',
  bedTime: '',

  // Activity metrics
  jobsApplied: 0,
  newConnections: 0,
  postsMade: 0,

  // Learning
  learn1: '', learn2: '', learn3: '',

  // Workout
  workoutGoal: '',
  workoutTarget: '',
  workoutTypes: [],    // selected type chips

  // Persistent (survive day reset)
  goals: [],           // today's goals [{id, text, done}]
  history: [],         // 30-day log
  streaks: { workout:0, content:0, outreach:0, music:0 },
  ageStyle: 'dec',
  coverUrl: '',
  avatarUrl: '',
  sidebarOpen: true,
  lifeGoals: JSON.parse(JSON.stringify(LIFE_GOALS_DEF)), // editable copy
  qGoals: ['', '', ''],   // quarterly goals (3 max)
  collapsedSections: {},    // which sections are collapsed
  reminders: [],
  notes: '',
  dailyCommand: '',  // topbar directive line
  uiMode: 'focus',   // 'focus' | 'planning' | 'reflection'
};

// Which life goal modal is open
let activeLgIdx = null;

// ══════════════════════════════════════════════════════
// SECTION C · STORAGE
// ──────────────────────────────────────────────────────
// Data flows in two layers:
//   1. localStorage  — instant, works offline, survives refresh
//   2. Upstash Redis — syncs to the server so data is available
//                      on any device (phone, laptop, etc.)
//
// Strategy: always write to localStorage immediately (fast),
// then fire-and-forget a save to the server in the background.
// On load: try server first, fall back to localStorage.
// ══════════════════════════════════════════════════════

// The single user ID — change this if you add auth later
const USER_ID = 'nik';

// ── Build the data object we save ──────────────────────
function buildSavePayload() {
  return {
    history:           S.history,
    streaks:           S.streaks,
    goals:             S.goals,
    ageStyle:          S.ageStyle,
    coverUrl:          S.coverUrl,
    avatarUrl:         S.avatarUrl,
    sidebarOpen:       S.sidebarOpen,
    lifeGoals:         S.lifeGoals,
    qGoals:            S.qGoals,
    collapsedSections: S.collapsedSections || {},
    reminders:         S.reminders || [],
    notes:             S.notes || '',
    dailyCommand:      S.dailyCommand || '',
    uiMode:            S.uiMode || 'focus',
  };
}

// ── Apply loaded data back into state ──────────────────
function applyLoadedData(d) {
  if (!d) return;
  S.history           = d.history     || [];
  S.streaks           = d.streaks     || { workout:0, content:0, outreach:0, music:0 };
  S.goals             = d.goals       || [];
  S.ageStyle          = d.ageStyle    || 'dec';
  S.coverUrl          = d.coverUrl    || '';
  S.avatarUrl         = d.avatarUrl   || '';
  S.sidebarOpen       = d.sidebarOpen !== undefined ? d.sidebarOpen : true;
  S.lifeGoals         = d.lifeGoals   || JSON.parse(JSON.stringify(LIFE_GOALS_DEF));
  S.qGoals            = d.qGoals      || ['', '', ''];
  S.collapsedSections = d.collapsedSections || {};
  S.reminders         = d.reminders   || [];
  S.notes             = d.notes       || '';
  S.dailyCommand      = d.dailyCommand || '';
  S.uiMode            = d.uiMode      || 'focus';
  // Restore today if it was already logged
  const todayEntry = S.history.find(h => h.date === todayStr());
  if (todayEntry) restoreTodayFromHistory(todayEntry);
}

// ── SAVE — writes to localStorage instantly, then syncs to server ──
function saveToStorage() {
  const payload = buildSavePayload();

  // 1. Write to localStorage immediately — never fails, always fast
  try {
    localStorage.setItem('steedOS_v3', JSON.stringify(payload));
  } catch(e) {
    console.warn('localStorage save failed:', e);
  }

  // 2. Sync to Upstash in the background — fire and forget
  // If this fails (offline, server error), localStorage still has the data
  fetch('/api/save', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ userId: USER_ID, data: payload }),
  }).catch(err => console.warn('Server sync failed (offline?):', err));
}

// ── LOAD — tries server first, falls back to localStorage ──
async function loadFromStorage() {
  // Try loading from the server first (cross-device sync)
  try {
    const res  = await fetch(`/api/load?userId=${USER_ID}`);
    const json = await res.json();
    if (json.data) {
      applyLoadedData(json.data);
      // Mirror server data to localStorage for offline use
      localStorage.setItem('steedOS_v3', JSON.stringify(json.data));
      return; // loaded from server — done
    }
  } catch(err) {
    console.warn('Server load failed, falling back to localStorage:', err);
  }

  // Fall back to localStorage (works offline or if server has no data yet)
  try {
    const raw = localStorage.getItem('steedOS_v3');
    if (raw) applyLoadedData(JSON.parse(raw));
  } catch(e) {
    console.warn('localStorage load failed:', e);
  }
}

function restoreTodayFromHistory(t) {
  S.cards         = t.cards         || {};
  S.cardCounts    = t.cardCounts    || {};
  S.mood          = t.mood          || null;
  S.intention     = t.intention     || '';
  S.win           = t.win           || '';
  S.avoid         = t.avoid         || '';
  S.primaryMove   = t.primaryMove   || '';
  S.primaryShipped= t.primaryShipped ?? null;
  S.sessions      = t.sessions      || {};
  S.submitted     = true;
  S.wakeTime      = t.wakeTime      || '';
  S.bedTime       = t.bedTime       || '';
  S.jobsApplied   = t.jobsApplied   || 0;
  S.newConnections= t.newConnections|| 0;
  S.postsMade     = t.postsMade     || 0;
  S.learn1        = t.learn1        || '';
  S.learn2        = t.learn2        || '';
  S.learn3        = t.learn3        || '';
  S.workoutGoal   = t.workoutGoal   || '';
  S.workoutTarget = t.workoutTarget || '';
  S.workoutTypes  = t.workoutTypes  || [];
  S.timelogEntries= t.timelogEntries|| [];
  S.negEntries    = t.negEntries    || [];
}


// ══════════════════════════════════════════════════════
// SECTION D · UTILITIES
// ══════════════════════════════════════════════════════
function todayStr()  { return new Date().toISOString().split('T')[0]; }
function esc(s)      { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function uid()       { return 'x' + Date.now() + Math.random().toString(36).slice(2,6); }
function fmtTime(t)  { if(!t)return''; const[h,m]=t.split(':').map(Number),ap=h>=12?'PM':'AM',hr=h%12||12; return`${hr}:${String(m).padStart(2,'0')} ${ap}`; }
function gradeFor(s) { if(s>=90)return'A+'; if(s>=80)return'A'; if(s>=70)return'B+'; if(s>=60)return'B'; if(s>=50)return'C+'; if(s>=40)return'C'; return'D'; }


// ══════════════════════════════════════════════════════
// SECTION E · INIT — runs once on page load
// ══════════════════════════════════════════════════════
async function init() {
  // Load saved data first (from server or localStorage) before rendering anything
  await loadFromStorage();
  startClock();
  startAge();
  renderGreeting();
  renderCover();
  renderLifeGrid();
  renderSbLifeGoals();
  renderGoals();
  renderSbGoals();
  renderSessions();
  renderSbSessions();
  renderHistory();
  renderStreaks();
  renderQuarter();
  renderSbQuarter();
  renderQGoalsSidebar();
  renderTimelogEntries();
  renderNegEntries();
  recalc();
  restoreFieldValues();
  applySidebar();
  restoreCollapsed();
  checkDaySummary();
  updateSectionBadges();
  // Auto-check 9pm for day summary popup
  setInterval(checkDaySummary, 30000);
  // Sleep button context
  updateSleepBtn();
  setInterval(updateSleepBtn, 60000);
  // Reminders
  updateReminderBadge();
  updateWidgets();
  setInterval(checkReminderAlerts, 60000);
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission().catch(()=>{});
  }
  // Notes
  const notesTa = document.getElementById('sbNotesTa');
  if (notesTa) {
    notesTa.value = S.notes || '';
    updateNotesMeta();
  }
  // Daily command line
  const cmdEl = document.getElementById('tbCommand');
  if (cmdEl && S.dailyCommand) cmdEl.value = S.dailyCommand;
  // Restore UI mode
  setMode(S.uiMode || 'focus', true);
  // If restoring reflection mode, init typeform after DOM is ready
  if ((S.uiMode || 'focus') === 'reflection') {
    setTimeout(initTypeform, 150);
  }
  // Session stub
  updateSessionStub();
  setInterval(updateSessionStub, 60000);
  // Sparkline + momentum
  renderSparkline();
  updateMomentum();
  // Daily command line restore
  restoreDailyCommand();
}


// ══════════════════════════════════════════════════════
// SECTION F · TOPBAR CLOCK + CHECK-IN INFO
// ══════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────
// FLIP CLOCK
// Tracks what each card is currently showing.
// Only flips a card when its digit actually changes.
// ─────────────────────────────────────────────────────
const flipState = { h1: null, h2: null, m1: null, m2: null, s1: null, s2: null };

function startClock() {
  tickClock();
  setInterval(tickClock, 1000);
}

function tickClock() {
  const now  = new Date();
  let   hour = now.getHours();
  const min  = now.getMinutes();
  const sec  = now.getSeconds();

  // Convert to 12-hour format (1–12)
  if (hour === 0)       hour = 12;
  else if (hour > 12)  hour = hour - 12;

  // Break each value into two digits (e.g. 12 → '1' and '2')
  const digits = {
    h1: String(Math.floor(hour / 10)),
    h2: String(hour % 10),
    m1: String(Math.floor(min  / 10)),
    m2: String(min  % 10),
    s1: String(Math.floor(sec  / 10)),
    s2: String(sec  % 10),
  };

  // Flip only the cards whose digit changed this second
  Object.keys(digits).forEach(key => {
    if (digits[key] !== flipState[key]) {
      flipDigit('fc-' + key, flipState[key] ?? digits[key], digits[key]);
      flipState[key] = digits[key];
    }
  });

  // Update the visible clock display
  const clockEl = document.getElementById('tbClockDisplay');
  if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: true });
  // Keep hidden legacy elements updated (other functions read tbTime/tbDate)
  const timeEl = document.getElementById('tbTime');
  if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const dateEl = document.getElementById('tbDate');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  // Cover photo datetime
  const coverTime = document.getElementById('coverDtTime');
  if (coverTime) coverTime.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  const coverDate = document.getElementById('coverDtDate');
  if (coverDate) coverDate.textContent = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });

  updateCheckinInfo(now);
}

// Animate one flip card from the old digit to the new digit.
// The illusion: old digit sits on the top half, new digit is revealed
// on the bottom half as the card flips down — just like a real departure board.
function flipDigit(cardId, oldDigit, newDigit) {
  const topSpan = document.getElementById(cardId + '-top');   // static top half
  const botSpan = document.getElementById(cardId + '-bot');   // static bottom half
  const flap    = document.getElementById(cardId + '-flap');  // animated card
  const foldSpan = document.getElementById(cardId + '-fold'); // flap top (shows old)
  const revSpan  = document.getElementById(cardId + '-rev');  // flap bottom (shows new)

  if (!topSpan || !botSpan || !flap || !foldSpan || !revSpan) return;

  // Set the flap: old digit on top half, new digit on bottom half
  foldSpan.textContent = oldDigit;
  revSpan.textContent  = newDigit;

  // Immediately update the static halves to the new digit
  // (they'll be hidden during the flip, then revealed after)
  topSpan.textContent = newDigit;
  botSpan.textContent = newDigit;

  // Kick off the flip animation
  flap.classList.remove('is-flipping');
  void flap.offsetWidth;  // force browser to reset the animation
  flap.classList.add('is-flipping');

  // Clean up when done
  setTimeout(() => flap.classList.remove('is-flipping'), 320);
}

function updateCheckinInfo(n) {
  const h = n.getHours(), m = n.getMinutes();
  const times = [{ h:9 }, { h:12 }, { h:15 }, { h:19 }];
  let next = null;
  for (const t of times) { if (h < t.h || (h === t.h && m === 0)) { next = t; break; } }

  const curr = SESS_DEF.slice().reverse().find(s => h >= s.hour);
  let blockTxt = '';
  if (curr) {
    const done = curr.cards.filter(id => S.cards[id]?.val === true).length;
    blockTxt = `${done}/${curr.cards.length} this block`;
  }

  let nextTxt = '';
  if (!next) { nextTxt = 'All check-ins done'; }
  else {
    const ml = (next.h * 60) - (h * 60 + m);
    const hrs = Math.floor(ml / 60), mins = ml % 60;
    nextTxt = (hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`) + ' until next check-in';
  }

  const ci = document.getElementById('tbCheckinInfo');
  if (ci) ci.innerHTML = `<strong>${nextTxt}</strong>${blockTxt ? ' &nbsp;·&nbsp; ' + blockTxt : ''}`;
}


// ══════════════════════════════════════════════════════
// SECTION G · GREETING + COVER
// ══════════════════════════════════════════════════════
function renderGreeting() {
  const now  = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Cover greeting
  const coverEl = document.getElementById('coverName');
  if (coverEl) coverEl.innerHTML = `${greeting}, <em>Nik.</em>`;

  // Date under SteedOS wordmark in the top header (e.g. "Sunday, March 1")
  const dateEl = document.getElementById('tbTodayDate');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }
}

function renderCover() {
  if (S.coverUrl) document.getElementById('coverImg').src = S.coverUrl;
}

function loadCover(inp) {
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => { document.getElementById('coverImg').src = e.target.result; S.coverUrl = e.target.result; saveToStorage(); };
  r.readAsDataURL(f);
}

function resetCover() {
  document.getElementById('coverImg').src = DEFAULT_COVER;
  S.coverUrl = ''; saveToStorage();
}


// ══════════════════════════════════════════════════════
// SECTION H · AGE CLOCK
// ══════════════════════════════════════════════════════
function startAge() {
  document.querySelectorAll('.age-sty-btn').forEach(b => {
    b.classList.toggle('on', b.getAttribute('onclick').includes(`'${S.ageStyle}'`));
  });
  renderAge(); setInterval(renderAge, 1000);
}

function getAge() {
  const n = new Date(), ms = n - BIRTH, yr = ms / (1000*60*60*24*365.25);
  const fy = Math.floor(yr);
  const nb = new Date(BIRTH); nb.setFullYear(n.getFullYear());
  if (nb <= n) nb.setFullYear(n.getFullYear() + 1);
  const mu = nb - n;
  const dU = Math.floor(mu/864e5), hU = Math.floor((mu%864e5)/36e5);
  const mU = Math.floor((mu%36e5)/6e4), sU = Math.floor((mu%6e4)/1e3);
  const jan = new Date(n.getFullYear(),0,1), dec = new Date(n.getFullYear(),11,31,23,59,59);
  const yrP = ((n-jan)/(dec-jan))*100;
  const q1E = new Date(2026,2,31,23,59,59), q1S = new Date(2026,0,1);
  const q1P = n > q1E ? 100 : n < q1S ? 0 : ((n-q1S)/(q1E-q1S))*100;
  return { fy, yr, dec:yr.toFixed(9), dU, hU, mU, sU, lp:(yr/85)*100, yrP, q1P };
}

function renderAge() {
  const d = getAge();
  const numEl = document.getElementById('sbAgeNum');
  if (numEl) numEl.textContent = d.fy;
  const el = document.getElementById('ageDsp'); if (!el) return;
  switch (S.ageStyle) {
    case 'dec':
      el.innerHTML = `<div class="age-mono">${d.dec}</div>`; break;
    case 'bar':
      el.innerHTML = `<div class="age-bar-lbl">Life progress (85yr)</div>
        <div class="age-bar-t"><div class="age-bar-f" style="width:${Math.min(d.lp,100).toFixed(3)}%"></div></div>
        <div class="age-bar-pct">${d.lp.toFixed(4)}% lived</div>`; break;
    case 'cd':
      el.innerHTML = `<div class="age-cd">
        <div class="age-cd-c"><div class="age-cd-n">${d.dU}</div><div class="age-cd-l">Days</div></div>
        <div class="age-cd-c"><div class="age-cd-n">${String(d.hU).padStart(2,'0')}</div><div class="age-cd-l">Hrs</div></div>
        <div class="age-cd-c"><div class="age-cd-n">${String(d.mU).padStart(2,'0')}</div><div class="age-cd-l">Min</div></div>
        <div class="age-cd-c"><div class="age-cd-n">${String(d.sU).padStart(2,'0')}</div><div class="age-cd-l">Sec</div></div>
      </div><div style="font-size:9px;color:var(--muted);margin-top:5px;">until next birthday</div>`; break;
    case 'yr':
      el.innerHTML = `<div class="age-yr-row">
        <div class="age-yr-c"><div class="age-yr-p">${d.yrP.toFixed(1)}%</div><div class="age-yr-s">2026</div><div class="age-yr-t"><div class="age-yr-f" style="width:${d.yrP.toFixed(1)}%"></div></div></div>
        <div class="age-yr-c"><div class="age-yr-p">${d.q1P.toFixed(1)}%</div><div class="age-yr-s">Q1</div><div class="age-yr-t"><div class="age-yr-f" style="width:${d.q1P.toFixed(1)}%"></div></div></div>
      </div>`; break;
    case 'pulse':
      el.innerHTML = `<div class="age-pulse"><div class="age-pulse-dot"></div><div class="age-pulse-txt">${d.yr.toFixed(7)} years alive</div></div>`; break;
  }
}

function setAgeStyle(s, btn) {
  S.ageStyle = s; saveToStorage();
  document.querySelectorAll('.age-sty-btn').forEach(b => b.classList.toggle('on', b.getAttribute('onclick').includes(`'${s}'`)));
  renderAge();
}


// ══════════════════════════════════════════════════════
// SECTION I · QUARTER TRACKER
// ══════════════════════════════════════════════════════
function getQuarterData() {
  const now = new Date();
  const y = now.getFullYear();
  // Quarter boundaries for 2026
  const quarters = [
    { name:'Q1', start: new Date(y,0,1),  end: new Date(y,2,31,23,59,59)  },
    { name:'Q2', start: new Date(y,3,1),  end: new Date(y,5,30,23,59,59)  },
    { name:'Q3', start: new Date(y,6,1),  end: new Date(y,8,30,23,59,59)  },
    { name:'Q4', start: new Date(y,9,1),  end: new Date(y,11,31,23,59,59) },
  ];
  const q = quarters.find(q => now >= q.start && now <= q.end) || quarters[0];
  const total   = q.end - q.start;
  const elapsed = now - q.start;
  const pct     = Math.min(100, Math.round((elapsed / total) * 100));
  const daysLeft = Math.ceil((q.end - now) / 864e5);
  const daysGone = Math.floor(elapsed / 864e5);
  const weeksLeft = Math.ceil(daysLeft / 7);
  // Year progress
  const jan = new Date(y,0,1), dec = new Date(y,11,31,23,59,59);
  const yrPct = Math.round(((now-jan)/(dec-jan))*100);
  return { name:q.name, pct, daysLeft, daysGone, weeksLeft, yrPct };
}

function renderQuarter() {
  const d = getQuarterData();
  const setEl = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  setEl('qMainTitle', d.name + ' 2026');
  setEl('qMainBadge', d.daysLeft + ' days left');
  setEl('qPctBig',    d.pct + '%');
  setEl('qSubLabel',  'of ' + d.name + ' complete');
  setEl('qDaysLeft',  d.daysLeft);
  setEl('qWeeksLeft', d.weeksLeft);
  // Compact bar fill
  const fill = document.getElementById('qBarFill');
  if (fill) fill.style.width = d.pct + '%';
  // Mini arc — circumference = 2π×15 ≈ 94.2
  const circ = 94.2;
  const offset = circ - (circ * d.pct / 100);
  const arc = document.getElementById('qMiniArc');
  if (arc) arc.style.strokeDashoffset = offset;
}

function toggleQGoals() {
  const panel = document.getElementById('qGoalsPanel');
  const btn   = document.getElementById('qGoalsToggle');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none' && panel.style.display !== '';
  if (isOpen) {
    panel.style.display = 'none';
    if (btn) btn.classList.remove('open');
  } else {
    panel.style.display = '';
    if (btn) btn.classList.add('open');
  }
}

function renderSbQuarter() {
  const d = getQuarterData();
  const setEl = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  setEl('sbQLabel',    d.name + ' 2026');
  setEl('sbQDays',     d.daysLeft + ' days left');
  setEl('sbQPct',      d.pct + '%');
  setEl('sbQDaysLeft', d.daysLeft + ' days remaining');
  // Sidebar mini arc — circ = 2π×22 ≈ 138.2
  const circ = 138.2;
  const offset = circ - (circ * d.pct / 100);
  const arc = document.getElementById('sbPizzaArc');
  if (arc) arc.style.strokeDashoffset = offset;
}


// ══════════════════════════════════════════════════════
// SECTION J · QUARTERLY GOALS
// ══════════════════════════════════════════════════════
function renderQGoalsSidebar() {
  const wrap = document.getElementById('sbQGoals'); if (!wrap) return;
  wrap.innerHTML = '';
  S.qGoals.forEach((g, i) => {
    const div = document.createElement('div'); div.className = 'sb-qgoal';
    div.innerHTML = `<div class="sb-qgoal-num">0${i+1}</div><div>${esc(g) || '<span style="color:#ccc;font-style:italic;">Not set yet</span>'}</div>`;
    wrap.appendChild(div);
  });
}

function wireQGoals() {
  [1,2,3].forEach(n => {
    const el = document.getElementById('qGoal' + n);
    if (!el) return;
    el.value = S.qGoals[n-1] || '';
    el.addEventListener('input', () => { S.qGoals[n-1] = el.value; saveToStorage(); renderQGoalsSidebar(); });
  });
}


// ══════════════════════════════════════════════════════
// SECTION K · LIFE GOALS (expandable cards)
// ══════════════════════════════════════════════════════
function renderLifeGrid() {
  const grid = document.getElementById('lifeGrid'); if (!grid) return;
  grid.innerHTML = '';
  S.lifeGoals.forEach((lg, i) => {
    const card = document.createElement('div'); card.className = 'lgm';
    card.innerHTML = `
      <div class="lgm-icon">${lg.icon}</div>
      <div class="lgm-title-wrap">
        <textarea class="lgm-title-inp" id="lgTitle${i}" rows="2" placeholder="Life goal title…"
          onclick="event.stopPropagation()"
          onchange="updateLgTitle(${i},this.value)"
          oninput="updateLgTitle(${i},this.value)"
        >${esc(lg.title)}</textarea>
        <div class="lgm-expand-hint" title="Click to expand">↗</div>
      </div>
      <div class="lgm-sub">${esc(lg.sub)}</div>
    `;
    card.addEventListener('click', e => {
      if (e.target.classList.contains('lgm-title-inp')) return;
      openLgModal(i);
    });
    grid.appendChild(card);
  });
}

function renderSbLifeGoals() {
  const list = document.getElementById('sbLifeGoals'); if (!list) return;
  list.innerHTML = '';
  S.lifeGoals.forEach(lg => {
    const item = document.createElement('div'); item.className = 'sb-life-item';
    item.innerHTML = `<span class="sb-life-icon">${lg.icon}</span>${esc(lg.title)}`;
    list.appendChild(item);
  });
}

function updateLgTitle(i, v) {
  S.lifeGoals[i].title = v;
  saveToStorage(); renderSbLifeGoals();
}

// Life goal modal
function openLgModal(i) {
  activeLgIdx = i;
  const lg = S.lifeGoals[i];
  document.getElementById('lgModalIcon').textContent  = lg.icon;
  document.getElementById('lgModalTitle').value       = lg.title;
  document.getElementById('lgModalSubEl').textContent = lg.sub;
  document.getElementById('lgModalWhy').value         = lg.why || '';
  document.getElementById('lgModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('lgModalWhy').focus(), 200);
}

function closeLgModal(e) {
  if (e && e.target !== document.getElementById('lgModalOverlay')) return;
  document.getElementById('lgModalOverlay').classList.remove('open');
}

function closeLgModalBtn() {
  document.getElementById('lgModalOverlay').classList.remove('open');
}

function saveLgModal() {
  if (activeLgIdx === null) return;
  S.lifeGoals[activeLgIdx].title = document.getElementById('lgModalTitle').value;
  S.lifeGoals[activeLgIdx].why   = document.getElementById('lgModalWhy').value;
  saveToStorage(); renderLifeGrid(); renderSbLifeGoals();
  document.getElementById('lgModalOverlay').classList.remove('open');
}


// ══════════════════════════════════════════════════════
// SECTION L · TODAY'S GOALS (max 5)
// ══════════════════════════════════════════════════════
function addGoal() {
  if (S.goals.length >= 5) return;
  const id = uid(); S.goals.push({ id, text:'', done:false });
  saveToStorage(); renderGoals(); renderSbGoals();
  setTimeout(() => { const el = document.getElementById('gi-' + id); if (el) el.focus(); }, 40);
}

function toggleGoal(id) {
  if (S.submitted) return;
  const g = S.goals.find(x => x.id === id);
  if (g) {
    g.done = !g.done;
    saveToStorage(); renderGoals(); renderSbGoals(); recalc();
    if (S.goals.length > 0 && S.goals.every(x => x.done)) {
      doFlash('flash-goals'); showBadge('check-goals');
    }
  }
}

function deleteGoal(id) {
  S.goals = S.goals.filter(x => x.id !== id);
  saveToStorage(); renderGoals(); renderSbGoals();
}

function updateGoalText(id, v) {
  const g = S.goals.find(x => x.id === id);
  if (g) { g.text = v; saveToStorage(); renderSbGoals(); recalc(); }  // typing a goal earns 3pts
}

function renderGoals() {
  const list = document.getElementById('goalsList');
  const empty = document.getElementById('goalsEmpty');
  const limitTxt = document.getElementById('goalsLimitTxt');
  const addBtn = document.getElementById('goalsAddBtn');
  if (!list) return;
  list.innerHTML = '';
  if (limitTxt) limitTxt.textContent = `${S.goals.length} / 5`;
  if (addBtn) addBtn.style.display = S.goals.length >= 5 ? 'none' : '';
  if (!S.goals.length) { if(empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  S.goals.forEach(g => {
    const row = document.createElement('div'); row.className = 'goal-row';
    row.innerHTML = `
      <div class="goal-cb${g.done?' on':''}" onclick="toggleGoal('${g.id}')">${g.done?'✓':''}</div>
      <input class="goal-inp${g.done?' done':''}" id="gi-${g.id}"
        value="${esc(g.text)}" placeholder="What's the goal?"
        onchange="updateGoalText('${g.id}',this.value)"
        oninput="updateGoalText('${g.id}',this.value)"
        ${S.submitted?'disabled':''}/>
      <button class="goal-del" onclick="deleteGoal('${g.id}')" ${S.submitted?'disabled':''}>×</button>
    `;
    list.appendChild(row);
  });
}

function renderSbGoals() {
  const list = document.getElementById('sbTGoals'); if (!list) return;
  list.innerHTML = '';
  if (!S.goals.length) { list.innerHTML = '<div style="font-size:10px;color:#ccc;font-style:italic;">No goals yet.</div>'; return; }
  S.goals.forEach(g => {
    const item = document.createElement('div'); item.className = 'sb-tgoal' + (g.done?' done':'');
    item.innerHTML = `<div class="sb-tgoal-cb${g.done?' on':''}" onclick="toggleGoal('${g.id}')">${g.done?'✓':''}</div><span>${esc(g.text)||'—'}</span>`;
    list.appendChild(item);
  });
}


// ══════════════════════════════════════════════════════
// SECTION M · PRIMARY MOVE
// ══════════════════════════════════════════════════════
function setPrimaryShipped(v) {
  if (S.submitted) return;
  S.primaryShipped = v; applyPrimaryUI(v);
  if (v === true) { doFlash('flash-primary'); showBadge('check-primary'); }
  recalc();
}

function applyPrimaryUI(v) {
  const y = document.getElementById('pmYes'), n = document.getElementById('pmNo');
  if (y) y.className = 'pm-btn' + (v===true ? ' active-yes' : ' yes');
  if (n) n.className = 'pm-btn' + (v===false? ' active-no'  : ' no');
  const dot = document.getElementById('sbPDot'), lbl = document.getElementById('sbPLbl');
  if (dot) dot.className = 'sb-p-dot' + (v===true?' shipped':v===false?' missed':'');
  if (lbl) lbl.textContent = v===true ? 'Shipped ✓' : v===false ? 'Not shipped' : 'Pending';
}

function updateSbPrimary() {
  const el = document.getElementById('sbPrimaryTxt');
  if (el) el.textContent = S.primaryMove || 'Not set yet.';
}


// ══════════════════════════════════════════════════════
// SECTION N · METRICS (Jobs / Connections / Posts)
// ══════════════════════════════════════════════════════
function syncMetrics() {
  const ja = parseInt(document.getElementById('jobsAppliedInp')?.value||0)||0;
  const nc = parseInt(document.getElementById('newConnectionsInp')?.value||0)||0;
  const pm = parseInt(document.getElementById('postsMadeInp')?.value||0)||0;
  if (ja + nc + pm > 0) { doFlash('flash-metrics'); showBadge('check-metrics'); }
  S.jobsApplied = ja; S.newConnections = nc; S.postsMade = pm;
  // Mirror to sidebar
  const sj = document.getElementById('sbJobsApplied');  if(sj) sj.value = ja||'';
  const sc = document.getElementById('sbConnections');   if(sc) sc.value = nc||'';
  const sp = document.getElementById('sbPostsMade');     if(sp) sp.value = pm||'';
  // Activity bar (based on total actions today vs target 10)
  const total = ja + nc + pm;
  const pct = Math.min(100, Math.round((total/10)*100));
  const fill = document.getElementById('actBarFill'); if(fill) fill.style.width = pct + '%';
  const pctTxt = document.getElementById('actPctTxt'); if(pctTxt) pctTxt.textContent = total > 0 ? total + ' actions' : '—';
}


// ══════════════════════════════════════════════════════
// SECTION O · SLEEP
// ══════════════════════════════════════════════════════
function openSleepModal() {
  document.getElementById('sleepWake').value = S.wakeTime || '';
  document.getElementById('sleepBed').value  = S.bedTime  || '';
  calcSleepDur();
  document.getElementById('sleepWrap').classList.add('open');
}

function closeSleepModal(e, force) {
  if (!force && e && e.target !== document.getElementById('sleepWrap')) return;
  S.wakeTime = document.getElementById('sleepWake').value;
  S.bedTime  = document.getElementById('sleepBed').value;
  const wi = document.getElementById('wakeInp'); if(wi) { wi.value = S.wakeTime; applyAtpDisplay('wake', S.wakeTime); }
  const bi = document.getElementById('bedInp');  if(bi) { bi.value = S.bedTime; applyAtpDisplay('bed', S.bedTime); }
  updateSleepPill();
  document.getElementById('sleepWrap').classList.remove('open');
}

function calcSleepDur() {
  const wk = document.getElementById('sleepWake').value;
  const bd = document.getElementById('sleepBed').value;
  const el = document.getElementById('sleepDurBox'); if(!el) return;
  if (!wk || !bd) { el.textContent = '—'; return; }
  const [wh,wm] = wk.split(':').map(Number), [bh,bm] = bd.split(':').map(Number);
  let d = (wh*60+wm) - (bh*60+bm); if(d<0) d += 1440;
  el.textContent = `${Math.floor(d/60)}h ${d%60}m of sleep`;
}

function saveSleep() {
  S.wakeTime = document.getElementById('wakeInp')?.value||'';
  S.bedTime  = document.getElementById('bedInp')?.value||'';
  updateSleepPill();
}
function handleAppleTime(type, val) {
  if (type === 'wake') S.wakeTime = val;
  else                 S.bedTime  = val;
  applyAtpDisplay(type, val);
}

function updateSleepPill() {
  const el = document.getElementById('sleepBtnTxt'); if(!el) return;
  if (S.wakeTime && S.bedTime) el.textContent = `Up ${fmtTime(S.wakeTime)} · Bed ${fmtTime(S.bedTime)}`;
  else if (S.wakeTime)         el.textContent = `Up ${fmtTime(S.wakeTime)}`;
  else                         el.textContent = 'Log sleep';
}


// ══════════════════════════════════════════════════════
// SECTION P · WORKOUT TYPE CHIPS
// ══════════════════════════════════════════════════════
function toggleWorkoutType(btn) {
  if (S.submitted) return;
  const type = btn.textContent.trim();
  btn.classList.toggle('on');
  if (btn.classList.contains('on')) { if (!S.workoutTypes.includes(type)) S.workoutTypes.push(type); }
  else { S.workoutTypes = S.workoutTypes.filter(t => t !== type); }
}


// ══════════════════════════════════════════════════════
// SECTION Q · TIMELOG (focused blocks)
// ══════════════════════════════════════════════════════
function addTimelogEntry() {
  if (S.submitted) return;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  S.timelogEntries.push({ id: uid(), time: timeStr, note: '' });
  renderTimelogEntries();
}

function removeTimelogEntry(id) {
  S.timelogEntries = S.timelogEntries.filter(e => e.id !== id);
  renderTimelogEntries();
}

function renderTimelogEntries() {
  const wrap = document.getElementById('timelogEntries'); if (!wrap) return;
  wrap.innerHTML = '';
  S.timelogEntries.forEach((entry, i) => {
    const row = document.createElement('div'); row.className = 'timelog-row';
    row.innerHTML = `
      <input type="time" class="timelog-time-inp" value="${entry.time||''}"
        ${S.submitted?'disabled':''}
        onchange="S.timelogEntries[${i}].time=this.value"/>
      <input class="timelog-note-inp" value="${esc(entry.note)}"
        placeholder="What were you focused on?"
        ${S.submitted?'disabled':''}
        oninput="S.timelogEntries[${i}].note=this.value"
        onchange="S.timelogEntries[${i}].note=this.value"/>
      ${S.submitted ? '' : `<button class="timelog-del" onclick="removeTimelogEntry('${entry.id}')">×</button>`}
    `;
    wrap.appendChild(row);
  });
  const addBtn = document.getElementById('addTimelogBtn');
  if (addBtn) addBtn.style.display = S.submitted ? 'none' : '';
}


// ══════════════════════════════════════════════════════
// SECTION R · NEGATIVITY JOURNAL
// ══════════════════════════════════════════════════════
function addNegEntry() {
  if (S.submitted) return;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  S.negEntries.push({ id: uid(), time: timeStr, note: '' });
  renderNegEntries();
}

function removeNegEntry(id) {
  S.negEntries = S.negEntries.filter(e => e.id !== id);
  renderNegEntries();
}

function renderNegEntries() {
  const wrap = document.getElementById('negEntries'); if (!wrap) return;
  wrap.innerHTML = '';
  S.negEntries.forEach((entry, i) => {
    const row = document.createElement('div'); row.className = 'neg-timelog-row';
    row.innerHTML = `
      <input type="time" class="neg-time-inp" value="${entry.time||''}"
        ${S.submitted?'disabled':''}
        onchange="S.negEntries[${i}].time=this.value"/>
      <textarea class="neg-ta" rows="3"
        placeholder="What are you feeling right now? Write it all out. No filter needed."
        ${S.submitted?'disabled':''}
        oninput="S.negEntries[${i}].note=this.value"
        onchange="S.negEntries[${i}].note=this.value"
      >${esc(entry.note)}</textarea>
      ${S.submitted ? '' : `<button class="neg-del" onclick="removeNegEntry('${entry.id}')">×</button>`}
    `;
    wrap.appendChild(row);
  });
  const addBtn = document.getElementById('addNegBtn');
  if (addBtn) addBtn.style.display = S.submitted ? 'none' : '';
}


// ══════════════════════════════════════════════════════
// SECTION S · SESSIONS
// ══════════════════════════════════════════════════════
function isAvail(s)   { return new Date().getHours() >= s.hour; }
function isCurrSess(s){ const h = new Date().getHours(); const c = SESS_DEF.slice().reverse().find(x => h >= x.hour); return c && c.id === s.id; }
function doneCount(s) { return s.cards.filter(id => S.cards[id]?.val !== undefined).length; }

function renderSbSessions() {
  const nav = document.getElementById('sbSnav'); if (!nav) return;
  nav.innerHTML = '';
  SESS_DEF.forEach(s => {
    const av = isAvail(s), cu = isCurrSess(s), dc = doneCount(s);
    const dotCls = dc === s.cards.length ? 'done' : dc > 0 ? 'partial' : '';
    const item = document.createElement('div');
    item.className = 'sb-sni' + (cu?' curr':'') + (av?'':' lock-nav');
    if (av) item.onclick = () => scrollToSess(s.id);
    item.innerHTML = `
      <div class="sb-sni-l">
        <div class="sb-sni-dot ${dotCls}"></div>
        <div><div class="sb-sni-time">${s.time}</div><div class="sb-sni-name">${s.name}</div></div>
      </div>
      <div class="sb-sni-badge">${dc}/${s.cards.length}</div>
    `;
    nav.appendChild(item);
  });
}

function scrollToSess(id) { const el = document.getElementById('sess-'+id); if(el){el.scrollIntoView({behavior:'smooth',block:'start'});openSessCard(id);} }
function openSessCard(id) { const c = document.getElementById('sess-'+id); if(c) c.classList.add('open'); }
function toggleSess(id)   { const c = document.getElementById('sess-'+id); if(c) c.classList.toggle('open'); }

function renderSessions() {
  const wrap = document.getElementById('sessionsWrap'); if (!wrap) return;
  wrap.innerHTML = '';
  SESS_DEF.forEach(s => {
    const av  = isAvail(s);
    const cu  = isCurrSess(s);
    const sl  = !!S.sessions[s.id]?.locked || S.submitted;
    const dc  = doneCount(s);

    const card = document.createElement('div');
    card.className = 'sess-card' + (cu?' curr':'') + (av?'':' locked');
    card.id = 'sess-' + s.id;

    // Header
    const hdr = document.createElement('div'); hdr.className = 'sess-hdr';
    if (av) hdr.onclick = () => toggleSess(s.id);
    hdr.innerHTML = `
      <div class="sh-l">
        <div class="sh-pill">${s.time}</div>
        <div><div class="sh-title">${s.name}</div><div class="sh-sub">${s.sub}</div></div>
      </div>
      <div class="sh-r">
        ${!av
          ? `<span style="font-size:10px;color:var(--muted);font-style:italic;">Unlocks at ${s.time}</span>`
          : `<span class="sh-prog">${dc}/${s.cards.length}</span><span class="sh-chev">▾</span>`
        }
      </div>
    `;
    card.appendChild(hdr);

    const body = document.createElement('div'); body.className = 'sess-body';

    // Objectives (3 per session)
    const objData = S.sessions[s.id]?.objectives || ['','',''];
    const objSec = document.createElement('div'); objSec.className = 'sess-objs';
    objSec.innerHTML = `
      <div class="obj-lbl">3 Objectives — Set before you begin this block</div>
      <div class="obj-inputs">
        ${[0,1,2].map(i => `
          <div class="obj-row">
            <span class="obj-num">${i+1}</span>
            <input class="obj-inp" placeholder="What will you accomplish?" value="${esc(objData[i]||'')}"
              onchange="saveObjText('${s.id}',${i},this.value)"
              oninput="saveObjText('${s.id}',${i},this.value)"
              ${sl?'disabled':''}/>
          </div>
        `).join('')}
      </div>
    `;
    body.appendChild(objSec);

    // Cards (yes/no items)
    const ciList = document.createElement('div'); ciList.className = 'ci-list';
    s.cards.forEach(cardId => {
      const cfg = CARDS[cardId]; if (!cfg) return;
      const cd = S.cards[cardId] || {};
      const isDone = cd.val === true, isSkip = cd.val === false;
      const dis = sl ? 'disabled' : '';
      const cnt = S.cardCounts[cardId] || 0;

      const item = document.createElement('div');
      item.className = 'ci-item' + (isDone?' done':isSkip?' skip':'');

      item.innerHTML = `
        <div class="ci-main">
          <div class="ci-l">
            <div class="ci-ico">${cfg.e}</div>
            <div><div class="ci-name">${cfg.l}</div><div class="ci-sub">${cfg.s}</div></div>
          </div>
          <div class="tog-row">
            <button class="tog${isDone?' y':''}" onclick="logCard('${s.id}','${cardId}',true)"  ${dis}>Yes</button>
            <button class="tog${isSkip?' n':''}" onclick="logCard('${s.id}','${cardId}',false)" ${dis}>No</button>
          </div>
        </div>
        <!-- How many? (appears after Yes) -->
        <div class="ci-howmany">
          <div class="ci-hm-lbl">How many?</div>
          <div class="ci-hm-btns">
            <button class="ci-hm-btn" onclick="adjustCount('${cardId}',-1)" ${dis}>−</button>
            <div class="ci-hm-val" id="hmc-${cardId}">${cnt}</div>
            <button class="ci-hm-btn" onclick="adjustCount('${cardId}',1)"  ${dis}>+</button>
          </div>
          <input class="ci-hm-inp" type="number" value="${cnt||''}" placeholder="—"
            id="hmci-${cardId}"
            oninput="setCount('${cardId}',this.value)"
            onchange="setCount('${cardId}',this.value)"
            ${dis}/>
        </div>
        <!-- Detail / choices / notes -->
        <div class="ci-detail">
          <div class="det-q">${cfg.q}</div>
          <div class="det-chips">
            ${cfg.c.map(c => `<button class="det-chip${(cd.choices||[]).includes(c)?' on':''}" onclick="toggleChoice('${s.id}','${cardId}','${c}')" ${dis}>${c}</button>`).join('')}
          </div>
          <textarea class="det-ta" placeholder="Describe exactly what you did…" ${dis}
            oninput="saveNote('${s.id}','${cardId}',this.value)"
            onchange="saveNote('${s.id}','${cardId}',this.value)"
          >${cd.note||''}</textarea>
        </div>
      `;
      ciList.appendChild(item);
    });
    body.appendChild(ciList);

    // Footer
    const foot = document.createElement('div'); foot.className = 'sess-foot';
    foot.innerHTML = sl
      ? `<span class="sess-lock-note">Session locked in.</span><span></span>`
      : `<span class="sess-lock-note">${dc}/${s.cards.length} answered</span>
         <button class="sess-lock-btn" onclick="lockSess('${s.id}')">Lock in ${s.time} →</button>`;
    body.appendChild(foot);
    card.appendChild(body);
    if (cu && !sl) card.classList.add('open');
    wrap.appendChild(card);
  });
}

// Session helpers
function saveObjText(sId,i,v) { if(S.submitted||S.sessions[sId]?.locked)return; if(!S.sessions[sId])S.sessions[sId]={}; if(!S.sessions[sId].objectives)S.sessions[sId].objectives=['','','']; S.sessions[sId].objectives[i]=v; }
function logCard(sId,cId,v) {
  if (S.submitted || S.sessions[sId]?.locked) return;
  if (!S.cards[cId]) S.cards[cId] = {};
  S.cards[cId].val = v;
  if (v === false) { S.cards[cId].choices = []; S.cards[cId].note = ''; S.cardCounts[cId] = 0; }
  renderSessions(); renderSbSessions(); recalc();
}
function toggleChoice(sId,cId,c) { if(S.submitted||S.sessions[sId]?.locked)return; if(!S.cards[cId])S.cards[cId]={}; if(!S.cards[cId].choices)S.cards[cId].choices=[]; const a=S.cards[cId].choices,i=a.indexOf(c); if(i>-1)a.splice(i,1);else a.push(c); renderSessions(); }
function saveNote(sId,cId,v)    { if(S.submitted||S.sessions[sId]?.locked)return; if(!S.cards[cId])S.cards[cId]={}; S.cards[cId].note=v; }
function lockSess(sId)          { if(!S.sessions[sId])S.sessions[sId]={}; S.sessions[sId].locked=true; renderSessions();renderSbSessions();recalc(); }
function adjustCount(cId,delta) { const cur=S.cardCounts[cId]||0; S.cardCounts[cId]=Math.max(0,cur+delta); const v=document.getElementById('hmc-'+cId); if(v)v.textContent=S.cardCounts[cId]; const inp=document.getElementById('hmci-'+cId); if(inp)inp.value=S.cardCounts[cId]||''; }
function setCount(cId,v)        { S.cardCounts[cId]=Math.max(0,parseInt(v)||0); const el=document.getElementById('hmc-'+cId); if(el)el.textContent=S.cardCounts[cId]; }


// ══════════════════════════════════════════════════════
// SECTION T · MOOD
// ══════════════════════════════════════════════════════
function setMood(m) {
  if (S.submitted) return;
  S.mood = m;
  document.querySelectorAll('.mchip').forEach(b => b.classList.toggle('on', b.textContent.trim().startsWith(m.split(' ')[0])));
  recalc();
}


// ══════════════════════════════════════════════════════
// SECTION U · SCORE CALCULATION + RECALC
// ══════════════════════════════════════════════════════
let raf = null, dispScore = 0;

function calcScore() {
  let s = 0;

  // Primary objective: 30pts for shipping it
  if (S.primaryShipped === true) s += PRIMARY_PTS;

  // Goals: 3pts for writing one down, 7 additional pts for completing it (10pts total per goal)
  S.goals.forEach(g => {
    if (g.text && g.text.trim()) s += 3;  // wrote it down — earned
    if (g.done)                  s += 7;  // checked it off — full points
  });

  // Daily check-in cards: each card has a weight defined in the W object above
  Object.entries(S.cards).forEach(([id, cd]) => {
    const w = W[id];
    if (w && cd.val === true) s += w;
  });

  // Mood bonus: positive state = extra pts
  if (S.mood === 'Locked in' || S.mood === 'On fire') s = Math.min(100, s + 5);
  if (S.mood === 'Solid'     || S.mood === 'Creative') s = Math.min(100, s + 2);

  return Math.min(100, Math.round(s));
}

function recalc() {
  const score = calcScore();
  S.score = score;
  animScore(score);

  // Update the topbar points badge
  const ptsNum = document.getElementById('tbPtsNum');
  if (ptsNum) ptsNum.textContent = score;
  // Bump animation on the badge
  const ptsBadge = document.getElementById('tbPtsBadge');
  if (ptsBadge) { ptsBadge.classList.remove('pts-bump'); void ptsBadge.offsetWidth; ptsBadge.classList.add('pts-bump'); }
  const barFill = document.getElementById('sbBarFill'); if(barFill) barFill.style.width = score + '%';
  const pill = document.getElementById('topScorePill');
  if (pill) { pill.textContent = score + ' / 100'; pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  const v = score>=80?'Elite execution.':score>=60?'Solid day.':score>=40?'Moving forward.':score>0?'Keep logging.':'Log your day.';
  const vEl = document.getElementById('sbVerdict'); if(vEl) vEl.textContent = v;
  // Pillar bars
  const pts = {agency:0,content:0,music:0,health:0}, max = {agency:0,content:0,music:0,health:0};
  Object.entries(CARDS).forEach(([id,cfg]) => { const p=cfg.p, w=W[id]||0; max[p]=(max[p]||0)+w; if(S.cards[id]?.val===true) pts[p]=(pts[p]||0)+w; });
  ['Agency','Content','Music','Health'].forEach(p => {
    const k = p.toLowerCase(), pct = max[k]>0 ? Math.round((pts[k]||0)/max[k]*100) : 0;
    const f = document.getElementById('pb'+p); if(f) f.style.width = pct + '%';
    const pe = document.getElementById('pb'+p+'P'); if(pe) pe.textContent = pct + '%';
  });
  // Brief
  const pool = score>=65 ? BRIEFS.high : score>=35 ? BRIEFS.mid : BRIEFS.low;
  const brief = document.getElementById('sbBrief'); if(brief) brief.textContent = pool[Math.floor(Math.random()*pool.length)];
  updateSbPrimary();
  if (typeof updateSectionBadges === 'function') updateSectionBadges();
  updateWidgets();
  if (typeof updateSessionStub === 'function') updateSessionStub();
  if (typeof renderSparkline === 'function') renderSparkline();
}

function animScore(t) {
  if (raf) cancelAnimationFrame(raf);
  const from = dispScore, t0 = performance.now(), dur = 700;
  function step(n) {
    const p = Math.min((n-t0)/dur, 1), e = 1-Math.pow(1-p,3);
    dispScore = Math.round(from + (t-from)*e);
    const el = document.getElementById('sbScore'); if(el) el.textContent = dispScore;
    if (p < 1) raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);
}


// ══════════════════════════════════════════════════════
// SECTION V · SUBMIT DAY
// ══════════════════════════════════════════════════════
function submitDay() {
  const ans = Object.values(S.cards).filter(c => c.val !== undefined).length;
  if (ans < 3 && S.primaryShipped === null) {
    // Show inline warning instead of alert
    const btn = document.getElementById('submitBtn');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Set primary + 3 check-ins first';
      btn.style.background = 'var(--amber)';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2500);
    }
    return;
  }
  S.submitted = true;
  // Capture from live fields (reflect panel + focus fields)
  S.win         = document.getElementById('refWin')?.value      || S.win         || '';
  S.avoid       = document.getElementById('refAvoid')?.value    || S.avoid       || '';
  S.intention   = document.getElementById('intentInp')?.value   || S.intention   || '';
  S.primaryMove = document.getElementById('pmInput')?.value     || S.primaryMove || '';
  // Metrics from sidebar counters
  S.jobsApplied    = parseInt(document.getElementById('sbJobsApplied')?.value||0)||0;
  S.newConnections = parseInt(document.getElementById('sbConnections')?.value||0)||0;
  S.postsMade      = parseInt(document.getElementById('sbPostsMade')?.value||0)||0;

  const score = calcScore();
  const grade = gradeFor(score);

  // Build history entry
  const entry = {
    date: todayStr(), score, grade,
    cards: JSON.parse(JSON.stringify(S.cards)),
    cardCounts: JSON.parse(JSON.stringify(S.cardCounts)),
    mood: S.mood, intention: S.intention, win: S.win, avoid: S.avoid,
    primaryMove: S.primaryMove, primaryShipped: S.primaryShipped,
    sessions: JSON.parse(JSON.stringify(S.sessions)),
    goals: JSON.parse(JSON.stringify(S.goals)),
    wakeTime: S.wakeTime, bedTime: S.bedTime,
    jobsApplied: S.jobsApplied, newConnections: S.newConnections,
    postsMade: S.postsMade, pipelineVal: S.pipelineVal,
    learn1: S.learn1, learn2: S.learn2, learn3: S.learn3,
    workoutGoal: S.workoutGoal, workoutTarget: S.workoutTarget, workoutTypes: S.workoutTypes,
    timelogEntries: JSON.parse(JSON.stringify(S.timelogEntries)),
    negEntries: JSON.parse(JSON.stringify(S.negEntries)),
  };

  S.history = S.history.filter(h => h.date !== todayStr());
  S.history.push(entry);

  // Update streaks
  const sorted = [...S.history].sort((a,b) => a.date.localeCompare(b.date));
  const skMap = { workout:'workout', content:'posted', outreach:'outreach', music:'music_move' };
  Object.entries(skMap).forEach(([sk,cid]) => {
    let streak=0; for(let i=sorted.length-1;i>=0;i--){if(sorted[i].cards?.[cid]?.val===true)streak++;else break;}
    S.streaks[sk]=streak;
  });

  saveToStorage();
  renderSessions(); renderSbSessions();
  renderHistory(); renderStreaks(); recalc();
  renderTimelogEntries(); renderNegEntries();

  // Disable all inputs
  document.querySelectorAll('.field-text,.field-time,.rev-inp,.av-ta,.win-inp,.obj-inp,.det-ta,.pm-input,.learning-inp,.workout-inp').forEach(el => el.disabled=true);
  document.querySelectorAll('.mchip,.pm-btn,.workout-chip').forEach(b => b.disabled=true);

  document.getElementById('loggedNote').style.display = 'block';
  const btn = document.getElementById('submitBtn'); btn.disabled=true; btn.textContent='Day Locked In ✓';

  // Build and show day summary
  buildDaySummary(entry);
  checkDaySummary();

  // Show close modal
  const verdictTxt = score>=80?'Exceptional.':score>=60?'Solid day.':score>=40?'Partial.':'Below standard.';
  const subTxt = score>=60 ? "That's the standard. Keep it there and you become hard to compete with." : "Not every day is perfect. You showed up to log it. Go again tomorrow.";
  setTimeout(() => {
    document.getElementById('dmNum').textContent     = score;
    document.getElementById('dmGrade').textContent   = grade;
    document.getElementById('dmVerdict').textContent = verdictTxt;
    document.getElementById('dmSub').textContent     = subTxt;
    document.getElementById('dayWrap').classList.add('open');
  }, 400);
}

function closeDayModal() { document.getElementById('dayWrap').classList.remove('open'); }


// ══════════════════════════════════════════════════════
// SECTION W · DAY SUMMARY
// ══════════════════════════════════════════════════════
function buildDaySummary(entry) {
  const content = document.getElementById('daySummaryContent'); if(!content) return;
  const score = entry.score, grade = entry.grade;
  const doneCards = Object.entries(entry.cards).filter(([,cd])=>cd.val===true).map(([id])=>CARDS[id]?.l||id);
  const objList = SESS_DEF.flatMap(s => (entry.sessions[s.id]?.objectives||[]).filter(Boolean).map((o,i)=>`${s.time} — Obj ${i+1}: ${o}`));
  const learnItems = [entry.learn1,entry.learn2,entry.learn3].filter(Boolean);
  // Pillar scores
  const pts={agency:0,content:0,music:0,health:0},max={agency:0,content:0,music:0,health:0};
  Object.entries(CARDS).forEach(([id,cfg])=>{const p=cfg.p,w=W[id]||0;max[p]=(max[p]||0)+w;if(entry.cards[id]?.val===true)pts[p]=(pts[p]||0)+w;});
  const pct=(p)=>max[p]>0?Math.round((pts[p]||0)/max[p]*100):0;

  content.innerHTML = `
    <div class="ds-score-row">
      <div class="ds-score-big">${score}</div>
      <div class="ds-score-denom">/ 100</div>
      <div class="ds-grade">${grade}</div>
    </div>
    <div class="ds-pillars-row">
      <div class="ds-pillar"><div class="ds-pillar-n">${pct('agency')}%</div><div class="ds-pillar-l">Agency</div></div>
      <div class="ds-pillar"><div class="ds-pillar-n">${pct('content')}%</div><div class="ds-pillar-l">Content</div></div>
      <div class="ds-pillar"><div class="ds-pillar-n">${pct('music')}%</div><div class="ds-pillar-l">Music</div></div>
      <div class="ds-pillar"><div class="ds-pillar-n">${pct('health')}%</div><div class="ds-pillar-l">Health</div></div>
    </div>
    <div class="ds-items" style="margin-top:14px;">
      <div class="ds-item"><div class="ds-item-lbl">Primary Move</div><div class="ds-item-val">${esc(entry.primaryMove)||'Not set'} — ${entry.primaryShipped===true?'✓ Shipped':'✕ Not shipped'}</div></div>
      ${entry.intention?`<div class="ds-item"><div class="ds-item-lbl">Intention</div><div class="ds-item-val">${esc(entry.intention)}</div></div>`:''}
      ${doneCards.length?`<div class="ds-item"><div class="ds-item-lbl">Completed (${doneCards.length})</div><div class="ds-item-val">${doneCards.map(esc).join(' · ')}</div></div>`:''}
      ${objList.length?`<div class="ds-item"><div class="ds-item-lbl">Block Objectives</div><div class="ds-item-val">${objList.map(esc).join('<br>')}</div></div>`:''}
      ${learnItems.length?`<div class="ds-item"><div class="ds-item-lbl">Wanted to Learn</div><div class="ds-item-val">${learnItems.map(esc).join('<br>')}</div></div>`:''}
      ${entry.win?`<div class="ds-item"><div class="ds-item-lbl">Biggest Win</div><div class="ds-item-val">${esc(entry.win)}</div></div>`:''}
      ${entry.avoid?`<div class="ds-item"><div class="ds-item-lbl">Avoided</div><div class="ds-item-val">${esc(entry.avoid)}</div></div>`:''}
      ${entry.mood?`<div class="ds-item"><div class="ds-item-lbl">Mental State</div><div class="ds-item-val">${esc(entry.mood)}</div></div>`:''}
      <div class="ds-item"><div class="ds-item-lbl">Activity</div><div class="ds-item-val">Jobs applied: ${entry.jobsApplied||0} · New connections: ${entry.newConnections||0} · Posts: ${entry.postsMade||0}</div></div>
    </div>
  `;
}

function checkDaySummary() {
  const h = new Date().getHours();
  const locked   = document.getElementById('daySummaryLocked');
  const content  = document.getElementById('daySummaryContent');
  // Unlock at 9pm AND only if day was submitted
  const canShow  = h >= 21 && S.submitted;
  if (locked)  locked.style.display  = canShow ? 'none' : 'flex';
  if (content) content.style.display = canShow ? 'block' : 'none';
  // If submitted but no content yet, rebuild
  if (canShow && content && !content.innerHTML.trim()) {
    const entry = S.history.find(h => h.date === todayStr());
    if (entry) buildDaySummary(entry);
  }
}


// ══════════════════════════════════════════════════════
// SECTION X · HISTORY + STREAKS
// ══════════════════════════════════════════════════════
function renderHistory() {
  ['hgrid','hgrid2'].forEach(gid => {
    const g = document.getElementById(gid); if(!g) return;
    g.innerHTML = '';
    const t = todayStr();
    for (let i=29; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const ds = d.toISOString().split('T')[0];
      const entry = S.history.find(h => h.date === ds);
      const dot = document.createElement('div');
      let cls = entry ? (entry.score>=75?'great':entry.score>=55?'good':entry.score>=35?'mid':'rough') : '';
      if (ds === t) cls += ' today-d';
      dot.className = 'hday ' + cls;
      dot.textContent = entry ? entry.score : d.getDate();
      dot.title = ds + (entry ? ` — ${entry.score}/100 (${entry.grade})` : '');
      g.appendChild(dot);
    }
  });
}

function renderStreaks() {
  const set = (id, v) => { const el=document.getElementById(id); if(el) el.textContent = v||0; };
  set('stWk', S.streaks.workout);
  set('stCt', S.streaks.content);
  set('stOt', S.streaks.outreach);
  set('stMu', S.streaks.music);
}


// ══════════════════════════════════════════════════════
// SECTION Y · SIDEBAR TOGGLE
// ══════════════════════════════════════════════════════
function toggleSidebar() { S.sidebarOpen = !S.sidebarOpen; applySidebar(); saveToStorage(); }
function applySidebar() {
  const app = document.getElementById('app');
  const btn = document.getElementById('sbToggle');
  if (S.sidebarOpen) { app.classList.remove('collapsed'); if(btn) btn.textContent='☰'; }
  else               { app.classList.add('collapsed');    if(btn) btn.textContent='▶'; }
}

// ─────────────────────────────────────────────────────
// SECTION Z: RESTORE FIELD VALUES ON LOAD
// (When today's data already exists in history)
// ─────────────────────────────────────────────────────
function restoreFieldValues() {
  const set = (id, v, dis) => { const el=document.getElementById(id); if(el){ el.value=v||''; if(dis&&S.submitted) el.disabled=true; } };

  set('intentInp',  S.intention, true);
  set('refWin',     S.win,       true);
  set('refAvoid',   S.avoid,     true);
  set('sbAvoidTa',  S.avoid,     false);  // sidebar always editable
  set('wakeInp',    S.wakeTime,  true);
  set('bedInp',     S.bedTime,   true);
  // Restore Apple time pill displays
  if (S.wakeTime) applyAtpDisplay('wake', S.wakeTime);
  if (S.bedTime)  applyAtpDisplay('bed',  S.bedTime);
  set('pmInput',    S.primaryMove, true);
  set('sbAvoidTa',  S.avoid,     true);
  set('learn1',     S.learn1,    true);
  set('learn2',     S.learn2,    true);
  set('learn3',     S.learn3,    true);
  set('workoutGoalInp',   S.workoutGoal,   true);
  set('workoutTargetInp', S.workoutTarget, true);
  set('jobsAppliedInp',   S.jobsApplied||'', true);
  set('newConnectionsInp',S.newConnections||'', true);
  set('postsMadeInp',     S.postsMade||'', true);
  set('sbJobsApplied',    S.jobsApplied||'', true);
  set('sbConnections',    S.newConnections||'', true);
  set('sbPostsMade',      S.postsMade||'', true);

  // Restore quarterly goals
  wireQGoals();

  syncMetrics();
  updateSleepPill();

  if (S.primaryShipped !== null) applyPrimaryUI(S.primaryShipped);

  // Mood
  if (S.mood) document.querySelectorAll('.mchip').forEach(b => b.classList.toggle('on', b.textContent.trim().startsWith(S.mood.split(' ')[0])));

  // Workout types
  if (S.workoutTypes?.length) {
    document.querySelectorAll('.workout-chip').forEach(b => {
      if (S.workoutTypes.includes(b.textContent.trim())) b.classList.add('on');
    });
  }

  // Submitted state
  if (S.submitted) {
    document.querySelectorAll('.mchip,.pm-btn,.workout-chip').forEach(b => b.disabled = true);
    const loggedNote = document.getElementById('loggedNote'); if(loggedNote) loggedNote.style.display='block';
    const btn = document.getElementById('submitBtn'); if(btn){ btn.disabled=true; btn.textContent='Day Locked In ✓'; }
    // Rebuild day summary
    const entry = S.history.find(h => h.date === todayStr());
    if (entry) buildDaySummary(entry);
  }

  // Wire live-updating inputs (only when not submitted)
  if (!S.submitted) {
    const wire = (id, key, cb) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => { S[key] = el.value; if(cb) cb(); });
    };
    wire('intentInp',  'intention');
    wire('winInp',     'win');
    wire('refAvoid',  'avoid', () => { const e=document.getElementById('sbAvoidTa'); if(e) e.value=S.avoid; });
    wire('sbAvoidTa', 'avoid', () => { const e=document.getElementById('refAvoid');  if(e) e.value=S.avoid; });
    wire('pmInput',    'primaryMove', updateSbPrimary);
    wire('learn1','learn1'); wire('learn2','learn2'); wire('learn3','learn3');
    wire('workoutGoalInp','workoutGoal'); wire('workoutTargetInp','workoutTarget');
  }
}

// ─────────────────────────────────────────────────────
// SECTION: PLANNING MODE — Tomorrow's Day
// ─────────────────────────────────────────────────────

// Tomorrow's plan lives in its own storage key so it
// persists independently from today's S state.
function getTomorrowKey() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return 'plan_' + d.toISOString().split('T')[0];
}

function loadTomorrowPlan() {
  try {
    const raw = localStorage.getItem(getTomorrowKey());
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function saveTomorrowPlan(plan) {
  try { localStorage.setItem(getTomorrowKey(), JSON.stringify(plan)); } catch(e) {}
}

function openPlanMode() {
  // Populate inline plan tab with saved data
  const plan = loadTomorrowPlan();
  const setVal = (id, v) => { const el = document.getElementById(id); if(el) el.value = v || ''; };
  setVal('planPrimaryInline', plan.primary   || '');
  setVal('planGoalA1',        plan.goal1     || '');
  setVal('planGoalA2',        plan.goal2     || '');
  setVal('planGoalA3',        plan.goal3     || '');
  setVal('planGoalA4',        plan.goal4     || '');
  setVal('planGoalA5',        plan.goal5     || '');
  setVal('planBlockA9',       plan.block9    || '');
  setVal('planBlockA12',      plan.block12   || '');
  setVal('planBlockA3',       plan.block3    || '');
  setVal('planBlockA7',       plan.block7    || '');
  setVal('planLearnInline',   plan.learn1    || '');
  setVal('planWorkoutInline', plan.workout   || '');
  setVal('planDumpInline',    plan.notes     || '');
  setMode('planning');
  setTimeout(() => {
    const el = document.getElementById('planPrimaryInline');
    if (el) { el.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, 100);
}

function closePlanMode() {
  setMode('focus');
}

function closePlanOverlay(e) {
  // Legacy — overlay no longer used
}

function savePlanMode() {
  const getVal = id => document.getElementById(id)?.value?.trim() || '';
  const plan = {
    primary: getVal('planPrimaryInline'),
    goal1:   getVal('planGoalA1'),
    goal2:   getVal('planGoalA2'),
    goal3:   getVal('planGoalA3'),
    goal4:   getVal('planGoalA4'),
    goal5:   getVal('planGoalA5'),
    block9:  getVal('planBlockA9'),
    block12: getVal('planBlockA12'),
    block3:  getVal('planBlockA3'),
    block7:  getVal('planBlockA7'),
    learn1:  getVal('planLearnInline'),
    workout: getVal('planWorkoutInline'),
    notes:   getVal('planDumpInline'),
    savedAt: new Date().toISOString(),
  };
  saveTomorrowPlan(plan);
  // Auto-save silently — data persists via oninput handlers too
}

// ─────────────────────────────────────────────────────
// KICK IT OFF
// ─────────────────────────────────────────────────────
init();

// ─────────────────────────────────────────────────────
// COLLAPSIBLE SECTIONS
// ─────────────────────────────────────────────────────
const COLL_MAX = {
  goals:'2000px', setup:'900px', learn:'800px',
  sessions:'5000px', mind:'3000px', close:'2000px'
};
function toggleColl(key) {
  const body = document.getElementById('body-' + key);
  const hdr  = document.querySelector('#sec-' + key + ' .coll-hdr');
  if (!body) return;

  const isOpen = !body.classList.contains('is-closed');

  if (isOpen) {
    // Snap to current height, then animate to 0
    const h = body.scrollHeight;
    body.style.maxHeight = h + 'px';
    void body.offsetHeight; // force reflow
    body.style.transition = 'max-height .42s cubic-bezier(.4,0,.2,1)';
    body.style.maxHeight  = '0px';
    body.classList.add('is-closed');
    if (hdr) hdr.classList.add('is-closed');
    if (!S.collapsedSections) S.collapsedSections = {};
    S.collapsedSections[key] = true;
  } else {
    // Clear inline, remove class — CSS max-height:6000px takes over
    body.style.transition = 'max-height .42s cubic-bezier(.4,0,.2,1)';
    body.style.maxHeight  = '6000px';
    body.classList.remove('is-closed');
    if (hdr) hdr.classList.remove('is-closed');
    // After animation, clear inline so CSS controls it
    setTimeout(() => { body.style.maxHeight = ''; body.style.transition = ''; }, 450);
    if (!S.collapsedSections) S.collapsedSections = {};
    delete S.collapsedSections[key];
  }
  saveToStorage();
}
function restoreCollapsed() {
  if (!S.collapsedSections) return;
  Object.keys(S.collapsedSections).forEach(key => {
    if (!S.collapsedSections[key]) return;
    const body = document.getElementById('body-' + key);
    const hdr  = document.querySelector('#sec-' + key + ' .coll-hdr');
    if (body) {
      body.style.transition = 'none';
      body.style.maxHeight  = '0px';
      body.classList.add('is-closed');
      requestAnimationFrame(() => { body.style.transition = ''; });
    }
    if (hdr) hdr.classList.add('is-closed');
  });
}

// ─────────────────────────────────────────────────────
// APPLE-STYLE COMPLETION FLASH + CHECKMARK BADGE
// ─────────────────────────────────────────────────────
function doFlash(elId) {
  if (!elId) return;
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove('run');
  void el.offsetWidth; // reflow
  el.classList.add('run');
  setTimeout(() => el.classList.remove('run'), 800);
}
function showBadge(elId) {
  const el = document.getElementById(elId);
  if (el) el.classList.add('show');
}
function updateLearnSaved() {
  const inp = document.getElementById('learn1');
  const txt = document.getElementById('learnSavedTxt');
  if (txt && inp && inp.value.trim()) {
    txt.textContent = 'Saved — "' + inp.value.trim().slice(0, 40) + (inp.value.length > 40 ? '…' : '') + '"';
  }
}


// ─────────────────────────────────────────────────────
// SECTION BADGES
// ─────────────────────────────────────────────────────
function updateSectionBadges() {
  const goalsEl = document.getElementById('badge-goals');
  if (goalsEl) {
    const done = S.goals.filter(g => g.done).length;
    goalsEl.textContent = S.goals.length > 0 ? done + ' / ' + S.goals.length + ' goals' : '—';
  }
  const sessEl = document.getElementById('badge-sessions');
  if (sessEl) {
    const total = SESS_DEF.reduce((a, s) => a + s.cards.filter(id => S.cards[id]?.val === true).length, 0);
    const max   = SESS_DEF.reduce((a, s) => a + s.cards.length, 0);
    sessEl.textContent = total + ' / ' + max;
  }
}


// ─────────────────────────────────────────────────────
// PREVIOUS DAYS MODAL
// ─────────────────────────────────────────────────────
function openPrevDays() {
  const body = document.getElementById('prevdaysBody');
  if (!body) return;
  body.innerHTML = '';
  const sorted = [...(S.history||[])].sort((a,b) => b.date.localeCompare(a.date));
  if (!sorted.length) {
    body.innerHTML = '<div class="prevdays-empty">No previous days logged yet. Every day you log builds the record.</div>';
  } else {
    sorted.forEach(entry => {
      const d = new Date(entry.date + 'T12:00:00');
      const dateStr = d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
      const dayStr  = d.toLocaleDateString('en-US',{weekday:'long'});
      const checkins = Object.values(entry.cards||{}).filter(c=>c.val===true).length;
      const el = document.createElement('div');
      el.className = 'prevday-card';
      el.innerHTML =
        '<div class="prevday-row">' +
          '<div>' +
            '<div class="prevday-date">' + dateStr + '</div>' +
            '<div class="prevday-day">' + dayStr + ' · ' + checkins + ' check-ins</div>' +
          '</div>' +
          '<div class="prevday-right">' +
            '<div class="prevday-grade">' + (entry.grade||'—') + '</div>' +
            '<div class="prevday-score">' + (entry.score||0) + '</div>' +
          '</div>' +
        '</div>' +
        (entry.intention ? '<div class="prevday-intent">"' + esc(entry.intention) + '"</div>' : '') +
        (entry.win       ? '<div class="prevday-win">🏆 ' + esc(entry.win) + '</div>' : '');
      body.appendChild(el);
    });
  }
  document.getElementById('prevdaysOverlay').classList.add('open');
}
function closePrevDays(e) {
  if (e && e.target !== document.getElementById('prevdaysOverlay')) return;
  document.getElementById('prevdaysOverlay').classList.remove('open');
}

// ─────────────────────────────────────────────────────
// APPLE TIME PICKER — updated handler
// ─────────────────────────────────────────────────────
function applyAtpDisplay(type, val) {
  const isWake = type === 'wake';
  const dispId   = isWake ? 'wakeDisplay' : 'bedDisplay';
  const periodId = isWake ? 'wakePeriod'  : 'bedPeriod';
  const btnId    = isWake ? 'wakeBtn'     : 'bedBtn';
  const disp   = document.getElementById(dispId);
  const period = document.getElementById(periodId);
  const btn    = document.getElementById(btnId);
  const dur    = document.getElementById('sleepDurDisplay');
  if (!val) {
    if (disp)   { disp.textContent = '—:——'; disp.classList.add('empty'); }
    if (period) period.textContent = '';
    if (btn)    btn.classList.remove('filled');
  } else {
    const [h,m] = val.split(':').map(Number);
    const ampm  = h >= 12 ? 'PM' : 'AM';
    const hr    = h % 12 || 12;
    const fmt   = hr + ':' + String(m).padStart(2,'0');
    if (disp)   { disp.textContent = fmt; disp.classList.remove('empty'); }
    if (period) period.textContent = ampm;
    if (btn)    btn.classList.add('filled');
  }
  // Recalc duration
  if (S.wakeTime && S.bedTime && dur) {
    const [wh,wm] = S.wakeTime.split(':').map(Number);
    const [bh,bm] = S.bedTime.split(':').map(Number);
    let mins = (wh*60+wm) - (bh*60+bm);
    if (mins < 0) mins += 1440;
    dur.textContent = Math.floor(mins/60) + 'h ' + (mins%60) + 'm';
    dur.classList.remove('empty');
  } else if (dur) { dur.textContent = '—'; dur.classList.add('empty'); }
  if (S.wakeTime && S.bedTime) { doFlash('flash-sleep'); showBadge('check-sleep'); }
  updateSleepPill();
}


// ─────────────────────────────────────────────────────
// SLEEP/WAKE BUTTON — context-aware (before 9pm = wake, after = sleep)
// ─────────────────────────────────────────────────────
function updateSleepBtn() {
  const btn   = document.getElementById('sleepBtnTxt');
  const title = document.getElementById('smTitle');
  const sub   = document.getElementById('smSub');
  const wlbl  = document.getElementById('smWakeLbl');
  const bedRow= document.getElementById('smBedRow');
  const h = new Date().getHours();
  const isSleepTime = h >= 21; // 9pm+
  if (btn)    btn.textContent   = isSleepTime ? 'Log Sleep'   : 'Log Wake Up';
  if (title)  title.textContent = isSleepTime ? 'Log Sleep'   : 'Log Wake Up';
  if (sub)    sub.textContent   = isSleepTime ? 'What time are you going to sleep?' : 'What time did you wake up today?';
  if (wlbl)   wlbl.textContent  = isSleepTime ? 'Sleep time'  : 'Wake up time';
  if (bedRow) bedRow.style.display = isSleepTime ? 'none' : '';
}

// ─────────────────────────────────────────────────────
// NOTES — word count meta
// ─────────────────────────────────────────────────────
function updateNotesMeta() {
  const ta   = document.getElementById('sbNotesTa');
  const meta = document.getElementById('sbNotesMeta');
  if (!ta || !meta) return;
  const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
  meta.textContent = words > 0 ? words + (words === 1 ? ' word' : ' words') : '';
}

// ─────────────────────────────────────────────────────
// REMINDERS
// ─────────────────────────────────────────────────────
function toggleReminders() {
  const ov = document.getElementById('remindersOverlay');
  if (!ov) return;
  if (ov.classList.contains('open')) {
    closeReminders();
  } else {
    renderReminderList();
    ov.classList.add('open');
  }
}
function closeReminders() {
  const ov = document.getElementById('remindersOverlay');
  if (ov) ov.classList.remove('open');
}
function handleReminderOverlayClick(e) {
  const panel = document.getElementById('remindersPanel');
  if (panel && !panel.contains(e.target)) closeReminders();
}
function addReminder() {
  const inp  = document.getElementById('rpInp');
  const time = document.getElementById('rpTime');
  const text = inp ? inp.value.trim() : '';
  if (!text) { if(inp) inp.focus(); return; }
  if (!S.reminders) S.reminders = [];
  S.reminders.push({ id: uid(), text, time: time ? time.value : '', done: false, ts: Date.now() });
  if (inp)  inp.value  = '';
  if (time) time.value = '';
  saveToStorage();
  renderReminderList();
  updateReminderBadge();
  if (inp) inp.focus();
}
function toggleReminderDone(id) {
  if (!S.reminders) return;
  const r = S.reminders.find(x => x.id === id);
  if (r) { r.done = !r.done; saveToStorage(); renderReminderList(); updateReminderBadge(); }
}
function deleteReminder(id) {
  if (!S.reminders) return;
  S.reminders = S.reminders.filter(x => x.id !== id);
  saveToStorage(); renderReminderList(); updateReminderBadge();
}
function renderReminderList() {
  const list  = document.getElementById('rpList');
  const empty = document.getElementById('rpEmpty');
  const count = document.getElementById('rpCount');
  if (!list) return;
  const all = S.reminders || [];
  const pending = all.filter(r => !r.done).length;
  if (count) count.textContent = pending + ' pending';
  list.innerHTML = '';
  if (!all.length) { if(empty) { list.appendChild(empty); empty.style.display=''; } return; }
  if (empty) empty.style.display = 'none';
  const sorted = [...all].sort((a,b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.ts - b.ts;
  });
  sorted.forEach(r => {
    const el = document.createElement('div');
    el.className = 'rp-item' + (r.done ? ' done' : '');
    el.innerHTML =
      '<div class="rp-cb' + (r.done ? ' on' : '') + '" onclick="toggleReminderDone(\'' + r.id + '\')">' + (r.done ? '&#10003;' : '') + '</div>' +
      '<div class="rp-item-body">' +
        '<div class="rp-item-text">' + esc(r.text) + '</div>' +
        (r.time ? '<div class="rp-item-time">' + fmtTime(r.time) + '</div>' : '') +
      '</div>' +
      '<button class="rp-del" onclick="deleteReminder(\'' + r.id + '\')" title="Delete">&#215;</button>';
    list.appendChild(el);
  });
}
function updateReminderBadge() {
  const dot = document.getElementById('notifDot');
  if (!dot) return;
  const n = (S.reminders || []).filter(r => !r.done).length;
  dot.textContent = n > 9 ? '9+' : n;
  dot.classList.toggle('show', n > 0);
}
function checkReminderAlerts() {
  if (!S.reminders) return;
  const now = new Date();
  const hhmm = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  S.reminders.forEach(r => {
    if (!r.done && r.time && r.time === hhmm && !r._alerted) {
      r._alerted = true;
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('SteedOS', { body: r.text });
      }
      updateReminderBadge();
    }
  });
}


// ─────────────────────────────────────────────
// PILLAR SCORES
// ─────────────────────────────────────────────
function calcPillarScores() {
  const pts = {agency:0, content:0, music:0, health:0};
  const max = {agency:0, content:0, music:0, health:0};
  Object.entries(CARDS).forEach(([id, cfg]) => {
    const p = cfg.p, w = W[id] || 0;
    max[p] = (max[p] || 0) + w;
    if (S.cards[id]?.val === true) pts[p] = (pts[p] || 0) + w;
  });
  return {
    agency:  max.agency  > 0 ? Math.round((pts.agency  / max.agency)  * 100) : 0,
    content: max.content > 0 ? Math.round((pts.content / max.content) * 100) : 0,
    music:   max.music   > 0 ? Math.round((pts.music   / max.music)   * 100) : 0,
    health:  max.health  > 0 ? Math.round((pts.health  / max.health)  * 100) : 0,
  };
}

// ─────────────────────────────────────────────
// WIDGET DASHBOARD UPDATES
// ─────────────────────────────────────────────
function updateWidgets() {
  const score = S.score || 0;

  // Score widget
  const wScore = document.getElementById('topScoreWidget');
  const wVerdict = document.getElementById('swVerdict');
  const wBar = document.getElementById('swBarFill');
  if (wScore)   wScore.textContent  = score;
  if (wVerdict) wVerdict.textContent = score === 0 ? 'Log your day.' : score >= 80 ? 'Elite day.' : score >= 60 ? 'Solid progress.' : score >= 40 ? 'Keep pushing.' : 'Just getting started.';
  if (wBar)     wBar.style.width    = Math.min(100, score) + '%';

  // Pillar widgets
  const pillars = calcPillarScores ? calcPillarScores() : null;
  if (pillars) {
    const ag = pillars.agency || 0, ct = pillars.content || 0;
    const wAg = document.getElementById('swAgency');
    const wAgB = document.getElementById('swAgencyBar');
    const wCt  = document.getElementById('swContent');
    const wCtB = document.getElementById('swContentBar');
    if (wAg)  wAg.textContent  = ag + '%';
    if (wAgB) wAgB.style.width = ag + '%';
    if (wCt)  wCt.textContent  = ct + '%';
    if (wCtB) wCtB.style.width = ct + '%';
  }

  // Streak widget
  const maxStreak = Math.max(S.streakWorkout||0, S.streakContent||0, S.streakOutreach||0, S.streakMusic||0);
  const wStr  = document.getElementById('swStreak');
  const wStrB = document.getElementById('swStreakBar');
  if (wStr)  wStr.textContent  = maxStreak;
  if (wStrB) wStrB.style.width = Math.min(100, maxStreak * 10) + '%';

  // Sync score pill in topbar too
  const pill = document.getElementById('topScorePill');
  if (pill) pill.textContent = score + ' / 100';
}


// ─────────────────────────────────────────────────────
// SECTION: UI MODES — Focus / Planning / Reflection
// Front-end display state only. No backend needed yet.
// ─────────────────────────────────────────────────────
function setMode(mode, silent) {
  S.uiMode = mode;
  if (!silent) saveToStorage();

  // Mode map: 'planning' -> 'Planning' for button IDs
  const modeMap = { focus: 'Focus', planning: 'Planning', reflection: 'Reflection' };

  // Update pill active states
  Object.entries(modeMap).forEach(([k, v]) => {
    const el = document.getElementById('mode' + v);
    if (el) el.classList.toggle('is-active', k === mode);
  });

  // ── Panel visibility ──
  // Focus: show primaryZone + focusGoals + sessionStub + sec-sessions
  // Planning: show planPanel + primaryZone (smaller) + bento-stats
  // Reflection: show reflectPanel + bento-stats

  const focusEls   = ['primaryZone', 'focusGoals'];
  const planEls    = ['planPanel'];
  const reflectEls = ['reflectPanel'];
  const bentoStats = document.querySelector('.bento-stats');
  const sessions   = document.getElementById('sec-sessions');

  focusEls.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (mode === 'focus') ? '' : 'none';
  });
  planEls.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (mode === 'planning') ? '' : 'none';
  });
  reflectEls.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (mode === 'reflection') ? '' : 'none';
  });

  // Bento stats: hidden in focus, visible in plan+reflect
  if (bentoStats) bentoStats.style.display = (mode === 'focus') ? '' : 'none';

  // Sessions section: focus mode only
  if (sessions) sessions.style.display = (mode === 'focus') ? '' : 'none';

  // Sidebar de-emphasis in focus
  const sb = document.getElementById('sidebar');
  // Sidebar stays fully active in all modes — no greying out

  if (mode === 'reflection') {
    setTimeout(initTypeform, 80);
    restorePlanFields();
  }
  if (mode === 'planning') {
    restorePlanFields();
    // Show tomorrow's date
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dateEl = document.getElementById('planDateDisplay');
    if (dateEl) dateEl.textContent = tomorrow.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
    // Also pre-populate from saved tomorrow plan
    const plan = (typeof loadTomorrowPlan === 'function') ? loadTomorrowPlan() : {};
    const sv = (id, v) => { const el = document.getElementById(id); if(el && !el.value && v) el.value = v; };
    sv('planPrimaryInline', plan.primary);
    sv('planGoalA1', plan.goal1); sv('planGoalA2', plan.goal2);
    sv('planGoalA3', plan.goal3); sv('planGoalA4', plan.goal4); sv('planGoalA5', plan.goal5);
    sv('planBlockA9', plan.block9); sv('planBlockA12', plan.block12);
    sv('planBlockA3', plan.block3); sv('planBlockA7', plan.block7);
    sv('planLearnInline', plan.learn1);
    sv('planWorkoutInline', plan.workout);
    sv('planDumpInline', plan.notes);
  }
}

// ─────────────────────────────────────────────────────
// Session stub — shows current session name + progress
// ─────────────────────────────────────────────────────
function updateSessionStub() {
  const dot   = document.getElementById('ssDot');
  const label = document.getElementById('ssLabel');
  const sub   = document.getElementById('ssSub');
  const badge = document.getElementById('badge-sessions-stub');
  if (!label) return;

  const now = new Date();
  const h = now.getHours();
  let name = 'Daily Check-ins';
  let isActive = false;

  if      (h >= 7  && h < 10) { name = 'Morning Block';   isActive = true; }
  else if (h >= 10 && h < 13) { name = 'Midday Block';    isActive = true; }
  else if (h >= 13 && h < 17) { name = 'Afternoon Block'; isActive = true; }
  else if (h >= 17 && h < 21) { name = 'Evening Block';   isActive = true; }

  if (label) label.textContent = name;
  if (sub)   sub.textContent   = isActive ? 'Active now →' : 'Not yet open';
  if (dot)   dot.classList.toggle('ss-dot-active', isActive);

  // Mirror the sessions badge
  const mainBadge = document.getElementById('badge-sessions');
  if (badge && mainBadge) badge.textContent = mainBadge.textContent;
}

function openSessionSection() {
  const sec = document.getElementById('sec-sessions');
  if (!sec) return;
  // In focus mode, temporarily show sessions section and scroll
  sec.style.display = '';
  const body = document.getElementById('body-sessions');
  if (body) {
    body.style.maxHeight = '6000px';
    body.classList.remove('is-closed');
    const hdr = sec.querySelector('.coll-hdr');
    if (hdr) hdr.classList.remove('is-closed');
  }
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─────────────────────────────────────────────────────
// Sparkline + Momentum indicator
// Reads last 7 days of history scores
// ─────────────────────────────────────────────────────
function renderSparkline() {
  const svg = document.getElementById('tbSparkline');
  const mom = document.getElementById('tbMomentum');
  if (!svg || !S.history || S.history.length < 2) {
    if (mom) mom.textContent = '';
    return;
  }

  // Get last 7 days (sorted ascending)
  const last7 = [...S.history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map(d => d.score || 0);

  if (last7.length < 2) { if (mom) mom.textContent = ''; return; }

  const W = 48, H = 18, pad = 2;
  const min = 0, max = 100;
  const xStep = (W - pad * 2) / (last7.length - 1);
  const yScale = v => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  const pts = last7.map((v, i) => [pad + i * xStep, yScale(v)]);
  const d = pts.map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(' ');

  svg.innerHTML = `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Momentum label
  const recent = last7.slice(-3);
  const avg3 = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prev  = last7.slice(-6, -3);
  const avg3p = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : avg3;
  const delta = avg3 - avg3p;

  if (mom) {
    if (delta > 8)       mom.textContent = '↑ Compounding';
    else if (delta < -8) mom.textContent = '↓ Slipping';
    else                 mom.textContent = '→ Stable';
    mom.className = 'tb-momentum ' + (delta > 8 ? 'mom-up' : delta < -8 ? 'mom-down' : 'mom-flat');
  }
}


/* ══════════════════════════════════════════════════════
   REFLECT MODE — Typeform sequential
══════════════════════════════════════════════════════ */
const EFFORT_LABELS = {
  A: 'Full send. Maximum effort.',
  B: "Solid. Could've pushed more.",
  C: 'Below standard. You know it.',
  D: "Minimal. Almost didn't show up."
};

// setEffort: called by legacy eg-btn AND tfSetEffort
function setEffort(pillar, grade, btn) {
  if (!S.effortGrades) S.effortGrades = {};
  S.effortGrades[pillar] = grade;
  saveToStorage();
}

function updateReflectJournalMeta() {
  const ta   = document.getElementById('reflectJournal');
  const meta = document.getElementById('reflectJournalMeta');
  if (!ta || !meta) return;
  const words = ta.value.trim().split(/\s+/).filter(Boolean).length;
  meta.textContent = words > 0 ? words + ' words' : '';
}

function restoreReflectFields() {
  const fields = {
    refWin:         'win',
    refAvoid:       'avoid',
    refImprove:     'reflectImprove',
    reflectJournal: 'reflectJournal',
  };
  Object.entries(fields).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && S[key]) el.value = S[key];
  });
  const rj = document.getElementById('reflectJournal');
  if (rj && !rj._metaBound) {
    rj.addEventListener('input', updateReflectJournalMeta);
    rj._metaBound = true;
  }
}
/* ══════════════════════════════════════════════════════
   TYPEFORM — REFLECT MODE JS
   Sequential questionnaire: 8 steps, keyboard nav
══════════════════════════════════════════════════════ */

const TF_TOTAL = 8;
let tfCurrent = 0;

function tfGo(step) {
  const slides = document.querySelectorAll('.tf-slide');
  if (!slides.length) return;
  step = Math.max(0, Math.min(TF_TOTAL - 1, step));

  slides.forEach((sl, i) => {
    sl.classList.remove('is-active', 'is-above');
    if (i === step)      sl.classList.add('is-active');
    else if (i < step)   sl.classList.add('is-above');
  });

  tfCurrent = step;

  // Progress bar
  const fill = document.getElementById('tfProgressFill');
  if (fill) fill.style.width = ((step + 1) / TF_TOTAL * 100) + '%';

  // Step counter
  const counter = document.getElementById('tfStepCounter');
  if (counter) counter.textContent = (step + 1) + ' of ' + TF_TOTAL;

  // Arrow states
  const up   = document.getElementById('tfUp');
  const down = document.getElementById('tfDown');
  if (up)   up.disabled   = step === 0;
  if (down) down.disabled = step === TF_TOTAL - 1;

  // Auto-focus the input on the new step
  setTimeout(() => {
    const active = document.getElementById('tfs-' + step);
    if (!active) return;
    const inp = active.querySelector('input, textarea');
    if (inp) inp.focus();
  }, 60);
}

function tfNext(step) {
  if (step < TF_TOTAL - 1) tfGo(step + 1);
}

// Grade selection auto-advances after short delay
function tfSetEffort(pillar, grade, btn, step) {
  setEffort(pillar, grade, btn);
  // Update tf-grade-btn active state
  const container = btn.closest('.tf-grade-grid');
  if (container) {
    container.querySelectorAll('.tf-grade-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.grade === grade);
    });
  }
  // Update meaning text
  const meaning = document.getElementById('efMeaning' + pillar.charAt(0).toUpperCase() + pillar.slice(1));
  if (meaning) meaning.textContent = EFFORT_LABELS[grade] || '';
  // Auto-advance after 600ms
  if (step < TF_TOTAL - 1) setTimeout(() => tfGo(step + 1), 600);
}

// Keyboard: Enter or ↓ = next, ↑ = back (on textarea: Shift+Enter = next)
function tfHandleKey(e, step) {
  if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
    tfNext(step);
  }
  if (e.key === 'Enter' && e.shiftKey && e.target.tagName === 'TEXTAREA') {
    e.preventDefault();
    tfNext(step);
  }
}

// Global keyboard nav when reflect is active
function tfGlobalKey(e) {
  if (S.uiMode !== 'reflection') return;
  const active = document.activeElement;
  const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
  if (isInput) return; // don't hijack typed chars
  if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); tfGo(tfCurrent + 1); }
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); tfGo(tfCurrent - 1); }
}
document.addEventListener('keydown', tfGlobalKey);

// Restore grades into tf-grade-btn active states
function restoreEffortGrades() {
  if (!S.effortGrades) return;
  const pillars = ['agency','content','music','health'];
  pillars.forEach(p => {
    const grade = S.effortGrades[p];
    if (!grade) return;
    const capP = p.charAt(0).toUpperCase() + p.slice(1);
    const container = document.getElementById('effort' + capP);
    if (container) {
      // Legacy eg-btn support
      container.querySelectorAll('.eg-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.trim() === grade);
      });
      // New tf-grade-btn
      container.querySelectorAll('.tf-grade-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.grade === grade);
      });
    }
    const meaningEl = document.getElementById('efMeaning' + capP);
    if (meaningEl) meaningEl.textContent = EFFORT_LABELS[grade] || '';
  });
}

// On entering reflection mode: initialize from step 0 or furthest answered
function initTypeform() {
  // Restore field values
  restoreReflectFields();
  restoreEffortGrades();
  // Find first unanswered step
  const vals = [
    document.getElementById('refWin')?.value,
    document.getElementById('refAvoid')?.value,
    document.getElementById('refImprove')?.value,
    S.effortGrades?.agency,
    S.effortGrades?.content,
    S.effortGrades?.music,
    S.effortGrades?.health,
    document.getElementById('reflectJournal')?.value,
  ];
  let startStep = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i]) startStep = i;
    else break;
  }
  tfGo(startStep);
}


/* ══════════════════════════════════════════════════════
   PLAN MODE — field restore + helpers
══════════════════════════════════════════════════════ */
function collectPlanGoals() {
  const goals = [];
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById('planGoalA' + i);
    if (el) goals.push(el.value);
  }
  return goals;
}

function collectPlanBlocks() {
  const blocks = {};
  ['9','12','3','7'].forEach(t => {
    const el = document.getElementById('planBlockA' + t);
    if (el) blocks[t] = el.value;
  });
  return blocks;
}

function restorePlanFields() {
  // Primary
  const pp = document.getElementById('planPrimaryInline');
  if (pp && S.planPrimary) pp.value = S.planPrimary;

  // Goals
  const goals = S.planGoals || [];
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById('planGoalA' + (i+1));
    if (el && goals[i]) el.value = goals[i];
  }

  // Blocks
  const blocks = S.planBlocks || {};
  ['9','12','3','7'].forEach(t => {
    const el = document.getElementById('planBlockA' + t);
    if (el && blocks[t]) el.value = blocks[t];
  });

  // Learn
  const pl = document.getElementById('planLearnInline');
  if (pl && S.planLearn) pl.value = S.planLearn;

  // Workout
  const pw = document.getElementById('planWorkoutInline');
  if (pw && S.planWorkout) pw.value = S.planWorkout;

  // Brain dump
  const pd = document.getElementById('planDumpInline');
  if (pd && S.planDump) pd.value = S.planDump;
}

function togglePlanChip(btn) {
  btn.classList.toggle('on');
  if (!S.planWorkoutChips) S.planWorkoutChips = [];
  const label = btn.textContent.trim();
  const idx = S.planWorkoutChips.indexOf(label);
  if (idx >= 0) S.planWorkoutChips.splice(idx, 1);
  else S.planWorkoutChips.push(label);
  saveToStorage();
}

/* ══════════════════════════════════════════════════════
   DAILY COMMAND — restore
══════════════════════════════════════════════════════ */
function restoreDailyCommand() {
  const el = document.getElementById('tbCommand');
  if (!el) return;
  if (S.dailyCommand) {
    el.value = S.dailyCommand;
  } else {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    el.placeholder = days[new Date().getDay()] + ' — ship one thing that matters.';
  }
}

/* ══════════════════════════════════════════════════════
   MOMENTUM SPARKLINE
══════════════════════════════════════════════════════ */
function updateMomentum() {
  const svg = document.getElementById('tbSparkline');
  const lbl = document.getElementById('tbMomentum');
  if (!svg) return;

  const history = S.history || [];
  const today = new Date();
  const scores = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const entry = history.find(h => h && h.date === key);
    scores.push(entry ? (entry.score || 0) : null);
  }

  const W = 48, H = 18;
  const valid = scores.filter(s => s !== null);
  const maxS = valid.length ? Math.max(...valid, 1) : 100;

  const pts = scores.map((s, i) => {
    const x = (i / 6) * W;
    const y = s === null ? H/2 : H - ((s / maxS) * (H - 4)) - 2;
    return [x.toFixed(1), y.toFixed(1)];
  });

  const d = pts.map((p,i) => (i===0?'M':'L') + p[0] + ',' + p[1]).join(' ');
  svg.innerHTML = '<path d="' + d + '" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';

  if (lbl) {
    const recent = valid.slice(-3), older = valid.slice(0,-3);
    const avgR = recent.length ? recent.reduce((a,b)=>a+b,0)/recent.length : 0;
    const avgO = older.length  ? older.reduce((a,b)=>a+b,0)/older.length  : avgR;
    lbl.textContent = avgR > avgO + 5 ? '🔥 Compounding' : avgR < avgO - 5 ? '⚠ Slipping' : '→ Stable';
  }
}

/* ══════════════════════════════════════════════════════
   INIT HOOK — additional setup after main init()
══════════════════════════════════════════════════════ */
// NOTE: init() is called at the bottom of the script and runs synchronously
// after the DOM is parsed (scripts are deferred by position). The items below
// are called inside init() already; this block only remains for safety on
// any browsers that need the extra defer.
document.addEventListener('DOMContentLoaded', function() {
  if (typeof updateMomentum === 'function') updateMomentum();
});

function confirmPlanSaved() {
  savePlanMode();
  const btn = document.getElementById('planAutosaveNote') ? document.querySelector('.plan-save-confirm-btn') : null;
  if (btn) {
    btn.textContent = 'Saved ✓';
    btn.classList.add('confirmed');
    setTimeout(() => { btn.textContent = 'Plan locked in ✓'; btn.classList.remove('confirmed'); }, 2000);
  }
  const note = document.getElementById('planAutosaveNote');
  if (note) { note.textContent = 'Plan saved — tomorrow is set.'; }
}