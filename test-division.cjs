// Run with node test-division.cjs. Exercise the actual app without Google or a DOM.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
scripts.forEach(s => new vm.Script(s));
const app = scripts.find(s => s.includes('function chooseNextProblem'));
const ctx = {console, localStorage:{getItem:()=>null}, window:{addEventListener(){}}, setTimeout:()=>0, clearTimeout(){}};
vm.createContext(ctx);
vm.runInContext(app.replace('    init();', `    globalThis.api = {chooseNextProblem, buildLevel100TablePool, choosePresentation,
  getActiveModel, checkGraduation, blankStats, getFactStats, getFactKey, updateFactStats,
  rememberRecentProblemFamily, clearProblemHistory, buildSafeFallbackPool,
  unwrapDriveProgress, buildClassroomRoundPayload, isClassroomReceiverNameAcceptable,
  state, classroomState, syncState, el, renderProgressGrid, updatePracticeHeader,
  renderProgressGraph, setGraphRange: value => { graphShowAllResults = value; },
  defaultProgress, stopRound, setSyncStatus, retryLastClassroomSubmit,
  setPracticeLocked, handleKeypad, triggerTimeout, handleAnswerInput,
  setSessionMode: value => { sessionMode = value; },
  setRound: value => { round = value; }};`), ctx);
