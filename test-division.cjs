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
  state, classroomState, el, renderProgressGrid, updatePracticeHeader};`), ctx);
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
assert.ok(a.el.practiceTitle.textContent.includes('÷2'));
assert.ok(a.el.practiceSubtitle.textContent.includes('8 ÷ 2'));
console.log('PASS: 121 division facts, 1,100 adaptive selections, progression, repeat safety, UI labels, and isolated storage/reporting.');
