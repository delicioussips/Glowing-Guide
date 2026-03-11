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

      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
        <button onClick={()=>printInventory(rows, invAdjustments)} style={mkBtn("#3DAA6A",{padding:"8px 18px",fontSize:12,display:"flex",alignItems:"center",gap:7})}>
          🖨 Print Inventory Report
        </button>
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
        headers:{
          "Content-Type":"application/json",
          "x-api-key":ANTHROPIC_KEY,
          "anthropic-version":"2023-06-01",
          "anthropic-beta":"pdfs-2024-09-25",
          "anthropic-dangerous-direct-browser-access":"true"
        },
        body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:2000, system:AI_SYSTEM, messages:[{ role:"user", content:messageContent }]})
      });
      if(!resp.ok){ const t=await resp.text(); throw new Error(`API error ${resp.status}: ${t.slice(0,120)}`); }
      const data = await resp.json();
      if(data.error) throw new Error(data.error.message||"API error");
      const text = data.content?.find(c=>c.type==="text")?.text||"{}";
      const cleaned = text.replace(/^```[a-z]*\n?/,"").replace(/\n?```$/,"").trim();
      let p = {};
      try{ p = JSON.parse(cleaned); }catch(_){ throw new Error("AI returned unexpected format — try pasting the text instead"); }
      if(!p.customer && !p.products?.length) throw new Error("Could not extract order details — include customer name and product info");
      if(!p.products?.length) p.products = [{productName:"",roastProfile:"",packageSize:"",skuQty:"",totalLbs:"",requiresRoast:true,requiresGrinding:false,requiresBlending:false,requiresPackaging:true,notes:""}];
      setParsed(p);
    } catch(e){
      setError(e.message || "Parsing failed — please check content and try again.");
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