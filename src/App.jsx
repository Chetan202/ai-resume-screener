import { useEffect, useMemo, useRef, useState } from "react";

const verdictTone = {
  "Strong Match": "strong",
  "Moderate Match": "moderate",
  "Weak Match": "weak",
  "Poor Match": "poor",
};

const THINKING_STEPS = [
  "Reading every page carefully…",
  "Extracting skills and experience…",
  "Matching against the role requirements…",
  "Weighing education and seniority…",
  "Scoring each candidate…",
  "Building ranked shortlist…",
  "Almost there — final checks…",
];

function ThinkingPanel({ fileCount }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % THINKING_STEPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="thinking" aria-live="polite" aria-busy="true">
      <div className="thinking-orb">
        <span className="orb-ring" />
        <span className="orb-ring" />
        <span className="orb-core" />
      </div>
      <h3>
        Thinking through {fileCount} resume{fileCount !== 1 ? "s" : ""}
      </h3>
      <p className="thinking-step" key={step}>
        {THINKING_STEPS[step]}
      </p>
      <div className="thinking-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function Bar({ score }) {
  return (
    <div className="bar">
      <span style={{ width: `${score}%` }} />
    </div>
  );
}

function Candidate({ result, rank }) {
  const [open, setOpen] = useState(rank === 1);

  return (
    <article className={`candidate ${open ? "is-open" : ""}`}>
      <button className="candidate-head" onClick={() => setOpen(!open)}>
        <span className="rank">{rank}</span>
        <span className="identity">
          <strong>{result.name || result.file_name}</strong>
          <small>{result.email || result.file_name}</small>
        </span>
        <span className="score">
          <em>{result.score}</em>
          <Bar score={result.score} />
        </span>
        <span className={`verdict ${verdictTone[result.verdict]}`}>
          {result.verdict}
        </span>
        <span className="chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="candidate-body">
          <div className="checks">
            <span className={result.experience_match ? "yes" : "no"}>
              Experience{" "}
              {result.experience_match ? "meets the bar" : "falls short"}
            </span>
            <span className={result.education_match ? "yes" : "no"}>
              Education{" "}
              {result.education_match ? "meets the bar" : "falls short"}
            </span>
          </div>

          <div className="skills">
            <div>
              <h4>Has</h4>
              <ul>
                {result.matched_skills.length ? (
                  result.matched_skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))
                ) : (
                  <li className="empty">Nothing matched the required list</li>
                )}
              </ul>
            </div>
            <div>
              <h4>Missing</h4>
              <ul className="missing">
                {result.missing_skills.length ? (
                  result.missing_skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))
                ) : (
                  <li className="empty">Nothing missing</li>
                )}
              </ul>
            </div>
          </div>

          <ol className="reasons">
            {result.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}

