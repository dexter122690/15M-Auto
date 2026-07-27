(function(){
  function textOf(entry, keys){ for(var i=0;i<keys.length;i++){ if(entry[keys[i]]!==undefined&&entry[keys[i]]!==null) return String(entry[keys[i]]); } return ""; }
  function clean(value){ return String(value||"").replace(/[^a-z0-9]/gi,"").toLowerCase(); }
  function money(value){ return Number(String(value||"").replace(/[^0-9.-]/g,""))||0; }
  function findEntry(cells, used){
    if(typeof data==="undefined"||!Array.isArray(data.expenses)) return -1;
    var date=clean(cells[0]?.textContent), item=clean(cells[1]?.textContent), total=money(cells[5]?.textContent);
    for(var i=0;i<data.expenses.length;i++){
      var e=data.expenses[i]; if(used[i]) continue;
      var eDate=clean(textOf(e,["date","invoiceDate"]));
      var eItem=clean(textOf(e,["description","item","service","name"]));
      var eTotal=Number(e.total!==undefined?e.total:(Number(e.amount||0)*Number(e.qty||e.quantity||1)));
      if(eDate===date&&eItem===item&&Math.abs(eTotal-total)<0.02) return i;
    } return -1;
  }
  function addActions(){
    var body=document.getElementById("expenseRows"); if(!body||typeof data==="undefined"||!Array.isArray(data.expenses)) return;
    var table=body.closest("table"), header=table&&table.querySelector("thead tr"); if(!table||!header) return;
    if(!header.querySelector(".expense-action-head")){ var h=document.createElement("th"); h.className="expense-action-head"; h.textContent="Actions"; header.appendChild(h); }
    var used={};
    Array.from(body.rows).forEach(function(row){
      var cells=Array.from(row.cells); if(!cells.length) return; var index=findEntry(cells,used); if(index<0) return; used[index]=true;
      row.dataset.expenseIndex=index; var cell=row.querySelector(".expense-action-cell"); if(!cell){ cell=document.createElement("td"); cell.className="expense-action-cell"; row.appendChild(cell); }
      cell.innerHTML='<button type="button" class="expense-edit" data-expense-edit="'+index+'">Edit</button><button type="button" class="expense-delete" data-expense-delete="'+index+'">Delete</button>';
    });
  }
  function startEdit(index){
    if(typeof data==="undefined"||!data.expenses||!data.expenses[index]) return;
    var e=data.expenses[index], form=document.getElementById("expenseForm"); if(!form) return;
    document.getElementById("expenseEditId").value="bridge-"+index;
    document.getElementById("eDate").value=textOf(e,["date","invoiceDate"]);
    document.getElementById("eCategory").value=textOf(e,["type","category","kind"])||"Miscellaneous Expense";
    document.getElementById("eDescription").value=textOf(e,["description","item","service","name"]);
    document.getElementById("eAmount").value=Number(e.amount||e.total||0);
    document.getElementById("eQty").value=Number(e.qty||e.quantity||1);
    var mode=document.getElementById("eMode"); if(mode) mode.value=textOf(e,["mode","paymentMode"])||"Sir Dex";
    var ref=document.getElementById("eReference"); if(ref) ref.value=textOf(e,["reference","ref","checkNo"]);
    var remarks=document.getElementById("eRemarks"); if(remarks) remarks.value=textOf(e,["remarks","notes"]);
    var button=form.querySelector("button[type=submit]")||form.querySelector("button"); if(button) button.textContent="Save expense changes";
    form.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function bind(){
    if(window.__15mExpenseActions) return; window.__15mExpenseActions=true;
    var style=document.createElement("style"); style.textContent=".expense-action-cell{white-space:nowrap}.expense-action-cell button{margin-right:6px;border:0;border-radius:6px;padding:6px 9px;font-weight:700;cursor:pointer}.expense-edit{background:#ff5a16;color:#fff}.expense-delete{background:#251d19;color:#fff}"; document.head.appendChild(style);
    document.addEventListener("click",function(event){
      var edit=event.target.closest("[data-expense-edit]"), del=event.target.closest("[data-expense-delete]");
      if(edit){ startEdit(Number(edit.dataset.expenseEdit)); return; }
      if(del){ var index=Number(del.dataset.expenseDelete); if(typeof data!=="undefined"&&data.expenses&&data.expenses[index]&&window.confirm("Delete this expense? This cannot be undone.")){ data.expenses.splice(index,1); if(typeof save==="function") save(); if(typeof render==="function") render(); } }
    },true);
    document.addEventListener("submit",function(event){
      var form=event.target; if(!form||form.id!=="expenseForm"||!String(document.getElementById("expenseEditId").value).startsWith("bridge-")) return;
      event.preventDefault(); event.stopImmediatePropagation(); var index=Number(document.getElementById("expenseEditId").value.replace("bridge-","")); if(!data.expenses[index]) return;
      var old=data.expenses[index], qty=Number(document.getElementById("eQty").value)||1, amount=Number(document.getElementById("eAmount").value)||0, type=document.getElementById("eCategory").value, description=document.getElementById("eDescription").value.trim();
      old.date=document.getElementById("eDate").value; old.description=description; old.item=description; old.service=description; old.type=type; old.category=type; old.qty=qty; old.quantity=qty; old.amount=amount; old.total=qty*amount;
      var mode=document.getElementById("eMode"); if(mode){old.mode=mode.value;old.paymentMode=mode.value;} var ref=document.getElementById("eReference"); if(ref){old.reference=ref.value;old.ref=ref.value;} var remarks=document.getElementById("eRemarks"); if(remarks){old.remarks=remarks.value;old.notes=remarks.value;}
      document.getElementById("expenseEditId").value=""; var button=form.querySelector("button[type=submit]")||form.querySelector("button"); if(button) button.textContent="Add expense"; if(typeof save==="function") save(); if(typeof render==="function") render();
    },true);
    function numberOf(entry){
      var quantity=Number(entry.qty||entry.quantity||1), unit=Number(entry.amount||0), total=entry.total;
      total=total===undefined||total===null||total===""?unit*quantity:Number(total);
      return Number.isFinite(total)?total:0;
    }
    function selectedPeriod(){
      var month="", year="", labels=document.querySelectorAll("#expenses label");
      Array.from(labels).forEach(function(label){
        var select=label.querySelector("select"), title=String(label.textContent||"").trim().toLowerCase();
        if(!select) return;
        if(title.indexOf("month")===0) month=select.value||"";
        if(title.indexOf("year")===0) year=select.value||"";
      });
      return {month:month,year:year};
    }
    function monthNumber(value){
      var text=String(value||"").trim().toLowerCase();
      if(!text||text.indexOf("all")===0) return "";
      if(/^\d{1,2}$/.test(text)) return String(Number(text)).padStart(2,"0");
      var months=["january","february","march","april","may","june","july","august","september","october","november","december"];
      var found=months.indexOf(text); return found<0?"":String(found+1).padStart(2,"0");
    }
    function standardDate(value){
      var text=String(value||"").trim();
      var iso=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if(iso) return iso[1]+"-"+String(iso[2]).padStart(2,"0")+"-"+String(iso[3]).padStart(2,"0");
      var local=text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
      return local?local[3]+"-"+String(local[2]).padStart(2,"0")+"-"+String(local[1]).padStart(2,"0"):"";
    }
    function updateSummary(){
      if(typeof data==="undefined"||!Array.isArray(data.expenses)) return;
      var period=selectedPeriod(), month=monthNumber(period.month), year=String(period.year||"").replace(/\D/g,"");
      if(year.length!==4) year="";
      var rows=data.expenses.filter(function(entry){
        var date=standardDate(textOf(entry,["date","invoiceDate"]));
        return (!year||date.slice(0,4)===year)&&(!month||date.slice(5,7)===month);
      });
      var total=rows.reduce(function(sum,entry){return sum+numberOf(entry);},0);
      var cost=rows.filter(function(entry){return clean(textOf(entry,["type","category","kind"]))===clean("Cost of Sales");}).reduce(function(sum,entry){return sum+numberOf(entry);},0);
      var petty=rows.filter(function(entry){return clean(textOf(entry,["mode","paymentMode"])).indexOf("petty")>=0;}).reduce(function(sum,entry){return sum+numberOf(entry);},0);
      var cib=rows.filter(function(entry){return clean(textOf(entry,["mode","paymentMode"])).indexOf("cib")>=0;}).reduce(function(sum,entry){return sum+numberOf(entry);},0);
      Array.from(document.querySelectorAll("#expenses .card")).forEach(function(card){
        var label=String(card.querySelector("span")?.textContent||"").trim().toLowerCase(), value;
        if(label==="expenses in selected period") value=total;
        else if(label==="cost of sales") value=cost;
        else if(label==="paid from petty cash") value=petty;
        else if(label==="paid from cib") value=cib;
        else return;
        var strong=card.querySelector("strong"); if(strong) strong.textContent=new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:2}).format(value);
        var detail=card.querySelectorAll("span")[1]; if(detail&&label==="expenses in selected period") detail.textContent=rows.length+" expense entr"+(rows.length===1?"y":"ies");
      });
    }
    var original=window.render; if(typeof original==="function"){ window.render=function(){ var result=original.apply(this,arguments); setTimeout(function(){addActions();updateSummary();},0); return result; }; }
    // The main render function already refreshes this table. Observing every DOM change here
    // would re-write the buttons repeatedly and can make the browser unresponsive.
    document.querySelectorAll("#expenses select").forEach(function(select){select.addEventListener("change",updateSummary);});
    setTimeout(function(){addActions();updateSummary();},300);
  } bind();
}());


