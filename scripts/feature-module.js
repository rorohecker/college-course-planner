// Feature module — merged into college-course-planner.html
// Prereq map (seed; notes also parsed at runtime)
const PREREQ_EXTRA={
  'ECE 302':{requires:['ECE 202','ECE 230']},
  'ECE 312':{requires:['ECE 202']},
  'ECE 316':{requires:['ECE 306']},
  'ECE 325':{requires:['ECE 125','PHY 303L']},
  'ECE 339':{requires:['ECE 325']},
  'ECE 351M':{requires:['ECE 302']},
  'ECE 360C':{requires:['ECE 312']},
  'ECE 362K':{requires:['ECE 312']},
  'ECE 411':{requires:['ECE 312']},
  'ECE 422C':{requires:['ECE 422K']},
  'ECE 445L':{requires:['ECE 316']},
  'ECE 460N':{requires:['ECE 316']},
  'M 408C':{requires:['M 408K']},
  'M 408D':{requires:['M 408C']},
  'M 427L':{requires:['M 408D']},
};
const UT_FLAG_DEFS=[
  {key:'wr',label:'Writing',re:/\bwr(?:iting)?\s*flag\b/i},
  {key:'qr',label:'Quantitative Reasoning',re:/\bqr\b|quantitative reasoning/i},
  {key:'cd',label:'Cultural Diversity',re:/\bcd\b|cultural diversity/i},
  {key:'gc',label:'Global Cultures',re:/\bgc\b|global cultures/i},
  {key:'e',label:'Ethics',re:/\bethics\b|\be\s*flag\b/i},
  {key:'ii',label:'Independent Inquiry',re:/\bindependent inquiry\b|\bii\b/i},
];
const UT_FLAG_TARGETS={wr:1,qr:1,cd:1,gc:1,e:1,ii:1};
const GRADE_DIST={
  'ECE 302':{avg:'3.1',aPct:18},
  'ECE 312':{avg:'3.0',aPct:15},
  'ECE 316':{avg:'2.9',aPct:12},
  'ECE 325':{avg:'2.8',aPct:10},
  'ECE 339':{avg:'3.0',aPct:14},
  'ECE 351M':{avg:'3.2',aPct:20},
  'ECE 360C':{avg:'3.1',aPct:17},
  'ECE 411':{avg:'2.7',aPct:8},
  'M 408C':{avg:'2.6',aPct:7},
  'M 408D':{avg:'2.7',aPct:9},
};
const TERM_STARTS={y1f:'2025-08-25',y1s:'2026-01-12',y2f:'2026-08-24',y2s:'2027-01-11',y3f:'2027-08-23',y3s:'2028-01-10',y4f:'2028-08-28',y4s:'2029-01-08'};
const GIST_PREFS_KEY='cp-gist-sync';
const SCHOOL_REGISTRY={
  ut:{id:'ut',name:'UT Austin',active:true,note:'Full support — ECE, BBA, minors'},
  tamu:{id:'tamu',name:'Texas A&M',active:false,note:'Coming soon — contribute a curriculum JSON'},
  rice:{id:'rice',name:'Rice University',active:false,note:'Coming soon'},
  utd:{id:'utd',name:'UT Dallas',active:false,note:'Coming soon'},
  txst:{id:'txst',name:'Texas State',active:false,note:'Coming soon'},
};
const SEM_ORDER=['ap','phy','y1f','y1s','y2f','y2s','y3f','y3s','y4f','y4s','lower','core','upper','human','major','canfield','electives'];

