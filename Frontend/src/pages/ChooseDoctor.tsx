import { useState, useEffect } from "react";
import { Heart, Search, UserCheck, Clock, CheckCircle, XCircle, Send, ArrowLeft, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000";
const token = () => sessionStorage.getItem("access_token");
const api = (path: string, opts: RequestInit = {}) =>
  fetch(`${API}${path}`, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, ...opts });

type Doctor = { id: number; name: string; email: string; patient_count: number };
type Relationship = {
  id: number; status: string;
  doctor: { id: number; name: string; email: string };
  created_at: string;
};

export default function ChooseDoctor() {
  const [doctors, setDoctors]       = useState<Doctor[]>([]);
  const [myDoctors, setMyDoctors]   = useState<Relationship[]>([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [requesting, setRequesting] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [toast, setToast]           = useState("");
  const navigate = useNavigate();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [dl, ml] = await Promise.all([
      api("/doctors/list").then(r => r.json()),
      api("/doctors/my-doctor").then(r => r.json()),
    ]);
    setDoctors(dl.doctors || []);
    setMyDoctors(ml.relationships || []);
    setLoading(false);
  };

  const sendRequest = async (doctorId: number) => {
    setRequesting(doctorId);
    const res  = await api("/doctors/request", { method: "POST", body: JSON.stringify({ doctor_id: doctorId }) });
    const data = await res.json();
    showToast(data.message || "Request sent!");
    await loadAll();
    setRequesting(null);
  };

  const cancelRequest = async (relId: number) => {
    setCancelling(relId);
    await api(`/doctors/request/${relId}`, { method: "DELETE" });
    showToast("Request cancelled.");
    await loadAll();
    setCancelling(null);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const relMap = Object.fromEntries(myDoctors.map(r => [r.doctor.id, r]));

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

  const StatusBadge = ({ rel }: { rel: Relationship }) => {
    if (rel.status === "accepted") return (
      <span className="badge badge-accepted"><CheckCircle size={12} /> Accepted</span>
    );
    if (rel.status === "pending") return (
      <span className="badge badge-pending"><Clock size={12} /> Pending</span>
    );
    if (rel.status === "rejected") return (
      <span className="badge badge-rejected"><XCircle size={12} /> Rejected</span>
    );
    return null;
  };

  return (
    <div className="root">
      <div className="dot-bg" />

      <nav className="topnav">
        <Link to="/dashboard" className="nav-back"><ArrowLeft size={16} /> Back to Dashboard</Link>
        <Link to="/" className="nav-logo">
          <Heart className="nav-hrt" /> CardioSense
        </Link>
        <span className="nav-spacer" />
      </nav>

      <div className="page-wrap">
        <div className="page-head">
          <h1 className="page-title">Choose Your Doctor</h1>
          <p className="page-sub">
            Select a doctor to manage your heart health. They'll be able to view your health profile and monitor your data.
          </p>
        </div>

        {/* Current doctors section */}
        {myDoctors.length > 0 && (
          <div className="my-doctors-section">
            <h2 className="section-title">Your Current Requests</h2>
            <div className="my-doctors-list">
              {myDoctors.map(rel => (
                <div key={rel.id} className={`my-doc-card status-${rel.status}`}>
                  <div className="mdc-left">
                    <div className="mdc-avatar">{rel.doctor.name[0].toUpperCase()}</div>
                    <div>
                      <div className="mdc-name">Dr. {rel.doctor.name}</div>
                      <div className="mdc-email">{rel.doctor.email}</div>
                      <div className="mdc-date">Since {new Date(rel.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="mdc-right">
                    <StatusBadge rel={rel} />
                    {rel.status === "accepted" && (
                      <button
                        className="btn-message"
                        onClick={() => navigate(`/messages?rel_id=${rel.id}`)}
                      >
                        <MessageCircle size={14} /> Message
                      </button>
                    )}
                    {rel.status !== "accepted" && (
                      <button
                        className="btn-cancel"
                        onClick={() => cancelRequest(rel.id)}
                        disabled={cancelling === rel.id}
                      >
                        {cancelling === rel.id ? "…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browse doctors */}
        <div className="browse-section">
          <div className="browse-head">
            <h2 className="section-title">Browse Doctors</h2>
            <div className="search-wrap">
              <Search size={14} className="si" />
              <input className="search-input" placeholder="Search by name or email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="empty">Loading doctors…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No doctors found{search ? ` for "${search}"` : ""}.</div>
          ) : (
            <div className="doctors-grid">
              {filtered.map(doc => {
                const rel = relMap[doc.id];
                return (
                  <div key={doc.id} className={`doc-card${rel?.status === "accepted" ? " doc-accepted" : ""}`}>
                    <div className="dc-top">
                      <div className="dc-avatar">{doc.name[0].toUpperCase()}</div>
                      <div className="dc-info">
                        <div className="dc-name">Dr. {doc.name}</div>
                        <div className="dc-email">{doc.email}</div>
                      </div>
                    </div>

                    <div className="dc-stat">
                      <UserCheck size={13} />
                      {doc.patient_count} active {doc.patient_count === 1 ? "patient" : "patients"}
                    </div>

                    <div className="dc-action">
                      {!rel ? (
                        <button className="btn-request" onClick={() => sendRequest(doc.id)}
                          disabled={requesting === doc.id}>
                          {requesting === doc.id ? (
                            <span className="spinner" />
                          ) : (
                            <><Send size={13} /> Request Doctor</>
                          )}
                        </button>
                      ) : rel.status === "accepted" ? (
                        <>
                          <div className="badge badge-accepted w-full"><CheckCircle size={13} /> Your Doctor</div>
                          <button
                            className="btn-message btn-message-primary"
                            onClick={() => navigate(`/messages?rel_id=${rel.id}`)}
                          >
                            <MessageCircle size={14} /> Send a Message
                          </button>
                        </>
                      ) : rel.status === "pending" ? (
                        <div className="badge badge-pending w-full"><Clock size={13} /> Request Pending</div>
                      ) : (
                        <button className="btn-request" onClick={() => sendRequest(doc.id)}
                          disabled={requesting === doc.id}>
                          <Send size={13} /> Re-request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--g:#10b981;--gd:#059669;--gl:#d1fae5;--gm:#a7f3d0;--tx:#111827;--mu:#6b7280;--bd:#e5e7eb;--bg:#f9fafb;--wh:#fff;--ff:'Outfit',sans-serif;}
        a{text-decoration:none;color:inherit;}

        .root{min-height:100vh;background:var(--bg);font-family:var(--ff);color:var(--tx);position:relative;}
        .dot-bg{position:fixed;inset:0;pointer-events:none;background-image:radial-gradient(circle,#bbf7d0 1px,transparent 1px);background-size:26px 26px;opacity:0.5;}

        .topnav{position:sticky;top:0;z-index:50;display:flex;align-items:center;padding:0 32px;height:60px;background:rgba(255,255,255,0.9);backdrop-filter:blur(14px);border-bottom:1px solid var(--bd);gap:16px;}
        .nav-back{display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:500;color:var(--mu);transition:color 0.18s;}
        .nav-back:hover{color:var(--tx);}
        .nav-logo{display:flex;align-items:center;gap:7px;font-weight:700;font-size:16px;color:var(--tx);margin:0 auto;}
        .nav-hrt{color:var(--g);fill:var(--g);width:18px;height:18px;animation:hb 1.4s ease-in-out infinite;}
        @keyframes hb{0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.15)}56%{transform:scale(1)}}
        .nav-spacer{width:120px;}

        .page-wrap{max-width:900px;margin:0 auto;padding:36px 24px 60px;position:relative;z-index:1;}
        .page-head{text-align:center;margin-bottom:36px;}
        .page-title{font-size:28px;font-weight:800;letter-spacing:-0.6px;color:var(--tx);margin-bottom:8px;}
        .page-sub{font-size:14px;color:var(--mu);max-width:480px;margin:0 auto;line-height:1.6;}
        .section-title{font-size:16px;font-weight:700;color:var(--tx);margin-bottom:14px;}

        .my-doctors-section{margin-bottom:36px;}
        .my-doctors-list{display:flex;flex-direction:column;gap:10px;}
        .my-doc-card{display:flex;align-items:center;justify-content:space-between;background:var(--wh);border:1.5px solid var(--bd);border-radius:14px;padding:16px 20px;transition:border-color 0.2s;}
        .my-doc-card.status-accepted{border-color:var(--gm);background:#f0fdf4;}
        .my-doc-card.status-pending{border-color:#fde68a;background:#fefce8;}
        .my-doc-card.status-rejected{border-color:#fecaca;background:#fef2f2;}
        .mdc-left{display:flex;align-items:center;gap:14px;}
        .mdc-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--g),var(--gd));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;flex-shrink:0;}
        .mdc-name{font-size:14px;font-weight:600;color:var(--tx);}
        .mdc-email{font-size:12px;color:var(--mu);margin:2px 0;}
        .mdc-date{font-size:11px;color:var(--mu);}
        .mdc-right{display:flex;align-items:center;gap:10px;}
        .btn-cancel{padding:6px 14px;border-radius:8px;border:1.5px solid var(--bd);background:var(--wh);font-family:var(--ff);font-size:12px;font-weight:500;color:var(--mu);cursor:pointer;transition:all 0.18s;}
        .btn-cancel:hover{border-color:#9ca3af;color:var(--tx);}

        .browse-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:16px;}
        .search-wrap{display:flex;align-items:center;gap:8px;background:var(--wh);border:1.5px solid var(--bd);border-radius:10px;padding:9px 14px;width:280px;}
        .si{color:var(--mu);flex-shrink:0;}
        .search-input{border:none;outline:none;font-family:var(--ff);font-size:14px;color:var(--tx);background:transparent;width:100%;}
        .search-input::placeholder{color:#c5cdd6;}
        .empty{padding:48px;text-align:center;color:var(--mu);font-size:14px;background:var(--wh);border:1px solid var(--bd);border-radius:16px;}

        .doctors-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
        .doc-card{background:var(--wh);border:1.5px solid var(--bd);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:14px;transition:all 0.2s;}
        .doc-card:hover{box-shadow:0 4px 20px rgba(16,185,129,0.1);border-color:var(--gm);}
        .doc-card.doc-accepted{border-color:var(--g);background:#f0fdf4;}
        .dc-top{display:flex;align-items:center;gap:12px;}
        .dc-avatar{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--g),var(--gd));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;flex-shrink:0;}
        .dc-name{font-size:14px;font-weight:700;color:var(--tx);}
        .dc-email{font-size:12px;color:var(--mu);margin-top:2px;}
        .dc-stat{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--mu);}
        .dc-action{display:flex;flex-direction:column;gap:8px;}

        .badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;}
        .badge.w-full{width:100%;justify-content:center;}
        .badge-accepted{background:#d1fae5;color:#065f46;}
        .badge-pending{background:#fef3c7;color:#92400e;}
        .badge-rejected{background:#fef2f2;color:#dc2626;}

        .btn-request{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:9px;border-radius:8px;border:none;background:var(--g);color:#fff;font-family:var(--ff);font-size:13px;font-weight:600;cursor:pointer;transition:all 0.18s;box-shadow:0 2px 8px rgba(16,185,129,0.25);}
        .btn-request:hover:not(:disabled){background:var(--gd);transform:translateY(-1px);}
        .btn-request:disabled{opacity:0.6;cursor:not-allowed;}

        /* Enhanced message button styles */
        .btn-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 20px;
          border: 1px solid var(--g);
          background: white;
          color: var(--gd);
          font-family: var(--ff);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .btn-message:hover {
          background: var(--gl);
          border-color: var(--gd);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(16,185,129,0.15);
        }
        .btn-message:active {
          transform: translateY(0);
        }
        /* Primary variant for grid cards */
        .btn-message-primary {
          background: linear-gradient(100deg, #ecfdf5, #d1fae5);
          border: none;
          padding: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #065f46;
          box-shadow: 0 2px 6px rgba(16,185,129,0.2);
        }
        .btn-message-primary:hover {
          background: linear-gradient(100deg, #d1fae5, #a7f3d0);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(16,185,129,0.2);
        }

        .spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;animation:spin 0.7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}

        .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--tx);color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:500;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,0.15);animation:slideUp 0.3s ease;}
        @keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

        @media(max-width:700px){
          .doctors-grid{grid-template-columns:repeat(2,1fr);}
          .browse-head{flex-direction:column;align-items:flex-start;}
          .search-wrap{width:100%;}
        }
        @media(max-width:480px){
          .doctors-grid{grid-template-columns:1fr;}
        }
      `}</style>
    </div>
  );
}