const a = ctx.api;
const progress = {currentTable:2,factStats:{},sessionHistory:[],sessionsCompleted:0};
assert.deepEqual(Array.from(a.getActiveModel(progress).activeFacts), [2,3]);
assert.equal(a.checkGraduation(progress),false);
function valid(p) {
  assert.equal(p.left / p.right, p.answer);
  assert.equal(p.right, p.table);
  assert.equal(p.answer, p.second);
  assert.ok(p.answer >= 2 && p.answer <= 12);
}
let previous;
for (let divisor=2; divisor<=12; divisor++) {
  progress.currentTable=divisor;
  for (const p of a.buildLevel100TablePool(divisor,null,progress)) valid(p);
  for (let i=0; i<100; i++) {
    const p=a.chooseNextProblem(previous,progress).problem;
    valid(p);
    if(previous) assert.notEqual(p.displayKey,previous.displayKey);
    a.rememberRecentProblemFamily(p); previous=p;
  }
}
const one=a.buildLevel100TablePool(2,null,progress)[1];
valid(a.buildSafeFallbackPool([one],one,[])[0]);
assert.equal(a.unwrapDriveProgress({app:'FactFlow',progress}),null);
assert.equal(a.unwrapDriveProgress({app:'DivisionFlow',progress}),progress);
assert.ok(html.includes("var DRIVE_FILE_NAME = 'divisionflow_data.json'"));
assert.ok(!/localStorage\.[^(]+\('factflow/.test(html));
assert.equal(a.isClassroomReceiverNameAcceptable({receiver:'factflow-practice-v1'}),false);
assert.equal(a.isClassroomReceiverNameAcceptable({}),false);
assert.equal(a.isClassroomReceiverNameAcceptable({receiver:'divisionflow-practice-v1'}),true);
assert.equal(a.buildClassroomRoundPayload({},progress).app,'DivisionFlowPractice');
// Unlocking remains tied to the divisor/quotient pair, never its inverse.
progress.currentTable=2;
for (const q of [2,3]) {
  const s=a.blankStats(); Object.assign(s,{shown:8,correct:8,mastery:1,avgMs:1000,
    recent:Array.from({length:4},()=>({isCorrect:true,timeout:false,responseMs:1000}))});
  progress.factStats[a.getFactKey(2,q)]=s;
}
assert.equal(a.getActiveModel(progress).maxSecond,4);
assert.equal(a.getFactStats(3,2,progress).shown,0);
a.el.progressGrid={};a.el.practiceTitle={};a.el.practiceSubtitle={};
a.renderProgressGrid(progress);a.updatePracticeHeader(progress);
assert.ok(a.el.progressGrid.innerHTML.includes('6 ÷ 2 = 3'));
assert.match(a.el.practiceTitle.textContent, /divide-by-2/);
assert.ok(a.el.practiceSubtitle.textContent.includes('8 ÷ 2'));
assert.match(a.el.progressGrid.innerHTML, /<th scope="col"/);
assert.match(a.el.progressGrid.innerHTML, /<th scope="row"/);
assert.ok(a.el.progressGrid.innerHTML.includes('6 divided by 2 equals 3. Learning'));
assert.ok(a.el.progressGrid.innerHTML.includes('8 divided by 2 equals 4. Not started'));
assert.match(a.el.progressGrid.innerHTML, /12 divided by 3 equals 4\. Locked/);
assert.match(html, /<section[^>]*id="practiceEntry"[\s\S]*?id="googleSignInBtn"/);
assert.equal((html.match(/id="googleSignInBtn"/g) || []).length, 1);
assert.match(html, /<dialog[^>]*id="hapticsInfoOverlay"/);
assert.match(html, /<dialog[^>]*id="scoreInfoOverlay"/);
assert.match(html, /id="roundResult"[^>]*role="status"/);
assert.match(html, /id="feedbackPill"[^>]*role="status"><\/div>/);
assert.match(html, /<label[^>]*for="timeoutInput"/);
assert.match(html, /<details[^>]*id="progressResults"/);

function makeNode() {
  const classes = new Set();
  return {
    children: [],
    value: '',
    get textContent() { return this.text; },
    set textContent(value) { this.text = String(value); this.children = []; },
    classList: {
      add: (...values) => values.forEach(value => classes.add(value)),
      remove: (...values) => values.forEach(value => classes.delete(value)),
      contains: value => classes.has(value),
      toggle: (value, on) => on ? classes.add(value) : classes.delete(value)
    },
    appendChild(child) { this.children.push(child); },
    focus() { ctx.document.activeElement = this; },
    contains(child) { return this.children.includes(child); }
  };
}

async function checkPracticeUi() {
  const intervals = new Map();
  let timerId = 0;
  ctx.setInterval = callback => { intervals.set(++timerId, callback); return timerId; };
  ctx.clearInterval = id => intervals.delete(id);
  ctx.document = {
    body: makeNode(), querySelectorAll: () => [],
    createElement: makeNode, createDocumentFragment: makeNode
  };
  ctx.document.activeElement = ctx.document.body;
  ctx.navigator = {onLine:true};
  ctx.localStorage.setItem = () => {};
  ctx.sessionStorage = {getItem: () => null, setItem: () => {}};
  ctx.console = {log() {}, warn() {}, error() {}};
  for (const name of ['progressGraph','progressResultsRows','progressResultsEmpty',
    'progressResultsTable','roundResult','roundStatus','roundStatePill','problemText','scoreNote',
    'startBtn','answerInput','timeoutInput','timeoutOverlay','timeoutAnnouncement',
    'feedbackPill','graduateBanner','timeoutAnswer','correctValue','streakValue',
    'practiceEntry','practiceEntryClass','practiceEntryStatus','practiceSignIn','practiceLayout','googleSignInBtn',
    'classroomSubmitBox','classroomBadge',
    'classroomSubmitStatus','classroomRetryBtn']) {
    a.el[name] = makeNode();
  }

  const oldHistory = a.defaultProgress();
  a.renderProgressGraph(oldHistory);
  assert.ok(a.el.progressResultsTable.classList.contains('hidden'));
  oldHistory.sessionHistory = [{session:1}].concat(Array.from({length:11}, (_, i) =>
    ({session:i + 2, date:'2026-11-07', accuracy:0, fpm:0})));
  a.renderProgressGraph(oldHistory);
  let rows = a.el.progressResultsRows.children[0].children;
  assert.equal(rows.length, 10);
  assert.deepEqual(rows[0].children.slice(2).map(cell => cell.textContent), ['0','0%','0']);
  assert.ok(a.el.progressGraph.innerHTML.includes('data-acc="0%" data-fpm="0 facts/min"'));
  a.setGraphRange(true);
  a.renderProgressGraph(oldHistory);
  rows = a.el.progressResultsRows.children[0].children;
  assert.equal(rows.length, 12);
  assert.deepEqual(rows[0].children.slice(1).map(cell => cell.textContent),
    ['Unavailable','0','Unavailable','Unavailable']);

  function seedRound(progress, correct = 1, graduated = false) {
    a.setRound({startedAt:Date.now() - 60000, durationSec:60, correct, attempted:correct,
      bestStreak:correct, progress, focusTable:progress.currentTable, graduated});
  }
  a.el.keyButtons = [];
  a.el.practiceLayout.appendChild(a.el.answerInput);
  a.el.practiceEntry.appendChild(a.el.googleSignInBtn);
  a.el.answerInput.focus();
  a.setPracticeLocked(true, 'Sign in with Google to start.');
  assert.ok(a.el.practiceLayout.classList.contains('hidden'));
  assert.equal(ctx.document.activeElement, a.el.googleSignInBtn);
  a.syncState.signedIn = true;
  a.setSessionMode('google');
  a.setPracticeLocked(true, 'Loading your Google progress...');
  assert.ok(a.el.practiceSignIn.classList.contains('hidden'));
  assert.equal(ctx.document.activeElement, a.el.practiceEntryStatus);
  assert.equal(a.el.practiceEntryStatus.textContent, 'Loading your Google progress...');
  a.setPracticeLocked(false);
  assert.ok(a.el.practiceEntry.classList.contains('hidden'));

  const answerProgress = a.defaultProgress();
  a.setRound({progress:answerProgress, startedAt:Date.now(), durationSec:60, timeoutSec:4,
    currentProblem:{left:20,right:2,answer:10,table:2,second:10}, problemStartTime:Date.now(),
    correct:0, attempted:0, timeoutsTriggered:0});
  a.el.answerInput.disabled = false;
  a.el.answerInput.focus();
  a.handleKeypad('1');
  a.handleAnswerInput();
  assert.equal(a.el.answerInput.value, '1');
  a.handleKeypad('1');
  a.handleAnswerInput();
  assert.equal(a.el.answerInput.value, '');
  assert.equal(a.el.feedbackPill.textContent, 'Try again');
  a.triggerTimeout();
  assert.equal(ctx.document.activeElement, a.el.timeoutInput);
  assert.equal(a.el.feedbackPill.textContent, '');
  a.handleKeypad('1');
  a.handleKeypad('0');
  assert.equal(ctx.document.activeElement, a.el.answerInput);
  assert.ok(a.el.timeoutInput.disabled);
  a.syncState.signedIn = false;
  a.setSessionMode('signed-out');

  const sent = [];
  ctx.fetch = async (_url, options) => {
    sent.push(JSON.parse(options.body));
    return {text: async () => JSON.stringify(sent.length === 1
      ? {ok:false, error:'Mock failure'}
      : {ok:true, receiver:'divisionflow-practice-v1', spreadsheetId:'mock-sheet'})};
  };
  Object.assign(a.classroomState, {enabled:true, teacherKey:'mock-class',
    teacherName:'Mock class', expectedSpreadsheetId:'mock-sheet',
    submitUrl:'https://script.google.com/macros/s/mock/exec'});
  a.syncState.googleUser = {name:'Mock Student', email:'student@example.invalid'};
  seedRound(a.defaultProgress());
  a.stopRound(true, 'time-up');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.el.roundResult.textContent, '1 correct.');
  assert.equal(a.el.classroomSubmitStatus.textContent, 'Mock failure');
  assert.equal(sent.length, 1);
  a.retryLastClassroomSubmit();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(sent.length, 2);
  assert.equal(sent[1].roundId, sent[0].roundId);
  assert.match(a.el.classroomSubmitStatus.textContent, /Class progress sent/);
  a.setSyncStatus('synced', 'Mock sync complete');
  for (const tick of intervals.values()) for (let i = 0; i < 5; i++) tick();
  assert.equal(a.el.roundResult.textContent, '1 correct.');
  assert.ok(a.el.scoreNote.classList.contains('visible'));
  a.stopRound(false, 'new-round');
  assert.equal(a.el.roundResult.textContent, '');
  assert.equal(a.el.scoreNote.textContent, '');

  a.classroomState.enabled = false;
  const graduated = a.defaultProgress();
  graduated.currentTable = 3;
  seedRound(graduated, 2, true);
  a.stopRound(true, 'time-up');
  assert.match(a.el.roundResult.textContent, /2 correct\. You unlocked the divide-by-3 table!/);

  const mastered = a.defaultProgress();
  mastered.currentTable = 12;
  for (let divisor = 2; divisor <= 12; divisor++) {
    for (let answer = 2; answer <= 12; answer++) {
      const stats = a.blankStats();
      Object.assign(stats, {shown:8, correct:8, mastery:1, confidence:100, masteryFlag:true,
        recent:Array.from({length:6}, () => ({isCorrect:true,timeout:false,responseMs:500}))});
      mastered.factStats[a.getFactKey(divisor, answer)] = stats;
    }
  }
  seedRound(mastered, 25, true);
  a.stopRound(true, 'time-up');
  assert.match(a.el.roundResult.textContent, /You mastered all division facts/);
  seedRound(a.defaultProgress());
  a.stopRound(false, 'sign-out');
  assert.equal(a.el.roundResult.textContent, '');
  assert.equal(sent.length, 2);
}

checkPracticeUi().then(() => {
  console.log('PASS: division facts, progression, repeat safety, mastery grid and history, round results, and classroom retries.');
}).catch(error => { console.error(error); process.exitCode = 1; });
