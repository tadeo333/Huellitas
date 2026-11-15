const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>iso(new Date());
const D=s=>new Date(s+'T00:00:00');
const diff=s=>Math.round((D(s)-D(today()))/864e5);
const fd=s=>s?D(s).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}):'—';
let col,S={tab:'inicio',sub:'mes',cur:new Date(),sel:today(),recs:[],pets:[],pid:null,prof:{},lead:[7,3,0],ready:false};
const R=t=>S.recs.filter(r=>r.t===t&&(r.pid||'perfil')===S.pid);const sel=()=>{S.prof=S.pets.find(p=>p._id===S.pid)||{}};
const TABS=[['inicio','🏠 Inicio'],['vac','💉 Vacunas'],['cita','📅 Citas'],['med','🩺 Historial'],['peso','⚖️ Peso'],['perfil','🐕 Perfil']];
const SEX=['Macho','Hembra'],YN=['Sí','No'],TM=['Enfermedad','Diagnóstico','Tratamiento','Medicamento','Cirugía','Alergia','Estudio','Nota del veterinario'],TR=['Desparasitación','Tratamiento','Revisión periódica','Otro cuidado'];
const F={
vac:[{k:'nombre',l:'Nombre de la vacuna',req:1},{k:'fecha',l:'Fecha de aplicación (déjala vacía si aún está pendiente)',ty:'date'},{k:'dosis',l:'Número de dosis',ty:'number'},{k:'prox',l:'Fecha de la siguiente dosis o refuerzo',ty:'date'},{k:'vet',l:'Veterinario que la aplicó'},{k:'clinica',l:'Clínica veterinaria'},{k:'obs',l:'Observaciones',ty:'area'},{k:'foto',l:'Foto del comprobante (opcional)',ty:'img',max:900}],
cita:[{k:'fecha',l:'Día',ty:'date',req:1},{k:'hora',l:'Hora',ty:'time',req:1},{k:'motivo',l:'Motivo de la consulta',req:1},{k:'vet',l:'Veterinario'},{k:'clinica',l:'Clínica'},{k:'dir',l:'Dirección de la clínica'},{k:'obs',l:'Notas',ty:'area'}],
med:[{k:'fecha',l:'Fecha de la consulta',ty:'date',req:1},{k:'tipo',l:'Tipo de registro',ty:'sel',o:TM,req:1},{k:'titulo',l:'Título (ej. Otitis, Esterilización)',req:1},{k:'detalle',l:'Detalle: diagnóstico, tratamiento, medicamentos, resultados',ty:'area'},{k:'foto',l:'Foto de estudio o receta (opcional)',ty:'img',max:900}],
peso:[{k:'fecha',l:'Fecha',ty:'date',req:1},{k:'kg',l:'Peso (kg)',ty:'number',req:1},{k:'obs',l:'Observaciones',ty:'area'}],
rec:[{k:'fecha',l:'Fecha',ty:'date',req:1},{k:'tipo',l:'Tipo',ty:'sel',o:TR,req:1},{k:'titulo',l:'Descripción',req:1},{k:'obs',l:'Notas',ty:'area'}],
perfil:[{k:'foto',l:'Fotografía',ty:'img',max:480},{k:'nombre',l:'Nombre',req:1},{k:'raza',l:'Raza'},{k:'nac',l:'Fecha de nacimiento',ty:'date'},{k:'edadAprox',l:'Edad aproximada (si no sabes la fecha)'},{k:'sexo',l:'Sexo',ty:'sel',o:SEX},{k:'color',l:'Color y características físicas'},{k:'peso',l:'Peso actual (kg)',ty:'number'},{k:'talla',l:'Estatura (cm, opcional)',ty:'number'},{k:'chip',l:'Microchip o identificación'},{k:'esteril',l:'¿Está esterilizado?',ty:'sel',o:YN},{k:'alim',l:'Tipo de alimentación'},{k:'alergias',l:'Alergias conocidas',ty:'area'},{k:'enf',l:'Enfermedades o padecimientos',ty:'area'},{k:'meds',l:'Medicamentos que utiliza',ty:'area'},{k:'dueno',l:'Nombre del propietario'},{k:'tel',l:'Teléfono del propietario'},{k:'dir',l:'Dirección o ubicación (opcional)'}]};
const T={vac:['Nueva vacuna','Editar vacuna'],cita:['Nueva cita','Editar cita'],med:['Nuevo registro médico','Editar registro'],peso:['Registrar peso','Editar peso'],rec:['Nuevo recordatorio','Editar recordatorio'],perfil:['Perfil de tu perro','Perfil de tu perro']};
const V={
vac:d=>!d.fecha&&!d.prox?'Indica la fecha de aplicación o la fecha de la próxima dosis.':d.fecha>today()?'La fecha de aplicación no puede ser futura. Para una dosis programada usa “Fecha de la siguiente dosis”.':d.prox&&d.fecha&&d.prox<d.fecha?'El refuerzo debe ser posterior a la fecha de aplicación.':d.dosis!=null&&(d.dosis<1||d.dosis%1)?'La dosis debe ser un número entero mayor a 0.':'',
med:d=>d.fecha>today()?'La fecha de la consulta no puede ser futura.':'',
peso:d=>!(d.kg>0&&d.kg<150)?'Escribe un peso válido en kg (mayor a 0).':d.fecha>today()?'La fecha no puede ser futura.':'',
perfil:d=>d.nac&&d.nac>today()?'La fecha de nacimiento no puede ser futura.':d.tel&&!/^[\d\s+()-]{7,}$/.test(d.tel)?'El teléfono solo puede tener números, espacios, + ( ) y guiones (mínimo 7).':d.peso!=null&&d.peso<=0?'El peso debe ser mayor a 0.':''};
const shrink=(f,max)=>new Promise((ok,no)=>{if(!f.type.startsWith('image/'))return no();const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const s=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.72))};i.onerror=no;i.src=r.result};r.onerror=no;r.readAsDataURL(f)});
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),2600)}
function close(){$('#modal').className='';$('#modal').innerHTML=''}
function sheet(h){$('#modal').innerHTML='<div class="sheet" role="dialog" aria-modal="true">'+h+'</div>';$('#modal').className='on'}
function fld(f,v){const n=esc(f.k),l=esc(f.l);v=v??'';
 if(f.ty==='area')return`<label>${l}<textarea name="${n}" rows="3">${esc(v)}</textarea></label>`;
 if(f.ty==='sel')return`<label>${l}<select name="${n}"><option value="">—</option>${f.o.map(o=>`<option${o===v?' selected':''}>${o}</option>`).join('')}</select></label>`;
 if(f.ty==='img')return`<label>${l}<input type="file" accept="image/*" data-img="${n}">${v?`<img class="pv" id="pv-${n}" src="${v}" alt="">`:`<img class="pv" id="pv-${n}" alt="" hidden>`}</label>`;
 return`<label>${l}<input name="${n}" type="${f.ty||'text'}" value="${esc(v)}"${f.ty==='number'?' step="any" inputmode="decimal"':''}${f.req?' required':''}></label>`}
