import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

const formatTags = (tags) => {
  if (Array.isArray(tags)) return tags.join(", ");
  if (typeof tags === "string") return tags;
  return "No tags";
};

export default function Validate() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [pending, setPending] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [priorityFlag, setPriorityFlag] = useState(false);
  const [actionNotice, setActionNotice] = useState("");

  const loadPending = async () => {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    const queue = Array.isArray(data) ? data.filter((item) => ["Pending", "Pending Validation"].includes(item.status)) : [];
    setPending(queue);
    if (queue.length && !selectedId) {
      setSelectedId(queue[0].id);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const selectedItem = useMemo(() => {
    if (!pending.length) return null;
    return pending.find((item) => item.id === selectedId) || pending[0];
  }, [pending, selectedId]);

  const handleDecision = async (decision) => {
    if (!selectedItem) return;

    await fetch(`/api/validate/${selectedItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: user.role, validator: user.username, decision }),
    });

    setActionNotice(`Decision saved: ${decision}.`);
    setPriorityFlag(false);
    setTimeout(() => setActionNotice(""), 2400);
    loadPending();
  };

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="page-main">
        <section className="page-panel">
          <div className="page-card">
            <div className="page-card__header">
              <div>
                <h2>Validate Knowledge</h2>
                <p className="muted">Knowledge Champion validation queue.</p>
              </div>
            </div>

            <div className="validate-grid">
              <div className="validate-list">
                <strong>Validation Queue</strong>
                {pending.map((item) => (
                  <button
                    key={item.id}
                    className={`validate-item ${selectedItem?.id === item.id ? "is-active" : ""}`}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="activity-item__title">{item.title}</span>
                    <span className="muted">by {item.author}</span>
                  </button>
                ))}
                {pending.length === 0 && <p className="muted">No pending items.</p>}
              </div>

              <div className="validate-detail">
                {selectedItem ? (
                  <>
                    <div>
                      <h3>{selectedItem.title}</h3>
                      <p className="muted">Submitted by {selectedItem.author}</p>
                    </div>
                    <p>{selectedItem.description}</p>
                    <div className="result-meta">
                      <span className="chip chip--filter">{formatTags(selectedItem.tags)}</span>
                      <span className="chip chip--filter">{selectedItem.project || "General"}</span>
                      <span className="chip chip--filter">{selectedItem.region || "Global"}</span>
                      <span className="chip chip--filter">{selectedItem.type || "General"}</span>
                    </div>

                    <label className="priority-flag">
                      <input
                        type="checkbox"
                        checked={priorityFlag}
                        onChange={(e) => setPriorityFlag(e.target.checked)}
                      />
                      Compliance flag
                      {priorityFlag && <span className="priority-flag__label">High priority</span>}
                    </label>

                    <div className="form-actions">
                      <button className="btn btn--primary" type="button" onClick={() => handleDecision("Approved")}>
                        Approve
                      </button>
                      <button className="btn btn--ghost" type="button" onClick={() => handleDecision("Rejected")}>Reject</button>
                      <button className="btn btn--secondary" type="button" onClick={() => handleDecision("Revision Requested")}>Request Revision</button>
                    </div>
                    {actionNotice && <span className="badge badge--soft">{actionNotice}</span>}
                  </>
                ) : (
                  <p className="muted">Select a pending item to review details.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

