import { useState } from "react";
import { Heart, Activity, Droplets, Dumbbell, ChevronRight, ChevronLeft, Check, User, Wind, Stethoscope } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";

const STEPS = [
  { id: 1, title: "Personal Info",   icon: User },
  { id: 2, title: "Vitals",          icon: Activity },
  { id: 3, title: "Lifestyle",       icon: Dumbbell },
  { id: 4, title: "Heart History",   icon: Stethoscope },
];

const fitnessLevels = [
  { value: "sedentary",   label: "Sedentary",   desc: "Little to no exercise" },
  { value: "light",       label: "Light",        desc: "1–2 days/week" },
  { value: "moderate",    label: "Moderate",     desc: "3–4 days/week" },
  { value: "active",      label: "Active",       desc: "5–6 days/week" },
  { value: "very_active", label: "Very Active",  desc: "Daily intense exercise" },
];

const stressLevels = [
  { value: "1", label: "Very Low" },
  { value: "2", label: "Low" },
  { value: "3", label: "Moderate" },
  { value: "4", label: "High" },
  { value: "5", label: "Very High" },
];

type FormData = {
  age: string; gender: string; height_cm: string; weight_kg: string;
  resting_heart_rate: string; systolic_bp: string; diastolic_bp: string;
  cholesterol_level: string; blood_glucose: string;
  smoker: string; cigarettes_per_day: string;
  alcohol_drinker: string; drinks_per_week: string;
  fitness_level: string; hours_sleep: string; stress_level: string;
  diabetes: string; hypertension: string; family_heart_disease: string;
  previous_heart_attack: string; chest_pain_type: string;
};

const initialForm: FormData = {
  age: "", gender: "", height_cm: "", weight_kg: "",
  resting_heart_rate: "", systolic_bp: "", diastolic_bp: "",
  cholesterol_level: "", blood_glucose: "",
  smoker: "no", cigarettes_per_day: "", alcohol_drinker: "no",
  drinks_per_week: "", fitness_level: "", hours_sleep: "", stress_level: "",
  diabetes: "no", hypertension: "no", family_heart_disease: "no",
  previous_heart_attack: "no", chest_pain_type: "none",
};

function Field({ label, unit, indent, children }: {
  label: string; unit?: string; indent?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`field-wrap${indent ? " indent" : ""}`}>
      <label className="field-label">
        {label}{unit && <span className="field-unit"> ({unit})</span>}
      </label>
      {children}
    </div>
  );
}