function form(title,fs,v,save,del){
 const imgs={};fs.filter(f=>f.ty==='img').forEach(f=>imgs[f.k]=v[f.k]||'');
 sheet(`<h2>${title}</h2><form id="f" novalidate>${fs.map(f=>fld(f,v[f.k])).join('')}<p class="err" id="err" role="alert"></p><div class="row"><button class="btn" type="submit">Guardar</button><button type="button" class="btn ghost" data-a="close">Cancelar</button>${del?'<button type="button" class="btn danger" id="del">Eliminar</button>':''}</div></form>`);
 const fm=$('#f');
 fm.querySelectorAll('[data-img]').forEach(i=>i.onchange=async()=>{const k=i.dataset.img,f=fs.find(x=>x.k===k);try{imgs[k]=await shrink(i.files[0],f.max);const p=$('#pv-'+k);p.src=imgs[k];p.hidden=false}catch{i.value='';$('#err').textContent='Solo se aceptan imágenes (JPG, PNG, WebP).'}});
 fm.onsubmit=async e=>{e.preventDefault();const d={};
  for(const f of fs){let x=f.ty==='img'?imgs[f.k]:fm.elements[f.k].value.trim();
   if(f.req&&!x)return $('#err').textContent='Completa el campo: '+f.l;
   if(f.ty==='number')x=x===''?null:Number(x);d[f.k]=x}
  const er=await save(d);if(er)$('#err').textContent=er};
 if(del)$('#del').onclick=()=>ask('¿Eliminar este registro? No se puede deshacer.',del)}
