import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, Send, X } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/media", label: "Media" },
  { to: "/future", label: "Future" },
  { to: "/stocks", label: "Stock Game" },
  { to: "/choice-1", label: "Rainbow Six Siege" },
  { to: "/choice-2", label: "Boxing" },
  { to: "/contact", label: "Contact" }
];

const STOCK_GAME_KEY = "mason-rhine-stock-game";
const STARTING_CASH = 10000;
const STOCKS = [
  { symbol: "R6S", name: "Siege Systems", sector: "Gaming", price: 86, volatility: 0.08 },
  { symbol: "LARO", name: "Laroi Music", sector: "Entertainment", price: 52, volatility: 0.12 },
  { symbol: "BOX", name: "Roundhouse Athletics", sector: "Sports", price: 34, volatility: 0.1 },
  { symbol: "AUTO", name: "Velocity Motors", sector: "Automotive", price: 118, volatility: 0.06 }
];

function createInitialStockGame() {
  return {
    cash: STARTING_CASH,
    day: 1,
    holdings: {},
    prices: Object.fromEntries(STOCKS.map((stock) => [stock.symbol, stock.price])),
    changes: Object.fromEntries(STOCKS.map((stock) => [stock.symbol, 0])),
    activity: [{ day: 1, text: "The practice market opened with $10,000 in fake cash." }]
  };
}

function loadStockGame() {
  const freshGame = createInitialStockGame();
  if (typeof window === "undefined") return freshGame;
  try {
    const savedGame = JSON.parse(window.localStorage.getItem(STOCK_GAME_KEY));
    if (!savedGame || typeof savedGame !== "object") return freshGame;
    return {
      ...freshGame,
      ...savedGame,
      holdings: { ...freshGame.holdings, ...(savedGame.holdings || {}) },
      prices: { ...freshGame.prices, ...(savedGame.prices || {}) },
      changes: { ...freshGame.changes, ...(savedGame.changes || {}) },
      activity: Array.isArray(savedGame.activity) ? savedGame.activity.slice(0, 8) : freshGame.activity
    };
  } catch {
    return freshGame;
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

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
    <div className={`site-shell ${location.pathname === "/media" ? "media-shell" : ""}`.trim()}>
      <div className="grain" aria-hidden="true" />
      <header className="site-header">
        <NavLink className="wordmark" to="/" aria-label="Mason Rhine home">MR<span>.</span></NavLink>
        <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`main-nav ${open ? "is-open" : ""}`}>
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>)}
          <NavLink className="admin-link" to="/admin">Admin <ArrowUpRight size={14} /></NavLink>
        </nav>
      </header>
      <main>{children}</main>
      <AlbumPlayer />
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

function MediaImage({ src, alt, label, type, className = "", linkUrl }) {
  if (!src) return <PlaceholderMedia label={label} type={type} />;
  const image = <div className={`media-placeholder media-image ${className}`.trim()}><img src={src} alt={alt || label} /><div className="media-image-label"><span>{type}</span><strong>{label}</strong></div></div>;
  return linkUrl ? <a className="media-image-link" href={linkUrl} target="_blank" rel="noreferrer" aria-label={`Open ${label}`}>{image}</a> : image;
}

function AlbumPlayer() {
  return (
    <aside className="album-player" aria-label="The First Time album player">
      <div className="album-player-heading">
        <p className="eyebrow">Soundtrack</p>
        <strong>The First Time</strong>
        <span>The Kid LAROI</span>
      </div>
      <iframe
        title="The First Time by The Kid LAROI on Spotify"
        src="https://open.spotify.com/embed/album/63IolVUykZCHMlu2zu9jHS?utm_source=generator&theme=0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </aside>
  );
}

function PageIntro({ label, title, copy }) {
  return <div className="page-intro section-pad"><p className="eyebrow">{label}</p><h1>{title}</h1>{copy && <p className="page-copy">{copy}</p>}</div>;
}

function ChoiceVideo({ src, title }) {
  if (!src) return <PlaceholderMedia type="Choice page" label="TOPIC IMAGE" />;
  return <div className="choice-video-wrap"><video className="choice-video" controls playsInline preload="metadata" aria-label={title}><source src={src} type="video/mp4" /></video><span className="choice-video-label">{title}</span></div>;
}

function ChoiceVideos({ page, number }) {
  const videos = page?.videos || (page?.videoSrc ? [{ src: page.videoSrc, title: page.videoTitle || `Choice page 0${number} video` }] : []);
  if (videos.length === 0) return <ChoiceVideo title={`Choice page 0${number} video`} />;
  return <div className="choice-videos">{videos.map((video) => <ChoiceVideo key={video.src} src={video.src} title={video.title} />)}</div>;
}

