
import { useEffect, useState } from "react";
import "./App.css";
import { api } from "./api";

const careerSkills = {
  "Data Scientist": ["Python", "SQL", "Statistics", "Machine Learning", "Data Analysis"],
  "Data Analyst": ["SQL", "Excel", "Python", "Data Analysis", "Power BI"],
  "ML Engineer": ["Python", "Machine Learning", "Deep Learning", "SQL", "Statistics"],
  "Full-Stack Developer": ["HTML & CSS", "JavaScript", "React", "Python", "SQL"],
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("skilltrack_user")) || null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [career, setCareer] = useState("Data Scientist");

  const [skills, setSkills] = useState([]);
  const [dashboard, setDashboard] = useState({
    total_skills: 0,
    average_proficiency: 0,
    completed_goals: 0,
    total_goals: 0,
  });

  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [progress, setProgress] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [editingId, setEditingId] = useState(null);

  const [goalTitle, setGoalTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load all information from Flask and SQLite
  async function loadData(userId, selectedCareer) {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const [
        skillsData,
        dashboardData,
        analysisData,
        recommendationsData,
        progressData,
      ] = await Promise.all([
        api.getSkills(userId),
        api.getDashboard(userId),
        api.getCareerAnalysis(userId, selectedCareer),
        api.getRecommendations(userId, selectedCareer),
        api.getProgress(userId),
      ]);

      setSkills(skillsData);
      setDashboard(dashboardData);
      setAnalysis(analysisData);
      setRecommendations(recommendationsData);
      setProgress(progressData);
    } catch (err) {
      setError(err.message || "Unable to load your information.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadData(user.id, career);
    }
  }, [user?.id, career]);

  function showMessage(message) {
    setNotice(message);
    setError("");
  }

  // Registration and login
  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;

      if (authMode === "register") {
        result = await api.register(authName, authEmail, authPassword);
      } else {
        result = await api.login(authEmail, authPassword);
      }

      localStorage.setItem("skilltrack_user", JSON.stringify(result.user));
      setUser(result.user);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setActiveTab("Dashboard");
      showMessage(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("skilltrack_user");
    setUser(null);
    setSkills([]);
    setDashboard({
      total_skills: 0,
      average_proficiency: 0,
      completed_goals: 0,
      total_goals: 0,
    });
    setProgress([]);
    setActiveTab("Dashboard");
    setNotice("");
    setError("");
  }

  // Add or edit skill
  async function saveSkill(event) {
    event.preventDefault();
    if (!skillName.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (editingId) {
        await api.updateSkill(
          editingId,
          user.id,
          skillName.trim(),
          skillLevel,
          "Technical"
        );
        showMessage("Skill updated successfully!");
      } else {
        await api.addSkill(
          user.id,
          skillName.trim(),
          skillLevel,
          "Technical"
        );
        showMessage("Skill added successfully!");
      }

      setSkillName("");
      setSkillLevel("Beginner");
      setEditingId(null);
      setShowForm(false);
      await loadData(user.id, career);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditing(skill) {
    setSkillName(skill.name);
    setSkillLevel(skill.level);
    setEditingId(skill.id);
    setShowForm(true);
  }

  function cancelEditing() {
    setSkillName("");
    setSkillLevel("Beginner");
    setEditingId(null);
    setShowForm(false);
  }

  async function deleteSkill(skillId) {
    if (!window.confirm("Are you sure you want to remove this skill?")) {
      return;
    }

    try {
      await api.deleteSkill(skillId, user.id);
      showMessage("Skill removed successfully!");
      await loadData(user.id, career);
    } catch (err) {
      setError(err.message);
    }
  }

  // Progress tracking
  async function addGoal(event) {
    event.preventDefault();
    if (!goalTitle.trim()) return;

    try {
      await api.addProgress(user.id, goalTitle.trim());
      setGoalTitle("");
      showMessage("Learning goal added!");
      await loadData(user.id, career);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleGoal(goal) {
    try {
      await api.updateProgress(
        goal.id,
        user.id,
        !goal.completed
      );
      await loadData(user.id, career);
    } catch (err) {
      setError(err.message);
    }
  }

  const navigation = [
    "Dashboard",
    "My Skills",
    "Career Analysis",
    "Recommendations",
    "Progress Tracking",
  ];

  const targetSkills = careerSkills[career];

  const matchedSkills = targetSkills.filter((target) =>
    skills.some(
      (skill) => skill.name.toLowerCase() === target.toLowerCase()
    )
  );

  const gapSkills = targetSkills.filter(
    (target) =>
      !skills.some(
        (skill) => skill.name.toLowerCase() === target.toLowerCase()
      )
  );

  // Login and registration screen
  if (!user) {
    return (
      <div style={authStyles.page}>
        <div style={authStyles.card}>
          <div style={authStyles.logo}>S</div>
          <h1 style={authStyles.title}>SkillTrack</h1>
          <p style={authStyles.subtitle}>
            Your personal skill and career growth platform.
          </p>

          <h2 style={authStyles.heading}>
            {authMode === "login" ? "Welcome back!" : "Create your account"}
          </h2>

          <form onSubmit={handleAuth} style={authStyles.form}>
            {authMode === "register" && (
              <input
                style={authStyles.input}
                placeholder="Full name"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
              />
            )}

            <input
              style={authStyles.input}
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />

            <input
              style={authStyles.input}
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && <p style={authStyles.error}>{error}</p>}

            <button style={authStyles.button} disabled={loading}>
              {loading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>

          <p style={authStyles.switchText}>
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
            {" "}
            <button
              style={authStyles.switchButton}
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {authMode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>SkillTrack</span>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav>
          {navigation.map((item) => (
            <button
              key={item}
              className={`nav-link ${activeTab === item ? "active" : ""}`}
              onClick={() => setActiveTab(item)}
            >
              <span className="nav-dot">●</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user.name}</strong>
            <small>Student Account</small>
            <button className="text-button" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {activeTab}</p>
            <h2>{activeTab}</h2>
          </div>

          <div className="topbar-right">
            <span className="status-dot"></span>
            <span>My Learning Space</span>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div style={messageStyles.error}>{error}</div>
          )}

          {notice && (
            <div style={messageStyles.success}>
              {notice}
              <button
                onClick={() => setNotice("")}
                style={messageStyles.close}
              >
                ×
              </button>
            </div>
          )}

          {loading && (
            <p className="muted">Loading your SkillTrack data...</p>
          )}

          {activeTab === "Dashboard" && (
            <>
              <section className="welcome-section">
                <div>
                  <p className="eyebrow">YOUR PERSONAL GROWTH SPACE</p>
                  <h1>
                    Welcome back, {user.name}! <span>✦</span>
                  </h1>
                  <p>
                    Keep learning, keep growing. Your next opportunity starts here.
                  </p>
                </div>
                <div className="welcome-art">✧</div>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon purple">✧</div>
                  <p>Total Skills</p>
                  <h2>{dashboard.total_skills}</h2>
                  <small>Skills in your profile</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">↗</div>
                  <p>Average Proficiency</p>
                  <h2>{dashboard.average_proficiency}%</h2>
                  <small>Across your listed skills</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">✓</div>
                  <p>Career Skill Matches</p>
                  <h2>{matchedSkills.length}/{targetSkills.length}</h2>
                  <small>For your selected career</small>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel skills-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">YOUR PROGRESS</p>
                      <h3>Skill Overview</h3>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setActiveTab("My Skills")}
                    >
                      View all →
                    </button>
                  </div>

                  {skills.length === 0 ? (
                    <p className="muted">Add your first skill to get started.</p>
                  ) : (
                    skills.slice(0, 4).map((skill) => (
                      <div className="skill-item" key={skill.id}>
                        <div className="skill-info">
                          <strong>{skill.name}</strong>
                          <span>{skill.proficiency}%</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{ width: `${skill.proficiency}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="panel career-panel">
                  <p className="eyebrow">YOUR CAREER GOAL</p>
                  <h3>Build your future</h3>
                  <p>Select a career path to discover the skills you need to develop.</p>

                  <select
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                  >
                    {Object.keys(careerSkills).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <div className="career-match">
                    <strong>
                      {matchedSkills.length} of {targetSkills.length} skills matched
                    </strong>
                    <div className="progress-track">
                      <div
                        className="progress-fill green-fill"
                        style={{
                          width: `${(matchedSkills.length / targetSkills.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <button
                    className="primary-button full-button"
                    onClick={() => setActiveTab("Career Analysis")}
                  >
                    Explore Career Analysis →
                  </button>
                </div>
              </section>

              <section className="panel recommendation-preview">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">KEEP MOVING FORWARD</p>
                    <h3>Recommended for you</h3>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActiveTab("Recommendations")}
                  >
                    See all →
                  </button>
                </div>

                <div className="recommendation-grid">
                  {recommendations.slice(0, 2).map((item) => (
                    <div className="recommendation-card" key={item.skill}>
                      <span className="recommendation-icon">✦</span>
                      <div>
                        <strong>Learn {item.skill}</strong>
                        <p>{item.suggestion}</p>
                        <small>Priority: {item.priority}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "My Skills" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">YOUR KNOWLEDGE</p>
                  <h3>Manage your skills</h3>
                  <p className="muted">Add and track the skills you're learning.</p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => {
                    if (showForm) {
                      cancelEditing();
                    } else {
                      setShowForm(true);
                    }
                  }}
                >
                  {showForm ? "Cancel" : "+ Add Skill"}
                </button>
              </div>

              {showForm && (
                <form className="skill-form" onSubmit={saveSkill}>
                  <input
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="Enter skill name"
                    required
                  />

                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>

                  <button className="primary-button" type="submit" disabled={loading}>
                    {editingId ? "Update Skill" : "Save Skill"}
                  </button>
                </form>
              )}

              <div className="skill-list">
                {skills.length === 0 && (
                  <p className="muted">No skills added yet. Add your first skill!</p>
                )}

                {skills.map((skill) => (
                  <div className="skill-row" key={skill.id}>
                    <div className="skill-row-info">
                      <div>
                        <strong>{skill.name}</strong>
                        <small>{skill.category} · {skill.level}</small>
                      </div>
                      <span>{skill.proficiency}%</span>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${skill.proficiency}%` }}
                      ></div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button
                        className="text-button"
                        onClick={() => startEditing(skill)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => deleteSkill(skill.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "Career Analysis" && (
            <section className="panel full-panel">
              <p className="eyebrow">PLAN YOUR CAREER</p>
              <h3>Career Skill Gap Analysis</h3>
              <p className="muted">
                Compare your current skills with the skills expected for your chosen career.
              </p>

              <label className="field-label">Select your target career</label>
              <select
                className="career-select"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
              >
                {Object.keys(careerSkills).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              {analysis && (
                <>
                  <div className="analysis-summary">
                    <div>
                      <span className="summary-number">
                        {matchedSkills.length}
                      </span>
                      <p>Matched skills</p>
                    </div>
                    <div>
                      <span className="summary-number">
                        {gapSkills.length}
                      </span>
                      <p>Skills to develop</p>
                    </div>
                    <div>
                      <span className="summary-number">
                        {analysis.match_percentage}%
                      </span>
                      <p>Career match</p>
                    </div>
                  </div>

                  <h4 className="subheading">Your skill proficiency</h4>

                  {analysis.skills.map((item) => (
                    <div className="skill-item" key={item.name}>
                      <div className="skill-info">
                        <strong>{item.name}</strong>
                        <span>{item.current}% / 80%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(item.current, 80) / 80 * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  <h4 className="subheading">Skills to develop</h4>

                  {analysis.skills.filter((item) => item.gap > 0).map((item) => (
                    <div className="gap-row" key={item.name}>
                      <span>{item.name}</span>
                      <span className="gap-label">
                        {item.current === 0 ? "Not added" : `${item.gap}% gap`}
                      </span>
                    </div>
                  ))}

                  {analysis.skills.every((item) => item.gap === 0) && (
                    <p className="muted">Excellent! You have reached the target proficiency for this career.</p>
                  )}
                </>
              )}
            </section>
          )}

          {activeTab === "Recommendations" && (
            <section className="panel full-panel">
              <p className="eyebrow">YOUR NEXT STEPS</p>
              <h3>Personalized Learning Recommendations</h3>
              <p className="muted">
                Suggestions are generated from the skill gaps in your selected career.
              </p>

              <label className="field-label">Selected career</label>
              <select
                className="career-select"
                value={career}
                onChange={(e) => setCareer(e.target.value)}
              >
                {Object.keys(careerSkills).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <div className="recommendation-list">
                {recommendations.length === 0 ? (
                  <p className="muted">
                    Great work! No skill-gap recommendations at the moment.
                  </p>
                ) : (
                  recommendations.map((item, index) => (
                    <div className="recommendation-card" key={item.skill}>
                      <span className="recommendation-icon">{index + 1}</span>
                      <div>
                        <strong>Learn {item.skill}</strong>
                        <p>{item.suggestion}</p>
                        <small>
                          Current proficiency: {item.current_level}% · Priority: {item.priority}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === "Progress Tracking" && (
            <section className="panel full-panel">
              <p className="eyebrow">YOUR LEARNING JOURNEY</p>
              <h3>Progress Tracking</h3>
              <p className="muted">
                Set learning goals and mark them complete as you make progress.
              </p>

              <div className="analysis-summary">
                <div>
                  <span className="summary-number">{dashboard.total_goals}</span>
                  <p>Total goals</p>
                </div>
                <div>
                  <span className="summary-number">{dashboard.completed_goals}</span>
                  <p>Completed goals</p>
                </div>
              </div>

              <form className="skill-form" onSubmit={addGoal}>
                <input
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Enter a learning goal"
                  required
                />
                <button className="primary-button" type="submit">
                  + Add Goal
                </button>
              </form>

              <div className="skill-list">
                {progress.length === 0 ? (
                  <p className="muted">No learning goals yet. Add your first goal!</p>
                ) : (
                  progress.map((goal) => (
                    <div className="gap-row" key={goal.id}>
                      <label style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={goal.completed}
                          onChange={() => toggleGoal(goal)}
                        />
                        <span
                          style={{
                            textDecoration: goal.completed ? "line-through" : "none",
                          }}
                        >
                          {goal.title}
                        </span>
                      </label>
                      <span className={goal.completed ? "match-label" : "gap-label"}>
                        {goal.completed ? "Completed" : "In progress"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          <footer className="footer">
            SkillTrack © 2026 · Learn with purpose. Grow with confidence.
          </footer>
        </div>
      </main>
    </div>
  );
}

const authStyles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    background: "linear-gradient(135deg, #f3edff, #e8edff)",
    fontFamily: "sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    background: "#ffffff",
    padding: "38px",
    borderRadius: "22px",
    boxShadow: "0 15px 50px rgba(72, 55, 130, 0.12)",
    textAlign: "center",
  },
  logo: {
    width: "52px",
    height: "52px",
    margin: "0 auto",
    borderRadius: "16px",
    background: "#7654c8",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: "25px",
    fontWeight: "bold",
  },
  title: {
    color: "#38285e",
    marginBottom: "6px",
  },
  subtitle: {
    color: "#77718a",
    fontSize: "14px",
    marginBottom: "28px",
  },
  heading: {
    color: "#38285e",
    marginBottom: "20px",
  },
  form: {
    display: "grid",
    gap: "14px",
  },
  input: {
    padding: "14px",
    border: "1px solid #e2dcef",
    borderRadius: "10px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#7654c8",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  switchText: {
    marginTop: "22px",
    color: "#77718a",
    fontSize: "14px",
  },
  switchButton: {
    background: "none",
    border: "none",
    color: "#7654c8",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    color: "#c0392b",
    fontSize: "13px",
  },
};

const messageStyles = {
  error: {
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    background: "#ffe9e9",
    color: "#a52a2a",
  },
  success: {
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    background: "#e6f7ec",
    color: "#216e39",
    display: "flex",
    justifyContent: "space-between",
  },
  close: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
  },
};

export default App;