function ask(q,yes){sheet(`<h2>${q}</h2><div class="row" style="margin-top:14px"><button class="btn danger" id="y">Sí, eliminar</button><button class="btn ghost" data-a="close">No, volver</button></div>`);$('#y').onclick=yes}
async function w(p){try{await p;return 1}catch(e){toast('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');return 0}}
async function open(t,id,pre){
 const r=id?S.recs.find(x=>x._id===id):{...pre};
 form(T[t][id?1:0],F[t],r,async d=>{const e=V[t]&&V[t](d);if(e)return e;
  const o={...r,...d,t,pid:S.pid};delete o._id;
  const ok=await w(id?col.doc(id).set(o):col.add(o));if(ok){close();toast('Guardado')}},
  id?async()=>{if(await w(col.doc(id).delete())){close();toast('Eliminado')}}:null)}
async function openProf(nuevo){const P=nuevo?{}:S.prof;
 form('Perfil de tu perro',F.perfil,P,async d=>{const e=V.perfil(d);if(e)return e;
  const o={...P,...d};delete o._id;if(nuevo)o.t='pet';const ref=nuevo?col.add(o).then(r=>{S.pid=r.id;sel();render()}):col.doc(S.pid).set(o);if(await w(ref)){close();toast(nuevo?'Perro agregado':'Perfil actualizado')}})}
async function setLead(n){const s=new Set(S.lead);s.has(n)?s.delete(n):s.add(n);S.lead=[...s].sort((a,b)=>b-a);await w(col.doc('cfg').set({lead:S.lead}))}
function edad(){const p=S.prof;if(!p.nac)return p.edadAprox||'';const n=new Date(),d=D(p.nac);let m=(n.getFullYear()-d.getFullYear())*12+n.getMonth()-d.getMonth();if(n.getDate()<d.getDate())m--;if(m<0)return'';const a=Math.floor(m/12);return m<12?`${m} ${m===1?'mes':'meses'}`:`${a} ${a===1?'año':'años'}${m%12?` y ${m%12} m`:''}`}
const sup=v=>R('vac').some(o=>o._id!==v._id&&o.nombre.toLowerCase()===v.nombre.toLowerCase()&&o.fecha&&(!v.fecha||o.fecha>v.fecha));
function vst(v){if(!v.fecha)return['pend','Pendiente'];if(!v.prox||sup(v))return['ok','Aplicada'];const d=diff(v.prox);return d<0?['pend','Pendiente: refuerzo vencido']:d<=30?['next','Próxima a vencer']:['ok','Aplicada']}
function events(){const e=[];
 R('vac').forEach(v=>{if(v.prox&&!sup(v))e.push({d:v.prox,txt:'Refuerzo: '+v.nombre,ic:'💉',t:'vac',id:v._id})});
 R('cita').forEach(c=>{if(!c.cancelada)e.push({d:c.fecha,h:c.hora,txt:'Cita: '+c.motivo,ic:'📅',t:'cita',id:c._id})});
 R('rec').forEach(c=>{if(!c.hecho)e.push({d:c.fecha,txt:c.tipo+': '+c.titulo,ic:'🔔',t:'rec',id:c._id})});
 return e.sort((a,b)=>(a.d+(a.h||'')).localeCompare(b.d+(b.h||'')))}
