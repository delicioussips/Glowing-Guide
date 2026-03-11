import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';


// ─── CONFIG — PASTE YOUR KEYS HERE ──────────────────────────────────────────
const SUPABASE_URL      = "PASTE_YOUR_PROJECT_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_KEY_HERE";
const ANTHROPIC_KEY     = "PASTE_YOUR_ANTHROPIC_API_KEY_HERE";

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// ─── ORDERS ───────────────────────────────────────────────────────────────────
const fetchOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ ...r.data, id: r.id, _rowid: r.id }));
};

const insertOrder = async (order) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{ id: order.id, data: order }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const updateOrder = async (order) => {
  const { error } = await supabase
    .from('orders')
    .update({ data: order })
    .eq('id', order.id);
  if (error) throw error;
};

// ─── RECEIVING ────────────────────────────────────────────────────────────────
const fetchReceiving = async () => {
  const { data, error } = await supabase
    .from('receiving')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ ...r.data, id: r.id }));
};

const insertReceiving = async (record) => {
  const { error } = await supabase
    .from('receiving')
    .insert([{ id: record.id, data: record }]);
  if (error) throw error;
};

const updateReceiving = async (record) => {
  const { error } = await supabase
    .from('receiving')
    .update({ data: record })
    .eq('id', record.id);
  if (error) throw error;
};

// ─── INVENTORY ADJUSTMENTS ───────────────────────────────────────────────────
const fetchAdjustments = async () => {
  const { data, error } = await supabase
    .from('inv_adjustments')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(r => r.data);
};

const insertAdjustment = async (adj) => {
  const { error } = await supabase
    .from('inv_adjustments')
    .insert([{ data: adj }]);
  if (error) throw error;
};

// ─── CUPPING ──────────────────────────────────────────────────────────────────
const fetchCupping = async () => {
  const { data, error } = await supabase
    .from('cupping')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ ...r.data, id: r.id }));
};

const insertCupping = async (record) => {
  const { error } = await supabase
    .from('cupping')
    .insert([{ id: record.id, data: record }]);
  if (error) throw error;
};

const updateCupping = async (record) => {
  const { error } = await supabase
    .from('cupping')
    .update({ data: record })
    .eq('id', record.id);
  if (error) throw error;
};

// ─── REAL-TIME SUBSCRIPTIONS ─────────────────────────────────────────────────
// Call this once on app load — fires callback whenever any employee changes data
const subscribeAll = (onOrdersChange, onReceivingChange, onAdjChange, onCuppingChange) => {
  const channel = supabase
    .channel('crm-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },       () => onOrdersChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'receiving' },     () => onReceivingChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inv_adjustments'},() => onAdjChange())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cupping' },       () => onCuppingChange())
    .subscribe();
  return () => supabase.removeChannel(channel); // call this to unsubscribe
};


// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const WORKFLOW = ["production","receiving","inventory","roast","grinding","blending","packaging","cupping"];
const MODULE_META = {
  production:{ label:"Production Orders", icon:"📋", accent:"#A855F7" },
  receiving: { label:"Receiving Log",     icon:"📦", accent:"#C8702A" },
  inventory: { label:"Inventory Log",     icon:"🏭", accent:"#3DAA6A" },
  roast:     { label:"Roast Log",         icon:"🔥", accent:"#E8531A" },
  grinding:  { label:"Grinding Log",      icon:"⚙️", accent:"#7C6AE8" },
  blending:  { label:"Blending Log",      icon:"🔄", accent:"#1AB8CF" },
  packaging: { label:"Packaging Log",     icon:"🛍️", accent:"#D4A853" },
  cupping:   { label:"Cupping Log",         icon:"☕", accent:"#5BA4A4" },
};
const PROCESS_STEPS = ["roast","grinding","blending","packaging"];
const STEP_LABELS   = { roast:"Roast", grinding:"Grind", blending:"Blend", packaging:"Package" };
const counters = { po:0, batch:0 };
const nextPO    = ()=>{ counters.po++;    return `PO-${String(counters.po).padStart(4,"0")}`; };
const nextBatch = ()=>{ counters.batch++; return `BCH-${String(counters.batch).padStart(4,"0")}`; };

// ─── STYLES ───────────────────────────────────────────────────────────────────
const inp = (x={})=>({ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.13)", borderRadius:6, color:"#F5EDD8", padding:"8px 12px", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box", ...x });
const lbl = { fontSize:11, color:"rgba(255,255,255,0.42)", textTransform:"uppercase", letterSpacing:"0.09em", display:"block", marginBottom:5 };
const mkBtn=(bg,x={})=>({ background:bg, color:"#fff", border:"none", borderRadius:6, padding:"9px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.04em", ...x });
const ghost=(x={})=>({ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, color:"rgba(255,255,255,0.55)", cursor:"pointer", fontFamily:"inherit", fontSize:12, padding:"6px 14px", ...x });

function GrindScale({ value, onChange }){
  const val = Number(value) || 5;
  const labels = { 1:"Coarse / Cold Brew", 5:"Drip", 10:"Extra Fine" };
  const trackColor = `hsl(${20 + val*14}, 70%, 50%)`;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>1 — Coarse / Cold Brew</span>
        <span style={{ fontSize:14, fontWeight:700, color:trackColor, padding:"2px 12px", background:`${trackColor}20`, border:`1px solid ${trackColor}50`, borderRadius:6 }}>
          {val} {labels[val] ? `— ${labels[val]}` : ""}
        </span>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>10 — Extra Fine</span>
      </div>
      <input type="range" min="1" max="10" step="1" value={val} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", accentColor:trackColor, cursor:"pointer", height:6 }}/>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n=>(
          <span key={n} style={{ fontSize:9, color:n===val?trackColor:"rgba(255,255,255,0.2)", fontWeight:n===val?700:400, cursor:"pointer", userSelect:"none" }} onClick={()=>onChange(String(n))}>{n}</span>
        ))}
      </div>
    </div>
  );
}
function Badge({ label, color }){
  return <span style={{ background:`${color}20`, color, border:`1px solid ${color}40`, borderRadius:4, padding:"2px 9px", fontSize:10, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{label}</span>;
}
function Fld({ type, options, value, onChange, placeholder, disabled }){
  const s = inp({ opacity:disabled?0.5:1 });
  if(type==="grindscale") return <GrindScale value={value} onChange={onChange}/>;
  if(type==="select") return <select style={s} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}><option value="">— select —</option>{options.map(o=><option key={o}>{o}</option>)}</select>;
  if(type==="textarea") return <textarea rows={2} style={{...s,resize:"vertical"}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Notes…"} disabled={disabled}/>;
  if(type==="number") return <input type="text" inputMode="decimal" style={{...s,MozAppearance:"textfield"}} value={value} onChange={e=>onChange(e.target.value)} onWheel={e=>e.currentTarget.blur()} placeholder={placeholder||""} disabled={disabled}/>;
  return <input type={type} style={s} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} disabled={disabled}/>;
}
const GridRow=({fields,data,onChange})=>(
  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:"13px 18px" }}>
    {fields.map(f=>(
      <div key={f.name} style={f.full?{gridColumn:"1/-1"}:{}}>
        <label style={lbl}>{f.label}</label>
        <Fld type={f.type||"text"} options={f.options} value={data[f.name]||""} onChange={v=>onChange(f.name,v)} placeholder={f.ph||""}/>
      </div>
    ))}
  </div>
);

// ─── TODAY HELPER ─────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0,10);

