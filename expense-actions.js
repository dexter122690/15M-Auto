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
    var original=window.render; if(typeof original==="function"){ window.render=function(){ var result=original.apply(this,arguments); setTimeout(addActions,0); return result; }; }
    // The main render function already refreshes this table. Observing every DOM change here
    // would re-write the buttons repeatedly and can make the browser unresponsive.
    setTimeout(addActions,300);
  } bind();
}());