function reminders(){const m=Math.max(0,...S.lead);return events().filter(e=>{const d=diff(e.d);return d<0?e.t!=='cita':d<=m})}
const when=d=>{const n=diff(d);return n<0?`Atrasado ${-n} d`:n===0?'Hoy':n===1?'Mañana':`En ${n} días`};
const evRow=e=>`<div class="item"><div>${e.ic} <b>${esc(e.txt)}</b><div class="mut">${fd(e.d)}${e.h?' · '+e.h:''}</div></div><span class="tag ${diff(e.d)<0?'late':diff(e.d)<=3?'next':''}">${when(e.d)}</span>${e.t==='rec'?`<button class="btn sm ghost" data-a="done" data-id="${e.id}">Hecho</button>`:''}</div>`;
const empty=(t,b)=>`<p class="mut">${t}</p>${b||''}`;
const addB=(t,l,x='')=>`<button class="btn" data-a="add" data-t="${t}" ${x}>${l}</button>`;
const latestW=()=>{const w=R('peso').sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];return w?w.kg:S.prof.peso};
function vInicio(){const p=S.prof;
 if(!p.nombre)return`<div class="card"><h2>Bienvenido 🐾</h2><p>Empieza creando el perfil de tu perro. Después podrás registrar vacunas, citas, peso e historial médico.</p><button class="btn" data-a="newpet">Crear perfil</button></div>`;
 const nc=events().filter(e=>e.t==='cita'&&diff(e.d)>=0)[0],nv=events().filter(e=>e.t==='vac'&&diff(e.d)>=0)[0],rm=reminders(),lm=R('med').sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,3),pw=latestW();
 return`<div class="hero"><div class="av" style="background-image:url('${p.foto||''}')">${p.foto?'':'🐕'}</div><div><div class="big">${esc(p.nombre)}</div><div>${esc(p.raza||'')} ${edad()?'· '+edad():''}</div><div class="mut">${pw?'Peso más reciente: '+pw+' kg':'Sin peso registrado'}</div></div></div>
 <div class="row" style="margin-bottom:14px">${addB('vac','+ Vacuna')}${addB('cita','+ Cita')}${addB('peso','+ Peso')}${addB('rec','+ Recordatorio')}<button class="btn ghost" data-a="perfil">Actualizar perfil</button></div>
 <div class="grid"><div class="card"><h3>Próxima cita</h3>${nc?evRow(nc):empty('No tienes citas próximas.')}</div>
 <div class="card"><h3>Próxima vacuna o refuerzo</h3>${nv?evRow(nv):empty('Sin refuerzos programados.')}</div>
 <div class="card"><h3>Recordatorios pendientes</h3>${rm.length?rm.map(evRow).join(''):empty('Todo al día. 🌿')}</div>
 <div class="card"><h3>Últimos registros médicos</h3>${lm.length?lm.map(m=>`<div class="item"><div><b>${esc(m.titulo)}</b><div class="mut">${esc(m.tipo)} · ${fd(m.fecha)}</div></div></div>`).join(''):empty('Aún no hay registros.')}</div>
 <div class="card"><h3>Avisos con anticipación</h3><div class="row">${[14,7,3,1,0].map(n=>`<button class="chip" aria-pressed="${S.lead.includes(n)}" data-a="lead" data-n="${n}">${n?n+(n===1?' día':' días')+' antes':'El mismo día'}</button>`).join('')}</div><p class="mut">Los avisos aparecen aquí y como notificación del navegador al abrir la app. Las fechas de refuerzo son las que tú o tu veterinario registran; la app no sugiere calendarios médicos.</p><button class="btn ghost sm" data-a="notif">Activar notificaciones del navegador</button></div></div>`}
