import { db, requireAuthorizedUser, collection, getDocs, deleteDoc, doc, query, orderBy } from './firebase.js';
import { bindAuthUI } from './auth-ui.js';

const user = await requireAuthorizedUser();
if (!user) throw new Error('Auth redirect');
bindAuthUI(user);
document.getElementById('pageLoading').hidden = true;
document.getElementById('resultsRoot').hidden = false;

const box=document.getElementById('results');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let records=[]; let categoryChart=null; let itemChart=null;

const categoryGroups = (()=>{
  const map=new Map();
  for(const item of window.MILESTONE_ITEMS){if(!map.has(item.category))map.set(item.category,[]);map.get(item.category).push(item.code);}
  return [...map.entries()].map(([name,codes])=>({name:name.replace(/\s*\(共\d+項\)\s*$/,''),codes}));
})();
function numericLevel(value){const m=/^Level\s+(\d(?:\.5)?)$/.exec(value||'');return m?Number(m[1]):null;}
function formatDate(v){if(!v)return '—';const [y,m,d]=String(v).split('-');return y&&m&&d?`${y}/${m}/${d}`:String(v);}
function createdString(v){if(!v)return '';const date=v.toDate?v.toDate():new Date(v);return isNaN(date)?'':date.toLocaleString('zh-TW',{hour12:false});}

async function loadRecords(){
  const snap=await getDocs(query(collection(db,'assessments'),orderBy('evaluationDate','desc')));
  records=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderAll();
}

function chronological(){return [...records].sort((a,b)=>(a.evaluationDate||'').localeCompare(b.evaluationDate||'') || createdString(a.createdAt).localeCompare(createdString(b.createdAt)));}
function chartTextColor(){return getComputedStyle(document.documentElement).getPropertyValue('--text').trim()||'#333';}
function chartGridColor(){return getComputedStyle(document.documentElement).getPropertyValue('--line').trim()||'#ddd';}
function commonScales(){return {y:{min:1,max:5,ticks:{stepSize:.5,color:chartTextColor()},grid:{color:chartGridColor()},title:{display:true,text:'Level',color:chartTextColor()}},x:{ticks:{color:chartTextColor()},grid:{color:chartGridColor()}}};}

function renderCategoryChart(){
  const data=chronological();
  const labels=data.map(r=>formatDate(r.evaluationDate));
  const datasets=categoryGroups.map(group=>({
    label:group.name,
    data:data.map(r=>{const nums=group.codes.map(c=>numericLevel(r.ratings?.[c])).filter(v=>v!=null);return nums.length?Number((nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2)):null;}),
    tension:.25,spanGaps:true
  }));
  if(categoryChart)categoryChart.destroy();
  categoryChart=new Chart(document.getElementById('categoryChart'),{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:chartTextColor()}}},scales:commonScales()}});
}

function initItemSelect(){
  const select=document.getElementById('itemSelect');
  select.innerHTML=window.MILESTONE_ITEMS.map(it=>`<option value="${esc(it.code)}">${esc(it.code)}－${esc(it.name)}</option>`).join('');
  select.addEventListener('change',renderItemChart);
}
function renderItemChart(){
  const code=document.getElementById('itemSelect').value||window.MILESTONE_ITEMS[0].code;
  const data=chronological();
  const item=window.MILESTONE_ITEMS.find(i=>i.code===code);
  const labels=data.map(r=>formatDate(r.evaluationDate));
  const values=data.map(r=>numericLevel(r.ratings?.[code]));
  if(itemChart)itemChart.destroy();
  itemChart=new Chart(document.getElementById('itemChart'),{type:'line',data:{labels,datasets:[{label:`${code}－${item?.name||''}`,data:values,tension:.25,spanGaps:true,pointRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:chartTextColor()}},tooltip:{callbacks:{afterLabel:(ctx)=>{const r=data[ctx.dataIndex];const raw=r?.ratings?.[code];return numericLevel(raw)==null?`結果：${raw||'—'}`:'';}}}},scales:commonScales()}});
}

function renderTrendTable(){
  const body=document.getElementById('trendTableBody'); const data=chronological();
  body.innerHTML=window.MILESTONE_ITEMS.map(it=>{
    const vals=data.map(r=>numericLevel(r.ratings?.[it.code])).filter(v=>v!=null);
    const first=vals.length?vals[0]:null, latest=vals.length?vals[vals.length-1]:null;
    const diff=first!=null&&latest!=null?Number((latest-first).toFixed(1)):null;
    const diffText=diff==null?'—':diff>0?`↑ +${diff}`:diff<0?`↓ ${diff}`:'→ 0';
    const cls=diff==null?'':diff>0?'trend-up':diff<0?'trend-down':'trend-flat';
    return `<tr><td><strong>${esc(it.code)}</strong>－${esc(it.name)}</td><td>${first??'—'}</td><td>${latest??'—'}</td><td class="${cls}">${diffText}</td></tr>`;
  }).join('');
}

function renderRecords(){
  if(!records.length){box.innerHTML='<div class="panel empty">目前還沒有儲存的評估紀錄。</div>';return;}
  box.innerHTML=records.map(r=>{
    const details=window.MILESTONE_ITEMS.map(it=>`<div class="detail-row"><strong>${esc(it.code)}－${esc(it.name)}</strong><br>${esc(r.ratings?.[it.code]||'—')}</div>`).join('');
    return `<article class="result-card"><div class="result-summary"><div><strong>${esc(formatDate(r.evaluationDate))}</strong>${r.evaluator?`<span class="badge">${esc(r.evaluator)}</span>`:''}<div class="result-meta">儲存時間：${esc(createdString(r.createdAt))}</div></div><div>展開 ▾</div></div><div class="result-detail"><div class="detail-grid">${details}</div>${r.comment?`<div class="comment"><strong>總評語</strong><br>${esc(r.comment)}</div>`:''}<div class="record-actions"><button class="btn btn-secondary danger delete-one" data-id="${esc(r.id)}">刪除此筆</button></div></div></article>`;
  }).join('');
  document.querySelectorAll('.result-summary').forEach(el=>el.addEventListener('click',()=>el.parentElement.classList.toggle('open')));
  document.querySelectorAll('.delete-one').forEach(btn=>btn.addEventListener('click',async e=>{e.stopPropagation();if(!confirm('確定刪除這筆評估紀錄？'))return;btn.disabled=true;try{await deleteDoc(doc(db,'assessments',btn.dataset.id));await loadRecords();}catch(err){console.error(err);alert('刪除失敗。');btn.disabled=false;}}));
}
function renderAll(){renderCategoryChart();renderItemChart();renderTrendTable();renderRecords();}
initItemSelect();
await loadRecords();

document.getElementById('exportBtn').addEventListener('click',()=>{
  const clean=records.map(({id,...r})=>({id,...r,createdAt:r.createdAt?.toDate?r.createdAt.toDate().toISOString():r.createdAt||null}));
  const blob=new Blob([JSON.stringify(clean,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`neurology-milestone-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>setTimeout(renderAll,30));
document.getElementById('themeSelect')?.addEventListener('change',()=>setTimeout(renderAll,30));
