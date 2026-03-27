import{c as U,b as $,r as x,e as N,j as e,l as k,i as z,U as L,a as j,s as M}from"./index-DRlvC4TR.js";import{getMunicipalityReport as B,buildTableReportHTML as R}from"./reportUtils-DjzFs_3q.js";import{P,R as O,E as q,h as F}from"./reportTemplate-DXPNoyru.js";import{getQRCodeURL as Q}from"./qrcode-C_7GDAR9.js";import"./globe-Bpvnhnsg.js";import"./check-L-E5dpQY.js";import"./chevron-up-B4lDvQJs.js";import"./chevron-down-3idf1cL_.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y=U("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);function Z(){const{user:g}=$(),l=(g==null?void 0:g.municipalityId)||0,[f,w]=x.useState(""),[o,u]=x.useState(null),[a,S]=x.useState(null),[m,C]=x.useState(""),[y,T]=x.useState([]);x.useEffect(()=>{l&&B(l,j).then(S).catch(()=>{})},[l]);const{data:D}=N(()=>j.schools.list({municipalityId:l}),[l]),{data:E}=N(()=>j.students.list({municipalityId:l}),[l]),b=D||[],d=(E||[]).filter(t=>{var r;const i=!f||String(t.schoolId)===f,n=!m||((r=t.name)==null?void 0:r.toLowerCase().includes(m.toLowerCase()))||(t.enrollment||"").includes(m);return i&&n}),v=t=>{const i=a==null?void 0:a.municipality,n=a==null?void 0:a.secretaria,r=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Carteirinhas - NetEscol</title>
    <style>
      body{font-family:Arial,sans-serif;padding:10px;margin:0}
      .cards{display:flex;flex-wrap:wrap;gap:15px;justify-content:center}
      .card{width:400px;height:255px;border:2px solid #1B3A5C;border-radius:12px;padding:12px;position:relative;page-break-inside:avoid;background:linear-gradient(135deg,#f0f4f8 0%,#e6f7f6 100%)}
      .card-inst{display:flex;align-items:center;gap:6px;margin-bottom:4px;padding-bottom:4px;border-bottom:1.5px solid #ccc}
      .card-inst img{width:32px;height:32px;object-fit:contain}
      .card-inst .inst-text{flex:1;text-align:center;line-height:1.15}
      .card-inst .inst-text p{margin:0;font-size:7.5px;color:#444}
      .card-inst .inst-text .mun{font-size:8px;font-weight:bold;color:#1B3A5C;text-transform:uppercase}
      .card-inst .inst-text .sec{font-size:7px;color:#555}
      .card-inst .inst-text .sch{font-size:7.5px;color:#333;font-weight:600}
      .card-title{text-align:center;font-size:11px;font-weight:bold;color:#1B3A5C;margin:3px 0;padding-bottom:3px;border-bottom:2px solid #2DB5B0;letter-spacing:1px}
      .card-body{display:flex;gap:8px;margin-top:5px}
      .photo{width:60px;height:75px;background:#ddd;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#999;border:1px solid #ccc;flex-shrink:0}
      .photo img{width:100%;height:100%;object-fit:cover;border-radius:6px}
      .info{flex:1;font-size:9.5px;line-height:1.55}
      .info b{color:#1B3A5C}
      .qr{width:65px;height:65px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
      .qr img{width:60px;height:60px}
      .card-footer{position:absolute;bottom:5px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;font-size:7.5px;color:#999}
      @media print{body{padding:0}.cards{gap:10px}}
    </style></head><body>
    <div class="cards">${t.map(s=>{var h;const p=b.find(I=>I.id===s.schoolId);return`<div class="card">
        <div class="card-inst">
          ${i!=null&&i.logoUrl?'<img src="'+i.logoUrl+'" alt="Brasao"/>':""}
          <div class="inst-text">
            ${i!=null&&i.state?"<p>ESTADO DO "+i.state.toUpperCase()+"</p>":""}
            <p class="mun">${(i==null?void 0:i.name)||"Prefeitura Municipal"}</p>
            ${n!=null&&n.name?'<p class="sec">'+n.name+"</p>":""}
            <p class="sch">${(p==null?void 0:p.name)||""}</p>
          </div>
        </div>
        <div class="card-title">CARTEIRA ESTUDANTIL</div>
        <div class="card-body">
          <div class="photo">${s.photoUrl?'<img src="'+s.photoUrl+'"/>':((h=s.name)==null?void 0:h[0])||"?"}</div>
          <div class="info">
            <p><b>Nome:</b> ${s.name}</p>
            <p><b>Matrícula:</b> ${s.enrollment||"—"}</p>
            <p><b>Série:</b> ${s.grade||"—"} | <b>Turma:</b> ${s.classRoom||"—"}</p>
            <p><b>Turno:</b> ${s.shift==="afternoon"?"Tarde":s.shift==="evening"?"Noite":s.shift==="full_time"?"Integral":"Manhã"}</p>
            <p><b>Nascimento:</b> ${s.birthDate?new Date(s.birthDate).toLocaleDateString("pt-BR"):"—"}</p>
          </div>
          <div class="qr"><img src="${Q(s.enrollment||String(s.id),60)}" alt="QR"/></div>
        </div>
        <div class="card-footer"><span>Validade: ${new Date().getFullYear()}</span></div>
      </div>`}).join("")}</div></body></html>`,c=window.open("","_blank");c&&(c.document.write(r),c.document.close(),setTimeout(()=>c.print(),300))},A=()=>{const t=d.map(r=>({nome:r.name||"--",matrícula:r.enrollment||"--",serie:r.grade||"--",turma:r.classRoom||"--",turno:r.shift==="afternoon"?"Tarde":r.shift==="evening"?"Noite":"Manhã",nascimento:r.birthDate?new Date(r.birthDate).toLocaleDateString("pt-BR"):"--"})),n=R("LISTA DE ALUNOS - CARTEIRINHA ESTUDANTIL",t,["Nome","Matricula","Serie","Turma","Turno","Nascimento"],a,{orientation:"landscape",signatories:y});if(!n){M("Nenhum dado para exportar");return}u({html:n,filename:"carteirinha_estudantil"})};return e.jsxs("div",{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center",children:e.jsx(Y,{size:20,className:"text-teal-600"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:"Carteirinha Estudantil"}),e.jsxs("p",{className:"text-gray-500",children:[d.length," aluno(s)"]})]})]}),d.length>0&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>v(d),className:"btn-primary flex items-center gap-2",children:[e.jsx(P,{size:16})," Imprimir Carteirinhas"]}),e.jsxs("button",{onClick:A,className:"btn-secondary flex items-center gap-2",children:[e.jsx(k,{size:16})," Exportar"]})]})]}),e.jsx(O,{selected:y,onChange:T}),e.jsxs("div",{className:"flex gap-3 mb-5",children:[e.jsxs("select",{className:"input w-56",value:f,onChange:t=>w(t.target.value),children:[e.jsx("option",{value:"",children:"Todas as escolas"}),b.map(t=>e.jsx("option",{value:t.id,children:t.name},t.id))]}),e.jsxs("div",{className:"relative flex-1",children:[e.jsx(z,{size:15,className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"}),e.jsx("input",{className:"input pl-9",placeholder:"Buscar por nome ou matr\\u00edcula...",value:m,onChange:t=>C(t.target.value)})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:[d.map(t=>{var n,r,c,s,p;const i=b.find(h=>h.id===t.schoolId);return e.jsxs("div",{className:"rounded-xl border-2 border-primary-500 p-4 bg-gradient-to-br from-[#f0f4f8] to-[#e6f7f6] relative cursor-pointer hover:shadow-lg transition-shadow",onClick:()=>v([t]),children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2 pb-2 border-b border-gray-300",children:[((n=a==null?void 0:a.municipality)==null?void 0:n.logoUrl)&&e.jsx("img",{src:a.municipality.logoUrl,className:"w-7 h-7 object-contain",alt:""}),e.jsxs("div",{className:"flex-1 text-center leading-tight",children:[((r=a==null?void 0:a.municipality)==null?void 0:r.state)&&e.jsxs("p",{className:"text-[7px] text-gray-500",children:["ESTADO DO ",a.municipality.state.toUpperCase()]}),e.jsx("p",{className:"text-[8px] font-bold text-primary-700 uppercase",children:((c=a==null?void 0:a.municipality)==null?void 0:c.name)||"Prefeitura"}),((s=a==null?void 0:a.secretaria)==null?void 0:s.name)&&e.jsx("p",{className:"text-[7px] text-gray-500",children:a.secretaria.name}),e.jsx("p",{className:"text-[8px] font-semibold text-gray-700",children:(i==null?void 0:i.name)||""})]})]}),e.jsx("p",{className:"text-[10px] font-bold text-primary-600 uppercase text-center mb-2 pb-1 border-b-2 border-accent-500 tracking-wider",children:"Carteira Estudantil"}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx("div",{className:"w-16 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400 flex-shrink-0 overflow-hidden",children:t.photoUrl?e.jsx("img",{src:t.photoUrl,className:"w-full h-full object-cover"}):(p=t.name)==null?void 0:p[0]}),e.jsxs("div",{className:"text-xs space-y-0.5",children:[e.jsx("p",{className:"font-bold text-gray-800 text-sm",children:t.name}),e.jsxs("p",{className:"text-gray-600",children:[e.jsx("b",{children:"Mat:"})," ",t.enrollment||"—"]}),e.jsxs("p",{className:"text-gray-600",children:[e.jsx("b",{children:"S\\u00e9rie:"})," ",t.grade||"—"," | ",e.jsx("b",{children:"Turma:"})," ",t.classRoom||"—"]}),e.jsxs("p",{className:"text-gray-600",children:[e.jsx("b",{children:"Turno:"})," ",t.shift==="afternoon"?"Tarde":t.shift==="evening"?"Noite":"Manhã"]})]})]}),e.jsxs("div",{className:"flex justify-between mt-2 text-[10px] text-gray-400",children:[e.jsxs("span",{children:["Ano Letivo ",new Date().getFullYear()]}),e.jsxs("span",{children:["Mat: ",t.enrollment||t.id]})]})]},t.id)}),!d.length&&e.jsxs("div",{className:"col-span-3 card text-center py-16",children:[e.jsx(L,{size:48,className:"text-gray-200 mx-auto mb-3"}),e.jsx("p",{className:"text-gray-500",children:"Nenhum aluno encontrado"})]})]}),e.jsx(q,{allowSign:!0,open:!!o,onClose:()=>u(null),onExport:(t,i)=>{o!=null&&o.html&&F(t,[],o.html,o.filename,i),u(null)},title:o?"Exportar Relatório":void 0})]})}export{Z as default};