function vVac(){const L=R('vac').sort((a,b)=>(b.fecha||b.prox).localeCompare(a.fecha||a.prox));
 return`<div class="row sp"><h2>Cartilla de vacunación</h2>${addB('vac','+ Nueva vacuna')}</div><div class="card" style="margin-top:12px">${L.length?L.map(v=>{const[c,tx]=vst(v);return`<div class="item"><div><b>${esc(v.nombre)}</b> <span class="tag ${c}">${tx}</span><div class="mut">${v.fecha?'Aplicada: '+fd(v.fecha):'Sin aplicar'}${v.dosis?' · Dosis '+v.dosis:''}${v.prox?' · Próxima: '+fd(v.prox):''}</div><div class="mut">${[v.vet,v.clinica].filter(Boolean).map(esc).join(' · ')}</div>${v.obs?`<div>${esc(v.obs)}</div>`:''}${v.foto?`<button class="btn sm ghost" data-a="view" data-id="${v._id}">Ver comprobante</button>`:''}</div><button class="btn sm ghost" data-a="edit" data-t="vac" data-id="${v._id}">Editar</button></div>`}).join(''):empty('Aún no hay vacunas registradas.')}</div>`}
const citaRow=c=>`<div class="item"><div><b>${esc(c.motivo)}</b> ${c.cancelada?'<span class="tag late">Cancelada</span>':''}<div class="mut">${fd(c.fecha)} · ${esc(c.hora)}</div><div class="mut">${[c.vet,c.clinica,c.dir].filter(Boolean).map(esc).join(' · ')}</div>${c.obs?`<div>${esc(c.obs)}</div>`:''}</div><div class="row"><button class="btn sm ghost" data-a="edit" data-t="cita" data-id="${c._id}">Editar</button>${c.cancelada?'':`<button class="btn sm danger" data-a="cancel" data-id="${c._id}">Cancelar</button>`}</div></div>`;
const dayItems=d=>events().filter(e=>e.d===d);
function vCita(){const s=S.sub,subs=[['mes','Mes'],['sem','Semana'],['prox','Próximas'],['hist','Historial']];
 let b='';const C=R('cita');
 if(s==='mes'){const y=S.cur.getFullYear(),m=S.cur.getMonth(),f=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
  b=`<div class="row sp"><button class="btn sm ghost" data-a="nav" data-n="-1">‹ Anterior</button><b>${S.cur.toLocaleDateString('es-MX',{month:'long',year:'numeric'})}</b><button class="btn sm ghost" data-a="nav" data-n="1">Siguiente ›</button></div><div class="cal">${'LMMJVSD'.split('').map(x=>`<b>${x}</b>`).join('')}${Array(f).fill('<span class="day x"></span>').join('')}${Array.from({length:n},(_,i)=>{const d=iso(new Date(y,m,i+1)),it=dayItems(d);return`<button class="day ${d===today()?'t':''} ${d===S.sel?'s':''}" data-a="day" data-d="${d}" aria-label="${fd(d)}${it.length?', '+it.length+' eventos':''}">${i+1}<span>${it.some(e=>e.t==='cita')?'<i class="dot"></i>':''}${it.some(e=>e.t!=='cita')?'<i class="dot o"></i>':''}</span></button>`}).join('')}</div><p class="mut"><i class="dot"></i> Cita <i class="dot o"></i> Vacuna o recordatorio</p>
  <div class="card"><div class="row sp"><h3>${fd(S.sel)}</h3>${addB('cita','+ Agendar este día',`data-d="${S.sel}"`)}</div>${dayItems(S.sel).length?dayItems(S.sel).map(evRow).join(''):empty('Sin eventos este día.')}</div>`}
 if(s==='sem'){const st=new Date(S.cur);st.setDate(st.getDate()-((st.getDay()+6)%7));
  b=`<div class="row sp"><button class="btn sm ghost" data-a="nav" data-n="-1">‹ Anterior</button><b>Semana del ${fd(iso(st))}</b><button class="btn sm ghost" data-a="nav" data-n="1">Siguiente ›</button></div><div class="card" style="margin-top:10px">${Array.from({length:7},(_,i)=>{const d=new Date(st);d.setDate(st.getDate()+i);const k=iso(d),it=dayItems(k);return`<div class="item"><div style="flex:0 0 96px"><b>${d.toLocaleDateString('es-MX',{weekday:'short',day:'numeric'})}</b>${k===today()?' <span class="tag">Hoy</span>':''}</div><div>${it.length?it.map(e=>`<div>${e.ic} ${e.h?e.h+' · ':''}${esc(e.txt)}</div>`).join(''):'<span class="mut">—</span>'}</div></div>`}).join('')}</div>`}
 if(s==='prox'){const L=C.filter(c=>!c.cancelada&&c.fecha>=today()).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));b=`<div class="card">${L.length?L.map(citaRow).join(''):empty('No hay citas próximas.')}</div>`}
 if(s==='hist'){const L=C.filter(c=>c.cancelada||c.fecha<today()).sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora));b=`<div class="card">${L.length?L.map(citaRow).join(''):empty('Aún no hay consultas pasadas.')}</div>`}
 return`<div class="row sp"><h2>Citas veterinarias</h2>${addB('cita','+ Nueva cita')}</div><div class="tabs" style="margin-top:10px">${subs.map(([k,l])=>`<button class="chip" aria-pressed="${s===k}" data-a="sub" data-s="${k}">${l}</button>`).join('')}</div>${b}`}
