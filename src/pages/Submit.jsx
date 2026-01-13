import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const supportedTypes = [
  "Playbook",
  "Checklist",
  "Template",
  "Lessons Learned",
  "Reference",
  "Procedure",
];

const projectOptions = ["Atlas", "Nova", "Orion", "Pulse"];
const regionOptions = ["Americas", "EMEA", "APAC", "Global"];

export default function Submit() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const canSubmit = user?.role === "Consultant";

  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: "",
    project: "",
    region: "",
    type: "",
    upload: null,
  });
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState("");

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const nextErrors = [];

    if (!form.title.trim()) nextErrors.push("Title is required.");
    if (!form.description.trim()) nextErrors.push("Description is required.");
    if (!form.tags.trim()) nextErrors.push("At least one tag is required.");
    if (!form.project) nextErrors.push("Project is required.");
    if (!form.region) nextErrors.push("Region is required.");
    if (!form.type) nextErrors.push("Type is required.");
    if (form.type && !supportedTypes.includes(form.type)) {
      nextErrors.push("Unsupported knowledge type selected.");
    }

    return nextErrors;
  };

  const submitKnowledge = async () => {
    if (!canSubmit) {
      setErrors(["Only Consultants can submit knowledge."]);
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setStatus("");

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          tags,
          project: form.project,
          region: form.region,
          type: form.type,
          author: user.username,
          role: user.role,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setErrors([data.error]);
        return;
      }
      setStatus("Submitted. Status: Pending Validation.");
      setForm({
        title: "",
        description: "",
        tags: "",
        project: "",
        region: "",
        type: "",
        upload: null,
      });
    } catch (err) {
      console.error(err);
      setErrors(["Server error. Try again later."]);
    }
  };

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="page-main">
        <section className="page-panel">
          <div className="page-card">
            <div className="page-card__header">
              <div>
                <h2>Submit Knowledge</h2>
                <p className="muted">Provide the required metadata for validation.</p>
              </div>
            </div>

            <div className="page-form">
              {!canSubmit && (
                <p className="muted">
                  You can view this form, but only Consultants can submit knowledge.
                </p>
              )}

              <div className="page-field">
                <label htmlFor="title">Title *</label>
                <input
                  className="page-input"
                  type="text"
                  id="title"
                  placeholder="Enter title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </div>

              <div className="page-field">
                <label htmlFor="description">Description *</label>
                <textarea
                  className="page-input page-textarea"
                  id="description"
                  placeholder="Enter description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                ></textarea>
              </div>

              <div className="page-field">
                <label htmlFor="tags">Tags * (comma-separated)</label>
                <input
                  className="page-input"
                  type="text"
                  id="tags"
                  placeholder="e.g. onboarding, finance, api"
                  value={form.tags}
                  onChange={(e) => updateField("tags", e.target.value)}
                />
              </div>

              <div className="filter-grid">
                <div className="filter-field">
                  <label htmlFor="project">Project *</label>
                  <select
                    className="page-input"
                    id="project"
                    value={form.project}
                    onChange={(e) => updateField("project", e.target.value)}
                  >
                    <option value="">Select project</option>
                    {projectOptions.map((project) => (
                      <option key={project} value={project}>
                        {project}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="region">Region *</label>
                  <select
                    className="page-input"
                    id="region"
                    value={form.region}
                    onChange={(e) => updateField("region", e.target.value)}
                  >
                    <option value="">Select region</option>
                    {regionOptions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="type">Type *</label>
                  <select
                    className="page-input"
                    id="type"
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                  >
                    <option value="">Select type</option>
                    {supportedTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="page-field">
                <label htmlFor="upload">Upload (optional)</label>
                <input
                  className="page-input"
                  type="file"
                  id="upload"
                  onChange={(e) => updateField("upload", e.target.files?.[0] || null)}
                />
              </div>

              <div className="page-field">
                <label htmlFor="author">Author</label>
                <input
                  className="page-input"
                  id="author"
                  type="text"
                  value={user?.username || "consultant1"}
                  readOnly
                />
              </div>

              {errors.length > 0 && (
                <div className="home-empty">
                  {errors.map((error) => (
                    <p className="muted" key={error}>{error}</p>
                  ))}
                </div>
              )}

              {status && <p className="badge badge--soft">{status}</p>}

              <div className="form-actions">
                <button
                  className="btn btn--primary"
                  onClick={submitKnowledge}
                  type="button"
                  disabled={!canSubmit}
                >
                  Submit
                </button>
                <button className="btn btn--ghost" onClick={() => navigate(-1)} type="button">
                  Back
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