function normCourseCode(code){return String(code||'').trim().toUpperCase().replace(/\s+/g,' ').replace(/H$/,'');}
function parseCodesFromNote(note){
  const out=[];
  const text=String(note||'');
  const re=/(?:pre-?req|co-?req|prerequisite)s?:\s*([^.;]+)/gi;
  let m;
  while((m=re.exec(text))){
    for(const part of m[1].split(/[,;]|\bor\b/i)){
      const code=part.trim().toUpperCase().replace(/\s+/g,' ');
      if(/^[A-Z]{2,4}\s*\d{3}/.test(code))out.push(code.replace(/\s+/,' '));
    }
  }
  return out;
}
function prereqsForCourse(c){
  const nc=normCourseCode(c.code);
  const extra=PREREQ_EXTRA[nc]||PREREQ_EXTRA[c.code?.trim().toUpperCase()];
  const fromNote=parseCodesFromNote(c.note);
  const requires=[...(extra?.requires||[]),...fromNote];
  return{requires:[...new Set(requires.map(normCourseCode))],coreqs:(extra?.coreqs||[]).map(normCourseCode)};
}
function semesterOrderIndex(semId){
  const i=SEM_ORDER.indexOf(semId);
  if(i>=0)return i;
  if(String(semId||'').startsWith('prog_'))return 900;
  return 500;
}
function codesCompletedBefore(sems,beforeIdx){
  const done=new Set();
  const ordered=[...sems].sort((a,b)=>semesterOrderIndex(a.id)-semesterOrderIndex(b.id));
  for(const sem of ordered){
    if(semesterOrderIndex(sem.id)>=beforeIdx)break;
    for(const c of sem.courses||[]){
      if(c.done||!c.done)done.add(normCourseCode(c.code));
    }
  }
  return done;
}
function validatePlanPrereqs(sems){
  const issues=[];
  const ordered=[...sems].filter(s=>!s.isOff&&!String(s.id).startsWith('prog_')).sort((a,b)=>semesterOrderIndex(a.id)-semesterOrderIndex(b.id));
  for(const sem of ordered){
    const before=semesterOrderIndex(sem.id);
    const prior=codesCompletedBefore(sems,before);
    for(const c of sem.courses||[]){
      if(isDegreePlaceholderCode(c.code))continue;
      const{requires}=prereqsForCourse(c);
      const missing=requires.filter(r=>!prior.has(r)&&!prior.has(r+'H'));
      if(missing.length)issues.push({semId:sem.id,semLabel:sem.label,course:c,missing});
    }
  }
  return issues;
}
function semCreditLoad(sem){
  if(sem.isOff||sem.id==='ap'||sem.id==='phy')return null;
  const cr=(sem.courses||[]).reduce((t,c)=>t+Number(c.credits||0),0);
  return{cr,over:cr>18,under:cr>0&&cr<12};
}
function checkSemesterLoads(sems){
  return(sems||[]).map(s=>{const l=semCreditLoad(s);return l?{sem:s,...l}:null;}).filter(Boolean);
}
function scanDegreeFlags(sems){
  const found={};
  for(const def of UT_FLAG_DEFS)found[def.key]=[];
  for(const sem of sems||[]){
    for(const c of sem.courses||[]){
      const text=`${c.note||''} ${c.name||''}`;
      for(const def of UT_FLAG_DEFS){
        if(def.re.test(text))found[def.key].push({code:c.code,sem:sem.label});
      }
    }
  }
  return found;
}
function flagProgressSummary(sems){
  const flags=scanDegreeFlags(sems);
  return UT_FLAG_DEFS.map(def=>({
    ...def,hit:flags[def.key].length,target:UT_FLAG_TARGETS[def.key]||1,courses:flags[def.key],
    ok:flags[def.key].length>=(UT_FLAG_TARGETS[def.key]||1),
  }));
}
function courseRequirementTags(sch,c){
  const nc=normCourseCode(c.code);
  const tags=[];
  if(sch?.track&&TRACKS[sch.track]){
    const t=TRACKS[sch.track];
    if(t.cores.some(x=>normCourseCode(x.code)===nc))tags.push('Track core');
    if(c.note==='Track elective'||t.electives.some(e=>normCourseCode(e)===nc))tags.push('Track elective');
  }
  for(const pk of programKeys(sch)){
    const prog=UT_PROGRAMS_BY_KEY[pk];
    const req=programReq(prog);
    if(req?.cores?.some(x=>normCourseCode(x.code)===nc))tags.push(prog?.name||pk);
    if(c.note==='Program elective'&&c.programKey===pk)tags.push(`${prog?.name||pk} elective`);
  }
  if(tags.length>1)return{code:c.code,tags,overlap:true};
  return tags.length?{code:c.code,tags,overlap:false}:null;
}
function computeRequirementOverlap(sch){
  const sems=sch?.sems||[];
  const map=new Map();
  for(const sem of sems){
    for(const c of sem.courses||[]){
      const info=courseRequirementTags(sch,c);
      if(info?.overlap)map.set(normCourseCode(c.code),info);
    }
  }
  return[...map.values()];
}
function computePlanDiff(schA,schB){
  const byCode=sems=>{
    const m=new Map();
    for(const sem of sems||[]){
      for(const c of sem.courses||[])m.set(normCourseCode(c.code),{...c,semId:sem.id,semLabel:sem.label});
    }
    return m;
  };
  const a=byCode(schA?.sems),b=byCode(schB?.sems);
  const added=[],removed=[],moved=[],gradeChanges=[];
  for(const [code,c] of b){
    if(!a.has(code))added.push(c);
    else{
      const o=a.get(code);
      if(o.semId!==c.semId)moved.push({code,from:o.semLabel,to:c.semLabel});
      if((o.grade||'')!==(c.grade||''))gradeChanges.push({code,from:o.grade||'—',to:c.grade||'—'});
    }
  }
  for(const [code,c] of a)if(!b.has(code))removed.push(c);
  return{added,removed,moved,gradeChanges};
}
function trackWhatIfMatrix(sch){
  const codes=new Set((sch?.sems||[]).flatMap(s=>s.courses||[]).map(c=>normCourseCode(c.code)));
  return Object.entries(TRACKS).map(([key,t])=>{
    const coreHit=t.cores.filter(c=>codes.has(normCourseCode(c.code))).length;
    const electHit=(sch?.sems||[]).flatMap(s=>s.courses||[]).filter(c=>c.note==='Track elective'&&t.electives.some(e=>normCourseCode(e)===normCourseCode(c.code))).length;
    const need=eceTrackKind(sch)==='general'?GENERAL_TRACK_PICK:ECB_TRACK_PICK;
    return{key,track:t,coreHit,coreTotal:t.cores.length,electHit,need};
  });
}
function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');}
function toICSForSemester(sem,semId){
  const start=TERM_STARTS[semId]||'2026-08-25';
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//College Course Planner//EN','CALSCALE:GREGORIAN'];
  let i=0;
  for(const c of sem.courses||[]){
    if(isDegreePlaceholderCode(c.code))continue;
    const dt=start.replace(/-/g,'');
    const uid=`cp-${semId}-${i++}@planner`;
    lines.push('BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${dt}T120000Z`,`DTSTART;VALUE=DATE:${dt}`,`SUMMARY:${icsEscape(c.code+' — '+c.name)}`,`DESCRIPTION:${icsEscape(c.note||'')}`,'END:VEVENT');
  }
  for(const d of UT_DEADLINES){
    lines.push('BEGIN:VEVENT',`UID:deadline-${semId}-${icsEscape(d.week)}@planner`,`DTSTAMP:20260101T120000Z`,`DTSTART;VALUE=DATE:20260101`,`SUMMARY:${icsEscape('UT Deadline: '+d.week)}`,`DESCRIPTION:${icsEscape(d.what)}`,'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function downloadTextFile(text,filename,mime){
  const blob=new Blob([text],{type:mime||'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function parseMeetingTime(str){
  const s=String(str||'').trim();
  if(!s)return null;
  const m=s.match(/([MTWRF]+)\s+(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/i);
  if(!m)return null;
  const days=m[1].toUpperCase().split('');
  const start=parseInt(m[2],10)*60+(parseInt(m[3]||'0',10));
  const end=parseInt(m[4],10)*60+(parseInt(m[5]||'0',10));
  return{days,start,end,raw:s};
}
function meetingsOverlap(a,b){
  if(!a||!b)return false;
  const shared=a.days.filter(d=>b.days.includes(d));
  if(!shared.length)return false;
  return a.start<b.end&&b.start<a.end;
}
function weeklyScheduleAnalysis(sems){
  const courses=[];
  for(const sem of sems||[]){
    for(const c of sem.courses||[]){
      if(c.meeting){courses.push({...c,semLabel:sem.label,mtg:parseMeetingTime(c.meeting)});}
    }
  }
  const conflicts=[];
  for(let i=0;i<courses.length;i++){
    for(let j=i+1;j<courses.length;j++){
      if(meetingsOverlap(courses[i].mtg,courses[j].mtg)){
        conflicts.push([courses[i],courses[j]]);
      }
    }
  }
  return{courses,conflicts};
}
function gradeDistFor(code){
  const nc=normCourseCode(code);
  return GRADE_DIST[nc]||GRADE_DIST[code]||null;
}
function readGistPrefs(){
  try{return JSON.parse(localStorage.getItem(GIST_PREFS_KEY)||'{}');}catch(e){return{};}
}
function writeGistPrefs(p){try{localStorage.setItem(GIST_PREFS_KEY,JSON.stringify(p));}catch(e){}}
async function gistSyncPush(){
  const prefs=readGistPrefs();
  if(!prefs.token)throw new Error('Add a GitHub personal access token first (gist scope).');
  const body={schedules:S.schedules,activeId:S.activeId,exportedAt:new Date().toISOString(),version:'cp-v3'};
  const desc='College Course Planner backup';
  if(prefs.gistId){
    const res=await fetch(`https://api.github.com/gists/${prefs.gistId}`,{method:'PATCH',headers:{'Authorization':`token ${prefs.token}`,'Content-Type':'application/json','Accept':'application/vnd.github+json'},body:JSON.stringify({files:{'college-planner-backup.json':{content:JSON.stringify(body,null,2)}}})});
    if(!res.ok)throw new Error('Gist update failed: '+res.status);
    return prefs.gistId;
  }
  const res=await fetch('https://api.github.com/gists',{method:'POST',headers:{'Authorization':`token ${prefs.token}`,'Content-Type':'application/json','Accept':'application/vnd.github+json'},body:JSON.stringify({description:desc,public:false,files:{'college-planner-backup.json':{content:JSON.stringify(body,null,2)}}})});
  if(!res.ok)throw new Error('Gist create failed: '+res.status);
  const data=await res.json();
  prefs.gistId=data.id;writeGistPrefs(prefs);
  return data.id;
}
async function gistSyncPull(){
  const prefs=readGistPrefs();
  if(!prefs.token||!prefs.gistId)throw new Error('Set token and gist ID first.');
  const res=await fetch(`https://api.github.com/gists/${prefs.gistId}`,{headers:{'Authorization':`token ${prefs.token}`,'Accept':'application/vnd.github+json'}});
  if(!res.ok)throw new Error('Gist fetch failed: '+res.status);
  const data=await res.json();
  const file=data.files?.['college-planner-backup.json']?.content;
  if(!file)throw new Error('No backup file in gist.');
  const p=JSON.parse(file);
  if(!p.schedules?.length)throw new Error('Invalid backup in gist.');
  pushHistory();
  S.schedules=p.schedules.map(normalizeSchedule);
  S.activeId=fixActiveId(S.schedules,p.activeId)||S.schedules[0].id;
  save();render();
}
function encodeAdvisingShare(){
  return btoa(encodeURIComponent(JSON.stringify({readOnly:true,schedules:S.schedules,activeId:S.activeId,exportedAt:Date.now()})));
}
function loadAdvisingFromUrl(){
  const m=location.search.match(/[?&]advise=([^&]+)/);
  if(!m)return false;
  try{
    const p=JSON.parse(decodeURIComponent(atob(decodeURIComponent(m[1]))));
    if(!p.schedules?.length)return false;
    S.schedules=p.schedules.map(normalizeSchedule);
    S.activeId=fixActiveId(S.schedules,p.activeId)||S.schedules[0].id;
    S.readOnly=true;
    return true;
  }catch(e){return false;}
}
function registerPWA(){
  if(!('serviceWorker'in navigator))return;
  const sw=`self.addEventListener('install',e=>{e.waitUntil(caches.open('cp-v1').then(c=>c.addAll([self.location.href])));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});`;
  try{
    const url=URL.createObjectURL(new Blob([sw],{type:'application/javascript'}));
    navigator.serviceWorker.register(url).catch(()=>{});
  }catch(e){}
}
function injectPWAMeta(){
  if(document.querySelector('link[rel="manifest"]'))return;
  const manifest={name:'College Course Planner',short_name:'Planner',display:'standalone',background_color:'#0F1117',theme_color:'#BF3A1F',start_url:location.href.split('?')[0]};
  const link=document.createElement('link');
  link.rel='manifest';
  link.href=URL.createObjectURL(new Blob([JSON.stringify(manifest)],{type:'application/json'}));
  document.head.appendChild(link);
}
let _validationCache={rev:-1,val:null};
function planValidation(){
  if(_validationCache.rev===_saveRev)return _validationCache.val;
  const sems=getAS();
  const val={prereqs:validatePlanPrereqs(sems),loads:checkSemesterLoads(sems),flags:flagProgressSummary(sems),overlap:computeRequirementOverlap(getAct())};
  _validationCache={rev:_saveRev,val};
  return val;
}
