import { useMemo, useRef, useState } from "react";

const verdictTone = {
  "Strong Match": "strong",
  "Moderate Match": "moderate",
  "Weak Match": "weak",
  "Poor Match": "poor",
};

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
              Experience {result.experience_match ? "meets the bar" : "falls short"}
            </span>
            <span className={result.education_match ? "yes" : "no"}>
              Education {result.education_match ? "meets the bar" : "falls short"}
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

  async function fetchJobDescription() {
    if (!jobUrl.trim()) return;
    setFetchingJd(true);
    setError("");

    try {
      // Replace with your real endpoint later
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
      setError("The server did not respond. Check your connection and try again.");
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
        {/* <label htmlFor="job-url">Job posting URL <span>(optional)</span></label>
        <div className="url-row">
          <input
            id="job-url"
            type="url"
            placeholder="https://linkedin.com/jobs/view/… or any job page"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchJobDescription()}
          />
          <button
            type="button"
            disabled={!jobUrl.trim() || fetchingJd}
            onClick={fetchJobDescription}
          >
            {fetchingJd ? "Fetching…" : "Fetch"}
          </button>
        </div> */}

        <label htmlFor="jd">Job description</label>
        <textarea
          id="jd"
          rows={10}
          placeholder="Paste the full job description, including required skills, years of experience and education…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

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
                      setFiles((prev) => prev.filter((f) => f.name !== file.name));
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="cta" disabled={!ready} onClick={run}>
          {loading ? (
            <>
              <span className="spinner" />
              Screening {files.length} resume{files.length !== 1 ? "s" : ""}…
            </>
          ) : (
            "Screen resumes"
          )}
        </button>

        {error && <p className="note bad">{error}</p>}
      </section>

      {data && (
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