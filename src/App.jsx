import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, Send, X } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/media", label: "Media" },
  { to: "/future", label: "Future" },
  { to: "/choice-1", label: "Choice 01" },
  { to: "/choice-2", label: "Choice 02" },
  { to: "/contact", label: "Contact" }
];

function useContent() {
  const [content, setContent] = useState(null);
  useEffect(() => {
    fetch("/api/content").then((response) => response.json()).then(setContent).catch(() => setContent(null));
  }, []);
  return content;
}

function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  return (
    <div className="site-shell">
      <div className="grain" aria-hidden="true" />
      <header className="site-header">
        <NavLink className="wordmark" to="/" aria-label="Mason Rhine home">MR<span>.</span></NavLink>
        <button id="menu-toggle-btn" className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`main-nav ${open ? "is-open" : ""}`}>
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>)}
          <NavLink className="admin-link" to="/admin">Admin <ArrowUpRight size={14} /></NavLink>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <span>MR. / Personal website project</span>
        <span>© 2026 Mason Rhine</span>
      </footer>
    </div>
  );
}

function PlaceholderMedia({ label = "YOUR MEDIA HERE", type = "Placeholder" }) {
  return <div className="media-placeholder" role="img" aria-label={`${type} placeholder`}><span>{type}</span><strong>{label}</strong><small>Replace with your original file</small></div>;
}

function MediaImage({ src, alt, label, type }) {
  if (!src) return <PlaceholderMedia label={label} type={type} />;
  return <div className="media-placeholder media-image"><img src={src} alt={alt || label} /><div className="media-image-label"><span>{type}</span><strong>{label}</strong></div></div>;
}

function PageIntro({ label, title, copy }) {
  return <div className="page-intro section-pad"><p className="eyebrow">{label}</p><h1>{title}</h1>{copy && <p className="page-copy">{copy}</p>}</div>;
}

function Home() {
  const content = useContent();
  const profile = content?.profile;
  return (
    <>
      <section className="hero section-pad">
        <div className="hero-copy">
          <p className="eyebrow">About me / 2026</p>
          <h1>{profile?.headline || "[Add your homepage headline]"}</h1>
          <p className="hero-intro">{profile?.shortBio || "Lorem ipsum placeholder for your introduction."}</p>
          <NavLink id="explore-work-link" className="button-link" to="/media">Explore my work <ArrowUpRight size={16} /></NavLink>
        </div>
        <PlaceholderMedia label="PROFILE PHOTO" type="Home page" />
      </section>
      <section className="split-section section-pad">
        <div><p className="eyebrow">A little about me</p><h2>My story<br /><em>starts here.</em></h2></div>
        <div className="content-column"><p>{profile?.longBio || "Lorem ipsum placeholder for your longer biography."}</p><div className="interest-tags">{(profile?.interests || []).map((interest) => <span key={interest}>{interest}</span>)}</div><div className="profile-highlights">{(profile?.highlights || []).map((highlight) => <span key={highlight}>{highlight}</span>)}</div><NavLink className="text-link" to="/future">See my future plans <ArrowUpRight size={16} /></NavLink></div>
      </section>
      <section className="color-band section-pad">
        <p className="eyebrow">More to explore</p>
        <div className="card-links">
          <NavLink to="/media"><span>01</span><strong>Media</strong><ArrowUpRight size={20} /></NavLink>
          <NavLink to="/future"><span>02</span><strong>Future</strong><ArrowUpRight size={20} /></NavLink>
          <NavLink to="/contact"><span>03</span><strong>Contact</strong><ArrowUpRight size={20} /></NavLink>
        </div>
      </section>
    </>
  );
}

function Media() {
  const content = useContent();
  const items = content?.media || [];
  return (
    <>
      <PageIntro label="Phase 02 / Gallery" title={<>My<br /><em>media.</em></>} copy="This gallery is ready for your original images, videos, audio, screenshots, and projects." />
      <section className="media-grid section-pad">
        {items.map((item) => <article className="media-card" key={item.id}><MediaImage src={item.src} alt={item.alt} type={item.type} label={item.title.toUpperCase()} /><div className="media-card-copy"><h2>{item.title}</h2><p>{item.description}</p><span>{item.status}</span>{item.sourceUrl && <a className="media-source" href={item.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} /></a>}</div></article>)}
      </section>
    </>
  );
}

function Future() {
  const content = useContent();
  const future = content?.future;
  return (
    <>
      <PageIntro label="Phase 03 / Looking ahead" title={<>The<br /><em>future.</em></>} copy={future?.intro} />
      <section className="goal-list section-pad">
        {(future?.goals || []).map((goal) => <article className="goal-card" key={goal.title}><span>Goal</span><h2>{goal.title}</h2><p>{goal.copy}</p></article>)}
      </section>
      <section className="quote-band section-pad"><p>“[Add a sentence about what you hope to build, learn, or become.]”</p></section>
    </>
  );
}

