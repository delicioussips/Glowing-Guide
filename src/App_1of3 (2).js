import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';


// ─── CONFIG — PASTE YOUR KEYS HERE ──────────────────────────────────────────
const SUPABASE_URL      = "https://egznlbgocoptwfwlfyxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnem5sYmdvY29wdHdmd2xmeXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDM2NDAsImV4cCI6MjA4ODgxOTY0MH0.lXVc175D_9iGjPRsJRFb6S0h6YqHxXihBNzK8aaX8ao";

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
  const STEP_COLOR = {roast:"#c8400a",grinding:"#5b50c0",blending:"#0d8b9e",packaging:"#a07820"};
  const STEP_ICON  = {roast:"🔥",grinding:"⚙",blending:"↺",packaging:"▣"};

  const productsHtml = po.products.map((prod,i)=>{
    const reqSteps = PROCESS_STEPS.filter(st=>prod[`requires${st.charAt(0).toUpperCase()+st.slice(1)}`]);
    const stepsHtml = reqSteps.map(step=>{
      const data = po.steps[`${prod.id}_${step}`];
      const color = STEP_COLOR[step]||"#555";
      if(!data) return `<div class="step pending">${STEP_ICON[step]||"•"} <b>${STEP_LABELS[step]}</b> — Pending</div>`;
      const fields = {
        roast:     ["roastDate","totalGreenWt","roastedWeight","startTemp","endTemp","duration","operator"],
        grinding:  ["grindDate","inputWeight","outputWeight","grindSize","operator"],
        blending:  ["blendDate","totalWeight","operator"],
        packaging: ["packDate","unitsProd","totalNetWt","packMaterial","bestBefore","qcStatus","operator"],
      }[step]||[];
      const rows = fields.filter(k=>data[k]).map(k=>`<tr><td class="k">${k.replace(/([A-Z])/g," $1").trim()}</td><td class="v">${data[k]}</td></tr>`).join("");
      const bags = data.selectedBags?.length ? `<div class="bags">Bags: ${data.selectedBags.map(b=>`${b.origin}/${b.bagMarks} ×${b.bagsUsed}`).join(", ")}</div>` : "";
      return `<div class="step done" style="border-left:3px solid ${color}"><b style="color:${color}">${STEP_ICON[step]||"•"} ${STEP_LABELS[step]}</b>${bags}<table>${rows}</table></div>`;
    }).join("");

    return `<div class="prod">
      <div class="prod-head">
        <span class="ln">Line ${i+1}</span>
        <span class="pn">${prod.productName||"—"}</span>
        ${prod.roastProfile?`<span class="tag">${prod.roastProfile}</span>`:""}
        ${prod.packageSize?`<span class="tag blue">${prod.packageSize}</span>`:""}
        <span class="batch">Batch: ${prod.batchNumber||"—"}</span>
        ${prod.skuQty?`<span class="batch">Qty: ${prod.skuQty}</span>`:""}
        ${prod.totalLbs?`<span class="batch">${prod.totalLbs} lbs</span>`:""}
      </div>
      ${prod.notes?`<div class="prod-note">${prod.notes}</div>`:""}
      <div class="steps">${stepsHtml||"<div class='step pending'>No steps logged yet</div>"}</div>
    </div>`;
  }).join("");

  const statusColor = po.status==="Closed"?"#2d7a2d":po.status==="In Progress"?"#9a6e00":"#1a5a8a";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${po.poNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{font-family:Georgia,serif;color:#1a1008;background:#fff;font-size:11.5px;padding:18px 22px}
    /* ── Header ── */
    .hdr{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid #6b3a0f;padding-bottom:10px;margin-bottom:12px}
    .brand{font-size:17px;font-weight:700;color:#6b3a0f;letter-spacing:.04em}
    .brand-sub{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-top:2px}
    .po-block{text-align:right}
    .po-num{font-size:22px;font-weight:700;color:#6b3a0f}
    .po-status{display:inline-block;font-size:9px;font-weight:700;padding:2px 7px;border-radius:3px;background:${statusColor}1a;color:${statusColor};border:1px solid ${statusColor}55;text-transform:uppercase;letter-spacing:.06em;margin-top:3px}
    /* ── Summary bar ── */
    .meta{display:flex;gap:0;border:1px solid #e0d0b0;border-radius:6px;overflow:hidden;margin-bottom:12px;background:#fffaf5}
    .meta-cell{flex:1;padding:7px 10px;border-right:1px solid #e0d0b0}
    .meta-cell:last-child{border-right:none}
    .mk{font-size:8px;color:#aaa;text-transform:uppercase;letter-spacing:.08em}
    .mv{font-size:11.5px;font-weight:600;color:#1a1008;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    /* ── Products ── */
    .prod{border:1px solid #e0d0b0;border-radius:6px;margin-bottom:8px;overflow:hidden;page-break-inside:avoid}
    .prod-head{background:#fdf0e0;padding:7px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;border-bottom:1px solid #e0d0b0}
    .ln{font-size:9px;color:#aaa;font-weight:600;text-transform:uppercase}
    .pn{font-size:13px;font-weight:700;color:#1a1008}
    .tag{font-size:9px;padding:2px 6px;border-radius:3px;background:#fde8d8;color:#c8400a;border:1px solid #f0c0a0;font-weight:600}
    .tag.blue{background:#ddf0f8;color:#0d6c7e;border:1px solid #b0dcea}
    .batch{font-size:9px;color:#888;background:#f5f0e8;padding:2px 6px;border-radius:3px;border:1px solid #e0d0b0}
    .prod-note{padding:4px 12px;font-size:10px;color:#888;font-style:italic;background:#fffaf5;border-bottom:1px solid #f0e0c8}
    /* ── Steps ── */
    .steps{padding:8px 10px;display:flex;flex-direction:column;gap:6px}
    .step{border-radius:4px;padding:5px 9px;font-size:11px}
    .step.done{background:#f6fcf6;border:1px solid #c0dfc0}
    .step.pending{background:#fafafa;border:1px solid #e0e0e0;color:#aaa;font-style:italic}
    .bags{font-size:10px;color:#6b3a0f;background:#fdf0e0;border-radius:3px;padding:3px 6px;margin:3px 0}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    td{padding:2px 6px;font-size:10.5px}
    td.k{color:#999;text-transform:capitalize;width:130px}
    td.v{color:#1a1008;font-weight:500}
    /* ── Footer ── */
    .ftr{margin-top:10px;padding-top:8px;border-top:1px solid #e0d0b0;display:flex;justify-content:space-between;font-size:9px;color:#bbb}
    @page{margin:0.4in}
    @media print{body{padding:0}}
  </style></head><body>

  <div class="hdr">
    <div>
      <div class="brand">Delicious Sips Coffee Roasters</div>
      <div class="brand-sub">Production Order</div>
    </div>
    <div class="po-block">
      <div class="po-num">${po.poNumber}</div>
      <div class="po-status">${po.status}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-cell"><div class="mk">Customer</div><div class="mv">${po.customer||"—"}</div></div>
    <div class="meta-cell"><div class="mk">Order Date</div><div class="mv">${po.date||"—"}</div></div>
    <div class="meta-cell"><div class="mk">Due Date</div><div class="mv">${po.targetDate||"—"}</div></div>
    <div class="meta-cell"><div class="mk">Priority</div><div class="mv">${po.priority||"Normal"}</div></div>
    <div class="meta-cell"><div class="mk">Products</div><div class="mv">${po.products.length} line${po.products.length!==1?"s":""}</div></div>
    ${po.notes?`<div class="meta-cell" style="flex:2"><div class="mk">Notes</div><div class="mv">${po.notes}</div></div>`:""}
  </div>

  ${productsHtml}

  <div class="ftr">
    <span>Printed ${new Date().toLocaleString()}</span>
    <span>${po.poNumber} — ${po.customer||""}</span>
    <span>Delicious Sips Coffee Roasters</span>
  </div>

  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;

  const existing = document.getElementById("__crm_print__");
  if(existing) existing.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "__crm_print__";
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  setTimeout(()=>iframe.remove(), 8000);
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
  const [doError, setDoError] = useState("");
  const [parsedItems, setParsedItems] = useState([]);  // multi-item DO results
  const fileRef  = useRef();
  const doRef    = useRef();

  const sd = (k,v)=>setD(p=>({...p,[k]:v}));

  // AI-powered DO parsing — reads PDF/image and extracts line items
  const handleDOUpload = async (file)=>{
    if(!file) return;
    setDoError(""); setDoFile(file); setUploading(true);
    try {
      // Read file as base64
      const base64 = await new Promise((res,rej)=>{
        const r = new FileReader();
        r.onload  = e => res(e.target.result.split(",")[1]);
        r.onerror = () => rej(new Error("Could not read file"));
        r.readAsDataURL(file);
      });

      const isImage = file.type.startsWith("image/");
      const isPDF   = file.type === "application/pdf";
      if(!isImage && !isPDF){ setDoError("Please upload a PDF, JPG, or PNG file."); setUploading(false); return; }

      // Build content block
      const fileBlock = isPDF
        ? { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 }}
        : { type:"image",    source:{ type:"base64", media_type:file.type,           data:base64 }};

      const SYSTEM = `You are a data extraction assistant for a coffee roasting company. Extract every line item from this delivery order document.
Return ONLY a raw JSON array with no markdown, no code fences, no explanation — just the array.
Each object must have these exact keys:
{"date":"YYYY-MM-DD or empty string","supplier":"company name or empty","origin":"coffee origin/country","bagMarks":"lot/bag mark identifier","qtyBags":"number as string","weightPerBag":"lbs per bag as string","deliveryOrder":"DO or PO number","notes":"any extra notes"}
Rules:
- One object per coffee lot or line item
- If 3 lots listed, return array of 3 objects
- Share date/supplier/DO number across all items if they appear once on the doc
- Today is ${new Date().toISOString().slice(0,10)}
- Return ONLY the JSON array, starting with [ and ending with ]`;

      const doBody = {
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role:"user", content:[fileBlock, { type:"text", text:"Extract all delivery order line items and return the JSON array." }]}]
      };
      if(isPDF) doBody._beta = "pdfs-2024-09-25";

      console.log("[DO] calling proxy fileType=" + file.type);
      const resp = await fetch("/.netlify/functions/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doBody)
      });

      console.log("[DO] response status:", resp.status);
      if(!resp.ok){
        const errText = await resp.text();
        console.error("[DO] error body:", errText);
        throw new Error("API " + resp.status + ": " + errText.slice(0,200));
      }

      const data = await resp.json();
      console.log("[DO] content blocks:", JSON.stringify(data.content || data.error).slice(0,300));
      if(data.error) throw new Error(data.error.message || "Unknown API error");

      const rawText = data.content && data.content.find(function(c){return c.type==="text";});
      const rawStr = rawText ? rawText.text : "";
      if(!rawStr) throw new Error("Empty response from AI — try a clearer scan");

      // Strip markdown fences if model wrapped response
      const cleaned = rawStr.replace(/```[a-z]*/g,"").replace(/```/g,"").trim();
      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch(e){ throw new Error("AI returned: " + rawStr.slice(0,120)); }

      if(!Array.isArray(parsed)) parsed = [parsed];
      if(parsed.length === 0) throw new Error("No line items found. Try a higher quality scan or different file.");

      // Stamp each item with a unique id and empty cost field
      const items = parsed.map((item,i)=>({ ...item, id: Date.now()+i, costPerLb:"", coaFile:null }));
      setParsedItems(items);
      setFlash("do_parsed");
      setTimeout(()=>setFlash(""), 8000);

      // If single item, also pre-fill the manual form
      if(items.length === 1){
        const p = items[0];
        setD(prev=>({...prev,
          date: p.date||prev.date, supplier: p.supplier||prev.supplier,
          origin: p.origin||prev.origin, bagMarks: p.bagMarks||prev.bagMarks,
          qtyBags: p.qtyBags||prev.qtyBags, weightPerBag: p.weightPerBag||prev.weightPerBag,
          deliveryOrder: p.deliveryOrder||prev.deliveryOrder, notes: p.notes||prev.notes,
        }));
      }
    } catch(err){
      setDoError(err.message || "Upload failed — please try again.");
    }
    setUploading(false);
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
          onDragEnter={e=>{e.preventDefault();e.stopPropagation();}}
          onDragOver={e=>{e.preventDefault();e.stopPropagation();}}
          onDragLeave={e=>{e.preventDefault();e.stopPropagation();}}
          onDrop={e=>{e.preventDefault();e.stopPropagation();const f=e.dataTransfer.files[0];if(f)handleDOUpload(f);}}>
          {uploading
            ? <><span style={{ fontSize:22 }}>⏳</span><div><div style={{ color:"#C8702A", fontWeight:700 }}>Parsing document with AI…</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:3 }}>Reading delivery order fields</div></div></>
            : doFile
            ? <><span style={{ fontSize:22 }}>📄</span><div><div style={{ color:"#3DAA6A", fontWeight:700 }}>✓ {doFile.name}</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:3 }}>Click to replace • Fields auto-filled below</div></div></>
            : <><span style={{ fontSize:22 }}>📂</span><div><div style={{ color:"rgba(255,255,255,0.6)", fontWeight:600 }}>Click or drag & drop Delivery Order</div><div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3 }}>PDF, JPG, or PNG — AI will extract and fill fields automatically</div></div></>
          }
        </div>
        <input ref={doRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={e=>handleDOUpload(e.target.files[0])}/>
        {flash==="do_parsed" && <div style={{ marginTop:8, color:"#3DAA6A", fontSize:12 }}>✓ {parsedItems.length} line item{parsedItems.length!==1?"s":""} detected — review and confirm below.</div>}
        {doError && <div style={{ marginTop:8, color:"#E8531A", fontSize:12, padding:"8px 12px", background:"rgba(232,83,26,0.08)", border:"1px solid rgba(232,83,26,0.2)", borderRadius:6 }}>⚠ {doError}</div>}
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
function printInventory(rows, adjustments){
  const now = new Date();
  const rowsHtml = rows.map(r=>{
    const bal = r.bagsIn - r.bagsOut;
    const status = bal<=0?"Empty":bal<=5?"Low Stock":"In Stock";
    const statusColor = bal<=0?"#c8400a":bal<=5?"#9a6e00":"#2d7a2d";
    const totalLbs = bal * (Number(r.weightPerBag)||0);
    const totalValue = totalLbs * (Number(r.costPerLb)||0);
    return `<tr>
      <td>${r.origin||"—"}</td>
      <td>${r.bagMarks||"—"}</td>
      <td style="text-align:right">${r.bagsIn}</td>
      <td style="text-align:right">${r.bagsOut}</td>
      <td style="text-align:right;font-weight:700;color:${statusColor}">${bal}</td>
      <td style="text-align:right">${r.weightPerBag?r.weightPerBag+" lbs":"—"}</td>
      <td style="text-align:right">${totalLbs?totalLbs.toFixed(1)+" lbs":"—"}</td>
      <td style="text-align:right">${r.costPerLb?"$"+Number(r.costPerLb).toFixed(2):"—"}</td>
      <td style="text-align:right">${totalValue?"$"+totalValue.toFixed(2):"—"}</td>
      <td style="text-align:center"><span style="font-size:9px;padding:2px 6px;border-radius:3px;background:${statusColor}18;color:${statusColor};border:1px solid ${statusColor}44;font-weight:600">${status}</span></td>
    </tr>`;
  }).join("");

  const totalBagsIn  = rows.reduce((s,r)=>s+r.bagsIn,0);
  const totalBagsOut = rows.reduce((s,r)=>s+r.bagsOut,0);
  const totalBal     = totalBagsIn - totalBagsOut;
  const totalLbsAll  = rows.reduce((s,r)=>s+(r.bagsIn-r.bagsOut)*(Number(r.weightPerBag)||0),0);
  const totalValAll  = rows.reduce((s,r)=>s+(r.bagsIn-r.bagsOut)*(Number(r.weightPerBag)||0)*(Number(r.costPerLb)||0),0);

  const adjHtml = adjustments?.length ? `
    <div style="margin-top:20px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;border-bottom:1px solid #e0d0b0;padding-bottom:5px;margin-bottom:8px">Adjustment History</div>
      <table><thead><tr style="font-size:9px;color:#aaa;text-transform:uppercase">
        <th style="text-align:left;padding:4px 8px">Date</th><th style="text-align:left;padding:4px 8px">Origin</th><th style="text-align:left;padding:4px 8px">Bag Marks</th>
        <th style="text-align:left;padding:4px 8px">Type</th><th style="text-align:right;padding:4px 8px">Qty</th><th style="text-align:left;padding:4px 8px">Reason</th><th style="text-align:left;padding:4px 8px">Notes</th>
      </tr></thead><tbody>
      ${adjustments.map(a=>`<tr style="border-bottom:1px solid #f0e8d8;font-size:10px">
        <td style="padding:3px 8px">${a.date?new Date(a.date).toLocaleDateString():"—"}</td>
        <td style="padding:3px 8px">${a.origin||"—"}</td><td style="padding:3px 8px">${a.bagMarks||"—"}</td>
        <td style="padding:3px 8px;color:${a.type==="add"?"#2d7a2d":"#c8400a"}">${a.type==="add"?"+ Add":"- Remove"}</td>
        <td style="padding:3px 8px;text-align:right;font-weight:600">${a.qty}</td>
        <td style="padding:3px 8px;color:#888">${a.reason||"—"}</td><td style="padding:3px 8px;color:#888">${a.notes||""}</td>
      </tr>`).join("")}
      </tbody></table>
    </div>` : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Inventory Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{font-family:Georgia,serif;color:#1a1008;background:#fff;font-size:11px;padding:18px 22px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid #6b3a0f;padding-bottom:10px;margin-bottom:14px}
    .brand{font-size:17px;font-weight:700;color:#6b3a0f}.brand-sub{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:.1em;margin-top:2px}
    .rpt-title{font-size:14px;font-weight:700;color:#6b3a0f;text-align:right}.rpt-date{font-size:9px;color:#aaa;text-align:right;margin-top:3px}
    .summary{display:flex;gap:0;border:1px solid #e0d0b0;border-radius:6px;overflow:hidden;margin-bottom:14px;background:#fffaf5}
    .sc{flex:1;padding:8px 12px;border-right:1px solid #e0d0b0}.sc:last-child{border-right:none}
    .sk{font-size:8px;color:#aaa;text-transform:uppercase;letter-spacing:.08em}.sv{font-size:15px;font-weight:700;margin-top:2px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:7px 8px;font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#999;background:#fdf6ee;border-bottom:2px solid #e0d0b0;white-space:nowrap}
    td{padding:6px 8px;border-bottom:1px solid #f0e8d8;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    .totals-row td{font-weight:700;background:#fdf0e0;border-top:2px solid #e0d0b0;font-size:12px}
    .ftr{margin-top:14px;padding-top:8px;border-top:1px solid #e0d0b0;display:flex;justify-content:space-between;font-size:9px;color:#bbb}
    @page{margin:0.4in}@media print{body{padding:0}}
  </style></head><body>

  <div class="hdr">
    <div><div class="brand">Delicious Sips Coffee Roasters</div><div class="brand-sub">Green Coffee Inventory</div></div>
    <div><div class="rpt-title">Inventory Report</div><div class="rpt-date">Generated ${now.toLocaleString()}</div></div>
  </div>

  <div class="summary">
    <div class="sc"><div class="sk">SKUs On Hand</div><div class="sv" style="color:#3DAA6A">${rows.filter(r=>r.bagsIn-r.bagsOut>0).length}</div></div>
    <div class="sc"><div class="sk">Bags On Hand</div><div class="sv" style="color:#1AB8CF">${totalBal}</div></div>
    <div class="sc"><div class="sk">Total lbs On Hand</div><div class="sv" style="color:#C8702A">${totalLbsAll.toFixed(1)}</div></div>
    <div class="sc"><div class="sk">Est. Inventory Value</div><div class="sv" style="color:#A855F7">${totalValAll?"$"+totalValAll.toFixed(2):"—"}</div></div>
  </div>

  <table>
    <thead><tr>
      <th>Origin</th><th>Bag Marks</th><th style="text-align:right">Bags In</th><th style="text-align:right">Bags Out</th>
      <th style="text-align:right">Balance</th><th style="text-align:right">lbs/Bag</th><th style="text-align:right">Total lbs</th>
      <th style="text-align:right">Cost/lb</th><th style="text-align:right">Est. Value</th><th style="text-align:center">Status</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
    <tfoot><tr class="totals-row">
      <td colspan="2">TOTALS</td>
      <td style="text-align:right">${totalBagsIn}</td>
      <td style="text-align:right">${totalBagsOut}</td>
      <td style="text-align:right;color:#1AB8CF">${totalBal}</td>
      <td></td>
      <td style="text-align:right">${totalLbsAll.toFixed(1)} lbs</td>
      <td></td>
      <td style="text-align:right">${totalValAll?"$"+totalValAll.toFixed(2):"—"}</td>
      <td></td>
    </tr></tfoot>
  </table>

  ${adjHtml}

  <div class="ftr">
    <span>Printed ${now.toLocaleString()}</span>
    <span>Delicious Sips Coffee Roasters — Green Coffee Inventory Report</span>
    <span>Confidential</span>
  </div>

  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;

  const existing = document.getElementById("__crm_inv_print__");
  if(existing) existing.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "__crm_inv_print__";
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:900px;height:600px;border:none;";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  setTimeout(()=>iframe.remove(), 8000);
}

function InventoryLog({ receivingRecords, orderPulls, invAdjustments, onAddAdjustment }){
  const [adjustKey, setAdjustKey] = useState(null); // key of row being adjusted