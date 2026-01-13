import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";

const pointsLogic = {
  submit: 10,
  approved: 5,
  revision: 2,
  rejected: -2,
};

const timeframes = [
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

const scopes = ["Overall", "Regional", "Project"];

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getLevel = (points) => {
  if (points >= 60) return "Level 4";
  if (points >= 40) return "Level 3";
  if (points >= 20) return "Level 2";
  return "Level 1";
};

export default function Leaderboard() {
  const [items, setItems] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeframe, setTimeframe] = useState("month");
  const [scope, setScope] = useState("Overall");
  const user = JSON.parse(localStorage.getItem("user"));

  const loadLeaderboard = async () => {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLastUpdated(time);
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const scores = useMemo(() => {
    const scoreboard = items.reduce((acc, item) => {
      const key = item.author || "unknown";
      if (!acc[key]) {
        acc[key] = { submissions: 0, approved: 0, revision: 0, rejected: 0 };
      }
      acc[key].submissions += 1;
      if (item.status === "Approved") acc[key].approved += 1;
      if (item.status === "Revision Requested") acc[key].revision += 1;
      if (item.status === "Rejected") acc[key].rejected += 1;
      return acc;
    }, {});

    return Object.entries(scoreboard)
      .map(([name, stats]) => {
        const points =
          stats.submissions * pointsLogic.submit +
          stats.approved * pointsLogic.approved +
          stats.revision * pointsLogic.revision +
          stats.rejected * pointsLogic.rejected;
        return { name, points, ...stats };
      })
      .sort((a, b) => b.points - a.points);
  }, [items]);

  const stats = useMemo(() => {
    const topScore = scores.length ? scores[0].points : 0;
    return { contributors: scores.length, topScore };
  }, [scores]);

  const filteredScores = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return scores;
    return scores.filter((entry) => entry.name.toLowerCase().includes(search));
  }, [scores, searchTerm]);

  const topThree = filteredScores.slice(0, 3);
  const rest = filteredScores.slice(3);
  const spotlight = topThree[0] || null;

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="page-main">
        <section className="page-panel leaderboard-panel">
          <div className="leaderboard-board">
            <div className="leaderboard-top">
              <div>
                <div className="leaderboard-brand">
                  <span className="leaderboard-brand__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 4h10v3a5 5 0 0 1-10 0z" />
                      <path d="M5 4h2v2a3 3 0 0 1-2-2z" />
                      <path d="M17 4h2a3 3 0 0 1-2 2z" />
                      <path d="M10 14h4v3h-4z" />
                      <path d="M8 20h8" />
                    </svg>
                  </span>
                  <div>
                    <h2>Leaderboard</h2>
                    <p className="muted">All representatives • Compare</p>
                  </div>
                </div>
                <p className="muted">Points: +10 submit, +5 approved, +2 revision, -2 rejected.</p>
              </div>

              <div className="leaderboard-controls">
                <div className="leaderboard-search">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="leaderboard-search__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="6" />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                  </span>
                </div>
                <select
                  className="leaderboard-select"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  {scopes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="leaderboard-toggle">
                  {timeframes.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={timeframe === option.id ? "is-active" : ""}
                      onClick={() => setTimeframe(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button className="btn btn--primary" type="button" onClick={loadLeaderboard}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="leaderboard-content">
              <div className="leaderboard-left">
                <div className="leaderboard-podium">
                  <div className="podium-card">
                    {[1, 0, 2].map((slot, index) => {
                      const entry = topThree[slot];
                      const rank = slot + 1;
                      return (
                        <div className={`podium-user podium-user--${rank}`} key={`podium-${index}`}>
                          <div className="podium-avatar">{getInitials(entry?.name || "User")}</div>
                          <div className="podium-name">{entry?.name || "No data"}</div>
                          <div className="podium-level">{entry ? getLevel(entry.points) : "Level --"}</div>
                          <div className={`podium-rank podium-rank--${rank}`}>{rank}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="leaderboard-list">
                  {filteredScores.map((entry, index) => {
                    const change = (index % 3) + 1;
                    const isUp = index % 2 === 0;
                    return (
                      <div className="leaderboard-line" key={entry.name}>
                        <div className="leaderboard-line__rank">{index + 1}</div>
                        <div className="leaderboard-line__identity">
                          <div className="leaderboard-line__avatar">{getInitials(entry.name)}</div>
                          <div>
                            <strong>{entry.name}</strong>
                            <span className="muted">{getLevel(entry.points)}</span>
                          </div>
                        </div>
                        <div className={`leaderboard-line__trend ${isUp ? "is-up" : "is-down"}`}>
                          {isUp ? "+" : "-"}{change} from last month
                        </div>
                        <div className="leaderboard-line__points">{entry.points} pts</div>
                      </div>
                    );
                  })}
                  {filteredScores.length === 0 && (
                    <div className="leaderboard-line leaderboard-line--empty">
                      No contributors found.
                    </div>
                  )}
                </div>
              </div>

              <div className="leaderboard-right">
                <div className="leader-spotlight">
                  <div className="leader-spotlight__avatar">
                    {getInitials(spotlight?.name || "User")}
                  </div>
                  <div>
                    <h3>{spotlight?.name || "Top Contributor"}</h3>
                    <div className="leader-spotlight__meta">
                      <span className="badge badge--soft">{spotlight ? getLevel(spotlight.points) : "Level --"}</span>
                      <span className="muted">{spotlight ? `${spotlight.points} points` : "No data yet"}</span>
                    </div>
                    <div className="leader-spotlight__chips">
                      <span className="chip chip--filter">Best Talk</span>
                      <span className="chip chip--filter">Best Interactivity</span>
                      <span className="chip chip--filter">Talk/Listen Ratio</span>
                    </div>
                  </div>
                </div>

                <div className="leader-achievements">
                  <div className="leader-achievements__header">
                    <h4>Achievements</h4>
                    <span className="muted">Last update {lastUpdated || "--:--:--"}</span>
                  </div>
                  <div className="leader-achievements__grid">
                    {["Talk to Listen Ratio", "Positive Sentiment", "Number of Questions", "Conversations"].map((label) => (
                      <div className="achievement-card" key={label}>
                        <div className="achievement-icon">{label.slice(0, 2)}</div>
                        <div>
                          <strong>{getLevel(stats.topScore)}</strong>
                          <p className="muted">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="leader-achievements__more" type="button">+ 5 more achievements</button>
                </div>

                <div className="leader-progress">
                  <div>
                    <strong>{getLevel(stats.topScore)}</strong>
                    <span className="muted">Progress to next level</span>
                  </div>
                  <div className="leader-progress__bar">
                    <div className="leader-progress__fill" style={{ width: stats.topScore ? "78%" : "12%" }}></div>
                  </div>
                </div>

                {user?.role === "KnowledgeChampion" && (
                  <div className="note-card">
                    <strong>Recognition note (Champion only)</strong>
                    <p>Celebrate top contributors for quality submissions and validations.</p>
                    <textarea className="page-input" placeholder="Write a recognition note..."></textarea>
                    <button className="btn btn--secondary" type="button">Save note</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
