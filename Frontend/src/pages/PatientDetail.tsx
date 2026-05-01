import { useState, useEffect } from "react";
import { Heart, ArrowLeft, Save, User, Activity, Dumbbell, Stethoscope, AlertTriangle, CheckCircle, FileText, Pencil } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:5000";
const token = () => sessionStorage.getItem("access_token");
const api = (path: string, opts: RequestInit = {}) =>
  fetch(`${API}${path}`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, ...opts });

type Health = {
  age: number; gender: string; height_cm: number; weight_kg: number; bmi: number;
  resting_heart_rate: number; systolic_bp: number; diastolic_bp: number;
  cholesterol_level: number; blood_glucose: number;
  smoker: boolean; cigarettes_per_day: number; alcohol_drinker: boolean; drinks_per_week: number;
  fitness_level: string; hours_sleep: number; stress_level: number;
  diabetes: boolean; hypertension: boolean; family_heart_disease: boolean;
  previous_heart_attack: boolean; chest_pain_type: string;
  created_at: string; updated_at: string;
};
type Patient = { id: number; name: string; email: string };

const FITNESS_LABELS: Record<string, string> = {
  sedentary: "Sedentary", light: "Light", moderate: "Moderate",
  active: "Active", very_active: "Very Active",
};
const CP_LABELS: Record<string, string> = {
  none: "None", typical_angina: "Typical Angina",
  atypical_angina: "Atypical Angina", non_anginal: "Non-Anginal",
  asymptomatic: "Asymptomatic",
};

function Pill({ val, yes = "Yes", no = "No" }: { val: boolean; yes?: string; no?: string }) {
  return (
    <span className={`pill ${val ? "pill-yes" : "pill-no"}`}>
      {val ? yes : no}
    </span>
  );
}

