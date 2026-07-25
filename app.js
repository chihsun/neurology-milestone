import { db, requireAuthorizedUser, collection, addDoc, serverTimestamp } from './firebase.js';
import { bindAuthUI } from './auth-ui.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localToday(){const d=new Date();const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)}
const user = await requireAuthorizedUser();
if (!user) throw new Error('Auth redirect');
bindAuthUI(user);
document.getElementById('pageLoading').hidden = true;
document.getElementById('appRoot').hidden = false;

const form=document.getElementById('evalForm'); const itemsBox=document.getElementById('items'); const status=document.getElementById('status');
document.getElementById('evalDate').value=localToday();
let lastCat='';
for(const item of window.MILESTONE_ITEMS){
  if(item.category!==lastCat){const h=document.createElement('h2');h.className='category';h.textContent=item.category;itemsBox.appendChild(h);lastCat=item.category;}
  const sec=document.createElement('section'); sec.className='item';
  const opts=item.options.map(o=>{const optionText=o.description?`${o.label}：${o.description}`:o.label;return `<option value="${esc(o.value)}">${esc(optionText)}</option>`;}).join('');
  sec.innerHTML=`<div class="item-head"><div class="item-title">${esc(item.code)}－${esc(item.name)} <span class="required">*</span></div><div class="goal"><strong>整體目標：</strong>${esc(item.goal)}</div><div class="methods"><strong>評量方法與工具：</strong>${item.methods.map(esc).join('、')}</div></div>
  <div class="select-wrap"><label class="select-label" for="rating-${esc(item.code)}">評估結果</label><select class="rating-select" id="rating-${esc(item.code)}" name="${esc(item.code)}" required><option value="" selected disabled>請選擇評估結果</option>${opts}</select><div class="selected-detail" id="detail-${esc(item.code)}" hidden></div></div>`;
  itemsBox.appendChild(sec);
}
function renderSelectedDetail(select){
  const item=window.MILESTONE_ITEMS.find(it=>it.code===select.name); const detail=document.getElementById(`detail-${select.name}`);
  if(!item||!detail||!select.value){if(detail)detail.hidden=true;return;}
  const opt=item.options.find(o=>o.value===select.value); if(!opt){detail.hidden=true;return;}
  const pieces=[]; if(opt.description) pieces.push(`<div><strong>${esc(opt.label)}：</strong>${esc(opt.description)}</div>`); if(opt.example) pieces.push(`<div class="example">舉例：${esc(opt.example)}</div>`);
  if(pieces.length){detail.innerHTML=pieces.join('');detail.hidden=false;} else detail.hidden=true;
}
function updateStatus(){let n=0;for(const it of window.MILESTONE_ITEMS){const s=form.querySelector(`select[name="${it.code}"]`);if(s&&s.value)n++;}status.textContent=`已完成 ${n} / ${window.MILESTONE_ITEMS.length} 項`;status.style.color=n===window.MILESTONE_ITEMS.length?'var(--ok)':'';}
form.addEventListener('change',e=>{if(e.target.matches('.rating-select'))renderSelectedDetail(e.target);updateStatus();});
form.addEventListener('reset',()=>setTimeout(()=>{document.getElementById('evalDate').value=localToday();for(const d of form.querySelectorAll('.selected-detail'))d.hidden=true;updateStatus()},0));
updateStatus();

form.addEventListener('submit',async e=>{
  e.preventDefault(); if(!form.reportValidity()) return;
  const ratings={};
  for(const it of window.MILESTONE_ITEMS){const s=form.querySelector(`select[name="${it.code}"]`);if(!s||!s.value){alert(`請完成 ${it.code}－${it.name}`);s?.focus();return;}ratings[it.code]=s.value;}
  const btn=document.getElementById('saveBtn'); btn.disabled=true; btn.textContent='儲存中…';
  try{
    await addDoc(collection(db,'assessments'),{
      evaluationDate:document.getElementById('evalDate').value,
      evaluator:document.getElementById('evaluator').value.trim(),
      evaluatorEmail:user.email||'',
      createdByUid:user.uid,
      comment:document.getElementById('comment').value,
      ratings,
      createdAt:serverTimestamp()
    });
    location.href='results.html';
  }catch(err){console.error(err);alert('儲存失敗。請確認網路連線、Firestore 設定與 Security Rules。');btn.disabled=false;btn.textContent='儲存本次評估';}
});