function vMed(){const L=R('med').sort((a,b)=>b.fecha.localeCompare(a.fecha));
 return`<div class="row sp"><h2>Historial médico</h2>${addB('med','+ Nuevo registro')}</div><div class="card" style="margin-top:12px">${L.length?L.map(m=>`<div class="item"><div><b>${esc(m.titulo)}</b> <span class="tag">${esc(m.tipo)}</span><div class="mut">${fd(m.fecha)}</div>${m.detalle?`<div>${esc(m.detalle)}</div>`:''}${m.foto?`<button class="btn sm ghost" data-a="view" data-id="${m._id}">Ver imagen</button>`:''}</div><button class="btn sm ghost" data-a="edit" data-t="med" data-id="${m._id}">Editar</button></div>`).join(''):empty('Aquí guardarás enfermedades, diagnósticos, cirugías y estudios.')}</div>`}
function chart(P){if(P.length<2)return'<p class="mut">Registra al menos dos pesos para ver la gráfica.</p>';
 const W=600,H=210,p=34,t0=+D(P[0].fecha),t1=+D(P[P.length-1].fecha)||t0+1,ys=P.map(x=>x.kg),lo=Math.min(...ys)-.5,hi=Math.max(...ys)+.5,
 X=d=>p+(t1===t0?0:(+D(d)-t0)/(t1-t0))*(W-2*p),Y=k=>H-p-(k-lo)/(hi-lo)*(H-2*p);
 return`<div class="ov"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Evolución del peso"><g stroke="var(--line)"><line x1="${p}" y1="${H-p}" x2="${W-p}" y2="${H-p}"/><line x1="${p}" y1="${p}" x2="${p}" y2="${H-p}"/></g><polyline fill="none" stroke="var(--green)" stroke-width="3" points="${P.map(x=>X(x.fecha)+','+Y(x.kg)).join(' ')}"/>${P.map(x=>`<circle cx="${X(x.fecha)}" cy="${Y(x.kg)}" r="5" fill="var(--green)"><title>${fd(x.fecha)}: ${x.kg} kg</title></circle>`).join('')}<g fill="var(--mut)" font-size="12"><text x="2" y="${p+4}">${hi.toFixed(1)}</text><text x="2" y="${H-p}">${lo.toFixed(1)}</text><text x="${p}" y="${H-8}">${fd(P[0].fecha)}</text><text x="${W-p}" y="${H-8}" text-anchor="end">${fd(P[P.length-1].fecha)}</text></g></svg></div>`}