export default function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [mode, setMode] = useState("paste");
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState("");
  const [fetchFailed, setFetchFailed] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingJd, setFetchingJd] = useState(false);
  const inputRef = useRef(null);

  const ready =
    jobDescription.trim().length > 20 && files.length > 0 && !loading;

  const average = useMemo(() => {
    if (!data || !data.results.length) return 0;
    const total = data.results.reduce((sum, item) => sum + item.score, 0);
    return Math.round(total / data.results.length);
  }, [data]);

  function pickFiles(list) {
    const accepted = Array.from(list).filter((file) =>
      /\.(pdf|docx)$/i.test(file.name)
    );
    setFiles(accepted.slice(0, 20));
  }

  async function loadFromUrl() {
    setFetching(true);
    setFetchNote("");
    setFetchFailed(false);

    try {
      const response = await fetch("/api/fetch-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setFetchFailed(true);
        setFetchNote(
          payload.detail ||
            "That link could not be read. Paste the text instead."
        );
        setMode("paste");
      } else {
        setJobDescription(payload.job_description);
        setFetchNote(
          `Loaded ${payload.job_description.length} characters${
            payload.title ? ` from ${payload.title}` : ""
          }. Edit below before screening.`
        );
        setMode("paste");
      }
    } catch {
      setFetchFailed(true);
      setFetchNote(
        "The server did not respond. Paste the description text instead."
      );
      setMode("paste");
    } finally {
      setFetching(false);
    }
  }

  async function fetchJobDescription() {
    if (!jobUrl.trim()) return;
    setFetchingJd(true);
    setError("");

    try {
      await new Promise((r) => setTimeout(r, 700));
      setJobDescription(
        `Fetched from: ${jobUrl}\n\n(Replace this mock with real content from your backend)`
      );
    } catch (err) {
      setError(err.message || "Failed to fetch job description");
    } finally {
      setFetchingJd(false);
    }
  }

  async function run() {
    setLoading(true);
    setError("");
    setData(null);

    const body = new FormData();
    body.append("job_description", jobDescription);
    files.forEach((file) => body.append("files", file));

    try {
      const response = await fetch("/api/screen", { method: "POST", body });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.detail || "Screening failed. Try again.");
      } else {
        setData(payload);
      }
    } catch {
      setError(
        "The server did not respond. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header>
        <div className="mark">
          <span />
          <span />
          <span />
        </div>
        <h1>
          Screen Smarter.
          <i>Shortlist Faster.</i>
        </h1>
        <p>
          Paste the role you're hiring for, drop in the resumes, and get every
          candidate scored on skills, experience and education.
        </p>
      </header>

      <section className="panel">
        <div className="tabs">
          <button
            className={mode === "paste" ? "on" : ""}
            onClick={() => setMode("paste")}
          >
            Paste the description
          </button>
          <button
            className={mode === "url" ? "on" : ""}
            onClick={() => setMode("url")}
          >
            Load from a link
          </button>
        </div>

        {mode === "url" ? (
          <div className="url-row">
            <input
              type="url"
              placeholder="https://careers.example.com/ai-developer"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Enter" && url.trim() && loadFromUrl()
              }
            />
            <button onClick={loadFromUrl} disabled={!url.trim() || fetching}>
              {fetching ? "Reading…" : "Read link"}
            </button>
          </div>
        ) : (
          <textarea
            id="jd"
            rows={11}
            placeholder="Paste the full job description, including required skills, years of experience and education."
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
        )}

        {fetchNote && (
          <p className={fetchFailed ? "note bad" : "note"}>{fetchNote}</p>
        )}

        <label htmlFor="files">The candidates</label>
        <div
          className={`drop ${files.length ? "has-files" : ""}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pickFiles(e.dataTransfer.files);
          }}
        >
          <input
            id="files"
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx"
            onChange={(e) => pickFiles(e.target.files)}
            hidden
          />
          {files.length === 0 ? (
            <div className="drop-empty">
              <div className="drop-icon">📄</div>
              <p>
                Drop PDF or DOCX resumes here
                <span>or click to browse · up to 20 files</span>
              </p>
            </div>
          ) : (
            <ul className="file-list">
              {files.map((file) => (
                <li key={file.name}>
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles((prev) =>
                        prev.filter((f) => f.name !== file.name)
                      );
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="cta" disabled={!ready || loading} onClick={run}>
          {loading ? (
            <>
              <span className="spinner" />
              Screening {files.length} resume
              {files.length !== 1 ? "s" : ""}…
            </>
          ) : (
            "Screen resumes"
          )}
        </button>

        {error && <p className="note bad">{error}</p>}
      </section>

      {loading && <ThinkingPanel fileCount={files.length} />}

      {data && !loading && (
        <section className="results">
          <div className="summary">
            <div>
              <h2>{data.role}</h2>
              <p>
                {data.results.length} screened · average score{" "}
                <strong>{average}</strong>
              </p>
            </div>
            <div className="required">
              <span>Required skills</span>
              <div className="skill-pills">
                {data.required_skills?.length
                  ? data.required_skills.map((s) => <span key={s}>{s}</span>)
                  : "not specified"}
              </div>
            </div>
          </div>

          {data.results.map((result, index) => (
            <Candidate
              key={result.file_name + index}
              result={result}
              rank={index + 1}
            />
          ))}

          {data.skipped?.length > 0 && (
            <div className="skipped">
              <h3>Not screened</h3>
              <ul>
                {data.skipped.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}