function VitalCard({ label, value, unit, normal, warn }: {
  label: string; value: string | number | null; unit?: string; normal?: boolean; warn?: boolean;
}) {
  return (
    <div className={`vital-card ${warn ? "vital-warn" : normal ? "vital-ok" : ""}`}>
      <div className="vital-lbl">{label}</div>
      <div className="vital-val">
        {value ?? "—"}
        {value && unit && <span className="vital-unit"> {unit}</span>}
      </div>
    </div>
  );
}

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate      = useNavigate();

  const [patient, setPatient]   = useState<Patient | null>(null);
  const [health, setHealth]     = useState<Health | null>(null);
  const [relId, setRelId]       = useState<number | null>(null);
  const [notes, setNotes]       = useState("");
  const [editNotes, setEditNotes] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => { load(); }, [patientId]);

  const load = async () => {
    setLoading(true);
    const res  = await api(`/doctors/patients/${patientId}`);
    const data = await res.json();
    if (!res.ok) { setError(data.message || "Access denied"); setLoading(false); return; }
    setPatient(data.patient);
    setHealth(data.health_details);
    setRelId(data.relationship_id);
    setNotes(data.notes || "");
    setLoading(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    await api(`/doctors/patients/${patientId}/notes`, {
      method: "PUT", body: JSON.stringify({ notes }),
    });
    setSaving(false); setSaved(true); setEditNotes(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const removePatient = async () => {
    if (!confirm(`Remove ${patient?.name} from your patient list?`)) return;
    await api(`/doctors/patients/${patientId}/remove`, { method: "DELETE" });
    navigate("/doctor/dashboard");
  };

  if (loading) return <div className="root"><div className="dot-bg"/><div className="loading">Loading patient data…</div></div>;
  if (error)   return <div className="root"><div className="dot-bg"/><div className="loading error">{error}</div></div>;

  const bmiClass = !health?.bmi ? "" :
    health.bmi < 18.5 ? "vital-info" :
    health.bmi < 25   ? "vital-ok"  :
    health.bmi < 30   ? "vital-warn" : "vital-err";

  const riskFlags = [
    health?.systolic_bp       && health.systolic_bp > 140       ? "High Blood Pressure"    : null,
    health?.cholesterol_level && health.cholesterol_level > 240 ? "High Cholesterol"       : null,
    health?.diabetes                                             ? "Diabetes"               : null,
    health?.hypertension                                         ? "Hypertension"           : null,
    health?.smoker                                               ? "Smoker"                 : null,
    health?.previous_heart_attack                                ? "Prior Heart Attack"     : null,
    health?.family_heart_disease                                 ? "Family Heart Disease"   : null,
    health?.bmi && health.bmi > 30                               ? "Obesity"                : null,
  ].filter(Boolean) as string[];

  return (
    <div className="root">
      <div className="dot-bg" />

      {/* Top nav */}
      <nav className="topnav">
        <Link to="/doctor/dashboard" className="nav-back">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <Link to="/" className="nav-logo">
          <Heart className="nav-hrt" /> CardioSense
        </Link>
        <span className="nav-role">Doctor Portal</span>
      </nav>

      <div className="page-wrap">

        {/* Patient header */}
        <div className="patient-header">
          <div className="ph-avatar">{patient?.name[0]?.toUpperCase()}</div>
          <div className="ph-info">
            <h1 className="ph-name">{patient?.name}</h1>
            <div className="ph-email">{patient?.email}</div>
            {health && (
              <div className="ph-meta">
                <span>Age {health.age}</span>
                <span>{health.gender.charAt(0).toUpperCase() + health.gender.slice(1)}</span>
                {health.bmi && <span>BMI {health.bmi.toFixed(1)}</span>}
              </div>
            )}
          </div>
          <div className="ph-actions">
            <button className="btn-remove" onClick={removePatient}>Remove Patient</button>
          </div>
        </div>

        {/* Risk flags */}
        {riskFlags.length > 0 && (
          <div className="risk-banner">
            <AlertTriangle size={16} className="risk-icon" />
            <span className="risk-title">Risk Factors:</span>
            <div className="risk-flags">
              {riskFlags.map(f => <span key={f} className="risk-flag">{f}</span>)}
            </div>
          </div>
        )}

        {!health ? (
          <div className="no-profile">
            <Stethoscope size={32} />
            <p>This patient hasn't completed their health profile yet.</p>
          </div>
        ) : (
          <div className="sections">

            {/* Personal & Vitals */}
            <div className="card">
              <div className="card-head"><User size={15} /> Personal & Vitals</div>
              <div className="vitals-grid">
                <VitalCard label="Resting Heart Rate" value={health.resting_heart_rate} unit="bpm"
                  warn={!!health.resting_heart_rate && health.resting_heart_rate > 100}
                  normal={!!health.resting_heart_rate && health.resting_heart_rate <= 100} />
                <VitalCard label="Systolic BP" value={health.systolic_bp} unit="mmHg"
                  warn={!!health.systolic_bp && health.systolic_bp > 140}
                  normal={!!health.systolic_bp && health.systolic_bp <= 120} />
                <VitalCard label="Diastolic BP" value={health.diastolic_bp} unit="mmHg"
                  warn={!!health.diastolic_bp && health.diastolic_bp > 90} />
                <VitalCard label="Cholesterol" value={health.cholesterol_level} unit="mg/dL"
                  warn={!!health.cholesterol_level && health.cholesterol_level > 240}
                  normal={!!health.cholesterol_level && health.cholesterol_level < 200} />
                <VitalCard label="Blood Glucose" value={health.blood_glucose} unit="mg/dL"
                  warn={!!health.blood_glucose && health.blood_glucose > 125} />
                <div className={`vital-card ${bmiClass}`}>
                  <div className="vital-lbl">BMI</div>
                  <div className="vital-val">
                    {health.bmi?.toFixed(1) ?? "—"}
                    <span className="vital-unit"> {
                      !health.bmi ? "" :
                      health.bmi < 18.5 ? "Underweight" :
                      health.bmi < 25   ? "Normal"      :
                      health.bmi < 30   ? "Overweight"  : "Obese"
                    }</span>
                  </div>
                </div>
                <VitalCard label="Height" value={health.height_cm} unit="cm" />
                <VitalCard label="Weight" value={health.weight_kg} unit="kg" />
              </div>
            </div>

            {/* Lifestyle */}
            <div className="card">
              <div className="card-head"><Dumbbell size={15} /> Lifestyle</div>
              <div className="info-grid">
                <InfoRow label="Smoker" value={<Pill val={health.smoker} />} />
                {health.smoker && <InfoRow label="Cigarettes/day" value={health.cigarettes_per_day} />}
                <InfoRow label="Alcohol" value={<Pill val={health.alcohol_drinker} />} />
                {health.alcohol_drinker && <InfoRow label="Drinks/week" value={health.drinks_per_week} />}
                <InfoRow label="Fitness Level" value={FITNESS_LABELS[health.fitness_level] || health.fitness_level} />
                <InfoRow label="Sleep" value={health.hours_sleep ? `${health.hours_sleep}h / night` : "—"} />
                <InfoRow label="Stress Level" value={health.stress_level ? `${health.stress_level} / 5` : "—"} />
              </div>
            </div>

            {/* Medical history */}
            <div className="card">
              <div className="card-head"><Stethoscope size={15} /> Medical History</div>
              <div className="info-grid">
                <InfoRow label="Diabetes"              value={<Pill val={health.diabetes} />} />
                <InfoRow label="Hypertension"          value={<Pill val={health.hypertension} />} />
                <InfoRow label="Family Heart Disease"  value={<Pill val={health.family_heart_disease} />} />
                <InfoRow label="Previous Heart Attack" value={<Pill val={health.previous_heart_attack} />} />
                <InfoRow label="Chest Pain Type"       value={CP_LABELS[health.chest_pain_type] || health.chest_pain_type || "None"} />
              </div>
            </div>

            {/* Doctor notes */}
            <div className="card">
              <div className="card-head">
                <FileText size={15} /> Private Notes
                <span className="notes-private">Only you can see these</span>
                {!editNotes && (
                  <button className="btn-edit-notes" onClick={() => setEditNotes(true)}>
                    <Pencil size={12} /> Edit
                  </button>
                )}
              </div>
              {editNotes ? (
                <div className="notes-edit">
                  <textarea
                    className="notes-ta"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add clinical notes about this patient…"
                    rows={5}
                  />
                  <div className="notes-btns">
                    <button className="btn-cancel-notes" onClick={() => setEditNotes(false)}>Cancel</button>
                    <button className="btn-save-notes" onClick={saveNotes} disabled={saving}>
                      <Save size={13} /> {saving ? "Saving…" : "Save Notes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="notes-view">
                  {notes ? <p>{notes}</p> : <p className="notes-empty">No notes yet. Click Edit to add notes.</p>}
                </div>
              )}
              {saved && (
                <div className="save-toast"><CheckCircle size={13} /> Notes saved successfully</div>
              )}
            </div>

            {/* Record dates */}
            <div className="dates-row">
              <span>Profile created: {new Date(health.created_at).toLocaleDateString()}</span>
              <span>Last updated: {new Date(health.updated_at).toLocaleDateString()}</span>
            </div>

          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--g:#10b981;--gd:#059669;--gl:#d1fae5;--gm:#a7f3d0;--tx:#111827;--mu:#6b7280;--bd:#e5e7eb;--bg:#f9fafb;--wh:#fff;--ff:'Outfit',sans-serif;}
        a{text-decoration:none;color:inherit;}

        .root{min-height:100vh;background:var(--bg);font-family:var(--ff);color:var(--tx);position:relative;}
        .dot-bg{position:fixed;inset:0;pointer-events:none;background-image:radial-gradient(circle,#bbf7d0 1px,transparent 1px);background-size:26px 26px;opacity:0.5;}
        .loading{display:flex;align-items:center;justify-content:center;height:80vh;font-size:15px;color:var(--mu);}
        .error{color:#dc2626;}

        /* Nav */
        .topnav{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:16px;padding:0 32px;height:60px;background:rgba(255,255,255,0.9);backdrop-filter:blur(14px);border-bottom:1px solid var(--bd);}
        .nav-back{display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:500;color:var(--mu);transition:color 0.18s;}
        .nav-back:hover{color:var(--tx);}
        .nav-logo{display:flex;align-items:center;gap:7px;font-weight:700;font-size:16px;color:var(--tx);margin:0 auto;}
        .nav-hrt{color:var(--g);fill:var(--g);width:18px;height:18px;animation:hb 1.4s ease-in-out infinite;}
        @keyframes hb{0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.15)}56%{transform:scale(1)}}
        .nav-role{font-size:12px;font-weight:600;color:var(--gd);background:var(--gl);padding:3px 10px;border-radius:20px;}

        /* Page */
        .page-wrap{max-width:800px;margin:0 auto;padding:32px 24px 60px;position:relative;z-index:1;}

        /* Patient header */
        .patient-header{display:flex;align-items:center;gap:18px;background:var(--wh);border:1px solid var(--bd);border-radius:20px;padding:24px 28px;margin-bottom:16px;box-shadow:0 2px 12px rgba(16,185,129,0.06);}
        .ph-avatar{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--g),var(--gd));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:24px;flex-shrink:0;}
        .ph-info{flex:1;}
        .ph-name{font-size:22px;font-weight:800;letter-spacing:-0.4px;color:var(--tx);}
        .ph-email{font-size:13px;color:var(--mu);margin:3px 0 8px;}
        .ph-meta{display:flex;gap:12px;font-size:13px;color:var(--mu);}
        .ph-meta span::after{content:"·";margin-left:12px;}
        .ph-meta span:last-child::after{content:"";}
        .ph-actions{flex-shrink:0;}
        .btn-remove{padding:8px 16px;border-radius:8px;border:1.5px solid #fecaca;background:#fef2f2;color:#dc2626;font-family:var(--ff);font-size:13px;font-weight:600;cursor:pointer;transition:all 0.18s;}
        .btn-remove:hover{background:#fee2e2;}

        /* Risk banner */
        .risk-banner{display:flex;align-items:center;flex-wrap:wrap;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px 18px;margin-bottom:16px;}
        .risk-icon{color:#dc2626;flex-shrink:0;}
        .risk-title{font-size:13px;font-weight:700;color:#dc2626;}
        .risk-flags{display:flex;flex-wrap:wrap;gap:6px;}
        .risk-flag{font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:rgba(220,38,38,0.1);color:#dc2626;border:1px solid #fecaca;}

        /* No profile */
        .no-profile{display:flex;flex-direction:column;align-items:center;gap:12px;padding:48px;background:var(--wh);border:1px solid var(--bd);border-radius:16px;color:var(--mu);}

        /* Sections */
        .sections{display:flex;flex-direction:column;gap:16px;}
        .card{background:var(--wh);border:1px solid var(--bd);border-radius:16px;overflow:hidden;}
        .card-head{display:flex;align-items:center;gap:8px;padding:16px 20px;border-bottom:1px solid var(--bd);font-size:14px;font-weight:700;color:var(--tx);}

        /* Vitals grid */
        .vitals-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--bd);}
        .vital-card{background:var(--wh);padding:16px;display:flex;flex-direction:column;gap:4px;}
        .vital-card.vital-ok{background:#f0fdf4;}
        .vital-card.vital-warn{background:#fff7ed;}
        .vital-card.vital-err{background:#fef2f2;}
        .vital-card.vital-info{background:#eff6ff;}
        .vital-lbl{font-size:11px;font-weight:600;color:var(--mu);text-transform:uppercase;letter-spacing:0.5px;}
        .vital-val{font-size:20px;font-weight:800;color:var(--tx);letter-spacing:-0.3px;}
        .vital-card.vital-ok .vital-val{color:#16a34a;}
        .vital-card.vital-warn .vital-val{color:#ea580c;}
        .vital-card.vital-err .vital-val{color:#dc2626;}
        .vital-card.vital-info .vital-val{color:#2563eb;}
        .vital-unit{font-size:12px;font-weight:400;color:var(--mu);}

        /* Info grid */
        .info-grid{display:flex;flex-direction:column;}

        /* Notes */
        .notes-private{font-size:11px;font-weight:500;color:var(--mu);background:var(--bg);padding:2px 8px;border-radius:20px;margin-left:4px;}
        .btn-edit-notes{margin-left:auto;display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:7px;border:1.5px solid var(--bd);background:var(--wh);font-family:var(--ff);font-size:12px;font-weight:500;color:var(--mu);cursor:pointer;transition:all 0.18s;}
        .btn-edit-notes:hover{border-color:var(--g);color:var(--gd);}
        .notes-edit{padding:16px 20px;display:flex;flex-direction:column;gap:12px;}
        .notes-ta{width:100%;padding:12px;border:1.5px solid var(--bd);border-radius:10px;font-family:var(--ff);font-size:14px;color:var(--tx);resize:vertical;outline:none;transition:border-color 0.2s;}
        .notes-ta:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(16,185,129,0.12);}
        .notes-btns{display:flex;gap:8px;justify-content:flex-end;}
        .btn-cancel-notes{padding:8px 16px;border-radius:8px;border:1.5px solid var(--bd);background:var(--wh);font-family:var(--ff);font-size:13px;font-weight:500;color:var(--mu);cursor:pointer;}
        .btn-save-notes{display:flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;border:none;background:var(--g);color:#fff;font-family:var(--ff);font-size:13px;font-weight:600;cursor:pointer;transition:background 0.18s;}
        .btn-save-notes:hover:not(:disabled){background:var(--gd);}
        .btn-save-notes:disabled{opacity:0.6;cursor:not-allowed;}
        .notes-view{padding:16px 20px;}
        .notes-view p{font-size:14px;color:var(--tx);line-height:1.6;white-space:pre-wrap;}
        .notes-empty{color:var(--mu) !important;}
        .save-toast{display:flex;align-items:center;gap:6px;padding:10px 20px;border-top:1px solid var(--bd);font-size:13px;color:var(--gd);background:#f0fdf4;}

        /* Dates */
        .dates-row{display:flex;justify-content:space-between;font-size:12px;color:var(--mu);padding:0 4px;}

        @media(max-width:640px){
          .vitals-grid{grid-template-columns:repeat(2,1fr);}
          .patient-header{flex-wrap:wrap;}
          .ph-actions{width:100%;}
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="info-row">
      <span className="ir-label">{label}</span>
      <span className="ir-value">{value}</span>
      <style>{`
        .info-row{display:flex;align-items:center;justify-content:space-between;padding:11px 20px;border-bottom:1px solid var(--bd);}
        .info-row:last-child{border-bottom:none;}
        .ir-label{font-size:13.5px;color:var(--mu);font-weight:500;}
        .ir-value{font-size:13.5px;font-weight:600;color:var(--tx);}
        .pill{display:inline-block;font-size:12px;font-weight:600;padding:2px 10px;border-radius:20px;}
        .pill-yes{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;}
        .pill-no{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;}
      `}</style>
    </div>
  );
}