/* Correct Sto. Tomas reporting and printable invoices */
(function(){
function amt(e){var q=Number(e.qty||e.quantity||1),a=Number(e.amount||0);return e.total==null||e.total===''?a*q:Number(e.total)||0}
function iso(v){v=String(v||'').trim();var m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0');m=v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);return m?m[3]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0'):''}
function period(){var mo='',yr='';document.querySelectorAll('#expenses label').forEach(function(l){var s=l.querySelector('select'),t=(l.textContent||'').trim().toLowerCase();if(s&&t.indexOf('month')===0)mo=s.value||'';if(s&&t.indexOf('year')===0)yr=s.value||''});var n=['january','february','march','april','may','june','july','august','september','october','november','december'],x=String(mo).toLowerCase();x=!x||x.indexOf('all')===0?'':(/^\d{1,2}$/.test(x)?String(+x).padStart(2,'0'):String(n.indexOf(x)+1).padStart(2,'0'));return{m:x==='00'?'':x,y:(String(yr).match(/^\d{4}$/)||[''])[0]}}
function cards(){if(!Array.isArray(window.data?.expenses))return;var p=period(),r=data.expenses.filter(function(e){var d=iso(e.date||e.invoiceDate);return(!p.y||d.slice(0,4)===p.y)&&(!p.m||d.slice(5,7)===p.m)}),sum=function(a){return a.reduce(function(s,e){return s+amt(e)},0)},tot=sum(r),cost=sum(r.filter(function(e){return String(e.type||e.category||'').trim().toLowerCase()==='cost of sales'})),petty=sum(r.filter(function(e){return String(e.mode||e.paymentMode||'').toLowerCase().indexOf('petty')>=0})),cib=sum(r.filter(function(e){return String(e.mode||e.paymentMode||'').toLowerCase().indexOf('cib')>=0})),fmt=function(v){return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2}).format(v)};document.querySelectorAll('#expenses .card').forEach(function(c){var l=(c.querySelector('span')?.textContent||'').trim().toLowerCase(),v=l==='expenses in selected period'?tot:l==='cost of sales'?cost:l==='paid from petty cash'?petty:l==='paid from cib'?cib:null;if(v===null)return;var b=c.querySelector('strong');if(b)b.textContent=fmt(v);var d=c.querySelectorAll('span')[1];if(d&&l==='expenses in selected period')d.textContent=r.length+' expense entr'+(r.length===1?'y':'ies')})}
function sto(){return String(localStorage.getItem('15m-local-branch-login')||'').toLowerCase()==='15msto.tomas@gmail.com'||/15M Sto\. Tomas/i.test(document.body.textContent||'')}
function printFix(){var box=document.getElementById('printInvoice');if(!box)return;box.querySelectorAll('*').forEach(function(e){if(!e.children.length)e.textContent=(e.textContent||'').replace(/â€”/g,'—').replace(/â€¢/g,'•').replace(/â€“/g,'–')});box.querySelectorAll('b').forEach(function(b){if((b.textContent||'').trim().toUpperCase()==='ESTIMATED RELEASE'){var v=b.nextElementSibling;if(v&&/^(—|â€”|)$/.test((v.textContent||'').trim()))v.textContent='Not yet set'}});if(sto())box.querySelectorAll('p').forEach(function(p){if(/Emmanuel Car Salon|Brgy\. Malitlit|Sta\. Rosa, Laguna/i.test(p.textContent||''))p.textContent='1960 ME GOV Antonio Carpio Ave Brgy. San Pedro, Sto. Tomas, Batangas'})}
var prior=window.render;if(typeof prior==='function')window.render=function(){var z=prior.apply(this,arguments);setTimeout(cards,0);return z};document.querySelectorAll('#expenses select').forEach(function(s){s.addEventListener('change',cards)});window.addEventListener('beforeprint',printFix);var old=window.print;window.print=function(){printFix();return old.apply(window,arguments)};setTimeout(cards,300)
}());