function Seg({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o} type="button" className={value === o ? "seg-on" : ""} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export default function HealthDetails() {
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate              = useNavigate();

  const set = (key: keyof FormData, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const bmi = form.height_cm && form.weight_kg
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)
    : null;
  const bmiMeta = bmi
    ? parseFloat(bmi) < 18.5 ? { label: "Underweight", cls: "bmi-low" }
    : parseFloat(bmi) < 25   ? { label: "Normal",       cls: "bmi-ok" }
    : parseFloat(bmi) < 30   ? { label: "Overweight",   cls: "bmi-warn" }
    :                           { label: "Obese",         cls: "bmi-high" }
    : null;

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const token = sessionStorage.getItem("access_token");
      const payload = {
        ...form,
        bmi: bmi ? parseFloat(bmi) : null,
        age: parseInt(form.age), height_cm: parseFloat(form.height_cm), weight_kg: parseFloat(form.weight_kg),
        resting_heart_rate: form.resting_heart_rate ? parseInt(form.resting_heart_rate) : null,
        systolic_bp:        form.systolic_bp        ? parseInt(form.systolic_bp)        : null,
        diastolic_bp:       form.diastolic_bp       ? parseInt(form.diastolic_bp)       : null,
        cholesterol_level:  form.cholesterol_level  ? parseFloat(form.cholesterol_level): null,
        blood_glucose:      form.blood_glucose      ? parseFloat(form.blood_glucose)    : null,
        cigarettes_per_day: form.cigarettes_per_day ? parseInt(form.cigarettes_per_day) : 0,
        drinks_per_week:    form.drinks_per_week    ? parseFloat(form.drinks_per_week)  : 0,
        hours_sleep:        form.hours_sleep        ? parseFloat(form.hours_sleep)      : null,
        stress_level:       form.stress_level       ? parseInt(form.stress_level)       : null,
      };
      const res = await fetch(`${API_BASE}/health/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to save."); return; }
      navigate("/dashboard");
    } catch { setError("Could not connect to server."); }
    finally   { setLoading(false); }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="root">
      <div className="dot-bg" />

      {/* Navbar */}
      <nav className="topnav">
        <Link to="/" className="nav-brand">
          <Heart className="nav-hrt" />
          <span>CardioSense</span>
        </Link>
        <span className="nav-chip">Health Profile Setup</span>
      </nav>

      <div className="layout">
        {/* Side panel */}
        <aside className="sidebar">
          <div className="sidebar-sticky">
            {/* Orb */}
            <div className="orb-wrap">
              <div className="orb-c3" /><div className="orb-c2" /><div className="orb-c1">
                <Heart className="orb-hrt" />
              </div>
            </div>

            <h2 className="side-title">Build your heart profile</h2>
            <p className="side-body">
              Your answers power CardioSense's AI. A complete profile means more accurate predictions and personalised insights.
            </p>

            <ol className="step-list">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const done = step > s.id; const active = step === s.id;
                return (
                  <li key={s.id} className={`sl-item${active?" sl-act":""}${done?" sl-done":""}`}>
                    <div className="sl-dot">{done ? <Check size={12}/> : <Icon size={12}/>}</div>
                    <span className="sl-lbl">{s.title}</span>
                  </li>
                );
              })}
            </ol>

            <div className="enc-badge"><Wind size={13}/> Data is encrypted &amp; never shared</div>
          </div>
        </aside>

        {/* Form card */}
        <div className="card">
          {/* Progress */}
          <div className="prog-track"><div className="prog-fill" style={{width:`${progress}%`}}/></div>

          <div className="card-body">
            <div className="shead">
              <span className="shead-pill">Step {step} of {STEPS.length}</span>
              <h3 className="shead-title">
                {["","Personal Information","Medical Vitals","Lifestyle Habits","Medical History"][step]}
              </h3>
              <p className="shead-sub">
                {step===1 && "Basic details to calibrate your baseline health metrics."}
                {step===2 && "Clinical values help assess cardiovascular risk. Leave blank if unknown."}
                {step===3 && "Daily habits have a major impact on heart health."}
                {step===4 && "Pre-existing conditions significantly affect risk prediction."}
              </p>
            </div>

            {/* ── STEP 1 ── */}
            {step===1 && (
              <div className="fields anim">
                <div className="r2">
                  <Field label="Age">
                    <input type="number" placeholder="e.g. 35" value={form.age} onChange={e=>set("age",e.target.value)} min="1" max="120"/>
                  </Field>
                  <Field label="Gender">
                    <Seg options={["Male","Female","Other"]} value={form.gender.charAt(0).toUpperCase()+form.gender.slice(1)} onChange={v=>set("gender",v.toLowerCase())}/>
                  </Field>
                </div>
                <div className="r2">
                  <Field label="Height" unit="cm">
                    <input type="number" placeholder="e.g. 175" value={form.height_cm} onChange={e=>set("height_cm",e.target.value)}/>
                  </Field>
                  <Field label="Weight" unit="kg">
                    <input type="number" placeholder="e.g. 70" value={form.weight_kg} onChange={e=>set("weight_kg",e.target.value)}/>
                  </Field>
                </div>
                {bmi && bmiMeta && (
                  <div className={`bmi-row ${bmiMeta.cls}`}>
                    <span className="bmi-val">{bmi}</span>
                    <div className="bmi-divider"/>
                    <div>
                      <div className="bmi-label">Body Mass Index</div>
                      <div className="bmi-cat">{bmiMeta.label}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step===2 && (
              <div className="fields anim">
                <div className="r2">
                  <Field label="Resting Heart Rate" unit="bpm">
                    <input type="number" placeholder="60–100" value={form.resting_heart_rate} onChange={e=>set("resting_heart_rate",e.target.value)}/>
                  </Field>
                  <Field label="Blood Glucose" unit="mg/dL">
                    <input type="number" placeholder="70–140" value={form.blood_glucose} onChange={e=>set("blood_glucose",e.target.value)}/>
                  </Field>
                </div>
                <div className="r2">
                  <Field label="Systolic BP" unit="mmHg">
                    <input type="number" placeholder="90–180" value={form.systolic_bp} onChange={e=>set("systolic_bp",e.target.value)}/>
                  </Field>
                  <Field label="Diastolic BP" unit="mmHg">
                    <input type="number" placeholder="60–120" value={form.diastolic_bp} onChange={e=>set("diastolic_bp",e.target.value)}/>
                  </Field>
                </div>
                <Field label="Total Cholesterol" unit="mg/dL">
                  <input type="number" placeholder="e.g. 190" value={form.cholesterol_level} onChange={e=>set("cholesterol_level",e.target.value)}/>
                </Field>
                <div className="info-note">
                  <Droplets size={13}/>
                  These values appear on blood test reports. Even rough estimates help our model.
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step===3 && (
              <div className="fields anim">
                <Field label="Do you smoke?">
                  <Seg options={["No","Yes"]} value={form.smoker==="yes"?"Yes":"No"} onChange={v=>set("smoker",v.toLowerCase())}/>
                </Field>
                {form.smoker==="yes" && (
                  <Field label="Cigarettes per day" indent>
                    <input type="number" placeholder="e.g. 10" value={form.cigarettes_per_day} onChange={e=>set("cigarettes_per_day",e.target.value)} min="1"/>
                  </Field>
                )}
                <Field label="Do you drink alcohol?">
                  <Seg options={["No","Yes"]} value={form.alcohol_drinker==="yes"?"Yes":"No"} onChange={v=>set("alcohol_drinker",v.toLowerCase())}/>
                </Field>
                {form.alcohol_drinker==="yes" && (
                  <Field label="Drinks per week" indent>
                    <input type="number" placeholder="e.g. 5" value={form.drinks_per_week} onChange={e=>set("drinks_per_week",e.target.value)} min="1"/>
                  </Field>
                )}
                <Field label="Fitness Level">
                  <div className="tile-grid">
                    {fitnessLevels.map(f=>(
                      <button key={f.value} type="button" className={`tile${form.fitness_level===f.value?" tile-on":""}`} onClick={()=>set("fitness_level",f.value)}>
                        <span className="tile-name">{f.label}</span>
                        <span className="tile-desc">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="r2">
                  <Field label="Hours of Sleep" unit="/ night">
                    <input type="number" placeholder="e.g. 7" value={form.hours_sleep} onChange={e=>set("hours_sleep",e.target.value)} min="1" max="24" step="0.5"/>
                  </Field>
                  <Field label="Stress Level">
                    <div className="stress-row">
                      {stressLevels.map(s=>(
                        <button key={s.value} type="button" className={`stbtn${form.stress_level===s.value?" st-on":""}`} onClick={()=>set("stress_level",s.value)}>
                          <span className="stn">{s.value}</span>
                          <span className="stl">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 4 ── */}
            {step===4 && (
              <div className="fields anim">
                {[
                  {key:"diabetes",             label:"Do you have Diabetes?"},
                  {key:"hypertension",          label:"Do you have Hypertension?"},
                  {key:"family_heart_disease",  label:"Family history of heart disease?"},
                  {key:"previous_heart_attack", label:"Previous heart attack?"},
                ].map(({key,label})=>(
                  <Field key={key} label={label}>
                    <Seg options={["No","Yes"]} value={form[key as keyof FormData]==="yes"?"Yes":"No"} onChange={v=>set(key as keyof FormData,v.toLowerCase())}/>
                  </Field>
                ))}
                <Field label="Chest Pain Type">
                  <div className="tile-grid">
                    {[
                      {value:"none",            label:"None",            desc:"No chest pain"},
                      {value:"typical_angina",  label:"Typical Angina",  desc:"Triggered by exertion"},
                      {value:"atypical_angina", label:"Atypical Angina", desc:"Unrelated to exertion"},
                      {value:"non_anginal",     label:"Non-Anginal",     desc:"Non-cardiac pain"},
                      {value:"asymptomatic",    label:"Asymptomatic",    desc:"No symptoms felt"},
                    ].map(c=>(
                      <button key={c.value} type="button" className={`tile${form.chest_pain_type===c.value?" tile-on":""}`} onClick={()=>set("chest_pain_type",c.value)}>
                        <span className="tile-name">{c.label}</span>
                        <span className="tile-desc">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                {error && <div className="err-box">{error}</div>}
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="card-footer">
            {step>1
              ? <button className="btn-back" onClick={()=>setStep(s=>s-1)} type="button"><ChevronLeft size={15}/> Back</button>
              : <div/>
            }
            {step<STEPS.length
              ? <button className="btn-next" onClick={()=>setStep(s=>s+1)} type="button">Continue <ChevronRight size={15}/></button>
              : <button className="btn-submit" onClick={handleSubmit} disabled={loading} type="button">
                  {loading ? <span className="spinner"/> : <><Heart size={14} style={{fill:"white",marginRight:6}}/> Complete Profile</>}
                </button>
            }
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        :root{
          --g:  #10b981;
          --gd: #059669;
          --gl: #d1fae5;
          --gm: #a7f3d0;
          --tx: #111827;
          --mu: #6b7280;
          --bd: #e5e7eb;
          --bg: #f9fafb;
          --wh: #ffffff;
          --ff: 'Outfit',sans-serif;
        }

        .root{min-height:100vh;background:var(--bg);font-family:var(--ff);color:var(--tx);position:relative;}

        /* dot grid */
        .dot-bg{position:fixed;inset:0;pointer-events:none;
          background-image:radial-gradient(circle,#bbf7d0 1px,transparent 1px);
          background-size:26px 26px;opacity:0.6;}

        /* nav */
        .topnav{
          position:sticky;top:0;z-index:50;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 40px;height:62px;
          background:rgba(255,255,255,0.88);backdrop-filter:blur(14px);
          border-bottom:1px solid var(--bd);
        }
        .nav-brand{display:flex;align-items:center;gap:8px;text-decoration:none;font-weight:700;font-size:17px;color:var(--tx);}
        .nav-hrt{color:var(--g);fill:var(--g);width:20px;height:20px;animation:hb 1.4s ease-in-out infinite;}
        @keyframes hb{0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.15)}56%{transform:scale(1)}}
        .nav-chip{font-size:12.5px;font-weight:600;color:var(--gd);background:var(--gl);padding:4px 12px;border-radius:20px;}

        /* layout */
        .layout{max-width:1080px;margin:0 auto;display:flex;gap:28px;padding:36px 24px 60px;position:relative;z-index:1;}

        /* sidebar */
        .sidebar{width:270px;flex-shrink:0;}
        .sidebar-sticky{position:sticky;top:90px;display:flex;flex-direction:column;gap:22px;}

        .orb-wrap{position:relative;width:110px;height:110px;display:flex;align-items:center;justify-content:center;}
        .orb-c1{width:54px;height:54px;border-radius:50%;background:var(--g);display:flex;align-items:center;justify-content:center;position:relative;z-index:3;}
        .orb-c2{position:absolute;width:80px;height:80px;border-radius:50%;background:var(--gm);opacity:0.5;animation:pulse 2.5s ease-in-out infinite;}
        .orb-c3{position:absolute;width:110px;height:110px;border-radius:50%;background:var(--gl);opacity:0.4;animation:pulse 2.5s ease-in-out infinite 0.5s;}
        .orb-hrt{color:#fff;fill:#fff;width:24px;height:24px;}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}

        .side-title{font-size:20px;font-weight:800;letter-spacing:-0.4px;line-height:1.2;color:var(--tx);}
        .side-body{font-size:13.5px;color:var(--mu);line-height:1.6;}

        /* step list */
        .step-list{list-style:none;display:flex;flex-direction:column;gap:2px;}
        .sl-item{
          display:flex;align-items:center;gap:11px;
          padding:9px 0;font-size:13.5px;font-weight:500;
          color:var(--mu);opacity:0.45;transition:opacity 0.3s;
          position:relative;
        }
        .sl-item::before{
          content:"";position:absolute;left:13px;top:36px;
          width:1.5px;height:calc(100% - 12px);background:var(--bd);
        }
        .sl-item:last-child::before{display:none;}
        .sl-item.sl-done::before{background:var(--gm);}
        .sl-item.sl-act,.sl-item.sl-done{opacity:1;}
        .sl-item.sl-act{color:var(--tx);}
        .sl-dot{
          width:28px;height:28px;border-radius:50%;flex-shrink:0;
          background:var(--bd);border:1.5px solid var(--bd);
          display:flex;align-items:center;justify-content:center;
          color:var(--mu);transition:all 0.3s;
        }
        .sl-item.sl-act .sl-dot{background:var(--gl);border-color:var(--g);color:var(--gd);}
        .sl-item.sl-done .sl-dot{background:var(--g);border-color:var(--g);color:#fff;}
        .sl-lbl{line-height:1;}

        .enc-badge{
          display:flex;align-items:center;gap:7px;
          font-size:12px;color:var(--mu);
          background:var(--gl);border-radius:10px;padding:10px 13px;
        }
        .enc-badge svg{color:var(--g);flex-shrink:0;}

        /* card */
        .card{
          flex:1;background:var(--wh);
          border:1px solid var(--bd);border-radius:20px;
          box-shadow:0 4px 24px rgba(16,185,129,0.08),0 1px 3px rgba(0,0,0,0.04);
          display:flex;flex-direction:column;overflow:hidden;
        }
        .prog-track{height:4px;background:var(--gl);}
        .prog-fill{height:100%;background:linear-gradient(90deg,var(--g),var(--gd));transition:width 0.5s cubic-bezier(.4,0,.2,1);border-radius:0 4px 4px 0;}
        .card-body{padding:34px 38px;flex:1;}

        /* step header */
        .shead{margin-bottom:26px;}
        .shead-pill{display:inline-block;font-size:12px;font-weight:700;color:var(--gd);background:var(--gl);padding:3px 11px;border-radius:20px;letter-spacing:0.3px;margin-bottom:10px;}
        .shead-title{font-size:22px;font-weight:800;letter-spacing:-0.4px;color:var(--tx);margin-bottom:5px;}
        .shead-sub{font-size:13.5px;color:var(--mu);line-height:1.55;}

        /* fields */
        .fields{display:flex;flex-direction:column;gap:18px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .anim{animation:fadeUp 0.3s ease both;}
        .r2{display:flex;gap:14px;}
        .r2>*{flex:1;}

        /* field wrap */
        .field-wrap{display:flex;flex-direction:column;gap:7px;}
        .field-wrap.indent{padding-left:16px;border-left:3px solid var(--gl);}
        .field-label{font-size:13px;font-weight:600;color:var(--tx);}
        .field-unit{font-weight:400;color:var(--mu);font-size:12px;}
        .field-wrap input{
          padding:10px 13px;border:1.5px solid var(--bd);border-radius:10px;
          font-family:var(--ff);font-size:14px;color:var(--tx);background:var(--wh);
          outline:none;transition:border-color 0.2s,box-shadow 0.2s;
          -moz-appearance:textfield;
        }
        .field-wrap input::-webkit-inner-spin-button,.field-wrap input::-webkit-outer-spin-button{-webkit-appearance:none;}
        .field-wrap input::placeholder{color:#c5cdd6;}
        .field-wrap input:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(16,185,129,0.13);}

        /* seg */
        .seg{display:flex;gap:6px;}
        .seg button{
          flex:1;padding:9px 12px;border:1.5px solid var(--bd);border-radius:10px;
          background:var(--wh);cursor:pointer;font-family:var(--ff);font-size:13px;font-weight:500;
          color:var(--mu);transition:all 0.18s;
        }
        .seg button:hover{border-color:var(--gm);color:var(--tx);}
        .seg button.seg-on{background:var(--gl);border-color:var(--g);color:var(--gd);font-weight:700;}

        /* bmi */
        .bmi-row{
          display:inline-flex;align-items:center;gap:14px;
          padding:11px 16px;border-radius:12px;
          border:1.5px solid var(--bd);background:var(--bg);
        }
        .bmi-row.bmi-ok{border-color:var(--gm);background:var(--gl);}
        .bmi-row.bmi-warn{border-color:#fed7aa;background:#fff7ed;}
        .bmi-row.bmi-high{border-color:#fecaca;background:#fef2f2;}
        .bmi-row.bmi-low{border-color:#bfdbfe;background:#eff6ff;}
        .bmi-val{font-size:28px;font-weight:800;}
        .bmi-row.bmi-ok .bmi-val{color:var(--gd);}
        .bmi-row.bmi-warn .bmi-val{color:#ea580c;}
        .bmi-row.bmi-high .bmi-val{color:#dc2626;}
        .bmi-row.bmi-low .bmi-val{color:#2563eb;}
        .bmi-divider{width:1px;height:28px;background:var(--bd);}
        .bmi-label{font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:0.5px;}
        .bmi-cat{font-size:14px;font-weight:700;color:var(--tx);}

        /* info note */
        .info-note{
          display:flex;align-items:flex-start;gap:8px;
          font-size:12.5px;color:var(--mu);line-height:1.5;
          background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 13px;
        }
        .info-note svg{color:#3b82f6;flex-shrink:0;margin-top:1px;}

        /* tiles */
        .tile-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(115px,1fr));gap:8px;}
        .tile{
          display:flex;flex-direction:column;gap:3px;
          padding:10px 12px;text-align:left;
          border:1.5px solid var(--bd);border-radius:11px;
          background:var(--wh);cursor:pointer;transition:all 0.18s;
        }
        .tile:hover{border-color:var(--gm);background:var(--gl);}
        .tile.tile-on{border-color:var(--g);background:var(--gl);}
        .tile-name{font-size:13px;font-weight:600;color:var(--tx);}
        .tile-desc{font-size:11px;color:var(--mu);line-height:1.3;}
        .tile.tile-on .tile-name{color:var(--gd);}

        /* stress */
        .stress-row{display:flex;gap:5px;}
        .stbtn{
          flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
          padding:8px 3px;border:1.5px solid var(--bd);border-radius:10px;
          background:var(--wh);cursor:pointer;transition:all 0.18s;
        }
        .stbtn:hover{border-color:var(--gm);}
        .stbtn.st-on{border-color:var(--g);background:var(--gl);}
        .stn{font-size:16px;font-weight:800;color:var(--tx);}
        .stl{font-size:9px;color:var(--mu);text-align:center;line-height:1.2;}
        .stbtn.st-on .stn{color:var(--gd);}

        /* footer */
        .card-footer{
          display:flex;align-items:center;justify-content:space-between;
          padding:18px 38px 26px;border-top:1px solid var(--bd);
        }
        .btn-back{
          display:flex;align-items:center;gap:5px;
          padding:10px 18px;border-radius:10px;border:1.5px solid var(--bd);background:var(--wh);
          font-family:var(--ff);font-size:14px;font-weight:500;color:var(--mu);cursor:pointer;transition:all 0.18s;
        }
        .btn-back:hover{border-color:#9ca3af;color:var(--tx);}
        .btn-next{
          display:flex;align-items:center;gap:6px;
          padding:11px 26px;border-radius:10px;border:none;
          background:var(--g);color:#fff;
          font-family:var(--ff);font-size:14px;font-weight:700;cursor:pointer;
          box-shadow:0 4px 14px rgba(16,185,129,0.35);transition:all 0.2s;
        }
        .btn-next:hover{background:var(--gd);transform:translateY(-1px);box-shadow:0 6px 18px rgba(16,185,129,0.4);}
        .btn-submit{
          display:flex;align-items:center;
          padding:11px 26px;border-radius:10px;border:none;
          background:var(--g);color:#fff;
          font-family:var(--ff);font-size:14px;font-weight:700;cursor:pointer;
          box-shadow:0 4px 14px rgba(16,185,129,0.35);transition:all 0.2s;
        }
        .btn-submit:hover:not(:disabled){background:var(--gd);transform:translateY(-1px);}
        .btn-submit:disabled{opacity:0.6;cursor:not-allowed;}
        .spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;animation:spin 0.75s linear infinite;flex-shrink:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .err-box{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:11px 14px;font-size:13px;color:#dc2626;text-align:center;}

        @media(max-width:740px){
          .sidebar{display:none;}
          .layout{padding:20px 14px 40px;}
          .card-body{padding:22px 18px;}
          .card-footer{padding:16px 18px 22px;}
          .r2{flex-direction:column;}
          .topnav{padding:0 16px;}
        }
      `}</style>
    </div>
  );
}