function Home() {
  const content = useContent();
  const profile = content?.profile;
  const socialLinks = (profile?.socials || []).filter((social) => social.url?.startsWith("http"));
  return (
    <>
      <section className="hero section-pad">
        <div className="hero-copy">
          <p className="eyebrow">About me / 2026</p>
          <h1>{profile?.headline || "[Add your homepage headline]"}</h1>
          <p className="hero-intro">{profile?.shortBio || "Lorem ipsum placeholder for your introduction."}</p>
          {socialLinks.length > 0 && <div className="social-links" aria-label="Social links">{socialLinks.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noreferrer">{social.label} <ArrowUpRight size={13} /></a>)}</div>}
          <NavLink className="button-link" to="/media">Explore my work <ArrowUpRight size={16} /></NavLink>
        </div>
          <MediaImage src={profile?.profileImage} alt={profile?.profileImageAlt} label="PROFILE PHOTO" type="Home page" className="profile-photo" />
      </section>
      <section className="split-section section-pad">
        <div><p className="eyebrow">A little about me</p><span className="bio-symbol" aria-hidden="true">{profile?.bioSymbol}</span><h2>My story<br /><em>starts here.</em></h2></div>
        <div className="content-column"><p>{profile?.longBio || "Lorem ipsum placeholder for your longer biography."}</p>{profile?.bioVerse && <blockquote className="bio-verse"><p>“{profile.bioVerse.text}”</p><cite>{profile.bioVerse.reference}</cite></blockquote>}<div className="interest-tags">{(profile?.interests || []).map((interest) => <span key={interest}>{interest}</span>)}</div><div className="profile-highlights">{(profile?.highlights || []).map((highlight) => <span key={highlight}>{highlight}</span>)}</div><NavLink className="text-link" to="/future">See my future plans <ArrowUpRight size={16} /></NavLink></div>
      </section>
      <section className="home-photo-section section-pad">
        <div className="home-photo-heading"><p className="eyebrow">A moment from my life</p><h2>More<br /><em>of me.</em></h2></div>
        <MediaImage src={profile?.homeImage} alt={profile?.homeImageAlt} label="PERSONAL PHOTO" type="Homepage" className="home-photo" />
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
    <div className="media-page">
      <PageIntro label="Phase 02 / Gallery" title={<>My<br /><em>media.</em></>} copy="This gallery is ready for your original images, videos, audio, screenshots, and projects." />
      <section className="media-grid section-pad">
        {items.map((item) => <article className="media-card" key={item.id}><MediaImage src={item.src} alt={item.alt} type={item.type} label={item.title.toUpperCase()} linkUrl={item.linkUrl} /><div className="media-card-copy"><h2>{item.title}</h2><p>{item.description}</p><span>{item.status}</span>{item.sourceUrl && <a className="media-source" href={item.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={13} /></a>}</div></article>)}
      </section>
    </div>
  );
}

function Future() {
  const content = useContent();
  const future = content?.future;
  return (
    <>
      <PageIntro label="Phase 03 / Looking ahead" title={<>The<br /><em>future.</em></>} copy={future?.intro} />
      <section className="goal-list section-pad">
        {(future?.goals || []).map((goal) => <article className={`goal-card ${goal.image ? "has-image" : ""}`.trim()} key={goal.title}>{goal.image && <img className="goal-card-image" src={goal.image} alt={goal.imageAlt || goal.title} />}<span>Goal</span><h2>{goal.title}</h2><p>{goal.copy}</p></article>)}
      </section>
      <section className="quote-band section-pad"><p>“{future?.verse?.text || "[Add a verse or quote here.]"}”</p>{future?.verse?.reference && <span className="quote-reference">{future.verse.reference}</span>}</section>
    </>
  );
}

function StockGame() {
  const [game, setGame] = useState(loadStockGame);
  const [quantities, setQuantities] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    window.localStorage.setItem(STOCK_GAME_KEY, JSON.stringify(game));
  }, [game]);

  const holdingsValue = useMemo(
    () => STOCKS.reduce((total, stock) => total + (game.holdings[stock.symbol] || 0) * game.prices[stock.symbol], 0),
    [game.holdings, game.prices]
  );
  const portfolioValue = game.cash + holdingsValue;
  const profit = portfolioValue - STARTING_CASH;

  const changeQuantity = (symbol, value) => {
    setQuantities((current) => ({ ...current, [symbol]: value }));
  };

  const trade = (stock, direction) => {
    const quantity = Math.floor(Number(quantities[stock.symbol]));
    if (!Number.isFinite(quantity) || quantity < 1) {
      setMessage({ type: "error", text: "Enter at least 1 share before trading." });
      return;
    }
    const total = quantity * game.prices[stock.symbol];
    const owned = game.holdings[stock.symbol] || 0;
    if (direction === "buy" && total > game.cash) {
      setMessage({ type: "error", text: "That trade costs more than your available fake cash." });
      return;
    }
    if (direction === "sell" && quantity > owned) {
      setMessage({ type: "error", text: `You only own ${owned} ${stock.symbol} share${owned === 1 ? "" : "s"}.` });
      return;
    }
    setGame((current) => ({
      ...current,
      cash: current.cash + (direction === "buy" ? -total : total),
      holdings: {
        ...current.holdings,
        [stock.symbol]: owned + (direction === "buy" ? quantity : -quantity)
      },
      activity: [
        { day: current.day, text: `${direction === "buy" ? "Bought" : "Sold"} ${quantity} ${stock.symbol} share${quantity === 1 ? "" : "s"} at ${formatMoney(current.prices[stock.symbol])}.` },
        ...current.activity
      ].slice(0, 8)
    }));
    setQuantities((current) => ({ ...current, [stock.symbol]: "" }));
    setMessage({ type: "success", text: `${direction === "buy" ? "Buy" : "Sell"} complete. Keep watching your risk and cash.` });
  };

  const advanceMarket = () => {
    setGame((current) => {
      const changes = {};
      const prices = {};
      STOCKS.forEach((stock) => {
        const change = (Math.random() * 2 - 1) * stock.volatility;
        changes[stock.symbol] = change;
        prices[stock.symbol] = Math.max(1, current.prices[stock.symbol] * (1 + change));
      });
      return {
        ...current,
        day: current.day + 1,
        prices,
        changes,
        activity: [{ day: current.day + 1, text: `Market day ${current.day + 1} opened. Prices moved — check before you trade.` }, ...current.activity].slice(0, 8)
      };
    });
    setMessage({ type: "success", text: "A new market day started. Price changes are simulated for practice." });
  };

  const resetGame = () => {
    setGame(createInitialStockGame());
    setQuantities({});
    setMessage({ type: "success", text: "Your practice portfolio was reset to $10,000." });
  };

  return (
    <>
      <PageIntro
        label="Phase 07 / Practice investing"
        title={<>Stock<br /><em>game.</em></>}
        copy="Use fake money to buy and sell fake stocks, then learn how price changes, cash, and diversification affect a portfolio."
      />
      <section className="stock-game section-pad">
        <div className="stock-game-header">
          <div className="stock-stat">
            <span>Portfolio value</span>
            <strong>{formatMoney(portfolioValue)}</strong>
            <small className={profit >= 0 ? "stock-positive" : "stock-negative"}>{profit >= 0 ? "+" : ""}{formatMoney(profit)} since start</small>
          </div>
          <div className="stock-stat">
            <span>Available cash</span>
            <strong>{formatMoney(game.cash)}</strong>
            <small>Market day {game.day}</small>
          </div>
          <div className="stock-game-actions">
            <button className="button-link" type="button" onClick={advanceMarket}>Advance market day <ArrowUpRight size={16} /></button>
            <button className="text-button" type="button" onClick={resetGame}>Reset game</button>
          </div>
        </div>
        {message.text && <p className={`stock-message ${message.type}`}>{message.text}</p>}
        <div className="stock-game-grid">
          <section className="stock-market-panel" aria-labelledby="market-heading">
            <div className="stock-panel-heading">
              <div><p className="eyebrow">Fake exchange</p><h2 id="market-heading">Choose your<br /><em>stocks.</em></h2></div>
              <span>Prices update each market day</span>
            </div>
            <div className="stock-list">
              {STOCKS.map((stock) => {
                const change = game.changes[stock.symbol] || 0;
                return (
                  <article className="stock-row" key={stock.symbol}>
                    <div className="stock-identity"><span className="stock-symbol">{stock.symbol}</span><div><h3>{stock.name}</h3><p>{stock.sector}</p></div></div>
                    <div className="stock-quote"><strong>{formatMoney(game.prices[stock.symbol])}</strong><span className={change >= 0 ? "stock-positive" : "stock-negative"}>{change >= 0 ? "+" : ""}{(change * 100).toFixed(2)}%</span></div>
                    <div className="stock-trade-controls">
                      <label htmlFor={`quantity-${stock.symbol}`}>Shares<input id={`quantity-${stock.symbol}`} type="number" min="1" step="1" value={quantities[stock.symbol] || ""} onChange={(event) => changeQuantity(stock.symbol, event.target.value)} placeholder="0" /></label>
                      <button type="button" onClick={() => trade(stock, "buy")}>Buy</button>
                      <button type="button" onClick={() => trade(stock, "sell")}>Sell</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          <aside className="stock-portfolio-panel" aria-labelledby="portfolio-heading">
            <div className="stock-panel-heading"><div><p className="eyebrow">Your position</p><h2 id="portfolio-heading">My<br /><em>portfolio.</em></h2></div></div>
            <div className="stock-portfolio-summary"><span>Invested value</span><strong>{formatMoney(holdingsValue)}</strong></div>
            <div className="stock-holdings">
              {STOCKS.map((stock) => <div className="stock-holding" key={stock.symbol}><span>{stock.symbol}</span><strong>{game.holdings[stock.symbol] || 0} shares</strong><small>{formatMoney((game.holdings[stock.symbol] || 0) * game.prices[stock.symbol])}</small></div>)}
            </div>
            <div className="stock-activity"><p className="eyebrow">Activity</p>{game.activity.map((item, index) => <p key={`${item.day}-${index}`}><span>DAY {item.day}</span>{item.text}</p>)}</div>
          </aside>
        </div>
      </section>
      <section className="stock-lessons section-pad">
        <div><p className="eyebrow">Learn while you play</p><h2>Practice<br /><em>the basics.</em></h2></div>
        <div className="stock-lesson-list">
          <article><span>01 / Diversification</span><h3>Do not put everything in one stock.</h3><p>Spreading fake money across different industries can reduce the impact of one company having a bad day.</p></article>
          <article><span>02 / Volatility</span><h3>Price movement is part of the risk.</h3><p>More volatile stocks can move up or down faster. Bigger possible gains also mean bigger possible losses.</p></article>
          <article><span>03 / Patience</span><h3>A single day does not tell the whole story.</h3><p>Use several market days to notice trends, and remember that this game is practice — not financial advice.</p></article>
        </div>
      </section>
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
          <ChoiceVideos page={page} number={number} />
         <div className="choice-sections">{(page?.sections || []).map((section) => {
           const title = typeof section === "string" ? section : section.title;
           const copy = typeof section === "string" ? "Lorem ipsum placeholder. Add your writing, facts, opinions, or instructions here." : section.copy;
           return <article key={title}><p className="eyebrow">Section</p><h2>{title}</h2><p>{copy}</p></article>;
         })}</div>
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
      <form className="contact-form section-pad" onSubmit={submit}>
        <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
        <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
        <label>Subject<input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="What is this about?" /></label>
        <label>Message<textarea required rows="6" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Write your message here..." /></label>
        <button className="button-link" type="submit" disabled={state === "sending"}>{state === "sending" ? "Saving..." : "Send message"} <Send size={16} /></button>
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
  if (!authed) return <><PageIntro label="Phase 06 / Private area" title={<>Admin<br /><em>dashboard.</em></>} copy="This area is password protected for managing contact messages and viewing basic project statistics." /><form className="admin-login section-pad" onSubmit={login}><label>Admin password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Configured in Replit Secrets" /></label><button className="button-link" type="submit">Log in <ArrowUpRight size={16} /></button>{error && <p className="form-status error">{error}</p>}</form></>;
  return <section className="admin-dashboard section-pad"><div className="admin-title"><div><p className="eyebrow">Phase 06 / Private area</p><h1>Admin<br /><em>dashboard.</em></h1></div><button className="text-button" onClick={() => { setAuthed(false); fetch("/api/admin/logout", { method: "POST" }); }}>Log out</button></div><div className="stats-grid"><div><span>Total messages</span><strong>{stats?.totalMessages ?? 0}</strong></div><div><span>Unread</span><strong>{stats?.unreadMessages ?? 0}</strong></div><div><span>Media items</span><strong>{stats?.mediaItems ?? 0}</strong></div></div><div className="admin-section"><h2>Messages</h2>{messages.length === 0 ? <p className="muted">No messages yet.</p> : messages.map((message) => <article className="admin-message" key={message.id}><div><span>{message.status}</span><h3>{message.subject}</h3><p>{message.name} / {message.email}</p><p>{message.message}</p></div><div className="admin-actions"><button onClick={() => updateMessage(message.id, message.status === "read" ? "unread" : "read")}>{message.status === "read" ? "Mark unread" : "Mark read"}</button><button onClick={() => deleteMessage(message.id)}>Delete</button></div></article>)}</div></section>;
}

export default function App() {
  return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/media" element={<Media />} /><Route path="/future" element={<Future />} /><Route path="/stocks" element={<StockGame />} /><Route path="/choice-1" element={<ChoicePage number={1} />} /><Route path="/choice-2" element={<ChoicePage number={2} />} /><Route path="/contact" element={<Contact />} /><Route path="/admin" element={<Admin />} /></Routes></Layout>;
}