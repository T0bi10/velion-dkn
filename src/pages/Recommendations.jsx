import Sidebar from "../components/Sidebar";

const recommendedContent = [
  {
    title: "Client onboarding playbook",
    detail: "Based on your recent searches in Atlas and onboarding tags.",
  },
  {
    title: "Regional compliance checklist",
    detail: "Recommended from your EMEA project history.",
  },
  {
    title: "API migration template",
    detail: "Suggested because of your recent submission tags.",
  },
];

const recommendedExperts = [
  {
    name: "Rina Matthews",
    role: "Knowledge Champion",
    detail: "Specialist in compliance validation and risk scoring.",
  },
  {
    name: "Ajay Patel",
    role: "Consultant",
    detail: "Leads migration playbooks for Nova and Orion projects.",
  },
  {
    name: "Camila Ortiz",
    role: "Admin",
    detail: "Owns metadata standards and governance workflows.",
  },
];

export default function Recommendations() {
  return (
    <div className="page-shell">
      <Sidebar />
      <main className="page-main">
        <section className="page-panel">
          <div className="page-card">
            <div className="page-card__header">
              <div>
                <h2>Recommendations</h2>
                <p className="muted">Based on your searches, projects, and tags.</p>
              </div>
            </div>

            <div className="recommendations-grid">
              <div className="recommend-card">
                <h3>Recommended Content</h3>
                <div className="recommend-list">
                  {recommendedContent.map((item) => (
                    <div className="recommend-item" key={item.title}>
                      <h4>{item.title}</h4>
                      <p>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recommend-card">
                <h3>Recommended Experts</h3>
                <div className="recommend-list">
                  {recommendedExperts.map((expert) => (
                    <div className="recommend-item" key={expert.name}>
                      <h4>{expert.name}</h4>
                      <p>{expert.role} • {expert.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