// ─── PRINT / EXPORT REPORT ───────────────────────────────────────────────────
function printReport(po){
  const stepColor = s=>s==="roast"?"#c8400a":s==="grinding"?"#5b50c0":s==="blending"?"#0d8b9e":s==="packaging"?"#a07820":"#555";
  const stepIcon  = s=>s==="roast"?"🔥":s==="grinding"?"⚙️":s==="blending"?"🔄":s==="packaging"?"🛍️":"•";

  let productsHtml = po.products.map((prod,i)=>{
    const reqSteps = PROCESS_STEPS.filter(st=>prod[`requires${st.charAt(0).toUpperCase()+st.slice(1)}`]);
    const stepsHtml = reqSteps.map(step=>{
      const data = po.steps[`${prod.id}_${step}`];
      if(!data) return `<div class="step incomplete"><div class="step-head">${stepIcon(step)} ${STEP_LABELS[step]} — <em>Pending</em></div></div>`;
      const rows = Object.entries(data)
        .filter(([k,v])=>k!=="completedAt"&&k!=="selectedBags"&&v&&String(v).length<100)
        .map(([k,v])=>`<tr><td class="field-name">${k.replace(/([A-Z])/g," $1").trim()}</td><td>${v}</td></tr>`).join("");
      const bags = data.selectedBags?.length>0
        ? `<div class="bags-used"><b>Bags Used:</b> ${data.selectedBags.map(b=>`${b.origin} / ${b.bagMarks} — ${b.bagsUsed} bags`).join(" | ")}</div>` : "";
      return `<div class="step done"><div class="step-head" style="color:${stepColor(step)}">${stepIcon(step)} ${STEP_LABELS[step]} — Completed ${new Date(data.completedAt).toLocaleString()}</div>${bags}<table class="step-table">${rows}</table></div>`;
    }).join("");
    return `
      <div class="product-block">
        <div class="product-header">
          <span class="line-num">Line ${i+1}</span>
          <span class="product-name">${prod.productName}</span>
          ${prod.roastProfile?`<span class="badge roast">${prod.roastProfile}</span>`:""}
          ${prod.packageSize?`<span class="badge pkg">${prod.packageSize}</span>`:""}
        </div>
        <div class="product-meta">
          Batch: <b>${prod.batchNumber}</b>
          ${prod.skuQty?` &nbsp;|&nbsp; Qty: ${prod.skuQty} units`:""}
          ${prod.totalLbs?` &nbsp;|&nbsp; ${prod.totalLbs} lbs green`:""}
          ${prod.notes?` &nbsp;|&nbsp; ${prod.notes}`:""}
        </div>
        <div class="steps">${stepsHtml}</div>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${po.poNumber} — Traceability Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Georgia',serif;color:#1a1008;background:#fff;padding:30px 40px;font-size:13px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #6b3a0f;padding-bottom:14px;margin-bottom:22px}
    .brand{font-size:22px;font-weight:700;color:#6b3a0f;letter-spacing:.05em}
    .brand-sub{font-size:10px;color:#888;letter-spacing:.12em;text-transform:uppercase;margin-top:3px}
    .po-num{font-size:28px;font-weight:700;color:#6b3a0f;text-align:right}
    .po-sub{font-size:11px;color:#888;text-align:right;margin-top:3px}
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px 20px;background:#fdf6ee;border:1px solid #e8d5b0;border-radius:8px;padding:14px 18px;margin-bottom:22px}
    .summary-item .sk{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.08em}
    .summary-item .sv{font-size:13px;font-weight:600;color:#1a1008;margin-top:3px}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;border-bottom:1px solid #e0d0b0;padding-bottom:6px;margin:20px 0 14px}
    .product-block{border:1px solid #e0d0b0;border-radius:8px;margin-bottom:16px;overflow:hidden}
    .product-header{background:#fdf0e0;padding:11px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-bottom:1px solid #e0d0b0}
    .line-num{font-size:11px;color:#888;font-weight:600}
    .product-name{font-size:15px;font-weight:700;color:#1a1008}
    .badge{font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600}
    .badge.roast{background:#fde8d8;color:#c8400a;border:1px solid #f0c0a0}
    .badge.pkg{background:#ddf0f8;color:#0d6c7e;border:1px solid #b0dcea}
    .product-meta{padding:8px 16px;font-size:12px;color:#555;background:#fffaf5;border-bottom:1px solid #f0e0c8}
    .steps{padding:12px 16px;display:flex;flex-direction:column;gap:10px}
    .step{border-radius:6px;padding:10px 14px}
    .step.done{background:#f8fdf8;border:1px solid #b8e0b8}
    .step.incomplete{background:#fafafa;border:1px solid #e0e0e0;color:#999;font-style:italic}
    .step-head{font-weight:700;font-size:13px;margin-bottom:6px}
    .bags-used{font-size:11px;color:#6b3a0f;background:#fdf0e0;border-radius:4px;padding:5px 8px;margin:6px 0}
    .step-table{width:100%;border-collapse:collapse;font-size:12px}
    .step-table tr{border-bottom:1px solid #f0e8d8}
    .step-table td{padding:4px 8px}
    .field-name{color:#888;text-transform:capitalize;width:180px}
    .footer{margin-top:30px;padding-top:14px;border-top:1px solid #e0d0b0;display:flex;justify-content:space-between;font-size:11px;color:#aaa}
    @media print{body{padding:15px 20px}.no-print{display:none!important}}
  </style></head><body>
  <div class="header">
    <div><div class="brand">Delicious Sips Coffee Roasters</div><div class="brand-sub">Traceability Report</div></div>
    <div><div class="po-num">${po.poNumber}</div><div class="po-sub">Generated ${new Date().toLocaleString()}</div></div>
  </div>
  <div class="summary-grid">
    ${[["Customer",po.customer],["Order Date",po.date],["Target Date",po.targetDate||"—"],["Priority",po.priority],["Status",po.status],["Products",po.products.length+" line items"],["Created",new Date(po.createdAt).toLocaleDateString()],["Notes",po.notes||"—"]].map(([k,v])=>`<div class="summary-item"><div class="sk">${k}</div><div class="sv">${v}</div></div>`).join("")}
  </div>
  <div class="section-title">Product Lines & Process Steps</div>
  ${productsHtml}
  <div class="footer"><span>${po.poNumber} — ${po.customer}</span><span>Delicious Sips Coffee Roasters — Traceability Report</span><span>${new Date().toLocaleDateString()}</span></div>

  </body></html>`;

  // Use hidden iframe — works without pop-up permission, prints as PDF via browser
  const existing = document.getElementById("__crm_print_frame__");
  if(existing) existing.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "__crm_print_frame__";
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(()=>{
    iframe.contentWindow.print();
    setTimeout(()=>iframe.remove(), 5000);
  }, 400);
}

// ─── RECEIVING LOG ────────────────────────────────────────────────────────────
const RECV_EMPTY = { date:today(),supplier:"",origin:"",bagMarks:"",qtyBags:"",weightPerBag:"",costPerLb:"",deliveryOrder:"",coaFile:null,notes:"" };

function ReceivingLog({ onSave, records, onUpdateRecord }){
  const [d, setD]           = useState(RECV_EMPTY);
  const [flash, setFlash]   = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [doFile, setDoFile] = useState(null);
  const [doPreview, setDoPreview] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);  // multi-item DO results
  const fileRef  = useRef();
  const doRef    = useRef();

  const sd = (k,v)=>setD(p=>({...p,[k]:v}));

  // AI-powered DO parsing
  const handleDOUpload = async (file)=>{
    if(!file) return;
    setDoFile(file);
    const reader = new FileReader();
    reader.onload = async(e)=>{
      const base64 = e.target.result.split(",")[1];
      const isImage = file.type.startsWith("image/");
      const isPDF   = file.type==="application/pdf";
      setDoPreview(isImage ? e.target.result : null);
      setUploading(true);
      try {
        const contentBlock = isImage
          ? { type:"image", source:{ type:"base64", media_type:file.type, data:base64 }}
          : isPDF
          ? { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 }}
          : null;
        if(!contentBlock){ setUploading(false); return; }

        const resp = await fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body: JSON.stringify({
            model:"claude-sonnet-4-20250514",
            max_tokens:2000,
            system:`You extract delivery order data from documents. The document may contain MULTIPLE line items (different coffee origins, bag marks, or lots). Extract EACH line item as a separate object.
Return ONLY valid JSON in this exact format — an array even if there is only one item:
[
  {
    "date": "YYYY-MM-DD or empty string",
    "supplier": "supplier/shipper name or empty",
    "origin": "coffee origin country/region for this line item",
    "bagMarks": "bag marks or lot number for this line item",
    "qtyBags": "number of bags as integer string",
    "weightPerBag": "weight per bag in lbs as number string",
    "deliveryOrder": "delivery order number",
    "notes": "any relevant notes for this line item"
  }
]
If the document has 3 different coffees listed, return 3 objects. Share common fields (date, supplier, DO number) across all items.
Return ONLY the JSON array, no markdown, no explanation.`,
            messages:[{ role:"user", content:[contentBlock,{ type:"text", text:"Extract ALL line items from this delivery order as separate objects." }]}]
          })
        });
        const data = await resp.json();
        const text = data.content?.find(c=>c.type==="text")?.text || "[]";
        let parsed = [];
        try { parsed = JSON.parse(text.replace(/```json|```/g,"").trim()); } catch(e){}
        if(!Array.isArray(parsed)) parsed = [parsed];
        if(parsed.length>0){
          setParsedItems(parsed.map((item,i)=>({ ...item, id:Date.now()+i, costPerLb:"", coaFile:null })));
          setFlash("do_parsed");
          setTimeout(()=>setFlash(""),4000);
        }
        if(parsed.length===1){
          // Single item: also fill the manual form for convenience
          const p = parsed[0];
          setD(prev=>({
            ...prev,
            date:p.date||prev.date, supplier:p.supplier||prev.supplier,
            origin:p.origin||prev.origin, bagMarks:p.bagMarks||prev.bagMarks,
            qtyBags:p.qtyBags||prev.qtyBags, weightPerBag:p.weightPerBag||prev.weightPerBag,
            deliveryOrder:p.deliveryOrder||prev.deliveryOrder, notes:p.notes||prev.notes,
          }));
        }
        setTimeout(()=>setFlash(""),3000);
      } catch(err){
        setFlash("do_error");
        setTimeout(()=>setFlash(""),3000);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const save = ()=>{
    if(!d.origin||!d.bagMarks) return alert("Origin and Bag Marks are required.");
    onSave({...d, id:Date.now()});
    setD(RECV_EMPTY); setDoFile(null); setDoPreview(null);
    setFlash("saved"); setTimeout(()=>setFlash(""),2500);
  };

  const startEdit=(r)=>{ setEditId(r.id); setEditData({...r}); };
  const saveEdit=()=>{ onUpdateRecord(editData); setEditId(null); setFlash("edited"); setTimeout(()=>setFlash(""),2500); };

  const RECV_FIELDS=[
    {name:"date",label:"Date Received",type:"date"},
    {name:"supplier",label:"Supplier Name"},
    {name:"origin",label:"Origin / Region"},
    {name:"bagMarks",label:"Bag Marks"},
    {name:"qtyBags",label:"Quantity of Bags",type:"number"},
    {name:"weightPerBag",label:"Weight Per Bag (lbs)",type:"number"},
    {name:"costPerLb",label:"Cost Per Pound (USD)",type:"number",ph:"0.00"},
    {name:"deliveryOrder",label:"Delivery Order #"},
    {name:"notes",label:"Notes",type:"textarea",full:true},
  ];

  return (
    <div>
      {/* DO Upload zone */}
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.7)", marginBottom:10 }}>
          📄 Upload Delivery Order — Auto-fill from document
        </div>
        <div onClick={()=>doRef.current.click()}
          style={{ border:"2px dashed rgba(200,112,42,0.4)", borderRadius:10, padding:"20px 24px", cursor:"pointer", background:doFile?"rgba(200,112,42,0.07)":"rgba(255,255,255,0.02)", display:"flex", alignItems:"center", gap:14, transition:"all .2s" }}
          onDragOver={e=>{e.preventDefault();}}
          onDrop={e=>{e.preventDefault();handleDOUpload(e.dataTransfer.files[0]);}}>
          {uploading
            ? <><span style={{ fontSize:22 }}>⏳</span><div><div style={{ color:"#C8702A", fontWeight:700 }}>Parsing document with AI…</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:3 }}>Reading delivery order fields</div></div></>
            : doFile
            ? <><span style={{ fontSize:22 }}>📄</span><div><div style={{ color:"#3DAA6A", fontWeight:700 }}>✓ {doFile.name}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:3 }}>Click to replace • Fields auto-filled below</div></div></>
            : <><span style={{ fontSize:22 }}>📂</span><div><div style={{ color:"rgba(255,255,255,0.6)", fontWeight:600 }}>Click or drag & drop Delivery Order</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3 }}>PDF, JPG, or PNG — AI will extract and fill fields automatically</div></div></>
          }
        </div>
        <input ref={doRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={e=>handleDOUpload(e.target.files[0])}/>
        {flash==="do_parsed" && <div style={{ marginTop:8, color:"#3DAA6A", fontSize:12 }}>✓ {parsedItems.length} line item{parsedItems.length!==1?"s":""} detected — review and confirm below.</div>}
        {flash==="do_error"  && <div style={{ marginTop:8, color:"#E8531A", fontSize:12 }}>⚠ Could not parse document. Please fill fields manually.</div>}
      </div>

      {/* Multi-item parsed preview */}
      {parsedItems.length>0 && (
        <div style={{ marginBottom:22, background:"rgba(61,170,106,0.06)", border:"1px solid rgba(61,170,106,0.2)", borderRadius:10, padding:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#3DAA6A" }}>📄 {parsedItems.length} Item{parsedItems.length!==1?"s":""} Detected from Delivery Order</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Review each item, adjust if needed, then confirm to add all to inventory</div>
            </div>
            <button onClick={()=>setParsedItems([])} style={ghost({padding:"4px 12px",fontSize:11,color:"#E8531A",borderColor:"#E8531A44"})}>✕ Dismiss</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
            {parsedItems.map((item,i)=>(
              <div key={item.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:8, padding:14 }}>
                <div style={{ fontSize:11, color:"#C8702A", fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.08em" }}>Line Item {i+1}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))", gap:"10px 14px" }}>
                  {[
                    {k:"date",label:"Date",type:"date"},
                    {k:"supplier",label:"Supplier"},
                    {k:"origin",label:"Origin"},
                    {k:"bagMarks",label:"Bag Marks"},
                    {k:"qtyBags",label:"Qty Bags",type:"number"},
                    {k:"weightPerBag",label:"lbs / Bag",type:"number"},
                    {k:"costPerLb",label:"Cost / lb ($)",type:"number"},
                    {k:"deliveryOrder",label:"DO #"},
                  ].map(f=>(
                    <div key={f.k}>
                      <label style={lbl}>{f.label}</label>
                      <input type={f.type||"text"} style={inp()} value={item[f.k]||""}
                        onChange={e=>setParsedItems(ps=>ps.map(p=>p.id===item.id?{...p,[f.k]:e.target.value}:p))}/>
                    </div>
                  ))}
                  <div style={{ gridColumn:"1/-1" }}>
                    <label style={lbl}>Notes</label>
                    <input type="text" style={inp()} value={item.notes||""}
                      onChange={e=>setParsedItems(ps=>ps.map(p=>p.id===item.id?{...p,notes:e.target.value}:p))}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={()=>{
              parsedItems.forEach(item=>{ if(item.origin||item.bagMarks) onSave({...item, id:Date.now()+Math.random()}); });
              setParsedItems([]); setDoFile(null);
              setFlash("saved"); setTimeout(()=>setFlash(""),2500);
            }}
            style={mkBtn("#3DAA6A",{fontSize:12,padding:"9px 22px"})}>
            ✓ Confirm & Add All {parsedItems.length} Item{parsedItems.length!==1?"s":""} to Inventory
          </button>
        </div>
      )}

      {/* Manual form */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))", gap:"14px 20px", marginBottom:22 }}>
        {RECV_FIELDS.map(f=>(
          <div key={f.name} style={f.full?{gridColumn:"1/-1"}:{}}>
            <label style={lbl}>{f.label}</label>
            <Fld type={f.type||"text"} value={d[f.name]||""} onChange={v=>sd(f.name,v)} placeholder={f.ph||""}/>
          </div>
        ))}
        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Certificate of Analysis (COA)</label>
          <div onClick={()=>fileRef.current.click()} style={inp({ cursor:"pointer", display:"flex", alignItems:"center", gap:10, color:d.coaFile?"#3DAA6A":"rgba(255,255,255,0.28)", borderStyle:"dashed", borderColor:d.coaFile?"#3DAA6A66":"rgba(255,255,255,0.13)" })}>
            <span style={{ fontSize:18 }}>📎</span>
            <span style={{ fontSize:13 }}>{d.coaFile?`✓ ${d.coaFile.name}`:"Click to attach COA (PDF, JPG, PNG, DOCX…)"}</span>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display:"none" }} onChange={e=>sd("coaFile",e.target.files[0]||null)}/>
        </div>
      </div>

      <button onClick={save} style={mkBtn("#C8702A")}>
        {flash==="saved"?"✓ Saved — Inventory Updated!":flash==="edited"?"✓ Record Updated!":"Save Receiving Entry"}
      </button>

      {/* History table with edit */}
      {records.length>0 && (
        <div style={{ marginTop:28 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Receiving History ({records.length})</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ color:"rgba(255,255,255,0.3)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                  {["Date","Supplier","Origin","Bag Marks","Bags","lbs/Bag","$/lb","DO #","COA",""].map(h=>
                    <th key={h} style={{ textAlign:"left", padding:"6px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)", whiteSpace:"nowrap" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {records.map(r=>(
                  editId===r.id
                    ? <tr key={r.id} style={{ background:"rgba(200,112,42,0.07)", borderBottom:"1px solid rgba(200,112,42,0.2)" }}>
                        {["date","supplier","origin","bagMarks","qtyBags","weightPerBag","costPerLb","deliveryOrder"].map(k=>(
                          <td key={k} style={{ padding:"5px 6px" }}>
                            <input type={k==="date"?"date":["qtyBags","weightPerBag","costPerLb"].includes(k)?"number":"text"}
                              style={{ ...inp(), padding:"4px 7px", fontSize:11 }}
                              value={editData[k]||""} onChange={e=>setEditData(p=>({...p,[k]:e.target.value}))}/>
                          </td>
                        ))}
                        <td style={{ padding:"5px 6px" }}><span style={{ color:"#3DAA6A", fontSize:11 }}>{editData.coaFile?"✓":"—"}</span></td>
                        <td style={{ padding:"5px 6px", display:"flex", gap:6 }}>
                          <button onClick={saveEdit} style={mkBtn("#3DAA6A",{padding:"3px 10px",fontSize:11})}>Save</button>
                          <button onClick={()=>setEditId(null)} style={ghost({padding:"3px 10px",fontSize:11})}>✕</button>
                        </td>
                      </tr>
                    : <tr key={r.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.45)" }}>{r.date}</td>
                        <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.6)" }}>{r.supplier}</td>
                        <td style={{ padding:"8px 10px", color:"#C8702A", fontWeight:600 }}>{r.origin}</td>
                        <td style={{ padding:"8px 10px", color:"#F5EDD8" }}>{r.bagMarks}</td>
                        <td style={{ padding:"8px 10px", color:"#3DAA6A", fontWeight:600 }}>{r.qtyBags}</td>
                        <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.55)" }}>{r.weightPerBag}</td>
                        <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.55)" }}>{r.costPerLb?`$${r.costPerLb}`:"—"}</td>
                        <td style={{ padding:"8px 10px", color:"rgba(255,255,255,0.45)" }}>{r.deliveryOrder}</td>
                        <td style={{ padding:"8px 10px" }}>{r.coaFile?<span style={{ color:"#3DAA6A",fontSize:11 }}>✓ {r.coaFile.name}</span>:<span style={{ color:"rgba(255,255,255,0.18)" }}>—</span>}</td>
                        <td style={{ padding:"8px 10px" }}><button onClick={()=>startEdit(r)} style={ghost({padding:"3px 10px",fontSize:11,color:"#C8702A",borderColor:"#C8702A55"})}>Edit</button></td>
                      </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INVENTORY LOG ────────────────────────────────────────────────────────────
function InventoryLog({ receivingRecords, orderPulls, invAdjustments, onAddAdjustment }){
  const [adjustKey, setAdjustKey] = useState(null); // key of row being adjusted
  const [adjForm, setAdjForm]     = useState({ type:"add", qty:"", reason:"", notes:"" });
  const [flash, setFlash]         = useState(null);
  const [editNotes, setEditNotes] = useState({});

  const ledger={};
  receivingRecords.forEach(r=>{
    const key=`${r.origin}||${r.bagMarks}`;
    if(!ledger[key]) ledger[key]={ origin:r.origin, bagMarks:r.bagMarks, weightPerBag:r.weightPerBag, costPerLb:r.costPerLb, bagsIn:0, bagsOut:0 };
    ledger[key].bagsIn+=Number(r.qtyBags)||0;
  });
  orderPulls.forEach(p=>{
    const key=`${p.origin}||${p.bagMarks}`;
    if(ledger[key]) ledger[key].bagsOut+=Number(p.bagsUsed)||0;
  });
  // Apply manual adjustments
  (invAdjustments||[]).forEach(a=>{
    if(ledger[a.key]){
      if(a.type==="add") ledger[a.key].bagsIn+=Number(a.qty)||0;
      else ledger[a.key].bagsOut+=Number(a.qty)||0;
    }
  });
  Object.entries(editNotes).forEach(([k,n])=>{ if(ledger[k]) ledger[k].notes=n; });

  const rows=Object.values(ledger);
  const tIn=rows.reduce((s,r)=>s+r.bagsIn,0), tOut=rows.reduce((s,r)=>s+r.bagsOut,0);

  const saveAdj=()=>{
    if(!adjForm.qty||isNaN(Number(adjForm.qty))||Number(adjForm.qty)<=0) return alert("Enter a valid quantity.");
    onAddAdjustment({ key:adjustKey, ...adjForm, date:new Date().toISOString(), origin:ledger[adjustKey]?.origin, bagMarks:ledger[adjustKey]?.bagMarks });
    setAdjustKey(null); setAdjForm({type:"add",qty:"",reason:"",notes:""});
    setFlash("saved"); setTimeout(()=>setFlash(null),2000);
  };

  const adjHistory=(invAdjustments||[]).filter(a=>a.key===adjustKey);

  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:22, flexWrap:"wrap" }}>
        {[{label:"SKUs On Hand",value:rows.filter(r=>r.bagsIn-r.bagsOut>0).length,accent:"#3DAA6A"},{label:"Bags Received",value:tIn,accent:"#C8702A"},{label:"Bags Used",value:tOut,accent:"#E8531A"},{label:"Bags On Hand",value:tIn-tOut,accent:"#1AB8CF"}].map(c=>(
          <div key={c.label} style={{ flex:"1 1 120px", background:`${c.accent}12`, border:`1px solid ${c.accent}2E`, borderRadius:10, padding:"13px 16px" }}>
            <div style={{ fontSize:26, fontWeight:700, color:c.accent, lineHeight:1 }}>{c.value}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.36)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:5 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {flash==="saved" && <div style={{ marginBottom:12, color:"#3DAA6A", fontSize:12 }}>✓ Adjustment saved.</div>}

      {rows.length===0
        ? <div style={{ textAlign:"center", padding:"52px 0", color:"rgba(255,255,255,0.18)", fontSize:14, border:"1px dashed rgba(255,255,255,0.07)", borderRadius:10 }}>No inventory yet — save a Receiving entry to populate this ledger.</div>
        : <>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"rgba(0,0,0,0.35)", color:"rgba(255,255,255,0.33)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  {[["Origin","l"],["Bag Marks","l"],["Bags In","r"],["Bags Out","r"],["Balance","r"],["lbs/Bag","r"],["Cost/lb","r"],["Notes","l"],["Status","r"],["","r"]].map(([h,a])=>
                    <th key={h} style={{ textAlign:a==="r"?"right":"left", padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)", whiteSpace:"nowrap" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>{
                  const key=`${r.origin}||${r.bagMarks}`, bal=r.bagsIn-r.bagsOut;
                  const sc=bal<=0?"#E8531A":bal<=5?"#D4A853":"#3DAA6A";
                  const isOpen=adjustKey===key;
                  return (
                    <>
                      <tr key={i} style={{ borderBottom: isOpen?"none":"1px solid rgba(255,255,255,0.05)", background:isOpen?"rgba(61,170,106,0.06)":"transparent", transition:"background .15s" }}>
                        <td style={{ padding:"11px 12px", color:"#C8702A", fontWeight:600 }}>{r.origin}</td>
                        <td style={{ padding:"11px 12px", color:"#F5EDD8" }}>{r.bagMarks}</td>
                        <td style={{ padding:"11px 12px", textAlign:"right", color:"#3DAA6A", fontWeight:600 }}>{r.bagsIn}</td>
                        <td style={{ padding:"11px 12px", textAlign:"right", color:"#E8531A", fontWeight:600 }}>{r.bagsOut}</td>
                        <td style={{ padding:"11px 12px", textAlign:"right", fontWeight:700, fontSize:16, color:sc }}>{bal}</td>
                        <td style={{ padding:"11px 12px", textAlign:"right", color:"rgba(255,255,255,0.55)" }}>{r.weightPerBag?`${r.weightPerBag} lbs`:"—"}</td>
                        <td style={{ padding:"11px 12px", textAlign:"right", color:"rgba(255,255,255,0.55)" }}>{r.costPerLb?`$${r.costPerLb}`:"—"}</td>
                        <td style={{ padding:"11px 12px", minWidth:140 }}>
                          <input type="text" placeholder="Add note…" value={editNotes[key]??r.notes??""} onChange={e=>setEditNotes(n=>({...n,[key]:e.target.value}))} style={{ ...inp(), padding:"5px 8px", fontSize:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}/>
                        </td>
                        <td style={{ padding:"11px 12px", textAlign:"right" }}><Badge label={bal<=0?"Empty":bal<=5?"Low Stock":"In Stock"} color={sc}/></td>
                        <td style={{ padding:"11px 12px", textAlign:"right" }}>
                          <button onClick={()=>{ setAdjustKey(isOpen?null:key); setAdjForm({type:"add",qty:"",reason:"",notes:""}); }}
                            style={ghost({padding:"3px 11px",fontSize:11,color:isOpen?"#E8531A":"#3DAA6A",borderColor:isOpen?"#E8531A55":"#3DAA6A55"})}>
                            {isOpen?"✕ Close":"⚖ Adjust"}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={key+"_adj"}>
                          <td colSpan={10} style={{ padding:0, borderBottom:"1px solid rgba(61,170,106,0.2)" }}>
                            <div style={{ background:"rgba(61,170,106,0.08)", border:"1px solid rgba(61,170,106,0.2)", borderTop:"none", padding:"14px 18px" }}>
                              <div style={{ fontSize:12, fontWeight:700, color:"#3DAA6A", marginBottom:12 }}>
                                ⚖ Manual Adjustment — <span style={{ color:"#C8702A" }}>{r.origin} / {r.bagMarks}</span>
                              </div>
                              <div style={{ display:"grid", gridTemplateColumns:"120px 110px 1fr 1fr auto", gap:"10px 14px", alignItems:"end" }}>
                                <div>
                                  <label style={lbl}>Type</label>
                                  <select style={inp()} value={adjForm.type} onChange={e=>setAdjForm(p=>({...p,type:e.target.value}))}>
                                    <option value="add">➕ Add Bags</option>
                                    <option value="remove">➖ Remove Bags</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={lbl}>Qty (bags)</label>
                                  <input type="text" inputMode="decimal" style={{...inp(),MozAppearance:"textfield"}} onWheel={e=>e.currentTarget.blur()} value={adjForm.qty} onChange={e=>setAdjForm(p=>({...p,qty:e.target.value}))} placeholder="0"/>
                                </div>
                                <div>
                                  <label style={lbl}>Reason</label>
                                  <select style={inp()} value={adjForm.reason} onChange={e=>setAdjForm(p=>({...p,reason:e.target.value}))}>
                                    <option value="">— select —</option>
                                    <option>Physical Count Correction</option>
                                    <option>Damaged / Spoiled</option>
                                    <option>Sample / Quality Check</option>
                                    <option>Transfer In</option>
                                    <option>Transfer Out</option>
                                    <option>Data Entry Error Correction</option>
                                    <option>Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={lbl}>Notes</label>
                                  <input type="text" style={inp()} value={adjForm.notes} onChange={e=>setAdjForm(p=>({...p,notes:e.target.value}))} placeholder="Optional detail…"/>
                                </div>
                                <div>
                                  <button onClick={saveAdj} style={mkBtn("#3DAA6A",{padding:"8px 18px",fontSize:12,whiteSpace:"nowrap"})}>Save Adjustment</button>
                                </div>
                              </div>
                              {adjHistory.length>0 && (
                                <div style={{ marginTop:14 }}>
                                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:8 }}>Adjustment History for this SKU</div>
                                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                                    {adjHistory.map((a,ai)=>(
                                      <div key={ai} style={{ display:"flex", gap:14, fontSize:11, color:"rgba(255,255,255,0.5)", padding:"5px 10px", background:"rgba(255,255,255,0.03)", borderRadius:5 }}>
                                        <span style={{ color:a.type==="add"?"#3DAA6A":"#E8531A", fontWeight:700 }}>{a.type==="add"?"+":`−`}{a.qty} bags</span>
                                        <span>{a.reason||"—"}</span>
                                        <span style={{ color:"rgba(255,255,255,0.3)" }}>{new Date(a.date).toLocaleDateString()}</span>
                                        {a.notes && <span style={{ fontStyle:"italic" }}>{a.notes}</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                <tr style={{ background:"rgba(0,0,0,0.28)", borderTop:"2px solid rgba(255,255,255,0.1)" }}>
                  <td colSpan={2} style={{ padding:"10px 12px", color:"rgba(255,255,255,0.35)", fontSize:11, textTransform:"uppercase" }}>Totals</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color:"#3DAA6A", fontWeight:700 }}>{tIn}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color:"#E8531A", fontWeight:700 }}>{tOut}</td>
                  <td style={{ padding:"10px 12px", textAlign:"right", color:"#1AB8CF", fontWeight:700, fontSize:16 }}>{tIn-tOut}</td>
                  <td colSpan={5}/>
                </tr>
              </tbody>
            </table>
          </div>
          {(invAdjustments||[]).length>0 && (
            <div style={{ marginTop:18, padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8 }}>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>All Manual Adjustments ({invAdjustments.length})</div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {invAdjustments.map((a,i)=>(
                  <div key={i} style={{ display:"flex", gap:14, fontSize:11, color:"rgba(255,255,255,0.45)", padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color:"#C8702A", fontWeight:600, minWidth:140 }}>{a.origin} / {a.bagMarks}</span>
                    <span style={{ color:a.type==="add"?"#3DAA6A":"#E8531A", fontWeight:700, minWidth:80 }}>{a.type==="add"?"+":`−`}{a.qty} bags</span>
                    <span style={{ minWidth:160 }}>{a.reason||"—"}</span>
                    <span style={{ color:"rgba(255,255,255,0.3)" }}>{new Date(a.date).toLocaleDateString()}</span>
                    {a.notes && <span style={{ fontStyle:"italic" }}>{a.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      }
      {orderPulls.length>0 && (
        <div style={{ marginTop:24 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Inventory Movements via Production Orders</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ color:"rgba(255,255,255,0.28)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                {["PO #","Batch","Origin","Bag Marks","Bags","Step","Date"].map(h=><th key={h} style={{ textAlign:"left", padding:"6px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{h}</th>)}
              </tr></thead>
              <tbody>{orderPulls.map((p,i)=>(
                <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"7px 10px", color:"#A855F7", fontWeight:600 }}>{p.poNumber}</td>
                  <td style={{ padding:"7px 10px", color:"#A855F7" }}>{p.batchNumber}</td>
                  <td style={{ padding:"7px 10px", color:"#C8702A" }}>{p.origin}</td>
                  <td style={{ padding:"7px 10px", color:"#F5EDD8" }}>{p.bagMarks}</td>
                  <td style={{ padding:"7px 10px", color:"#E8531A", fontWeight:700 }}>−{p.bagsUsed}</td>
                  <td style={{ padding:"7px 10px", color:"rgba(255,255,255,0.5)" }}>{p.step}</td>
                  <td style={{ padding:"7px 10px", color:"rgba(255,255,255,0.35)" }}>{p.date?new Date(p.date).toLocaleDateString():"—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── PO IMPORTER (Email / SMS / Attachment → Production Order) ───────────────
// Reads .eml, .msg, .txt, .pdf, .png/.jpg — or paste raw text
function POImporter({ onImported, onClose }){
  const [inputMode, setInputMode] = useState("drop");   // "drop" | "paste"
  const [rawText,   setRawText]   = useState("");
  const [sourceType,setSource]    = useState("email");
  const [droppedFile,setDropped]  = useState(null);     // { name, type, content, isImage, b64 }
  const [dragOver,  setDragOver]  = useState(false);
  const [parsing,   setParsing]   = useState(false);
  const [parsed,    setParsed]    = useState(null);
  const [error,     setError]     = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const fileRef   = useRef();
  const dropRef   = useRef();
  const dragCount = useRef(0);

  // ── File reading helpers ────────────────────────────────────────────────────
  const readFileAsText = (file) => new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload  = e => res(e.target.result);
    r.onerror = () => rej(new Error("Could not read file"));
    r.readAsText(file);
  });
  const readFileAsBase64 = (file) => new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload  = e => res(e.target.result.split(",")[1]);
    r.onerror = () => rej(new Error("Could not read file"));
    r.readAsDataURL(file);
  });

  // ── Parse .eml text into readable body ─────────────────────────────────────
  const parseEml = (text) => {
    // Extract headers + decode quoted-printable / base64 parts
    const lines    = text.split(/\r?\n/);
    const headers  = [];
    let   bodyStart= 0;
    for(let i=0;i<lines.length;i++){
      if(lines[i].trim()===""){bodyStart=i+1;break;}
      headers.push(lines[i]);
    }
    const headerBlock = headers.join("\n");
    const bodyLines   = lines.slice(bodyStart);

    // Try to grab plain-text part from multipart
    const fullText = text;
    let body = "";
    const plainMatch = fullText.match(/Content-Type: text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|\r?\n\r?\nContent-Type:|$)/i);
    if(plainMatch) body = plainMatch[1];
    else body = bodyLines.join("\n");

    // Decode quoted-printable
    body = body.replace(/=\r?\n/g,"").replace(/=([0-9A-Fa-f]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16)));
    return headerBlock + "\n\n" + body.trim();
  };

  // ── Handle file drop or pick ────────────────────────────────────────────────
  const handleFile = async (file) => {
    setError("");
    const name = file.name.toLowerCase();
    const isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(name);
    const isPdf = name.endsWith(".pdf");
    const isTxt = name.endsWith(".txt");
    const isEml = name.endsWith(".eml");
    const isMsg = name.endsWith(".msg");

    try {
      if(isImg){
        const b64 = await readFileAsBase64(file);
        const mediaType = file.type || "image/png";
        setDropped({ name:file.name, type:"image", isImage:true, b64, mediaType });
      } else if(isPdf){
        const b64 = await readFileAsBase64(file);
        setDropped({ name:file.name, type:"pdf", isImage:false, b64 });
      } else if(isEml){
        const text = await readFileAsText(file);
        const cleaned = parseEml(text);
        setDropped({ name:file.name, type:"eml", isImage:false, content:cleaned });
      } else if(isMsg){
        // .msg is binary OLE — read as text and extract readable strings
        const text = await readFileAsText(file);
        // Extract visible ASCII runs (words/sentences from the OLE stream)
        const readable = text.replace(/[^\x20-\x7E\r\n\t]/g," ").replace(/\s{3,}/g,"\n").trim();
        setDropped({ name:file.name, type:"msg", isImage:false, content:readable });
      } else if(isTxt){
        const text = await readFileAsText(file);
        setDropped({ name:file.name, type:"txt", isImage:false, content:text });
      } else {
        // Try reading as text anyway (covers .html forwards, etc.)
        const text = await readFileAsText(file);
        const stripped = text.replace(/<[^>]*>/g," ").replace(/\s{2,}/g," ").trim();
        setDropped({ name:file.name, type:"other", isImage:false, content:stripped });
      }
    } catch(e){
      setError("Could not read file: " + e.message);
    }
  };

  // Robust drag handlers — dragCount fixes false dragLeave fires on child elements
  const onDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCount.current++;
    setDragOver(true);
  };
  const onDragOver = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCount.current--;
    if(dragCount.current <= 0){ dragCount.current = 0; setDragOver(false); }
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCount.current = 0; setDragOver(false);
    const file = e.dataTransfer.files[0];
    if(file) handleFile(file);
  };

  const clearFile = () => { setDropped(null); setError(""); };

  // ── AI system prompt (shared) ───────────────────────────────────────────────
  const AI_SYSTEM = `You are a production order parser for a coffee roasting company. Extract order details and return ONLY a valid JSON object — no markdown, no explanation, no backticks.

Return this exact structure:
{
  "customer": "customer or company name (check From:, signature, company name)",
  "date": "YYYY-MM-DD order date or today if not found",
  "targetDate": "YYYY-MM-DD due/delivery date or empty string",
  "priority": "Normal or Urgent or Rush",
  "notes": "any general order notes or special instructions",
  "products": [
    {
      "productName": "product name e.g. Medium Roast, Ethiopian Dark, House Blend",
      "roastProfile": "Light or Medium-Light or Medium or Medium-Dark or Dark or empty",
      "packageSize": "8oz or 12oz or 1lb or 2lb or 5lb or Bulk or Custom or empty",
      "skuQty": "number of units as string or empty",
      "totalLbs": "total green coffee lbs needed as string or empty",
      "requiresRoast": true,
      "requiresGrinding": false,
      "requiresBlending": false,
      "requiresPackaging": true,
      "notes": "any product-specific notes"
    }
  ]
}

Rules:
- Multiple products/SKUs → multiple objects in products array
- Infer roast: "light"→Light, "medium"→Medium, "dark"/"espresso"→Dark, "blonde"→Light
- Infer size: "1 pound"→"1lb", "half pound"→"8oz", "5 lb"→"5lb", "bulk"→"Bulk"
- Priority: "urgent"/"rush"/"ASAP"/"emergency"→Rush, "soon"/"quick"→Urgent, else Normal
- Today's date: ${new Date().toISOString().slice(0,10)}
- Return ONLY the JSON object, nothing else`;

  // ── Send to AI ──────────────────────────────────────────────────────────────
  const parseWithAI = async () => {
    const hasFile = !!droppedFile;
    const hasText = rawText.trim().length > 0;
    if(!hasFile && !hasText) return setError("Please drop a file or paste message text first.");
    setError(""); setParsing(true); setParsed(null);

    try {
      let messageContent = [];

      if(hasFile && droppedFile.isImage){
        messageContent = [
          { type:"image", source:{ type:"base64", media_type:droppedFile.mediaType, data:droppedFile.b64 }},
          { type:"text",  text:"This is a forwarded email or order screenshot. Extract the production order details." }
        ];
      } else if(hasFile && droppedFile.type==="pdf"){
        messageContent = [
          { type:"document", source:{ type:"base64", media_type:"application/pdf", data:droppedFile.b64 }},
          { type:"text", text:"This is a forwarded email or order document. Extract the production order details." }
        ];
      } else {
        const content = hasFile ? droppedFile.content : rawText;
        const label   = hasFile ? `File: ${droppedFile.name} (${droppedFile.type})` : `Source: ${sourceType}`;
        messageContent = [{ type:"text", text:`${label}\n\n${content}` }];
      }

      const resp = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:2000, system:AI_SYSTEM, messages:[{ role:"user", content:messageContent }]})
      });
      const data = await resp.json();
      const text = data.content?.find(c=>c.type==="text")?.text||"{}";
      let p = {};
      try{ p = JSON.parse(text.replace(/```json|```/g,"").trim()); }catch(_){}
      if(!p.customer && !p.products?.length) throw new Error("Could not extract order details — try adding more specifics like customer name and product.");
      if(!p.products?.length) p.products = [{productName:"",roastProfile:"",packageSize:"",skuQty:"",totalLbs:"",requiresRoast:true,requiresGrinding:false,requiresBlending:false,requiresPackaging:true,notes:""}];
      setParsed(p);
    } catch(e){
      setError(e.message || "Parsing failed. Please check the content and try again.");
    }
    setParsing(false);
  };

  const updateParsed  = (k,v) => setParsed(p=>({...p,[k]:v}));
  const updateProduct = (i,k,v) => setParsed(p=>({...p,products:p.products.map((pr,idx)=>idx===i?{...pr,[k]:v}:pr)}));
  const addProduct    = () => setParsed(p=>({...p,products:[...p.products,{productName:"",roastProfile:"",packageSize:"",skuQty:"",totalLbs:"",requiresRoast:true,requiresGrinding:false,requiresBlending:false,requiresPackaging:true,notes:""}]}));
  const removeProduct = i  => setParsed(p=>({...p,products:p.products.filter((_,idx)=>idx!==i)}));

  const confirm = () => {
    if(!parsed.customer) return setError("Customer name is required.");
    if(parsed.products.some(p=>!p.productName)) return setError("Each product line needs a name.");
    onImported(parsed);
    setConfirmed(true);
    setTimeout(onClose, 1800);
  };

  const PRIORITY_COLOR = p=>p==="Rush"?"#E8531A":p==="Urgent"?"#D4A853":"#3DAA6A";

  const FILE_TYPES = [
    { ext:".eml",  icon:"📧", label:"Outlook .eml",   desc:"Forwarded email file" },
    { ext:".msg",  icon:"📬", label:"Outlook .msg",   desc:"Clipped/saved email"  },
    { ext:".pdf",  icon:"📄", label:"PDF",             desc:"Order form or printout"},
    { ext:".png",  icon:"🖼", label:"Image",           desc:"Screenshot or photo"  },
    { ext:".txt",  icon:"📝", label:"Text file",       desc:"Plain text order"     },
  ];

  return (
    <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();e.stopPropagation();const f=e.dataTransfer.files[0];if(f&&!droppedFile&&inputMode==="drop"){dragCount.current=0;setDragOver(false);handleFile(f);}}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:2000, overflowY:"auto", padding:"22px 12px", display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:880, background:"#141010", border:"1px solid rgba(168,85,247,0.35)", borderRadius:14, overflow:"hidden" }}>

        {/* ── Header ── */}
        <div style={{ background:"linear-gradient(135deg,rgba(168,85,247,0.15),rgba(59,130,246,0.08))", borderBottom:"1px solid rgba(168,85,247,0.22)", padding:"16px 22px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:"#A855F7", display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:20 }}>📨</span> Import Production Order
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.38)", marginTop:3 }}>
              Drop an email attachment, screenshot, or PDF — or paste text directly
            </div>
          </div>
          <button onClick={onClose} style={ghost({padding:"6px 14px",fontSize:13})}>✕ Close</button>
        </div>

        <div style={{ padding:"20px 22px" }}>
          {/* ── Success screen ── */}
          {confirmed ? (
            <div style={{ textAlign:"center", padding:"44px 0" }}>
              <div style={{ fontSize:44, marginBottom:14 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#3DAA6A" }}>Production Order Created!</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.38)", marginTop:6 }}>Closing…</div>
            </div>

          ) : !parsed ? (
            <>
              {/* ── Mode tabs ── */}
              <div style={{ display:"flex", gap:0, marginBottom:20, borderRadius:9, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)" }}>
                {[["drop","📎 Drop / Upload File"],["paste","✏️ Paste Text"]].map(([m,label])=>(
                  <button key={m} onClick={()=>setInputMode(m)} style={{ flex:1, padding:"10px 0", border:"none", background:inputMode===m?"rgba(168,85,247,0.18)":"rgba(255,255,255,0.03)", color:inputMode===m?"#A855F7":"rgba(255,255,255,0.38)", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:inputMode===m?700:400, borderRight:m==="drop"?"1px solid rgba(255,255,255,0.08)":"none" }}>{label}</button>
                ))}
              </div>

              {/* ── DROP MODE ── */}
              {inputMode==="drop" && (
                <>
                  {!droppedFile ? (
                    <>
                      {/* Drop zone */}
                      <div
                        ref={dropRef}
                        onDragEnter={onDragEnter}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={()=>fileRef.current.click()}
                        style={{ border:`2px dashed ${dragOver?"#A855F7":"rgba(168,85,247,0.35)"}`, borderRadius:12, padding:"44px 22px", textAlign:"center", cursor:"pointer", background:dragOver?"rgba(168,85,247,0.08)":"rgba(168,85,247,0.03)", transition:"all .18s", marginBottom:18, userSelect:"none" }}>
                        <div style={{ fontSize:44, marginBottom:10 }}>📎</div>
                        <div style={{ fontSize:15, fontWeight:700, color:"#A855F7", marginBottom:6 }}>
                          {dragOver ? "Drop it!" : "Drop your file here"}
                        </div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.38)", marginBottom:14 }}>
                          or click to browse
                        </div>
                        <div style={{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
                          {FILE_TYPES.map(f=>(
                            <div key={f.ext} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"5px 11px", fontSize:11, color:"rgba(255,255,255,0.45)" }}>
                              {f.icon} {f.label}
                            </div>
                          ))}
                        </div>
                        <input ref={fileRef} type="file" accept=".eml,.msg,.pdf,.txt,.png,.jpg,.jpeg,.gif,.webp,.html" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) handleFile(e.target.files[0]); e.target.value=""; }}/>
                      </div>

                      {/* How-to tip for Outlook */}
                      <div style={{ padding:"13px 16px", background:"rgba(59,130,246,0.07)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:9, fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.65 }}>
                        <div style={{ fontWeight:700, color:"rgba(59,130,246,0.85)", marginBottom:6 }}>📬 How to forward from Outlook</div>
                        <div>In Outlook, open the order email → click <b style={{color:"rgba(255,255,255,0.65)"}}>More (…)</b> → <b style={{color:"rgba(255,255,255,0.65)"}}>Forward as Attachment</b> — this saves the email as a <b style={{color:"rgba(255,255,255,0.65)"}}>.msg file</b>. You can also use <b style={{color:"rgba(255,255,255,0.65)"}}>File → Save As → .eml</b> from any email client. Then drop it here.</div>
                      </div>
                    </>
                  ) : (
                    /* File loaded — show preview card */
                    <div style={{ marginBottom:18 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background:"rgba(61,170,106,0.08)", border:"1px solid rgba(61,170,106,0.25)", borderRadius:10, marginBottom:14 }}>
                        <div style={{ fontSize:30 }}>
                          {droppedFile.type==="pdf"?"📄":droppedFile.isImage?"🖼":droppedFile.type==="eml"?"📧":droppedFile.type==="msg"?"📬":"📝"}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#F5EDD8" }}>{droppedFile.name}</div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:3, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                            {droppedFile.type==="eml"?"Outlook Email (.eml)":droppedFile.type==="msg"?"Outlook Message (.msg)":droppedFile.type==="pdf"?"PDF Document":droppedFile.isImage?"Image / Screenshot":"Text File"} · Ready to parse
                          </div>
                        </div>
                        <button onClick={clearFile} style={ghost({padding:"5px 12px",fontSize:11,color:"#E8531A",borderColor:"#E8531A44"})}>✕ Remove</button>
                      </div>

                      {/* Show text preview for non-image/pdf */}
                      {droppedFile.content && (
                        <div style={{ marginBottom:14 }}>
                          <label style={lbl}>Extracted Text Preview (editable)</label>
                          <textarea rows={8} style={{ ...inp(), resize:"vertical", fontSize:12, lineHeight:1.5, fontFamily:"monospace" }}
                            value={droppedFile.content}
                            onChange={e=>setDropped(d=>({...d,content:e.target.value}))}/>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── PASTE MODE ── */}
              {inputMode==="paste" && (
                <>
                  <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                    {[["email","📧 Email"],["sms","💬 SMS / Text"]].map(([t,label])=>(
                      <button key={t} onClick={()=>setSource(t)} style={{ flex:1, padding:"9px 0", borderRadius:8, border:`2px solid ${sourceType===t?"#A855F7":"rgba(255,255,255,0.1)"}`, background:sourceType===t?"rgba(168,85,247,0.1)":"transparent", color:sourceType===t?"#A855F7":"rgba(255,255,255,0.4)", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:sourceType===t?700:400 }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={lbl}>{sourceType==="email"?"Paste Email Content (subject + body)":"Paste SMS / Text Message"}</label>
                    <textarea rows={10} style={{ ...inp(), resize:"vertical", fontSize:13, lineHeight:1.55, fontFamily:"monospace" }}
                      value={rawText} onChange={e=>setRawText(e.target.value)}
                      placeholder={sourceType==="email"
                        ?"From: customer@example.com\nSubject: Order Request\n\nHi, we need 50 units medium roast 1lb by Friday. Also 20 dark roast 12oz. Rush order. — Mike"
                        :"Hey can you do 30 bags medium roast 1lb and 10 dark espresso 5lb? Need by Thursday. Thanks - Mike"}/>
                  </div>
                </>
              )}

              {error && <div style={{ marginBottom:14, color:"#E8531A", fontSize:13, padding:"9px 14px", background:"rgba(232,83,26,0.08)", border:"1px solid rgba(232,83,26,0.2)", borderRadius:7 }}>⚠ {error}</div>}

              <button onClick={parseWithAI} disabled={parsing} style={mkBtn(parsing?"rgba(168,85,247,0.4)":"#A855F7",{fontSize:13,padding:"10px 28px",opacity:parsing?0.7:1,display:"flex",alignItems:"center",gap:8})}>
                {parsing
                  ? <><span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⏳</span><span>Parsing with AI…</span></>
                  : <><span>✨</span><span>Parse & Extract Order</span></>}
              </button>
            </>

          ) : (
            /* ── REVIEW & CONFIRM ── */
            <>
              <div style={{ marginBottom:16, padding:"10px 16px", background:"rgba(61,170,106,0.08)", border:"1px solid rgba(61,170,106,0.25)", borderRadius:8, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:18 }}>✅</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#3DAA6A" }}>Order extracted — review and confirm below</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Edit any field before creating the order</div>
                </div>
                <button onClick={()=>{setParsed(null);setError("");}} style={ghost({marginLeft:"auto",fontSize:11,padding:"4px 12px"})}>← Re-parse</button>
              </div>

              {/* Order header fields */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:"12px 18px", marginBottom:20 }}>
                <div><label style={lbl}>Customer / Account *</label><input type="text" style={inp()} value={parsed.customer||""} onChange={e=>updateParsed("customer",e.target.value)} placeholder="Customer name"/></div>
                <div><label style={lbl}>Order Date</label><input type="date" style={inp()} value={parsed.date||today()} onChange={e=>updateParsed("date",e.target.value)}/></div>
                <div><label style={lbl}>Due / Target Date</label><input type="date" style={inp()} value={parsed.targetDate||""} onChange={e=>updateParsed("targetDate",e.target.value)}/></div>
                <div>
                  <label style={lbl}>Priority</label>
                  <select style={{...inp(),color:PRIORITY_COLOR(parsed.priority||"Normal")}} value={parsed.priority||"Normal"} onChange={e=>updateParsed("priority",e.target.value)}>
                    {["Normal","Urgent","Rush"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Order Notes</label><textarea rows={2} style={{...inp(),resize:"vertical"}} value={parsed.notes||""} onChange={e=>updateParsed("notes",e.target.value)} placeholder="Notes…"/></div>
              </div>

              {/* Product lines */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Product Lines ({parsed.products?.length||0})</div>
                <button onClick={addProduct} style={ghost({fontSize:11,padding:"4px 12px",color:"#A855F7",borderColor:"#A855F766"})}>+ Add Line</button>
              </div>

              {(parsed.products||[]).map((prod,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(168,85,247,0.18)", borderRadius:10, padding:15, marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:11 }}>
                    <div style={{ fontSize:12, color:"#A855F7", fontWeight:700 }}>Line {i+1}</div>
                    {parsed.products.length>1 && <button onClick={()=>removeProduct(i)} style={ghost({fontSize:11,padding:"2px 9px",color:"#E8531A",borderColor:"#E8531A44"})}>✕</button>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))", gap:"10px 14px", marginBottom:11 }}>
                    <div><label style={lbl}>Product Name *</label><input type="text" style={inp()} value={prod.productName||""} onChange={e=>updateProduct(i,"productName",e.target.value)}/></div>
                    <div><label style={lbl}>Roast Profile</label>
                      <select style={inp()} value={prod.roastProfile||""} onChange={e=>updateProduct(i,"roastProfile",e.target.value)}>
                        <option value="">— select —</option>{["Light","Medium-Light","Medium","Medium-Dark","Dark"].map(o=><option key={o}>{o}</option>)}
                      </select></div>
                    <div><label style={lbl}>Package Size</label>
                      <select style={inp()} value={prod.packageSize||""} onChange={e=>updateProduct(i,"packageSize",e.target.value)}>
                        <option value="">— select —</option>{["8oz","12oz","1lb","2lb","5lb","Bulk","Custom"].map(o=><option key={o}>{o}</option>)}
                      </select></div>
                    <div><label style={lbl}>SKU Qty</label><input type="text" inputMode="decimal" style={inp()} value={prod.skuQty||""} onChange={e=>updateProduct(i,"skuQty",e.target.value)}/></div>
                    <div><label style={lbl}>Green Coffee (lbs)</label><input type="text" inputMode="decimal" style={inp()} value={prod.totalLbs||""} onChange={e=>updateProduct(i,"totalLbs",e.target.value)}/></div>
                    <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Notes</label><input type="text" style={inp()} value={prod.notes||""} onChange={e=>updateProduct(i,"notes",e.target.value)}/></div>
                  </div>
                  <div>
                    <div style={{ ...lbl, marginBottom:8 }}>Required Steps</div>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                      {PROCESS_STEPS.map(step=>(
                        <label key={step} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13, color:"rgba(255,255,255,0.65)" }}>
                          <input type="checkbox" checked={prod[`requires${step.charAt(0).toUpperCase()+step.slice(1)}`]??false} onChange={e=>updateProduct(i,`requires${step.charAt(0).toUpperCase()+step.slice(1)}`,e.target.checked)} style={{ accentColor:"#A855F7", width:14, height:14 }}/>
                          {STEP_LABELS[step]}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {error && <div style={{ marginBottom:14, color:"#E8531A", fontSize:13, padding:"9px 14px", background:"rgba(232,83,26,0.08)", border:"1px solid rgba(232,83,26,0.2)", borderRadius:7 }}>⚠ {error}</div>}

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <button onClick={confirm} style={mkBtn("#A855F7",{padding:"10px 28px",fontSize:13})}>✅ Confirm & Create Production Order</button>
                <button onClick={()=>{setParsed(null);setError("");}} style={ghost({padding:"10px 18px",fontSize:13})}>← Re-parse</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTION ORDERS ────────────────────────────────────────────────────────
const emptyProd=()=>({ id:Date.now()+Math.random(), productName:"", roastProfile:"", packageSize:"", skuQty:"", totalLbs:"", requiresRoast:true, requiresGrinding:false, requiresBlending:false, requiresPackaging:true, notes:"" });

function ProductionOrders({ orders, onCreateOrder, onViewOrder }){
  const [showForm,setShowForm]=useState(false);
  const [showImporter,setShowImporter]=useState(false);
  const [flash,setFlash]=useState(false);
  const [filter,setFilter]=useState("all");
  const [hdr,setHdr]=useState({ date:today(),customer:"",targetDate:"",priority:"Normal",notes:"" });
  const [products,setProducts]=useState([emptyProd()]);
  const sh=(k,v)=>setHdr(p=>({...p,[k]:v}));
  const sp=(id,k,v)=>setProducts(ps=>ps.map(p=>p.id===id?{...p,[k]:v}:p));

  const handleCreate=()=>{
    if(!hdr.customer) return alert("Customer name is required.");
    if(products.some(p=>!p.productName)) return alert("Each product line needs a product name.");
    onCreateOrder({ id:Date.now(), poNumber:nextPO(), ...hdr, products:products.map(p=>({...p,batchNumber:nextBatch()})), steps:{}, status:"Open", createdAt:new Date().toISOString() });
    setShowForm(false); setHdr({date:today(),customer:"",targetDate:"",priority:"Normal",notes:""}); setProducts([emptyProd()]);
    setFlash(true); setTimeout(()=>setFlash(false),2500);
  };

  const filtered=filter==="all"?orders:orders.filter(o=>o.status.toLowerCase()===filter);
  const sc=s=>s==="Open"?"#3DAA6A":s==="In Progress"?"#D4A853":"#7C6AE8";

  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:22, flexWrap:"wrap" }}>
        {[{label:"Total",value:orders.length,accent:"#A855F7"},{label:"Open",value:orders.filter(o=>o.status==="Open").length,accent:"#3DAA6A"},{label:"In Progress",value:orders.filter(o=>o.status==="In Progress").length,accent:"#D4A853"},{label:"Closed",value:orders.filter(o=>o.status==="Closed").length,accent:"#7C6AE8"}].map(c=>(
          <div key={c.label} style={{ flex:"1 1 100px", background:`${c.accent}12`, border:`1px solid ${c.accent}2E`, borderRadius:10, padding:"13px 16px" }}>
            <div style={{ fontSize:26, fontWeight:700, color:c.accent, lineHeight:1 }}>{c.value}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.36)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:5 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:8 }}>
          {["all","open","in progress","closed"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?"#A855F722":"transparent", border:`1px solid ${filter===f?"#A855F7":"rgba(255,255,255,0.12)"}`, borderRadius:6, padding:"5px 13px", color:filter===f?"#A855F7":"rgba(255,255,255,0.38)", cursor:"pointer", fontSize:11, textTransform:"capitalize", fontFamily:"inherit" }}>{f==="all"?"All Orders":f}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:9 }}>
          <button onClick={()=>{setShowImporter(true);setShowForm(false);}} style={ghost({padding:"8px 15px",fontSize:12,color:"#A855F7",borderColor:"#A855F755",display:"flex",alignItems:"center",gap:6})}>
            <span>📨</span><span>Import from Email/SMS</span>
          </button>
          <button onClick={()=>setShowForm(f=>!f)} style={mkBtn(showForm?"rgba(255,255,255,0.08)":"#A855F7",{padding:"8px 18px",fontSize:12})}>
            {showForm?"✕ Cancel":"+ New Production Order"}
          </button>
        </div>
      </div>
      {flash && <div style={{ marginBottom:14, color:"#3DAA6A", fontSize:13 }}>✓ Production Order created successfully.</div>}

      {showForm && (
        <div style={{ background:"rgba(168,85,247,0.06)", border:"1px solid rgba(168,85,247,0.22)", borderRadius:12, padding:22, marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#A855F7", marginBottom:16 }}>NEW PRODUCTION ORDER</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:"13px 18px", marginBottom:22 }}>
            <div><label style={lbl}>Order Date</label><Fld type="date" value={hdr.date} onChange={v=>sh("date",v)}/></div>
            <div><label style={lbl}>Customer / Account *</label><Fld type="text" value={hdr.customer} onChange={v=>sh("customer",v)} placeholder="Customer name"/></div>
            <div><label style={lbl}>Target Completion Date</label><Fld type="date" value={hdr.targetDate} onChange={v=>sh("targetDate",v)}/></div>
            <div><label style={lbl}>Priority</label><select style={inp()} value={hdr.priority} onChange={e=>sh("priority",e.target.value)}>{["Normal","Urgent","Rush"].map(o=><option key={o}>{o}</option>)}</select></div>
            <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Order Notes</label><Fld type="textarea" value={hdr.notes} onChange={v=>sh("notes",v)}/></div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Products / Line Items</div>
            <button onClick={()=>setProducts(ps=>[...ps,emptyProd()])} style={ghost({ fontSize:11, padding:"5px 12px", color:"#A855F7", borderColor:"#A855F766" })}>+ Add Product</button>
          </div>
          {products.map((p,i)=>(
            <div key={p.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(168,85,247,0.15)", borderRadius:10, padding:16, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:12, color:"#A855F7", fontWeight:700 }}>Line Item {i+1}</div>
                {products.length>1 && <button onClick={()=>setProducts(ps=>ps.filter(x=>x.id!==p.id))} style={ghost({fontSize:11,padding:"3px 10px",color:"#E8531A",borderColor:"#E8531A44"})}>✕ Remove</button>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:"11px 16px", marginBottom:12 }}>
                <div><label style={lbl}>Product Name *</label><Fld type="text" value={p.productName} onChange={v=>sp(p.id,"productName",v)}/></div>
                <div><label style={lbl}>Roast Profile</label><select style={inp()} value={p.roastProfile} onChange={e=>sp(p.id,"roastProfile",e.target.value)}><option value="">— select —</option>{["Light","Medium-Light","Medium","Medium-Dark","Dark"].map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label style={lbl}>Package Size</label><select style={inp()} value={p.packageSize} onChange={e=>sp(p.id,"packageSize",e.target.value)}><option value="">— select —</option>{["8oz","12oz","1lb","2lb","5lb","Bulk","Custom"].map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label style={lbl}>SKU Qty (units)</label><Fld type="number" value={p.skuQty} onChange={v=>sp(p.id,"skuQty",v)}/></div>
                <div><label style={lbl}>Green Coffee Needed (lbs)</label><Fld type="number" value={p.totalLbs} onChange={v=>sp(p.id,"totalLbs",v)}/></div>
                <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Line Notes</label><Fld type="text" value={p.notes} onChange={v=>sp(p.id,"notes",v)} placeholder="Special instructions…"/></div>
              </div>
              <div>
                <div style={{ ...lbl, marginBottom:8 }}>Required Steps</div>
                <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
                  {PROCESS_STEPS.map(step=>(
                    <label key={step} style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:13, color:"rgba(255,255,255,0.65)" }}>
                      <input type="checkbox" checked={p[`requires${step.charAt(0).toUpperCase()+step.slice(1)}`]??false} onChange={e=>sp(p.id,`requires${step.charAt(0).toUpperCase()+step.slice(1)}`,e.target.checked)} style={{ accentColor:"#A855F7", width:14, height:14 }}/>
                      {STEP_LABELS[step]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <button onClick={handleCreate} style={mkBtn("#A855F7")}>Create Production Order</button>
        </div>
      )}

      {filtered.length===0
        ? <div style={{ textAlign:"center", padding:"52px 0", color:"rgba(255,255,255,0.18)", fontSize:14, border:"1px dashed rgba(255,255,255,0.07)", borderRadius:10 }}>{orders.length===0?"No production orders yet.":"No orders match this filter."}</div>
        : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(po=>{
              const allKeys=[]; po.products.forEach(p=>PROCESS_STEPS.forEach(st=>{ if(p[`requires${st.charAt(0).toUpperCase()+st.slice(1)}`]) allKeys.push(`${p.id}_${st}`); }));
              const pct=allKeys.length?Math.round((allKeys.filter(k=>po.steps[k]).length/allKeys.length)*100):0;
              const pc=po.priority==="Rush"?"#E8531A":po.priority==="Urgent"?"#D4A853":"rgba(255,255,255,0.3)";
              return (
                <div key={po.id} style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${sc(po.status)}25`, borderRadius:10, padding:"15px 18px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
                    <div style={{ minWidth:90 }}>
                      <div style={{ fontSize:16, fontWeight:700, color:"#A855F7" }}>{po.poNumber}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{po.date}</div>
                    </div>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"#F5EDD8" }}>👤 {po.customer}</div>
                      <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:3 }}>
                        {po.products.map((prod,i)=>(
                          <div key={prod.id} style={{ fontSize:12, color:"rgba(255,255,255,0.5)", display:"flex", gap:10, flexWrap:"wrap" }}>
                            <span style={{ color:"rgba(255,255,255,0.7)", fontWeight:600 }}>Line {i+1}:</span>
                            <span>{prod.productName}</span>
                            {prod.roastProfile && <span style={{ color:"#E8531A" }}>{prod.roastProfile}</span>}
                            {prod.skuQty && <span>📦 {prod.skuQty} {prod.packageSize&&`× ${prod.packageSize}`}</span>}
                            <span style={{ color:"#A855F7", fontSize:11 }}>{prod.batchNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ minWidth:140 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:5 }}><span>Progress</span><span>{pct}%</span></div>
                      <div style={{ height:5, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#7C6AE8":"#A855F7", borderRadius:3 }}/>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                      <div style={{ display:"flex", gap:8 }}><Badge label={po.priority} color={pc}/><Badge label={po.status} color={sc(po.status)}/>{po.importedFrom==="email_sms"&&<Badge label="📨 Imported" color="#3b82f6"/>}</div>
                      {po.targetDate && <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)" }}>Due: {po.targetDate}</div>}
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>printReport(po)} style={ghost({padding:"5px 12px",fontSize:11,color:"#3DAA6A",borderColor:"#3DAA6A55"})}>🖨 Print</button>
                        <button onClick={()=>onViewOrder(po.id)} style={mkBtn("#A855F7",{padding:"5px 14px",fontSize:11})}>View / Update →</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }
      {showImporter && (
        <POImporter
          onImported={parsed=>{
            const po={
              id:Date.now(), poNumber:nextPO(),
              date:parsed.date||today(),
              customer:parsed.customer||"",
              targetDate:parsed.targetDate||"",
              priority:parsed.priority||"Normal",
              notes:parsed.notes||"",
              products:(parsed.products||[]).map(p=>({...p,id:Date.now()+Math.random(),batchNumber:nextBatch()})),
              steps:{}, status:"Open", createdAt:new Date().toISOString(),
              importedFrom:"email_sms"
            };
            onCreateOrder(po);
          }}
          onClose={()=>setShowImporter(false)}
        />
      )}
    </div>
  );
}

// ─── PO DETAIL MODAL ──────────────────────────────────────────────────────────
function getStepFields(step){
  return {
    roast:[
      {name:"roastDate",label:"Roast Date",type:"date"},
      {name:"greenWeight",label:"Total Green Weight (lbs)",type:"number"},
      {name:"roastWeight",label:"Roasted Weight (lbs)",type:"number"},
      {name:"tempStart",label:"Start Temp (°F)",type:"number"},
      {name:"tempEnd",label:"End Temp (°F)",type:"number"},
      {name:"duration",label:"Duration (min)",type:"number"},
      {name:"operator",label:"Operator",type:"text"},
      {name:"notes",label:"Notes",type:"textarea",full:true},
    ],
    grinding:[
      {name:"grindDate",label:"Date",type:"date"},
      {name:"inputWeight",label:"Input Weight (lbs)",type:"number"},
      {name:"outputWeight",label:"Output Weight (lbs)",type:"number"},
      {name:"grindSize",label:"Grind Size (1–10 Scale)",type:"grindscale"},
      {name:"operator",label:"Operator"},
      {name:"notes",label:"Notes",type:"textarea",full:true},
    ],
    blending:[
      {name:"blendDate",label:"Date",type:"date"},
      {name:"totalWeight",label:"Total Weight (lbs)",type:"number"},
      {name:"operator",label:"Operator"},
      {name:"notes",label:"Notes",type:"textarea",full:true},
    ],
    packaging:[
      {name:"pkgDate",label:"Date",type:"date"},
      {name:"unitsProduced",label:"Units Produced",type:"number"},
      {name:"netWeight",label:"Total Net Weight (lbs)",type:"number"},
      {name:"packagingMaterial",label:"Packaging Material",type:"text"},
      {name:"firstBagWeight",label:"First Bag Weight (lbs)",type:"number"},
      {name:"middleBagWeight",label:"Middle Bag Weight (lbs)",type:"number"},
      {name:"finalBagWeight",label:"Final Bag Weight (lbs)",type:"number"},
      {name:"bestBefore",label:"Best Before Date",type:"date"},
      {name:"qcStatus",label:"QC Status",type:"select",options:["Pass","Fail","Pending"]},
      {name:"operator",label:"Operator"},
      {name:"notes",label:"Notes",type:"textarea",full:true},
    ],
  }[step]||[];
}

function PODetailModal({ po, inventoryRows, onClose, onUpdateStep, onChangeStatus }){
  const [activeStep,setActiveStep]=useState(null);
  const [drafts,setDrafts]=useState({});
  const [stepFlash,setStepFlash]=useState(null);
  const [editingStep,setEditingStep]=useState(null);
  const [editDraft,setEditDraft]=useState({});

  const setD=(key,k,v)=>setDrafts(prev=>({...prev,[key]:{...(prev[key]||{}),[k]:v}}));
  const getD=(key,k,def="")=>(drafts[key]||{})[k]??def;

  const toggleBag=(stepKey,bagKey)=>{
    const cur=getD(stepKey,"selectedBags")||[];
    const exists=cur.find(b=>b.key===bagKey);
    if(exists){ setD(stepKey,"selectedBags",cur.filter(b=>b.key!==bagKey)); }
    else {
      const row=inventoryRows.find(r=>`${r.origin}||${r.bagMarks}`===bagKey);
      setD(stepKey,"selectedBags",[...cur,{key:bagKey,origin:row.origin,bagMarks:row.bagMarks,bagsUsed:"",available:row.bagsIn-row.bagsOut}]);
    }
  };
  const setBagQty=(stepKey,bagKey,qty)=>{
    const cur=getD(stepKey,"selectedBags")||[];
    setD(stepKey,"selectedBags",cur.map(b=>b.key===bagKey?{...b,bagsUsed:qty}:b));
  };

  const handleSaveStep=(prod,step)=>{
    const key=`${prod.id}_${step}`;
    onUpdateStep(po.id,key,{...(drafts[key]||{}),completedAt:new Date().toISOString(),batchNumber:prod.batchNumber});
    setActiveStep(null);
    setStepFlash(key); setTimeout(()=>setStepFlash(null),2500);
  };

  const startEditStep=(key,data)=>{ setEditingStep(key); setEditDraft({...data}); };
  const saveEditStep=(poId,key)=>{ onUpdateStep(poId,key,{...editDraft,completedAt:editDraft.completedAt}); setEditingStep(null); };

  const sc=s=>s==="Open"?"#3DAA6A":s==="In Progress"?"#D4A853":"#7C6AE8";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:1000, overflowY:"auto", padding:"22px 12px" }}>
      <div style={{ maxWidth:920, margin:"0 auto", background:"#141010", border:"1px solid rgba(168,85,247,0.3)", borderRadius:14, overflow:"hidden" }}>
        {/* Modal header */}
        <div style={{ background:"rgba(168,85,247,0.1)", borderBottom:"1px solid rgba(168,85,247,0.2)", padding:"15px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:"#A855F7" }}>{po.poNumber}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginTop:2 }}>👤 {po.customer} · {po.products.length} product{po.products.length!==1?"s":""} · {po.date}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <button onClick={()=>printReport(po)} style={ghost({padding:"6px 14px",fontSize:12,color:"#3DAA6A",borderColor:"#3DAA6A55"})}>🖨 Print Report</button>
            <select value={po.status} onChange={e=>onChangeStatus(po.id,e.target.value)} style={{ ...inp(), width:"auto", fontSize:12, padding:"6px 12px", color:sc(po.status) }}>
              <option>Open</option><option>In Progress</option><option>Closed</option>
            </select>
            <button onClick={onClose} style={ghost({padding:"6px 14px",fontSize:13})}>✕ Close</button>
          </div>
        </div>

        <div style={{ padding:"20px 22px" }}>
          {po.notes && <div style={{ marginBottom:18, fontSize:13, color:"rgba(255,255,255,0.4)", fontStyle:"italic", padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:8 }}>📝 {po.notes}</div>}

          {po.products.map((prod,pi)=>{
            const reqSteps=PROCESS_STEPS.filter(st=>prod[`requires${st.charAt(0).toUpperCase()+st.slice(1)}`]);
            const doneSteps=reqSteps.filter(st=>po.steps[`${prod.id}_${st}`]);
            const pct=reqSteps.length?Math.round((doneSteps.length/reqSteps.length)*100):0;
            return (
              <div key={prod.id} style={{ marginBottom:22, border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, overflow:"hidden" }}>
                <div style={{ background:"rgba(168,85,247,0.07)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"12px 18px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#F5EDD8" }}>Line {pi+1}: {prod.productName}</span>
                      {prod.roastProfile && <Badge label={prod.roastProfile} color="#E8531A"/>}
                      {prod.packageSize  && <Badge label={prod.packageSize}  color="#1AB8CF"/>}
                    </div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4, display:"flex", gap:14, flexWrap:"wrap" }}>
                      <span>🏷 Batch: <b style={{ color:"#A855F7" }}>{prod.batchNumber}</b></span>
                      {prod.skuQty  && <span>📦 {prod.skuQty} units</span>}
                      {prod.totalLbs && <span>⚖️ {prod.totalLbs} lbs green</span>}
                    </div>
                  </div>
                  <div style={{ minWidth:130 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:4 }}><span>Progress</span><span>{pct}%</span></div>
                    <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#7C6AE8":"#A855F7", borderRadius:3 }}/>
                    </div>
                  </div>
                </div>

                <div style={{ padding:"13px 18px", display:"flex", flexDirection:"column", gap:10 }}>
                  {reqSteps.map((step,si)=>{
                    const stepKey=`${prod.id}_${step}`;
                    const done=!!po.steps[stepKey];
                    const stepData=po.steps[stepKey]||{};
                    const isOpen=activeStep===stepKey;
                    const isEditing=editingStep===stepKey;
                    const meta=MODULE_META[step];
                    const avail=inventoryRows.filter(r=>r.bagsIn-r.bagsOut>0);
                    const selBags=getD(stepKey,"selectedBags")||[];

                    return (
                      <div key={step} style={{ border:`1px solid ${done?meta.accent+"40":"rgba(255,255,255,0.08)"}`, borderRadius:9, overflow:"hidden" }}>
                        {/* Step header */}
                        <div style={{ display:"flex", alignItems:"center", gap:11, padding:"11px 15px", background:done?`${meta.accent}0D`:"rgba(255,255,255,0.02)", cursor:!done?"pointer":"default" }}
                          onClick={()=>!done&&!isEditing&&setActiveStep(isOpen?null:stepKey)}>
                          <div style={{ width:29, height:29, borderRadius:7, background:done?`${meta.accent}25`:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                            {done?"✓":meta.icon}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:done?meta.accent:"#F5EDD8" }}>Step {si+1}: {meta.label}</div>
                            {done
                              ? <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:1 }}>Completed {new Date(stepData.completedAt).toLocaleString()}{stepData.operator&&` · ${stepData.operator}`}</div>
                              : <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", marginTop:1 }}>Click to fill in details</div>}
                          </div>
                          {done && !isEditing && <button onClick={e=>{e.stopPropagation();startEditStep(stepKey,stepData);}} style={ghost({padding:"3px 10px",fontSize:11,color:meta.accent,borderColor:meta.accent+"55"})}>Edit</button>}
                          {!done && <div style={{ fontSize:11, color:meta.accent }}>{isOpen?"▲":"▼"}</div>}
                          {stepFlash===stepKey && <div style={{ fontSize:11, color:"#3DAA6A" }}>✓ Saved!</div>}
                        </div>

                        {/* Completed summary (view mode) */}
                        {done && !isEditing && (
                          <div style={{ padding:"10px 15px 14px", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                              {Object.entries(stepData).filter(([k,v])=>k!=="completedAt"&&k!=="selectedBags"&&v&&String(v).length<80).map(([k,v])=>(
                                <div key={k}>
                                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{k.replace(/([A-Z])/g," $1").trim()}</div>
                                  <div style={{ fontSize:12, color:"#F5EDD8", marginTop:2 }}>{String(v)}</div>
                                </div>
                              ))}
                            </div>
                            {stepData.selectedBags?.length>0 && (
                              <div style={{ marginTop:10 }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Bags Used</div>
                                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                                  {stepData.selectedBags.map((b,bi)=>(
                                    <div key={bi} style={{ background:"rgba(200,112,42,0.12)", border:"1px solid rgba(200,112,42,0.25)", borderRadius:6, padding:"5px 10px", fontSize:12 }}>
                                      <span style={{ color:"#C8702A", fontWeight:600 }}>{b.origin}</span> · <span style={{ color:"#F5EDD8" }}>{b.bagMarks}</span> · <span style={{ color:"#E8531A" }}>−{b.bagsUsed} bags</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Edit mode for completed step */}
                        {done && isEditing && (
                          <div style={{ padding:"14px 15px 16px", borderTop:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.2)" }}>
                            <div style={{ fontSize:12, color:"#D4A853", marginBottom:12 }}>✏️ Editing completed step — changes will update the record</div>
                            {/* Bag picker editable in edit mode for roast/blending */}
                            {(step==="roast"||step==="blending") && avail.length>0 && (
                              <div style={{ marginBottom:14, padding:13, background:"rgba(200,112,42,0.07)", border:"1px solid rgba(200,112,42,0.18)", borderRadius:9 }}>
                                <div style={{ fontSize:11, color:"#C8702A", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Bags Used — Edit Selection</div>
                                <div style={{ marginBottom:10 }}>
                                  <select style={inp()} value="" onChange={e=>{ if(e.target.value){ const cur=(editDraft.selectedBags||[]); const bk=e.target.value; if(!cur.find(b=>b.key===bk)){ const row=avail.find(r=>`${r.origin}||${r.bagMarks}`===bk); setEditDraft(p=>({...p,selectedBags:[...cur,{key:bk,origin:row.origin,bagMarks:row.bagMarks,bagsUsed:"",available:row.bagsIn-row.bagsOut}]})); }}}}>
                                    <option value="">— Add bag from inventory —</option>
                                    {avail.map(r=>{ const bk=`${r.origin}||${r.bagMarks}`; const already=(editDraft.selectedBags||[]).find(b=>b.key===bk); return <option key={bk} value={bk} disabled={!!already}>{already?"✓ ":""}{r.origin} — {r.bagMarks} ({r.bagsIn-r.bagsOut} avail)</option>; })}
                                  </select>
                                </div>
                                {(editDraft.selectedBags||[]).length>0 && (
                                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                                    {(editDraft.selectedBags||[]).map(b=>(
                                      <div key={b.key} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(200,112,42,0.2)", borderRadius:7, padding:"8px 12px" }}>
                                        <div style={{ flex:1 }}><span style={{ color:"#C8702A", fontWeight:600 }}>{b.origin}</span><span style={{ color:"rgba(255,255,255,0.5)", marginLeft:8, fontSize:12 }}>{b.bagMarks}</span></div>
                                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                          <label style={{ ...lbl, margin:0, whiteSpace:"nowrap" }}>Bags:</label>
                                          <input type="text" inputMode="decimal" style={{ ...inp(), width:70, padding:"5px 8px" }} value={b.bagsUsed} onWheel={e=>e.currentTarget.blur()} onChange={e=>setEditDraft(p=>({...p,selectedBags:p.selectedBags.map(sb=>sb.key===b.key?{...sb,bagsUsed:e.target.value}:sb)}))}/>
                                        </div>
                                        <button onClick={()=>setEditDraft(p=>({...p,selectedBags:p.selectedBags.filter(sb=>sb.key!==b.key)}))} style={{ background:"transparent", border:"none", color:"#E8531A", cursor:"pointer", fontSize:16, padding:"0 4px" }}>✕</button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"11px 15px", marginBottom:14 }}>
                              {getStepFields(step).map(f=>(
                                <div key={f.name} style={f.full?{gridColumn:"1/-1"}:{}}>
                                  <label style={lbl}>{f.label}</label>
                                  <Fld type={f.type||"text"} options={f.options} value={editDraft[f.name]||(f.type==="date"?today():"")} onChange={v=>setEditDraft(p=>({...p,[f.name]:v}))}/>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:"flex", gap:10 }}>
                              <button onClick={()=>saveEditStep(po.id,stepKey)} style={mkBtn(meta.accent,{padding:"8px 20px",fontSize:12})}>Save Changes</button>
                              <button onClick={()=>setEditingStep(null)} style={ghost({padding:"8px 16px",fontSize:12})}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Fill-in form for new step */}
                        {isOpen && !done && (
                          <div style={{ padding:"15px 15px 17px", borderTop:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.2)" }}>
                            <div style={{ marginBottom:13, display:"inline-flex", alignItems:"center", gap:10, background:"rgba(168,85,247,0.12)", border:"1px solid rgba(168,85,247,0.3)", borderRadius:7, padding:"7px 15px" }}>
                              <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Auto Batch #:</span>
                              <span style={{ fontSize:14, fontWeight:700, color:"#A855F7" }}>{prod.batchNumber}</span>
                            </div>

                            {/* Inventory bag picker */}
                            {(step==="roast"||step==="blending") && avail.length>0 && (
                              <div style={{ marginBottom:16, padding:13, background:"rgba(200,112,42,0.07)", border:"1px solid rgba(200,112,42,0.18)", borderRadius:9 }}>
                                <div style={{ fontSize:11, color:"#C8702A", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                                  Select Bags from Inventory {step==="blending"?"(select multiple to blend)":""}
                                </div>
                                <div style={{ marginBottom:10 }}>
                                  <select style={inp()} value="" onChange={e=>{ if(e.target.value) toggleBag(stepKey,e.target.value); }}>
                                    <option value="">— Select bag from inventory —</option>
                                    {avail.map(r=>{
                                      const bk=`${r.origin}||${r.bagMarks}`;
                                      const already=selBags.find(b=>b.key===bk);
                                      return <option key={bk} value={bk} disabled={!!already}>{already?"✓ ":""}{r.origin} — {r.bagMarks} ({r.bagsIn-r.bagsOut} bags avail)</option>;
                                    })}
                                  </select>
                                </div>
                                {selBags.length>0 && (
                                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                                    {selBags.map(b=>(
                                      <div key={b.key} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(200,112,42,0.2)", borderRadius:7, padding:"8px 12px" }}>
                                        <div style={{ flex:1 }}>
                                          <span style={{ color:"#C8702A", fontWeight:600 }}>{b.origin}</span>
                                          <span style={{ color:"rgba(255,255,255,0.5)", marginLeft:8, fontSize:12 }}>{b.bagMarks}</span>
                                          <span style={{ color:"#3DAA6A", fontSize:11, marginLeft:8 }}>({b.available} avail)</span>
                                        </div>
                                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                          <label style={{ ...lbl, margin:0, whiteSpace:"nowrap" }}>Bags to Pull:</label>
                                          <input type="text" inputMode="decimal" style={{ ...inp(), width:80, padding:"5px 8px", MozAppearance:"textfield" }} value={b.bagsUsed} onWheel={e=>e.currentTarget.blur()} onChange={e=>setBagQty(stepKey,b.key,e.target.value)}/>
                                        </div>
                                        <button onClick={()=>toggleBag(stepKey,b.key)} style={{ background:"transparent", border:"none", color:"#E8531A", cursor:"pointer", fontSize:16, padding:"0 4px" }}>✕</button>
                                      </div>
                                    ))}
                                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", paddingLeft:4 }}>
                                      Total: <b style={{ color:"#F5EDD8" }}>{selBags.reduce((s,b)=>s+(Number(b.bagsUsed)||0),0)}</b> bags selected
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"12px 15px", marginBottom:14 }}>
                              {getStepFields(step).map(f=>(
                                <div key={f.name} style={f.full?{gridColumn:"1/-1"}:{}}>
                                  <label style={lbl}>{f.label}</label>
                                  <Fld type={f.type||"text"} options={f.options} value={getD(stepKey,f.name)||(f.type==="date"?today():"")} onChange={v=>setD(stepKey,f.name,v)}/>
                                </div>
                              ))}
                            </div>
                            <button onClick={()=>handleSaveStep(prod,step)} style={mkBtn(meta.accent,{padding:"9px 20px",fontSize:12})}>
                              Save &amp; Attach to Production Order
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── CUPPING LOG ──────────────────────────────────────────────────────────────
const CUPP_EMPTY = {
  date:today(), cupper:"", sampleRef:"", origin:"", bagMarks:"", roastDate:"", roastLevel:"",
  fragrance:"", aroma:"", flavor:"", aftertaste:"", acidity:"", body:"", balance:"",
  uniformity:"", cleanCup:"", sweetness:"", overall:"",
  defects:"", notes:"", finalScore:""
};
const CUPP_SCORE_ATTRS = ["fragrance","aroma","flavor","aftertaste","acidity","body","balance","uniformity","cleanCup","sweetness","overall"];

function ScoreInput({ label, value, onChange }){
  const v = Number(value)||0;
  const color = v>=9?"#3DAA6A":v>=8?"#5BA4A4":v>=7?"#D4A853":v>=6?"#C8702A":"#E8531A";
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <input type="range" min="6" max="10" step="0.25" value={v||6} onChange={e=>onChange(e.target.value)}
          style={{ flex:1, accentColor:color, cursor:"pointer" }}/>
        <div style={{ minWidth:38, textAlign:"right", fontSize:14, fontWeight:700, color, background:`${color}15`, border:`1px solid ${color}40`, borderRadius:5, padding:"2px 7px" }}>
          {v||"—"}
        </div>
      </div>
    </div>
  );
}

function CuppingLog({ cuppingRecords, onSave, onUpdate, orders }){
  const [d, setD]           = useState(CUPP_EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [flash, setFlash]   = useState("");
  const sd = (k,v) => setD(p=>({...p,[k]:v}));

  // Auto-calculate total score from SCA attributes
  const calcScore = (rec)=>{
    const attrs = CUPP_SCORE_ATTRS.map(a=>Number(rec[a])||0).filter(v=>v>0);
    if(attrs.length===0) return "";
    return (attrs.reduce((s,v)=>s+v,0)).toFixed(2);
  };

  const save = ()=>{
    const scored = {...d, finalScore: d.finalScore || calcScore(d), id:Date.now(), createdAt:new Date().toISOString()};
    onSave(scored);
    setD(CUPP_EMPTY); setShowForm(false);
    setFlash("saved"); setTimeout(()=>setFlash(""),2500);
  };

  const saveEdit = ()=>{
    const scored = {...editData, finalScore: editData.finalScore || calcScore(editData)};
    onUpdate(scored); setEditId(null);
    setFlash("edited"); setTimeout(()=>setFlash(""),2500);
  };

  const scoreColor = s=>{ const n=Number(s); return n>=90?"#3DAA6A":n>=85?"#5BA4A4":n>=80?"#D4A853":n>=75?"#C8702A":"#E8531A"; };

  const ATTR_LABELS = { fragrance:"Fragrance/Aroma", aroma:"Aroma (wet)", flavor:"Flavor", aftertaste:"Aftertaste", acidity:"Acidity", body:"Body", balance:"Balance", uniformity:"Uniformity", cleanCup:"Clean Cup", sweetness:"Sweetness", overall:"Overall" };

  const renderForm = (rec, setRec, onSubmit, submitLabel)=>(
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:"12px 18px", marginBottom:20 }}>
        <div><label style={lbl}>Cupping Date</label><Fld type="date" value={rec.date} onChange={v=>setRec("date",v)}/></div>
        <div><label style={lbl}>Cupper / Evaluator</label><Fld type="text" value={rec.cupper} onChange={v=>setRec("cupper",v)} placeholder="Name"/></div>
        <div><label style={lbl}>Sample Reference</label>
          <select style={inp()} value={rec.sampleRef} onChange={e=>{
            const val=e.target.value; setRec("sampleRef",val);
            // auto-fill origin/bagMarks if a PO is selected
          }}>
            <option value="">— select PO / Batch —</option>
            {(orders||[]).flatMap(po=>[
              <option key={po.poNumber} value={po.poNumber} style={{fontWeight:700}}>
                {po.poNumber} — {po.customer} ({po.status})
              </option>,
              ...po.products.map(p=>(
                <option key={p.batchNumber} value={`${po.poNumber} / ${p.batchNumber}`}>
                  &nbsp;&nbsp;↳ {p.batchNumber} — {p.productName}{p.roastProfile?" ("+p.roastProfile+")":""}
                </option>
              ))
            ])}
          </select>
        </div>
        <div><label style={lbl}>Origin</label><Fld type="text" value={rec.origin} onChange={v=>setRec("origin",v)}/></div>
        <div><label style={lbl}>Bag Marks</label><Fld type="text" value={rec.bagMarks} onChange={v=>setRec("bagMarks",v)}/></div>
        <div><label style={lbl}>Roast Date</label><Fld type="date" value={rec.roastDate} onChange={v=>setRec("roastDate",v)}/></div>
        <div><label style={lbl}>Roast Level</label>
          <select style={inp()} value={rec.roastLevel} onChange={e=>setRec("roastLevel",e.target.value)}>
            <option value="">— select —</option>
            {["Light","Medium-Light","Medium","Medium-Dark","Dark"].map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background:"rgba(91,164,164,0.07)", border:"1px solid rgba(91,164,164,0.2)", borderRadius:10, padding:"16px 18px", marginBottom:18 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#5BA4A4", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.08em" }}>SCA Scoring Attributes (6.00 – 10.00)</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"14px 22px" }}>
          {CUPP_SCORE_ATTRS.map(attr=>(
            <ScoreInput key={attr} label={ATTR_LABELS[attr]||attr} value={rec[attr]}
              onChange={v=>setRec(attr,v)}/>
          ))}
        </div>
        <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:14, padding:"10px 14px", background:"rgba(91,164,164,0.1)", borderRadius:8 }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Auto-calculated Total Score:</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#5BA4A4" }}>{calcScore(rec)||"—"}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>(sum of all attributes)</div>
          <div style={{ flex:1 }}/>
          <div><label style={{...lbl,display:"inline",marginRight:8}}>Override Score:</label>
            <input type="text" inputMode="decimal" style={{...inp(),width:90,display:"inline",MozAppearance:"textfield"}} onWheel={e=>e.currentTarget.blur()} value={rec.finalScore} onChange={e=>setRec("finalScore",e.target.value)} placeholder="auto"/>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 18px", marginBottom:18 }}>
        <div><label style={lbl}>Defects (# cups × severity)</label><Fld type="text" value={rec.defects} onChange={v=>setRec("defects",v)} placeholder="e.g. 2 cups × 2 = 4"/></div>
        <div><label style={lbl}>General Notes / Tasting Notes</label><Fld type="textarea" value={rec.notes} onChange={v=>setRec("notes",v)}/></div>
      </div>

      <button onClick={onSubmit} style={mkBtn("#5BA4A4")}>{submitLabel}</button>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{cuppingRecords.length} cupping session{cuppingRecords.length!==1?"s":""} logged</div>
        </div>
        <button onClick={()=>setShowForm(f=>!f)} style={mkBtn(showForm?"rgba(255,255,255,0.08)":"#5BA4A4",{padding:"8px 18px",fontSize:12})}>
          {showForm?"✕ Cancel":"+ New Cupping Session"}
        </button>
      </div>

      {flash==="saved"  && <div style={{ marginBottom:12, color:"#3DAA6A", fontSize:13 }}>✓ Cupping session saved.</div>}
      {flash==="edited" && <div style={{ marginBottom:12, color:"#5BA4A4", fontSize:13 }}>✓ Session updated.</div>}

      {showForm && (
        <div style={{ background:"rgba(91,164,164,0.06)", border:"1px solid rgba(91,164,164,0.22)", borderRadius:12, padding:22, marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#5BA4A4", marginBottom:16 }}>NEW CUPPING SESSION</div>
          {renderForm(d, sd, save, "Save Cupping Session")}
        </div>
      )}

      {cuppingRecords.length===0 && !showForm && (
        <div style={{ textAlign:"center", padding:"52px 0", color:"rgba(255,255,255,0.18)", fontSize:14, border:"1px dashed rgba(255,255,255,0.07)", borderRadius:10 }}>
          No cupping sessions yet. Click "+ New Cupping Session" to begin.
        </div>
      )}

      {cuppingRecords.length>0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[...cuppingRecords].reverse().map(rec=>{
            const score = rec.finalScore || calcScore(rec);
            const isEditing = editId===rec.id;
            return (
              <div key={rec.id} style={{ border:`1px solid rgba(91,164,164,0.25)`, borderRadius:10, overflow:"hidden" }}>
                {/* Summary header */}
                <div style={{ background:"rgba(91,164,164,0.08)", padding:"13px 18px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                      <span style={{ fontSize:15, fontWeight:700, color:"#F5EDD8" }}>{rec.origin||"Unknown Origin"}</span>
                      {rec.bagMarks && <Badge label={rec.bagMarks} color="#C8702A"/>}
                      {rec.roastLevel && <Badge label={rec.roastLevel} color="#E8531A"/>}
                      {rec.sampleRef && <span style={{ fontSize:11, color:"#A855F7" }}>{rec.sampleRef}</span>}
                    </div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:4, display:"flex", gap:14 }}>
                      {rec.date && <span>📅 {rec.date}</span>}
                      {rec.cupper && <span>👤 {rec.cupper}</span>}
                      {rec.roastDate && <span>🔥 Roasted {rec.roastDate}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:700, color:scoreColor(score) }}>{score||"—"}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Score</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {!isEditing && <button onClick={()=>{ setEditId(rec.id); setEditData({...rec}); }} style={ghost({padding:"5px 13px",fontSize:11,color:"#5BA4A4",borderColor:"#5BA4A455"})}>Edit</button>}
                    {isEditing  && <button onClick={()=>setEditId(null)} style={ghost({padding:"5px 13px",fontSize:11,color:"#E8531A",borderColor:"#E8531A55"})}>Cancel</button>}
                  </div>
                </div>

                {/* Score bars */}
                {!isEditing && (
                  <div style={{ padding:"12px 18px 14px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:"8px 16px" }}>
                      {CUPP_SCORE_ATTRS.filter(a=>rec[a]).map(a=>{
                        const v=Number(rec[a]), pct=((v-6)/4)*100;
                        const bc=v>=9?"#3DAA6A":v>=8?"#5BA4A4":v>=7?"#D4A853":"#C8702A";
                        return (
                          <div key={a}>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:3 }}>
                              <span>{ATTR_LABELS[a]}</span><span style={{ color:bc, fontWeight:700 }}>{v}</span>
                            </div>
                            <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:2 }}>
                              <div style={{ height:"100%", width:`${pct}%`, background:bc, borderRadius:2 }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {rec.notes && <div style={{ marginTop:10, fontSize:12, color:"rgba(255,255,255,0.45)", fontStyle:"italic", padding:"8px 12px", background:"rgba(255,255,255,0.03)", borderRadius:6 }}>📝 {rec.notes}</div>}
                    {rec.defects && <div style={{ marginTop:6, fontSize:11, color:"#E8531A" }}>⚠ Defects: {rec.defects}</div>}
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div style={{ padding:"16px 18px", borderTop:"1px solid rgba(91,164,164,0.15)" }}>
                    <div style={{ fontSize:12, color:"#D4A853", marginBottom:14 }}>✏️ Editing cupping session</div>
                    {renderForm(editData, (k,v)=>setEditData(p=>({...p,[k]:v})), saveEdit, "Save Changes")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Add pulse animation for loading screen
const _styleTag = document.createElement("style");
_styleTag.textContent = "@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.1)} }";
document.head.appendChild(_styleTag);

export default function CoffeeCRM(){
  const [active,setActive]          = useState("production");
  const [orders,setOrders]          = useState([]);
  const [receiving,setReceiving]    = useState([]);
  const [invAdjustments,setInvAdj]  = useState([]);
  const [cuppingRecords,setCupping] = useState([]);
  const [viewingPO,setViewingPO]    = useState(null);
  const [loading,setLoading]        = useState(true);
  const [syncError,setSyncError]    = useState("");

  // ── Load all data on mount + subscribe to real-time changes ──────────────
  const loadOrders    = useCallback(async()=>{ try{ const d=await fetchOrders();    setOrders(d);    }catch(e){ setSyncError("Orders: "+e.message); } },[]);
  const loadReceiving = useCallback(async()=>{ try{ const d=await fetchReceiving(); setReceiving(d); }catch(e){ setSyncError("Receiving: "+e.message); } },[]);
  const loadAdj       = useCallback(async()=>{ try{ const d=await fetchAdjustments();setInvAdj(d);  }catch(e){ setSyncError("Adjustments: "+e.message); } },[]);
  const loadCupping   = useCallback(async()=>{ try{ const d=await fetchCupping();   setCupping(d);  }catch(e){ setSyncError("Cupping: "+e.message); } },[]);

  useEffect(()=>{
    Promise.all([loadOrders(),loadReceiving(),loadAdj(),loadCupping()])
      .finally(()=>setLoading(false));
    const unsub = subscribeAll(loadOrders,loadReceiving,loadAdj,loadCupping);
    return unsub;
  },[loadOrders,loadReceiving,loadAdj,loadCupping]);

  // ── Build inventory ledger (computed from loaded data) ───────────────────
  const ledger={};
  receiving.forEach(r=>{
    const key=`${r.origin}||${r.bagMarks}`;
    if(!ledger[key]) ledger[key]={ origin:r.origin, bagMarks:r.bagMarks, bagsIn:0, bagsOut:0, weightPerBag:r.weightPerBag, costPerLb:r.costPerLb };
    ledger[key].bagsIn+=Number(r.qtyBags)||0;
  });
  const orderPulls=[];
  orders.forEach(po=>{
    Object.entries(po.steps).forEach(([stepKey,data])=>{
      if(data.selectedBags?.length>0){
        data.selectedBags.forEach(b=>{
          const invKey=`${b.origin}||${b.bagMarks}`;
          if(ledger[invKey]) ledger[invKey].bagsOut+=Number(b.bagsUsed)||0;
          orderPulls.push({ poNumber:po.poNumber, batchNumber:data.batchNumber, origin:b.origin, bagMarks:b.bagMarks, bagsUsed:b.bagsUsed, step:stepKey.split("_").slice(-1)[0], date:data.completedAt });
        });
      }
    });
  });
  const inventoryRows=Object.values(ledger);

  // ── Handlers — write to Supabase, real-time subscription updates all clients
  const handleCreateOrder = async(o)=>{ setOrders(p=>[o,...p]); try{ await insertOrder(o); }catch(e){ setSyncError(e.message); } };
  const handleUpdateStep=(poId,stepKey,data)=>{
    setOrders(prev=>prev.map(o=>{
      if(o.id!==poId) return o;
      const newSteps={...o.steps,[stepKey]:data};
      const allKeys=[];
      o.products.forEach(p=>PROCESS_STEPS.forEach(st=>{ if(p[`requires${st.charAt(0).toUpperCase()+st.slice(1)}`]) allKeys.push(`${p.id}_${st}`); }));
      const updated={...o, steps:newSteps, status:allKeys.every(k=>newSteps[k])?"Closed":"In Progress"};
      updateOrder(updated).catch(e=>setSyncError(e.message));
      return updated;
    }));
  };
  const handleChangeStatus=(poId,status)=>{
    setOrders(prev=>prev.map(o=>{
      if(o.id!==poId) return o;
      const updated={...o,status};
      updateOrder(updated).catch(e=>setSyncError(e.message));
      return updated;
    }));
  };
  const handleSaveReceiving=async(r)=>{ setReceiving(p=>[r,...p]); try{ await insertReceiving(r); }catch(e){ setSyncError(e.message); } };
  const handleUpdateRecord=async(rec)=>{
    setReceiving(prev=>prev.map(r=>r.id===rec.id?rec:r));
    try{ await updateReceiving(rec); }catch(e){ setSyncError(e.message); }
  };
  const handleAddAdj=async(adj)=>{ setInvAdj(prev=>[...prev,adj]); try{ await insertAdjustment(adj); }catch(e){ setSyncError(e.message); } };
  const handleSaveCupping=async(rec)=>{ setCupping(prev=>[rec,...prev]); try{ await insertCupping(rec); }catch(e){ setSyncError(e.message); } };
  const handleUpdateCupping=async(rec)=>{
    setCupping(prev=>prev.map(r=>r.id===rec.id?rec:r));
    try{ await updateCupping(rec); }catch(e){ setSyncError(e.message); }
  };

  // ── Loading screen ───────────────────────────────────────────────────────
  if(loading) return (
    <div style={{ minHeight:"100vh", background:"#0E0A07", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", color:"#F5EDD8" }}>
      <div style={{ fontSize:48, marginBottom:20, animation:"pulse 1.5s ease-in-out infinite" }}>☕</div>
      <div style={{ fontSize:16, color:"rgba(245,237,216,0.6)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Loading Delicious Sips CRM…</div>
      {syncError && <div style={{ marginTop:20, fontSize:12, color:"#E8531A", maxWidth:400, textAlign:"center", padding:"10px 16px", background:"rgba(232,83,26,0.1)", borderRadius:8, border:"1px solid rgba(232,83,26,0.2)" }}>⚠ {syncError}<br/><span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Check your config.js Supabase credentials</span></div>}
    </div>
  );

  const viewPO=viewingPO?orders.find(o=>o.id===viewingPO):null;
  const totalOnHand=inventoryRows.reduce((s,r)=>s+(r.bagsIn-r.bagsOut),0);
  const openOrders=orders.filter(o=>o.status!=="Closed").length;
  const meta=MODULE_META[active], idx=WORKFLOW.indexOf(active);

  return (
    <div style={{ minHeight:"100vh", background:"#0E0A07", fontFamily:"'Georgia','Times New Roman',serif", color:"#F5EDD8", display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ borderBottom:"1px solid rgba(200,112,42,0.2)", padding:"13px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(0,0,0,0.35)", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={`data:image/png;base64,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`} alt="Delicious Sips" style={{ height:52, width:"auto", objectFit:"contain" }}/>
          <div style={{ fontSize:10, color:"rgba(245,237,216,0.38)", letterSpacing:"0.14em", textTransform:"uppercase", marginTop:2 }}>Manufacturing Operations</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ background:"rgba(168,85,247,0.14)", border:"1px solid rgba(168,85,247,0.28)", borderRadius:6, padding:"4px 12px", fontSize:11, color:"#A855F7" }}>{openOrders} open order{openOrders!==1?"s":""}</div>
          <div style={{ background:"rgba(61,170,106,0.14)", border:"1px solid rgba(61,170,106,0.28)", borderRadius:6, padding:"4px 12px", fontSize:11, color:"#3DAA6A" }}>{totalOnHand} bags on hand</div>
        </div>
      </div>

      {/* Sync error banner */}
      {syncError && <div style={{ background:"rgba(232,83,26,0.12)", borderBottom:"1px solid rgba(232,83,26,0.25)", padding:"6px 22px", fontSize:11, color:"#E8531A", display:"flex", justifyContent:"space-between", alignItems:"center" }}>⚠ Sync issue: {syncError} <button onClick={()=>setSyncError("")} style={{ background:"none", border:"none", color:"#E8531A", cursor:"pointer", fontSize:12 }}>✕</button></div>}
      {/* Nav */}
      <div style={{ padding:"10px 22px", background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.05)", overflowX:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", minWidth:"max-content" }}>
          {WORKFLOW.map((id,i)=>{
            const m=MODULE_META[id], isActive=active===id;
            return (
              <div key={id} style={{ display:"flex", alignItems:"center" }}>
                <button onClick={()=>setActive(id)} style={{ background:isActive?m.accent:"transparent", border:`2px solid ${isActive?m.accent:"rgba(255,255,255,0.09)"}`, borderRadius:8, padding:"6px 12px", color:isActive?"#fff":"rgba(255,255,255,0.38)", cursor:"pointer", fontSize:12, fontWeight:isActive?700:400, fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, transition:"all .2s", whiteSpace:"nowrap" }}>
                  <span>{m.icon}</span><span>{m.label}</span>
                </button>
                {i<WORKFLOW.length-1 && <div style={{ color:"rgba(255,255,255,0.1)", margin:"0 2px", fontSize:14 }}>›</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"20px 22px", maxWidth:1200, width:"100%", boxSizing:"border-box" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${meta.accent}30` }}>
          <div style={{ width:40, height:40, borderRadius:9, background:`${meta.accent}20`, border:`1px solid ${meta.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{meta.icon}</div>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:"#F5EDD8" }}>{meta.label}</h2>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Step {idx+1} of {WORKFLOW.length}</div>
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.065)", borderRadius:12, padding:20 }}>
          {active==="production" && <ProductionOrders orders={orders} onCreateOrder={handleCreateOrder} onViewOrder={id=>setViewingPO(id)}/>}
          {active==="receiving"  && <ReceivingLog onSave={handleSaveReceiving} records={receiving} onUpdateRecord={handleUpdateRecord}/>}
          {active==="inventory"  && <InventoryLog receivingRecords={receiving} orderPulls={orderPulls} invAdjustments={invAdjustments} onAddAdjustment={handleAddAdj}/>}
          {active==="cupping"    && <CuppingLog cuppingRecords={cuppingRecords} onSave={handleSaveCupping} onUpdate={handleUpdateCupping} orders={orders}/>}
          {["roast","grinding","blending","packaging"].includes(active) && (
            <div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:14 }}>Select an open Production Order to log {active} details for each product line.</div>
              {orders.filter(o=>o.status!=="Closed"&&o.products.some(p=>p[`requires${active.charAt(0).toUpperCase()+active.slice(1)}`]&&!o.steps[`${p.id}_${active}`])).length===0
                ? <div style={{ padding:"36px", textAlign:"center", color:"rgba(255,255,255,0.2)", border:"1px dashed rgba(255,255,255,0.07)", borderRadius:10 }}>No open orders require {active} at this time.</div>
                : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {orders.filter(o=>o.status!=="Closed"&&o.products.some(p=>p[`requires${active.charAt(0).toUpperCase()+active.slice(1)}`]&&!o.steps[`${p.id}_${active}`])).map(po=>(
                      <div key={po.id} style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"13px 17px", flexWrap:"wrap" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:4 }}>
                            <span style={{ fontSize:15, fontWeight:700, color:"#A855F7" }}>{po.poNumber}</span>
                            <Badge label={po.status} color={po.status==="Open"?"#3DAA6A":"#D4A853"}/>
                          </div>
                          <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>👤 {po.customer}</div>
                          <div style={{ marginTop:5, display:"flex", flexDirection:"column", gap:3 }}>
                            {po.products.filter(p=>p[`requires${active.charAt(0).toUpperCase()+active.slice(1)}`]&&!po.steps[`${p.id}_${active}`]).map(p=>(
                              <div key={p.id} style={{ fontSize:12, color:"rgba(255,255,255,0.65)", display:"flex", gap:8 }}>
                                <span style={{ color:"#A855F7" }}>{p.batchNumber}</span>
                                <span>{p.productName}</span>
                                {p.roastProfile && <span style={{ color:"#E8531A" }}>{p.roastProfile}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                        <button onClick={()=>setViewingPO(po.id)} style={mkBtn(MODULE_META[active].accent,{padding:"8px 17px",fontSize:12})}>
                          Open & Fill {STEP_LABELS[active]} →
                        </button>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>
      </div>

      {viewPO && <PODetailModal po={viewPO} inventoryRows={inventoryRows} onClose={()=>setViewingPO(null)} onUpdateStep={handleUpdateStep} onChangeStatus={handleChangeStatus}/>}
    </div>
  );
}
