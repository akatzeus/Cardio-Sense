import { useState, useEffect } from "react";
import { Heart, Users, Clock, AlertTriangle, Search, ChevronRight, CheckCircle, XCircle, Bell, LogOut, User, FileText, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

const token = () => sessionStorage.getItem("access_token");
const api = (path: string, opts: RequestInit = {}) =>
  fetch(`${API}${path}`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, ...opts });

type Stats = { total_patients: number; pending_requests: number; high_risk_count: number; low_risk_count: number };
type Request = { id: number; patient: { id: number; name: string; email: string }; created_at: string };
type Patient = {
  relationship_id: number;
  patient: { id: number; name: string; email: string };
  vitals_summary: { age: number; bmi: number; systolic_bp: number; resting_heart_rate: number; risk_flags: string[] };
  has_health_profile: boolean;
  assigned_since: string;
  notes: string;
};

export default function DoctorDashboard() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"patients" | "requests">("patients");
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [s, p, r] = await Promise.all([
      api("/doctors/dashboard/stats").then(r => r.json()),
      api("/doctors/patients").then(r => r.json()),
      api("/doctors/requests?status=pending").then(r => r.json()),
    ]);
    setStats(s);
    setPatients(p.patients || []);
    setRequests(r.requests || []);
    setLoading(false);
  };

  const respond = async (id: number, action: "accept" | "reject") => {
    await api(`/doctors/requests/${id}`, { method: "PUT", body: JSON.stringify({ action }) });
    loadAll();
  };

  const logout = () => { sessionStorage.clear(); navigate("/auth"); };

  const filtered = patients.filter(p =>
    p.patient.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="root">
      <div className="dot-bg" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sb-top">
          <Link to="/" className="sb-logo">
            <Heart className="sb-hrt" />
            <span>CardioSense</span>
          </Link>
          <div className="sb-role">Doctor Portal</div>
        </div>

        <nav className="sb-nav">
          {[
            { icon: Users, label: "Dashboard", to: "/doctor/dashboard", active: true }
          ].map(({ icon: Icon, label, to, active }) => (
            <Link key={label} to={to} className={`sb-link${active ? " sb-link-on" : ""}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        <div className="sb-user">
          <div className="sb-avatar">{user.name?.[0]?.toUpperCase() || "D"}</div>
          <div className="sb-uinfo">
            <div className="sb-uname">{user.name || "Doctor"}</div>
            <div className="sb-uemail">{user.email || ""}</div>
          </div>
          <button className="sb-logout" onClick={logout} title="Logout"><LogOut size={15} /></button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Good morning, Dr. {user.name?.split(" ")[0] || "Doctor"} 👋</h1>
            <p className="page-sub">Here's your patient overview for today</p>
          </div>
          {requests.length > 0 && (
            <div className="notif-badge">
              <Bell size={15} />
              {requests.length} pending {requests.length === 1 ? "request" : "requests"}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="stats-row">
          {[
            { label: "Total Patients",   value: stats?.total_patients  ?? "—", icon: Users,         color: "#10b981", bg: "#d1fae5" },
            { label: "Pending Requests", value: stats?.pending_requests ?? "—", icon: Clock,         color: "#f59e0b", bg: "#fef3c7" },
            { label: "High Risk",        value: stats?.high_risk_count  ?? "—", icon: AlertTriangle, color: "#ef4444", bg: "#fef2f2" },
            { label: "Low Risk",         value: stats?.low_risk_count   ?? "—", icon: CheckCircle,   color: "#10b981", bg: "#d1fae5" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div className="stat-card" key={label}>
              <div className="stat-icon" style={{ background: bg, color }}><Icon size={18} /></div>
              <div className="stat-val">{loading ? "…" : value}</div>
              <div className="stat-lbl">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs-row">
          <button className={`tab-btn${tab === "patients" ? " tab-on" : ""}`} onClick={() => setTab("patients")}>
            <Users size={14} /> My Patients ({patients.length})
          </button>
          <button className={`tab-btn${tab === "requests" ? " tab-on" : ""}`} onClick={() => setTab("requests")}>
            <Clock size={14} /> Pending Requests
            {requests.length > 0 && <span className="tab-dot">{requests.length}</span>}
          </button>
        </div>

        {/* Patients tab */}
        {tab === "patients" && (
          <div className="section">
            <div className="search-row">
              <Search size={15} className="search-icon" />
              <input className="search-input" placeholder="Search patients by name or email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
              <div className="empty-state">Loading patients…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                {search ? "No patients match your search." : "No patients yet. Accept requests to add patients."}
              </div>
            ) : (
              <div className="patient-list">
                {filtered.map(p => (
                  <div key={p.relationship_id} className="patient-card">
                    <div className="pc-left">
                      <div className="pc-avatar">{p.patient.name[0].toUpperCase()}</div>
                      <div className="pc-info">
                        <div className="pc-name">{p.patient.name}</div>
                        <div className="pc-email">{p.patient.email}</div>
                        <div className="pc-meta">
                          {p.vitals_summary.age && <span>Age {p.vitals_summary.age}</span>}
                          {p.vitals_summary.bmi && <span>BMI {p.vitals_summary.bmi?.toFixed(1)}</span>}
                          {p.vitals_summary.systolic_bp && <span>BP {p.vitals_summary.systolic_bp} mmHg</span>}
                        </div>
                        <div className="pc-flags">
                          {p.vitals_summary.risk_flags?.slice(0, 3).map(f => (
                            <span key={f} className="flag">{f}</span>
                          ))}
                          {(p.vitals_summary.risk_flags?.length || 0) > 3 && (
                            <span className="flag flag-more">+{p.vitals_summary.risk_flags.length - 3} more</span>
                          )}
                          {!p.has_health_profile && <span className="flag flag-warn">No health profile</span>}
                        </div>
                      </div>
                    </div>
                    <div className="pc-actions">
                      {/* Message button */}
                      <button
                        className="btn-message"
                        onClick={() => navigate(`/messages?rel_id=${p.relationship_id}`)}
                        title="Send a message"
                      >
                        <MessageCircle size={16} />
                        <span>Message</span>
                      </button>
                      {/* Patient detail link */}
                      <Link to={`/doctor/patients/${p.patient.id}`} className="btn-detail">
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests tab (unchanged) */}
        {tab === "requests" && (
          <div className="section">
            {loading ? (
              <div className="empty-state">Loading requests…</div>
            ) : requests.length === 0 ? (
              <div className="empty-state">No pending requests at the moment.</div>
            ) : (
              <div className="req-list">
                {requests.map(r => (
                  <div key={r.id} className="req-card">
                    <div className="req-left">
                      <div className="pc-avatar">{r.patient.name[0].toUpperCase()}</div>
                      <div>
                        <div className="pc-name">{r.patient.name}</div>
                        <div className="pc-email">{r.patient.email}</div>
                        <div className="req-time">Requested {new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="req-actions">
                      <button className="btn-accept" onClick={() => respond(r.id, "accept")}>
                        <CheckCircle size={14} /> Accept
                      </button>
                      <button className="btn-reject" onClick={() => respond(r.id, "reject")}>
                        <XCircle size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--g:#10b981;--gd:#059669;--gl:#d1fae5;--gm:#a7f3d0;--tx:#111827;--mu:#6b7280;--bd:#e5e7eb;--bg:#f9fafb;--wh:#fff;--ff:'Outfit',sans-serif;}
        a{text-decoration:none;color:inherit;}

        .root{min-height:100vh;background:var(--bg);font-family:var(--ff);color:var(--tx);display:flex;position:relative;}
        .dot-bg{position:fixed;inset:0;pointer-events:none;background-image:radial-gradient(circle,#bbf7d0 1px,transparent 1px);background-size:26px 26px;opacity:0.5;}

        /* Sidebar (unchanged) */
        .sidebar{width:240px;flex-shrink:0;background:var(--wh);border-right:1px solid var(--bd);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;z-index:20;}
        .sb-top{padding:24px 20px 16px;}
        .sb-logo{display:flex;align-items:center;gap:8px;font-weight:700;font-size:16px;color:var(--tx);margin-bottom:6px;}
        .sb-hrt{color:var(--g);fill:var(--g);width:18px;height:18px;animation:hb 1.4s ease-in-out infinite;}
        @keyframes hb{0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.15)}56%{transform:scale(1)}}
        .sb-role{font-size:11px;font-weight:600;color:var(--gd);background:var(--gl);padding:2px 10px;border-radius:20px;display:inline-block;}
        .sb-nav{padding:8px 12px;flex:1;display:flex;flex-direction:column;gap:2px;}
        .sb-link{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;font-size:13.5px;font-weight:500;color:var(--mu);transition:all 0.18s;}
        .sb-link:hover{background:var(--bg);color:var(--tx);}
        .sb-link-on{background:var(--gl);color:var(--gd);font-weight:600;}
        .sb-user{padding:16px;border-top:1px solid var(--bd);display:flex;align-items:center;gap:10px;}
        .sb-avatar{width:34px;height:34px;border-radius:50%;background:var(--g);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;}
        .sb-uinfo{flex:1;min-width:0;}
        .sb-uname{font-size:13px;font-weight:600;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sb-uemail{font-size:11px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sb-logout{background:none;border:none;cursor:pointer;color:var(--mu);padding:4px;border-radius:6px;display:flex;align-items:center;transition:color 0.18s;}
        .sb-logout:hover{color:#ef4444;}

        /* Main */
        .main{flex:1;padding:36px 40px;max-width:960px;position:relative;z-index:1;}
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;}
        .page-title{font-size:24px;font-weight:800;letter-spacing:-0.5px;color:var(--tx);}
        .page-sub{font-size:14px;color:var(--mu);margin-top:4px;}
        .notif-badge{display:flex;align-items:center;gap:7px;background:#fef3c7;border:1px solid #fde68a;color:#92400e;font-size:13px;font-weight:600;padding:8px 14px;border-radius:20px;}

        /* Stats */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;}
        .stat-card{background:var(--wh);border:1px solid var(--bd);border-radius:16px;padding:20px 18px;display:flex;flex-direction:column;gap:8px;}
        .stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
        .stat-val{font-size:28px;font-weight:800;letter-spacing:-0.5px;color:var(--tx);}
        .stat-lbl{font-size:12px;color:var(--mu);font-weight:500;}

        /* Tabs */
        .tabs-row{display:flex;gap:6px;margin-bottom:20px;}
        .tab-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;border:1.5px solid var(--bd);background:var(--wh);font-family:var(--ff);font-size:13.5px;font-weight:500;color:var(--mu);cursor:pointer;transition:all 0.18s;position:relative;}
        .tab-btn:hover{border-color:var(--gm);color:var(--tx);}
        .tab-btn.tab-on{background:var(--gl);border-color:var(--g);color:var(--gd);font-weight:700;}
        .tab-dot{background:#ef4444;color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}

        /* Section */
        .section{background:var(--wh);border:1px solid var(--bd);border-radius:16px;overflow:hidden;}
        .search-row{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--bd);}
        .search-icon{color:var(--mu);}
        .search-input{flex:1;border:none;outline:none;font-family:var(--ff);font-size:14px;color:var(--tx);background:transparent;}
        .search-input::placeholder{color:#c5cdd6;}
        .empty-state{padding:48px;text-align:center;color:var(--mu);font-size:14px;}

        /* Patient list */
        .patient-list{display:flex;flex-direction:column;}
        .patient-card{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--bd);transition:background 0.15s;}
        .patient-card:last-child{border-bottom:none;}
        .patient-card:hover{background:var(--bg);}
        .pc-left{display:flex;align-items:flex-start;gap:14px;flex:1;}
        .pc-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--g),var(--gd));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;}
        .pc-name{font-size:14px;font-weight:600;color:var(--tx);margin-bottom:2px;}
        .pc-email{font-size:12px;color:var(--mu);margin-bottom:6px;}
        .pc-meta{display:flex;gap:10px;font-size:12px;color:var(--mu);margin-bottom:6px;}
        .pc-meta span::after{content:"·";margin-left:10px;}
        .pc-meta span:last-child::after{content:"";}
        .pc-flags{display:flex;flex-wrap:wrap;gap:5px;}
        .flag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;}
        .flag-warn{background:#fef9c3;color:#854d0e;border-color:#fde047;}
        .flag-more{background:var(--bg);color:var(--mu);border-color:var(--bd);}

        /* Action buttons on patient card */
        .pc-actions{display:flex;align-items:center;gap:10px;}
        .btn-message{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#ecfdf5;border:1px solid var(--g);border-radius:20px;font-size:12px;font-weight:600;color:var(--gd);cursor:pointer;transition:all 0.2s;}
        .btn-message:hover{background:var(--gl);transform:translateY(-1px);}
        .btn-detail{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:var(--bg);color:var(--mu);transition:all 0.18s;}
        .btn-detail:hover{background:var(--gm);color:var(--gd);}

        /* Requests (unchanged) */
        .req-list{display:flex;flex-direction:column;}
        .req-card{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--bd);}
        .req-card:last-child{border-bottom:none;}
        .req-left{display:flex;align-items:center;gap:14px;}
        .req-time{font-size:11px;color:var(--mu);margin-top:3px;}
        .req-actions{display:flex;gap:8px;}
        .btn-accept{display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:8px;border:none;background:var(--g);color:#fff;font-family:var(--ff);font-size:13px;font-weight:600;cursor:pointer;}
        .btn-accept:hover{background:var(--gd);}
        .btn-reject{display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:8px;border:1.5px solid #fecaca;background:#fef2f2;color:#dc2626;font-family:var(--ff);font-size:13px;font-weight:600;cursor:pointer;}
        .btn-reject:hover{background:#fee2e2;}

        @media(max-width:900px){
          .sidebar{display:none;}
          .main{padding:20px 16px;}
          .stats-row{grid-template-columns:repeat(2,1fr);}
          .pc-actions .btn-message span{display:none;} /* hide text on small screens */
          .btn-message{padding:8px;}
        }
      `}</style>
    </div>
  );
}