function ChoicePage({ number }) {
  const content = useContent();
  const page = content?.choicePages?.find((item) => item.number === number);
  return (
    <>
      <PageIntro label={`Phase 0${number + 3} / Choice page`} title={<>Choice<br /><em>page 0{number}.</em></>} copy={page?.intro} />
      <section className="choice-content section-pad">
        <div className="choice-topic"><span>Selected topic</span><h2>{page?.topic || "[Topic not selected]"}</h2></div>
        <PlaceholderMedia type={`Choice page 0${number}`} label="TOPIC IMAGE" />
        <div className="choice-sections">{(page?.sections || []).map((section) => <article key={section}><p className="eyebrow">Section</p><h2>{section}</h2><p>Lorem ipsum placeholder. Add your writing, facts, opinions, or instructions here.</p></article>)}</div>
      </section>
    </>
  );
}

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [state, setState] = useState("idle");
  const submit = async (event) => {
    event.preventDefault();
    setState("sending");
    const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setState(response.ok ? "success" : "error");
    if (response.ok) setForm({ name: "", email: "", subject: "", message: "" });
  };
  return (
    <>
      <PageIntro label="Contact" title={<>Let&apos;s<br /><em>connect.</em></>} copy="Use this form to send a message. The fields can be adjusted to match your assignment requirements." />
      <form id="contact-form" className="contact-form section-pad" onSubmit={submit}>
        <label>Name<input id="contact-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
        <label>Email<input id="contact-email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
        <label>Subject<input id="contact-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="What is this about?" /></label>
        <label>Message<textarea id="contact-message" required rows="6" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Write your message here..." /></label>
        <button id="contact-submit-btn" className="button-link" type="submit" disabled={state === "sending"}>{state === "sending" ? "Saving..." : "Send message"} <Send size={16} /></button>
        {state === "success" && <p className="form-status success">Your message was saved.</p>}
        {state === "error" && <p className="form-status error">Something went wrong. Please try again.</p>}
      </form>
    </>
  );
}

function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const login = async (event) => {
    event.preventDefault();
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) return setError("Login failed. Set ADMIN_PASSWORD in your environment first.");
    setAuthed(true);
  };
  const loadDashboard = async () => {
    const [messageResponse, statsResponse] = await Promise.all([fetch("/api/admin/messages"), fetch("/api/admin/stats")]);
    if (messageResponse.ok) setMessages(await messageResponse.json());
    if (statsResponse.ok) setStats(await statsResponse.json());
  };
  useEffect(() => { if (authed) loadDashboard(); }, [authed]);
  const updateMessage = async (id, status) => { await fetch(`/api/admin/messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); loadDashboard(); };
  const deleteMessage = async (id) => { await fetch(`/api/admin/messages/${id}`, { method: "DELETE" }); loadDashboard(); };
  if (!authed) return <><PageIntro label="Phase 06 / Private area" title={<>Admin<br /><em>dashboard.</em></>} copy="This area is password protected for managing contact messages and viewing basic project statistics." /><form id="admin-login-form" className="admin-login section-pad" onSubmit={login}><label>Admin password<input id="admin-password-input" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Configured in Replit Secrets" /></label><button id="admin-login-btn" className="button-link" type="submit">Log in <ArrowUpRight size={16} /></button>{error && <p className="form-status error">{error}</p>}</form></>;
  return <section className="admin-dashboard section-pad"><div className="admin-title"><div><p className="eyebrow">Phase 06 / Private area</p><h1>Admin<br /><em>dashboard.</em></h1></div><button id="admin-logout-btn" className="text-button" onClick={() => { setAuthed(false); fetch("/api/admin/logout", { method: "POST" }); }}>Log out</button></div><div className="stats-grid"><div><span>Total messages</span><strong>{stats?.totalMessages ?? 0}</strong></div><div><span>Unread</span><strong>{stats?.unreadMessages ?? 0}</strong></div><div><span>Media items</span><strong>{stats?.mediaItems ?? 0}</strong></div></div><div className="admin-section"><h2>Messages</h2>{messages.length === 0 ? <p className="muted">No messages yet.</p> : messages.map((message) => <article className="admin-message" key={message.id}><div><span>{message.status}</span><h3>{message.subject}</h3><p>{message.name} / {message.email}</p><p>{message.message}</p></div><div className="admin-actions"><button onClick={() => updateMessage(message.id, message.status === "read" ? "unread" : "read")}>{message.status === "read" ? "Mark unread" : "Mark read"}</button><button onClick={() => deleteMessage(message.id)}>Delete</button></div></article>)}</div></section>;
}

export default function App() {
  return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/media" element={<Media />} /><Route path="/future" element={<Future />} /><Route path="/choice-1" element={<ChoicePage number={1} />} /><Route path="/choice-2" element={<ChoicePage number={2} />} /><Route path="/contact" element={<Contact />} /><Route path="/admin" element={<Admin />} /></Routes></Layout>;
}