import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer} from '../src/index.mjs';
const render=(month,content='')=>createRenderer().in('```calendar '+month+'\n'+content+'\n```');
test('calendar month starts Monday and renders escaped events',()=>{const h=render('2026-10','2026-10-17 | 14:00 <img src=x onerror=alert(1)>\n2026-10-17 | Zweiter Termin');assert.match(h,/Oktober 2026/);assert.equal((h.match(/calendar-empty/g)||[]).length,4);assert.equal((h.match(/<time /g)||[]).length,31);assert.match(h,/&lt;img/);assert.doesNotMatch(h,/<img/);assert.match(h,/Zweiter Termin/);assert.match(h,/<th scope="col">Mo/);});
test('leap year and invalid dates',()=>{assert.equal((render('2024-02').match(/<time /g)||[]).length,29);assert.equal((render('2025-02').match(/<time /g)||[]).length,28);assert.match(render('2026-13'),/YYYY-MM/);assert.match(render('2026-02','2026-02-30 | Fehler'),/Termine prüfen/);assert.match(render('2026-02','2026-03-01 | Anderer Monat'),/Termine prüfen/);});
test('other code fences stay literal',()=>{const h=createRenderer().in('```js\ncalendar 2026-10\n```');assert.match(h,/language-js/);assert.doesNotMatch(h,/<table/);});

test('year has twelve months and accepts events in multiple months',()=>{const h=render('2026','2026-01-01 | Neujahr\n2026-12-31 | Silvester');assert.equal((h.match(/<table>/g)||[]).length,12);assert.equal((h.match(/<time /g)||[]).length,365);assert.match(h,/Neujahr/);assert.match(h,/Silvester/);assert.doesNotMatch(h,/Termine prüfen/);});
test('day and range including reverse shorthand',()=>{const single=render('2026-10-10');assert.equal((single.match(/<time /g)||[]).length,1);const range=render('2026-10-10-05');assert.equal((range.match(/<time /g)||[]).length,6);assert.match(range,/5–10. Oktober/);assert.match(range,/datetime="2026-10-05"/);assert.match(range,/datetime="2026-10-10"/);assert.doesNotMatch(range,/datetime="2026-10-11"/);assert.match(render('2026-02-29'),/calendar-error/);});
