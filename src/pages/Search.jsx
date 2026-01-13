import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

const projectOptions = ["All", "Atlas", "Nova", "Orion", "Pulse"];
const typeOptions = [
  "All",
  "Playbook",
  "Checklist",
  "Template",
  "Lessons Learned",
  "Reference",
  "Procedure",
];

const suggestions = [
  {
    title: "AI Suggestion: Delivery risk checklist",
    detail: "Based on similar tags, review the delivery risk checklist for your project.",
  },
  {
    title: "AI Suggestion: Client onboarding guide",
    detail: "Consider searching the onboarding templates for faster rollout.",
  },
  {
    title: "AI Suggestion: Regional compliance summary",
    detail: "Explore the compliance summaries for your selected region.",
  },
];

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => tag.toLowerCase());
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

const getRelevance = (item, search, tagFilters) => {
  let score = 0;
  const title = item.title?.toLowerCase() || "";
  const description = item.description?.toLowerCase() || "";
  const author = item.author?.toLowerCase() || "";
  const tags = normalizeTags(item.tags);

  if (search && title.includes(search)) score += 2;
  if (search && description.includes(search)) score += 1;
  if (search && author.includes(search)) score += 1;
  if (tagFilters.length && tagFilters.some((tag) => tags.includes(tag))) score += 2;

  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
};

export default function Search() {
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const loadData = async () => {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    const tagFilters = tagFilter
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    return items.filter((item) => {
      const tags = normalizeTags(item.tags);
      const project = item.project || "General";
      const type = item.type || "General";

      const matchesText =
        !search ||
        item.title?.toLowerCase().includes(search) ||
        item.author?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search);

      const matchesTags =
        tagFilters.length === 0 || tagFilters.some((tag) => tags.includes(tag));

      const matchesProject = projectFilter === "All" || project === projectFilter;
      const matchesType = typeFilter === "All" || type === typeFilter;

      return matchesText && matchesTags && matchesProject && matchesType;
    });
  }, [items, keyword, tagFilter, projectFilter, typeFilter]);

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="page-main">
        <section className="page-panel">
          <div className="page-card">
            <div className="page-card__header">
              <div>
                <h2>Search Repository</h2>
                <p className="muted">Filter by tags, project, or type.</p>
              </div>
              <button className="btn btn--primary" type="button" onClick={loadData}>
                Refresh
              </button>
            </div>

            <input
              className="page-input"
              type="text"
              placeholder="Search by title, author, or description"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <div className="filter-grid">
              <div className="filter-field">
                <label htmlFor="tagsFilter">Tags</label>
                <input
                  className="page-input"
                  id="tagsFilter"
                  type="text"
                  placeholder="comma-separated"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                />
              </div>
              <div className="filter-field">
                <label htmlFor="projectFilter">Project</label>
                <select
                  className="page-input"
                  id="projectFilter"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  {projectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="typeFilter">Type</label>
                <select
                  className="page-input"
                  id="typeFilter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="data-list">
              {filtered.map((item) => {
                const search = keyword.trim().toLowerCase();
                const tagFilters = tagFilter
                  .split(",")
                  .map((tag) => tag.trim().toLowerCase())
                  .filter(Boolean);
                const relevance = getRelevance(item, search, tagFilters);
                const tags = normalizeTags(item.tags);

                return (
                  <div className="data-row data-row--accent" key={item.id}>
                    <div>
                      <div className="activity-item__title">{item.title}</div>
                      <div className="muted">by {item.author}</div>
                      <div className="result-meta">
                        {tags.slice(0, 3).map((tag) => (
                          <span className="chip chip--filter" key={tag}>{tag}</span>
                        ))}
                        <span className="chip chip--filter">{item.project || "General"}</span>
                        <span className="chip chip--filter">{item.type || "General"}</span>
                      </div>
                    </div>
                    <div className={`relevance relevance--${relevance.toLowerCase()}`}>
                      {relevance} relevance
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="data-row data-row--empty">
                  <div>
                    <p>No matching knowledge found.</p>\n                    <strong>AI suggestions</strong>\n                    <div className="recommend-list">
                      {suggestions.map((suggestion) => (
                        <div className="recommend-item" key={suggestion.title}>
                          <strong>{suggestion.title}</strong>
                          <p>{suggestion.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