function vPeso(){const P=R('peso').sort((a,b)=>a.fecha.localeCompare(b.fecha));
 return`<div class="row sp"><h2>Control de peso</h2>${addB('peso','+ Registrar peso')}</div><div class="card" style="margin:12px 0">${chart(P)}</div><div class="card">${P.length?[...P].reverse().map(x=>`<div class="item"><div><b>${x.kg} kg</b><div class="mut">${fd(x.fecha)}${x.obs?' · '+esc(x.obs):''}</div></div><button class="btn sm ghost" data-a="edit" data-t="peso" data-id="${x._id}">Editar</button></div>`).join(''):empty('Sin registros de peso todavía.')}</div>`}
function vPerfil(){const p=S.prof;if(!p.nombre)return vInicio();
 const rows=[['Raza',p.raza],['Edad',edad()],['Sexo',p.sexo],['Color y rasgos',p.color],['Peso actual',latestW()&&latestW()+' kg'],['Estatura',p.talla&&p.talla+' cm'],['Microchip',p.chip],['Esterilizado',p.esteril],['Alimentación',p.alim],['Alergias',p.alergias],['Padecimientos',p.enf],['Medicamentos',p.meds],['Propietario',p.dueno],['Teléfono',p.tel],['Dirección',p.dir]].filter(r=>r[1]);
 return`<div class="row sp"><h2>${esc(p.nombre)}</h2><div class="row"><button class="btn" data-a="perfil">Editar perfil</button><button class="btn danger" data-a="delpet">Eliminar perro</button></div></div><div class="card" style="margin-top:12px">${rows.map(r=>`<div class="item"><div class="mut" style="flex:0 0 130px">${r[0]}</div><div>${esc(r[1])}</div></div>`).join('')}</div>`}
function render(){S.ready=true;const p=S.prof;const pe=$('#pets');pe.style.display=S.pets.length?'flex':'none';pe.innerHTML=S.pets.map(x=>`<button class="chip" aria-pressed="${x._id===S.pid}" data-a="pet" data-id="${x._id}">🐕 ${esc(x.nombre)}</button>`).join('')+'<button class="chip" data-a="newpet">+ Agregar perro</button>';
 $('#hn').textContent=p.nombre||'Huellitas';$('#hs').textContent=p.nombre?(edad()||'Expediente digital'):'Expediente digital de tu perro';
 const a=$('#hav');a.style.backgroundImage=p.foto?`url('${p.foto}')`:'';a.textContent=p.foto?'':'🐾';
 $('#nav').innerHTML=TABS.map(([k,l])=>`<button data-a="tab" data-k="${k}" ${S.tab===k?'aria-current="true"':''}>${l}</button>`).join('');
 $('#app').innerHTML=(p.nombre?{inicio:vInicio,vac:vVac,cita:vCita,med:vMed,peso:vPeso,perfil:vPerfil}[S.tab]:vInicio)()}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,d=b.dataset;
 if(a==='close')return close();
 if(a==='pet'){S.pid=d.id;try{localStorage.setItem('hpid',d.id)}catch{}sel();return render()}
 if(!col)return;
 if(a==='tab'){S.tab=d.k;render()}
 else if(a==='sub'){S.sub=d.s;render()}
 else if(a==='nav'){const c=new Date(S.cur);S.sub==='sem'?c.setDate(c.getDate()+7*d.n):c.setMonth(c.getMonth()+ +d.n,1);S.cur=c;render()}
 else if(a==='day'){S.sel=d.d;render()}
 else if(a==='add')open(d.t,null,d.d?{fecha:d.d}:{});
 else if(a==='edit')open(d.t,d.id);
 else if(a==='perfil')openProf();else if(a==='newpet')openProf(true);else if(a==='pet'){S.pid=d.id;sel();render()}else if(a==='delpet')ask('¿Eliminar a '+S.prof.nombre+' y todos sus registros? No se puede deshacer.',async()=>{const id=S.pid,ids=S.recs.filter(r=>(r.pid||'perfil')===id).map(r=>r._id).concat(id);if(await w(Promise.all(ids.map(i=>col.doc(i).delete())))){close();toast('Perro eliminado')}});
 else if(a==='cancel')ask('¿Cancelar esta cita? Quedará en el historial.',async()=>{const c=S.recs.find(x=>x._id===d.id),o={...c,cancelada:true};delete o._id;if(await w(col.doc(d.id).set(o))){close();toast('Cita cancelada')}});
 else if(a==='done'){const c=S.recs.find(x=>x._id===d.id),o={...c,hecho:true};delete o._id;await w(col.doc(d.id).set(o))}
 else if(a==='lead')setLead(+d.n);
 else if(a==='view'){const r=S.recs.find(x=>x._id===d.id);sheet(`<img class="pv" src="${r.foto}" alt="Imagen guardada"><div class="row" style="margin-top:12px"><button class="btn ghost" data-a="close">Cerrar</button></div>`)}
 else if(a==='notif'){try{const r=await Notification.requestPermission();toast(r==='granted'?'Notificaciones activadas':'Las notificaciones están bloqueadas en este navegador');notify()}catch{toast('Este navegador no permite notificaciones aquí')}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
function notify(){try{if(Notification.permission!=='granted')return;const k='hn'+today();if(localStorage.getItem(k))return;
 const L=events().filter(e=>S.lead.includes(diff(e.d)));if(!L.length)return;localStorage.setItem(k,1);
 new Notification('Huellitas: '+L.length+' aviso'+(L.length>1?'s':''),{body:L.map(e=>e.txt+' ('+when(e.d)+')').join('\n')})}catch{}}
function gate(mode){mode=mode||'login';const reg=mode==='reg';
 $('#nav').innerHTML='';$('#pets').style.display='none';$('#out').hidden=true;
 $('#app').innerHTML=`<div class="card" style="max-width:420px;margin:24px auto"><h2>${reg?'Crea tu cuenta':'Inicia sesión'}</h2><p class="mut">Tu expediente es privado y se sincroniza entre tus dispositivos.</p><form id="af" novalidate>${reg?'<label>Tu nombre<input name="name" autocomplete="name"></label>':''}<label>Correo<input name="email" type="email" autocomplete="email" required></label><label>Contraseña (mínimo 8 caracteres)<input name="password" type="password" autocomplete="${reg?'new-password':'current-password'}" required></label><p class="err" id="aerr" role="alert"></p><button class="btn" type="submit">${reg?'Crear cuenta':'Entrar'}</button></form><p class="mut">${reg?'¿Ya tienes cuenta?':'¿Aún no tienes cuenta?'} <a href="#" id="sw">${reg?'Inicia sesión':'Crea una'}</a></p></div>`;
 $('#sw').onclick=e=>{e.preventDefault();gate(reg?'login':'reg')};
 $('#af').onsubmit=async e=>{e.preventDefault();const f=e.target.elements,b={email:f.email.value,password:f.password.value,name:f.name?f.name.value:''};
  try{await API.auth(reg?'register':'login',b);location.reload()}catch(x){$('#aerr').textContent=x.message}}}
function onSnap(s){S.recs=[];S.pets=[];let lg=null;
 s.docs.forEach(x=>{const v=x.data();v._id=x.id;if(x.id==='cfg')S.lead=v.lead||[7,3,0];else if(x.id==='perfil'){if(v.nombre){S.pets.push(v);lg=v.lead}}else if(v.t==='pet')S.pets.push(v);else S.recs.push(v)});
 if(lg&&!s.docs.some(x=>x.id==='cfg'))S.lead=lg;
 let sv=null;try{sv=localStorage.getItem('hpid')}catch{}
 if(!S.pets.some(p=>p._id===S.pid))S.pid=S.pets.some(p=>p._id===sv)?sv:(S.pets[0]?._id||null);
 sel();render();if(!window._n){window._n=1;notify()}}
(async()=>{
 if(!API.token)return gate();
 try{await API.req('GET','/api/me')}catch{return gate()}
 $('#out').hidden=false;$('#out').onclick=()=>API.logout();
 col=makeCol();col.onSnapshot(onSnap,()=>toast('Sin conexión con el servidor. Reintentando…'));render()})();

