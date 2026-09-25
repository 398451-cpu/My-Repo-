import { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, Menu, Send, X } from "lucide-react";
import BoxingGame from "./boxing/BoxingGame";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/media", label: "Media" },
  { to: "/future", label: "Future" },
  { to: "/stocks", label: "Stock Game" },
  { to: "/choice-1", label: "Rainbow Six Siege" },
  { to: "/choice-2", label: "Boxing" },
  { to: "/boxing-game", label: "Boxing Game" },
  { to: "/contact", label: "Contact" }
];

const STOCK_GAME_KEY = "mason-rhine-stock-game";
const STARTING_CASH = 10000;
const STOCKS = [
  { symbol: "R6S", name: "Siege Systems", sector: "Gaming", price: 86, volatility: 0.08, outlook: 78 },
  { symbol: "LARO", name: "Laroi Music", sector: "Entertainment", price: 52, volatility: 0.12, outlook: 69 },
  { symbol: "BOX", name: "Roundhouse Athletics", sector: "Sports", price: 34, volatility: 0.1, outlook: 43 },
  { symbol: "AUTO", name: "Velocity Motors", sector: "Automotive", price: 118, volatility: 0.06, outlook: 57 }
];
const BILLING_CYCLE_DAYS = 5;
const LIFESTYLE_ASSETS = [
  {
    id: "studio-apartment",
    name: "Starter apartment",
    category: "Home",
    description: "A first place of your own with manageable recurring costs.",
    price: 4200,
    purchaseTaxRate: 0.03,
    recurringCosts: [
      { kind: "tax", label: "Property tax", amount: 42 },
      { kind: "bill", label: "Utilities", amount: 48 }
    ]
  },
  {
    id: "starter-house",
    name: "Starter house",
    category: "Home",
    description: "More room, along with higher taxes and upkeep.",
    price: 7600,
    purchaseTaxRate: 0.03,
    recurringCosts: [
      { kind: "tax", label: "Property tax", amount: 76 },
      { kind: "bill", label: "Utilities", amount: 58 },
      { kind: "bill", label: "Home upkeep", amount: 28 }
    ]
  },
  {
    id: "used-car",
    name: "Used car",
    category: "Car",
    description: "A practical ride with insurance, fuel, and registration costs.",
    price: 2800,
    purchaseTaxRate: 0.07,
    recurringCosts: [
      { kind: "tax", label: "Vehicle tax", amount: 18 },
      { kind: "bill", label: "Insurance", amount: 42 },
      { kind: "bill", label: "Fuel and maintenance", amount: 55 }
    ]
  },
  {
    id: "compact-car",
    name: "New compact car",
    category: "Car",
    description: "A newer car with a higher price and larger insurance bill.",
    price: 5900,
    purchaseTaxRate: 0.07,
    recurringCosts: [
      { kind: "tax", label: "Vehicle tax", amount: 35 },
      { kind: "bill", label: "Insurance", amount: 68 },
      { kind: "bill", label: "Fuel and maintenance", amount: 48 }
    ]
  },
  {
    id: "laptop",
    name: "Laptop",
    category: "Personal",
    description: "A useful one-time purchase with no recurring charges.",
    price: 950,
    purchaseTaxRate: 0.08,
    recurringCosts: []
  },
  {
    id: "game-console",
    name: "Game console",
    category: "Personal",
    description: "A little fun for your new home. No monthly bill.",
    price: 500,
    purchaseTaxRate: 0.08,
    recurringCosts: []
  },
  {
    id: "sofa",
    name: "Living-room sofa",
    category: "Personal",
    description: "Furniture that adds comfort without adding bills.",
    price: 750,
    purchaseTaxRate: 0.08,
    recurringCosts: []
  }
];

function createInitialStockGame() {
  return {
    cash: STARTING_CASH,
    day: 1,
    holdings: {},
    ownedAssets: {},
    debt: 0,
    prices: Object.fromEntries(STOCKS.map((stock) => [stock.symbol, stock.price])),
    changes: Object.fromEntries(STOCKS.map((stock) => [stock.symbol, 0])),
    priceHistory: Object.fromEntries(STOCKS.map((stock) => [stock.symbol, [{ day: 1, price: stock.price }]])),
    activity: [{ day: 1, text: "The practice market opened with $10,000 in fake cash." }]
  };
}

function loadStockGame() {
  const freshGame = createInitialStockGame();
  if (typeof window === "undefined") return freshGame;
  try {
    const savedGame = JSON.parse(window.localStorage.getItem(STOCK_GAME_KEY));
    if (!savedGame || typeof savedGame !== "object") return freshGame;
    const savedDay = Math.max(1, Math.floor(Number(savedGame.day) || 1));
    const priceHistory = Object.fromEntries(STOCKS.map((stock) => {
      const existingPoints = savedGame.priceHistory?.[stock.symbol];
      const validPoints = Array.isArray(existingPoints)
        ? existingPoints.filter((point) => Number.isFinite(Number(point?.day)) && Number.isFinite(Number(point?.price)) && Number(point.price) > 0)
          .map((point) => ({ day: Number(point.day), price: Number(point.price) }))
        : [];
      const currentPrice = Number(savedGame.prices?.[stock.symbol]);
      return [stock.symbol, validPoints.length
        ? validPoints.slice(-30)
        : [{ day: savedDay, price: Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : stock.price }]];
    }));
    return {
      ...freshGame,
      ...savedGame,
      holdings: { ...freshGame.holdings, ...(savedGame.holdings || {}) },
      ownedAssets: Object.fromEntries(LIFESTYLE_ASSETS.map((asset) => [
        asset.id,
        Math.max(0, Math.floor(Number(savedGame.ownedAssets?.[asset.id]) || 0))
      ])),
      debt: Number.isFinite(Number(savedGame.debt)) && Number(savedGame.debt) > 0 ? Number(savedGame.debt) : 0,
      prices: { ...freshGame.prices, ...(savedGame.prices || {}) },
      changes: { ...freshGame.changes, ...(savedGame.changes || {}) },
      priceHistory,
      activity: Array.isArray(savedGame.activity) ? savedGame.activity.slice(0, 8) : freshGame.activity
    };
  } catch {
    return freshGame;
  }
}

function getLifestyleTotals(ownedAssets = {}) {
  return LIFESTYLE_ASSETS.reduce((totals, asset) => {
    const quantity = Math.max(0, Math.floor(Number(ownedAssets[asset.id]) || 0));
    totals.value += asset.price * quantity;
    asset.recurringCosts.forEach((cost) => {
      totals[cost.kind === "tax" ? "taxes" : "bills"] += cost.amount * quantity;
    });
    return totals;
  }, { value: 0, taxes: 0, bills: 0 });
}

function getAssetPurchaseCost(asset) {
  const tax = Number((asset.price * asset.purchaseTaxRate).toFixed(2));
  return { tax, total: asset.price + tax };
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function getStockReturn(stock, currentPrice) {
  return ((currentPrice / stock.price) - 1) * 100;
}

function StockPriceChart({ stock, points, currentPrice }) {
  const chartPoints = points.length ? points : [{ day: 1, price: stock.price }];
  const prices = chartPoints.map((point) => point.price);
  const minimumPrice = Math.min(...prices);
  const maximumPrice = Math.max(...prices);
  const spread = Math.max(maximumPrice - minimumPrice, maximumPrice * 0.08, 1);
  const chartMinimum = Math.max(0, minimumPrice - spread * 0.15);
  const chartMaximum = maximumPrice + spread * 0.15;
  const chartWidth = 820;
  const chartHeight = 340;
  const chartMargin = { top: 30, right: 142, bottom: 64, left: 92 };
  const plotWidth = chartWidth - chartMargin.left - chartMargin.right;
  const plotHeight = chartHeight - chartMargin.top - chartMargin.bottom;
  const xFor = (index) => chartMargin.left + (chartPoints.length === 1 ? plotWidth / 2 : (index / (chartPoints.length - 1)) * plotWidth);
  const yFor = (price) => chartMargin.top + ((chartMaximum - price) / (chartMaximum - chartMinimum)) * plotHeight;
  const linePath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point.price)}`).join(" ");
  const gridValues = Array.from({ length: 5 }, (_, index) => chartMaximum - ((chartMaximum - chartMinimum) * index) / 4);
  const tickCount = Math.min(6, chartPoints.length);
  const xTickIndexes = tickCount === 1
    ? [0]
    : [...new Set(Array.from({ length: tickCount }, (_, index) => Math.round((index / (tickCount - 1)) * (chartPoints.length - 1))))];
  const firstPrice = chartPoints[0].price;
  const periodChange = ((currentPrice / firstPrice) - 1) * 100;
  const lineTone = periodChange > 0.01 ? "up" : periodChange < -0.01 ? "down" : "neutral";
  const latestPoint = chartPoints[chartPoints.length - 1];
  const latestY = yFor(latestPoint.price);
  const latestLabelX = chartPoints.length === 1 ? xFor(0) - 58 : chartWidth - chartMargin.right + 12;
  const latestLabelY = chartPoints.length === 1
    ? latestY - 45 >= chartMargin.top
      ? latestY - 45
      : Math.min(latestY + 14, chartHeight - chartMargin.bottom - 30)
    : Math.max(chartMargin.top, Math.min(latestY - 15, chartHeight - chartMargin.bottom - 30));

  return (
    <section className="stock-price-chart" id="stock-price-chart" aria-labelledby="stock-chart-heading">
      <div className="stock-chart-header">
        <div>
          <p className="eyebrow">Fictional stock / Price history</p>
          <h3 id="stock-chart-heading">{stock.name} <span>{stock.symbol}</span></h3>
          <p className="stock-chart-range">{chartPoints.length === 1 ? `Market day ${chartPoints[0].day} · Advance the market to add graph points` : `Last ${chartPoints.length} saved market days`}</p>
          <div className="stock-chart-legend" role="group" aria-label={`Chart legend: ${stock.name} practice share price`}>
            <span className={`stock-chart-legend-swatch ${lineTone}`} aria-hidden="true" />
            <span>{stock.symbol} <span className="stock-chart-legend-divider">/</span> practice share price</span>
          </div>
        </div>
        <div className="stock-chart-stat">
          <span>Latest practice price</span>
          <strong>{formatMoney(currentPrice)}</strong>
          <small className={periodChange >= 0 ? "stock-positive" : "stock-negative"}>{periodChange >= 0 ? "+" : ""}{periodChange.toFixed(2)}% over chart period</small>
        </div>
      </div>
      <div className="stock-chart-scroll">
        <svg className="stock-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`${stock.name} price chart across ${chartPoints.length} saved market days. Current price ${formatMoney(currentPrice)}.`}>
          <rect className="stock-chart-plot-background" x={chartMargin.left} y={chartMargin.top} width={plotWidth} height={plotHeight} />
          {chartPoints.length >= 5 && Array.from({ length: chartPoints.length - 1 }, (_, index) => index)
            .filter((index) => index % 4 === 0)
            .map((index) => {
              const endIndex = Math.min(index + 2, chartPoints.length - 1);
              return (
                <rect
                  className="stock-chart-interval-shade"
                  key={`interval-${index}`}
                  x={xFor(index)}
                  y={chartMargin.top}
                  width={xFor(endIndex) - xFor(index)}
                  height={plotHeight}
                />
              );
            })}
          {gridValues.map((value, index) => {
            const y = chartMargin.top + (index / (gridValues.length - 1)) * plotHeight;
            return (
              <g key={index}>
                <line className="stock-chart-gridline" x1={chartMargin.left} x2={chartWidth - chartMargin.right} y1={y} y2={y} />
                <text className="stock-chart-label" x={chartMargin.left - 12} y={y + 4} textAnchor="end">{formatMoney(value)}</text>
              </g>
            );
          })}
          <line className="stock-chart-axis-line" x1={chartMargin.left} x2={chartWidth - chartMargin.right} y1={chartHeight - chartMargin.bottom} y2={chartHeight - chartMargin.bottom} />
          <path className={`stock-chart-line ${lineTone}`} d={linePath} />
          {chartPoints.map((point, index) => (
            <circle className="stock-chart-hit-target" key={`hit-${point.day}-${index}`} cx={xFor(index)} cy={yFor(point.price)} r="10">
              <title>{`Market day ${point.day}: ${formatMoney(point.price)}`}</title>
            </circle>
          ))}
          {chartPoints.length < 10 && chartPoints.map((point, index) => (
            <circle className={`stock-chart-point ${lineTone}`} key={`${point.day}-${index}`} cx={xFor(index)} cy={yFor(point.price)} r="4">
              <title>{`Day ${point.day}: ${formatMoney(point.price)}`}</title>
            </circle>
          ))}
          {chartPoints.length > 1 && (
            <line className={`stock-chart-latest-connector ${lineTone}`} x1={xFor(chartPoints.length - 1)} x2={latestLabelX} y1={latestY} y2={latestLabelY + 15} />
          )}
          <circle className={`stock-chart-latest-point ${lineTone}`} cx={xFor(chartPoints.length - 1)} cy={latestY} r="5" />
          <g className={`stock-chart-latest-label ${lineTone}`} aria-hidden="true">
            <rect x={latestLabelX} y={latestLabelY} width="116" height="30" rx="3" />
            <text x={latestLabelX + 58} y={latestLabelY + 20} textAnchor="middle">{formatMoney(currentPrice)}</text>
          </g>
          {xTickIndexes.map((index) => (
            <g className="stock-chart-tick" key={index}>
              <line x1={xFor(index)} x2={xFor(index)} y1={chartHeight - chartMargin.bottom} y2={chartHeight - chartMargin.bottom + 5} />
              <text className="stock-chart-label" x={xFor(index)} y={chartHeight - 39} textAnchor="middle">{`Day ${chartPoints[index].day}`}</text>
            </g>
          ))}
          <text className="stock-chart-axis-title" x={chartMargin.left} y={chartHeight - 10}>MARKET DAY</text>
        </svg>
      </div>
      <p className="stock-chart-disclaimer">Practice prices only. Past changes do not predict future results.</p>
    </section>
  );
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
  const [selectedStock, setSelectedStock] = useState(STOCKS[0].symbol);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    window.localStorage.setItem(STOCK_GAME_KEY, JSON.stringify(game));
  }, [game]);

  const holdingsValue = useMemo(
    () => STOCKS.reduce((total, stock) => total + (game.holdings[stock.symbol] || 0) * game.prices[stock.symbol], 0),
    [game.holdings, game.prices]
  );
  const lifestyleTotals = useMemo(() => getLifestyleTotals(game.ownedAssets), [game.ownedAssets]);
  const netWorth = game.cash + holdingsValue + lifestyleTotals.value - game.debt;
  const profit = netWorth - STARTING_CASH;
  const averageDailyMove = game.day > 1
    ? STOCKS.reduce((total, stock) => total + (game.changes[stock.symbol] || 0), 0) / STOCKS.length
    : 0;
  const marketState = game.day === 1
    ? { label: "Waiting for market", tone: "neutral" }
    : averageDailyMove > 0.005
      ? { label: "Market is up", tone: "up" }
      : averageDailyMove < -0.005
        ? { label: "Market is down", tone: "down" }
        : { label: "Mixed market", tone: "neutral" };

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

  const buyAsset = (asset) => {
    const purchase = getAssetPurchaseCost(asset);
    if (purchase.total > game.cash) {
      setMessage({ type: "error", text: `You need ${formatMoney(purchase.total)} including tax to buy the ${asset.name.toLowerCase()}.` });
      return;
    }
    setGame((current) => ({
      ...current,
      cash: current.cash - purchase.total,
      ownedAssets: {
        ...current.ownedAssets,
        [asset.id]: (current.ownedAssets[asset.id] || 0) + 1
      },
      activity: [
        { day: current.day, text: `Bought ${asset.name} for ${formatMoney(purchase.total)}, including ${formatMoney(purchase.tax)} purchase tax.` },
        ...current.activity
      ].slice(0, 8)
    }));
    setMessage({ type: "success", text: `${asset.name} purchased. ${formatMoney(purchase.tax)} purchase tax was added.` });
  };

  const payOutstandingBills = () => {
    const outstanding = Math.max(0, Number(game.debt) || 0);
    const payment = Math.min(game.cash, outstanding);
    if (payment <= 0) {
      setMessage({
        type: outstanding > 0 ? "error" : "success",
        text: outstanding > 0 ? "You need available cash before you can pay overdue bills." : "You have no overdue bills."
      });
      return;
    }
    setGame((current) => ({
      ...current,
      cash: current.cash - payment,
      debt: Math.max(0, current.debt - payment),
      activity: [
        { day: current.day, text: `Paid ${formatMoney(payment)} toward overdue taxes and bills.` },
        ...current.activity
      ].slice(0, 8)
    }));
    setMessage({
      type: payment < outstanding ? "error" : "success",
      text: payment < outstanding
        ? `${formatMoney(payment)} paid. ${formatMoney(outstanding - payment)} is still owed.`
        : `Overdue bills paid: ${formatMoney(payment)}.`
    });
  };

  const advanceMarket = () => {
    const sharedMarketMove = (Math.random() * 2 - 1) * 0.025;
    const dailyMoves = Object.fromEntries(STOCKS.map((stock) => {
      const outlookEffect = ((stock.outlook - 50) / 50) * stock.volatility * 0.35;
      const companyMovement = (Math.random() * 2 - 1) * stock.volatility * 0.6;
      return [stock.symbol, Math.max(-0.15, Math.min(0.15, sharedMarketMove + outlookEffect + companyMovement))];
    }));
    const nextDay = game.day + 1;
    const billingDay = nextDay % BILLING_CYCLE_DAYS === 0;
    const billTotals = getLifestyleTotals(game.ownedAssets);
    const invoice = billingDay ? billTotals.taxes + billTotals.bills + game.debt : 0;
    const payment = Math.min(game.cash, invoice);
    const remainingDebt = invoice - payment;

    setGame((current) => {
      const changes = {};
      const prices = {};
      const priceHistory = {};
      const currentBillTotals = getLifestyleTotals(current.ownedAssets);
      const currentInvoice = billingDay ? currentBillTotals.taxes + currentBillTotals.bills + current.debt : 0;
      const currentPayment = Math.min(current.cash, currentInvoice);
      STOCKS.forEach((stock) => {
        const change = dailyMoves[stock.symbol];
        changes[stock.symbol] = change;
        prices[stock.symbol] = Math.max(1, current.prices[stock.symbol] * (1 + change));
        const previousPoints = current.priceHistory?.[stock.symbol] || [{ day: current.day, price: current.prices[stock.symbol] }];
        priceHistory[stock.symbol] = [...previousPoints, { day: nextDay, price: prices[stock.symbol] }].slice(-30);
      });
      const billActivity = billingDay && currentInvoice > 0
        ? [{
          day: nextDay,
          text: `Taxes ${formatMoney(currentBillTotals.taxes)} + bills ${formatMoney(currentBillTotals.bills)}; paid ${formatMoney(currentPayment)}${currentInvoice > currentPayment ? `, ${formatMoney(currentInvoice - currentPayment)} overdue` : ""}.`
        }]
        : [];
      return {
        ...current,
        day: nextDay,
        cash: current.cash - currentPayment,
        debt: billingDay ? Math.max(0, currentInvoice - currentPayment) : current.debt,
        prices,
        changes,
        priceHistory,
        activity: [...billActivity, { day: nextDay, text: `Market day ${nextDay} opened. Prices moved — check before you trade.` }, ...current.activity].slice(0, 8)
      };
    });
    if (invoice > 0) {
      setMessage({
        type: remainingDebt > 0 ? "error" : "success",
        text: remainingDebt > 0
          ? `Billing day: ${formatMoney(payment)} paid; ${formatMoney(remainingDebt)} added to overdue bills.`
          : `Billing day: ${formatMoney(invoice)} in taxes and bills paid.`
      });
    } else {
      setMessage({ type: "success", text: "A new market day started. Price changes are simulated for practice." });
    }
  };

  const resetGame = () => {
    setGame(createInitialStockGame());
    setQuantities({});
    setMessage({ type: "success", text: "Your practice finances were reset to $10,000." });
  };

  return (
    <>
      <PageIntro
        label="Phase 07 / Practice investing"
        title={<>Stock<br /><em>game.</em></>}
        copy="Use fake money to trade stocks, buy a home or car, and learn how taxes, bills, and investing affect your finances."
      />
      <section className="stock-game section-pad">
        <div className="stock-game-header">
          <div className="stock-stat">
            <span>Net worth</span>
            <strong>{formatMoney(netWorth)}</strong>
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
        <section className="stock-state-tracker" aria-label="Market state tracker">
          <div className={`market-state-summary ${marketState.tone}`}>
            <p className="eyebrow">Market state / Day {game.day}</p>
            <strong>{marketState.label}</strong>
            <span className={averageDailyMove >= 0 ? "stock-positive" : "stock-negative"}>
              {game.day === 1 ? "Price changes begin when you advance the market" : `${averageDailyMove >= 0 ? "+" : ""}${(averageDailyMove * 100).toFixed(2)}% average today`}
            </span>
          </div>
          <div className="market-state-stocks">
            {STOCKS.map((stock) => {
              const totalReturn = getStockReturn(stock, game.prices[stock.symbol]);
              const trend = totalReturn > 0.5 ? "up" : totalReturn < -0.5 ? "down" : "neutral";
              return (
                <div className="market-state-stock" key={stock.symbol}>
                  <div><strong>{stock.symbol}</strong><span>{stock.outlook}% outlook</span></div>
                  <span className={`market-trend ${trend}`}>{trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Steady"}</span>
                  <strong className={totalReturn >= 0 ? "stock-positive" : "stock-negative"}>{totalReturn >= 0 ? "+" : ""}{totalReturn.toFixed(2)}%</strong>
                </div>
              );
            })}
          </div>
          <p className="market-state-note">Fake outlook scores influence simulated prices; they are not real company data or investment advice.</p>
        </section>
        <div className="stock-game-grid">
          <section className="stock-market-panel" aria-labelledby="market-heading">
            <div className="stock-panel-heading">
              <div><p className="eyebrow">Fake exchange</p><h2 id="market-heading">Choose your<br /><em>stocks.</em></h2></div>
              <span>Select a stock to see its price graph</span>
            </div>
            <div className="stock-list">
              {STOCKS.map((stock) => {
                const change = game.changes[stock.symbol] || 0;
                return (
                  <article className="stock-row" key={stock.symbol}>
                    <button className={`stock-select ${selectedStock === stock.symbol ? "is-selected" : ""}`} type="button" onClick={() => setSelectedStock(stock.symbol)} aria-pressed={selectedStock === stock.symbol} aria-label={`Show ${stock.name} price graph`}>
                      <span className="stock-symbol">{stock.symbol}</span><span className="stock-select-copy"><strong>{stock.name}</strong><small>{stock.sector} / {stock.outlook}% outlook</small></span>
                    </button>
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
            <StockPriceChart
              stock={STOCKS.find((stock) => stock.symbol === selectedStock) || STOCKS[0]}
              points={game.priceHistory?.[selectedStock] || []}
              currentPrice={game.prices[selectedStock] || STOCKS[0].price}
            />
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
        <section className="lifestyle-panel" aria-labelledby="lifestyle-heading">
          <div className="lifestyle-heading">
            <div>
              <p className="eyebrow">Everyday economy</p>
              <h2 id="lifestyle-heading">Buy a home.<br /><em>Build a life.</em></h2>
            </div>
            <p className="lifestyle-cycle-note">Purchase tax is due when you buy. Property and vehicle taxes, utilities, insurance, and upkeep are charged every {BILLING_CYCLE_DAYS} market days.</p>
          </div>
          <div className="lifestyle-layout">
            <div className="lifestyle-shop" aria-label="Homes, cars, and things for sale">
              {LIFESTYLE_ASSETS.map((asset) => {
                const purchase = getAssetPurchaseCost(asset);
                const assetTaxes = asset.recurringCosts.filter((cost) => cost.kind === "tax").reduce((sum, cost) => sum + cost.amount, 0);
                const assetBills = asset.recurringCosts.filter((cost) => cost.kind === "bill").reduce((sum, cost) => sum + cost.amount, 0);
                const quantity = game.ownedAssets[asset.id] || 0;
                const canAfford = game.cash >= purchase.total;
                return (
                  <article className="lifestyle-item" key={asset.id}>
                    <div className="lifestyle-item-meta">
                      <span className={`lifestyle-category ${asset.category.toLowerCase()}`}>{asset.category}</span>
                      <span className="lifestyle-owned">{quantity > 0 ? `Owned ×${quantity}` : "Not owned"}</span>
                    </div>
                    <h3>{asset.name}</h3>
                    <p className="lifestyle-item-description">{asset.description}</p>
                    <div className="lifestyle-price-line"><span>Price</span><strong>{formatMoney(asset.price)}</strong></div>
                    <div className="lifestyle-price-line tax"><span>Purchase tax</span><span>{formatMoney(purchase.tax)} ({(asset.purchaseTaxRate * 100).toFixed(0)}%)</span></div>
                    {assetTaxes + assetBills > 0
                      ? <p className="lifestyle-recurring">Every {BILLING_CYCLE_DAYS} days: {formatMoney(assetTaxes)} tax + {formatMoney(assetBills)} bills</p>
                      : <p className="lifestyle-recurring no-bills">No recurring bills</p>}
                    <button
                      className="lifestyle-buy-button"
                      type="button"
                      data-lifestyle-asset={asset.id}
                      onClick={() => buyAsset(asset)}
                      disabled={!canAfford}
                      aria-label={canAfford ? `Buy ${asset.name} for ${formatMoney(purchase.total)} including tax` : `Cannot afford ${asset.name}`}
                    >
                      {canAfford ? `Buy · ${formatMoney(purchase.total)}` : "Not enough cash"}
                    </button>
                  </article>
                );
              })}
            </div>
            <aside className="lifestyle-summary" aria-label="Household finances">
              <p className="eyebrow">Your household</p>
              <div className="lifestyle-total"><span>Home, car & personal items</span><strong>{formatMoney(lifestyleTotals.value)}</strong></div>
              <div className="lifestyle-ownership">
                {LIFESTYLE_ASSETS.filter((asset) => (game.ownedAssets[asset.id] || 0) > 0).length === 0
                  ? <p className="lifestyle-empty">No home, car, or goods yet. Choose something to buy.</p>
                  : LIFESTYLE_ASSETS.filter((asset) => (game.ownedAssets[asset.id] || 0) > 0).map((asset) => (
                    <div className="lifestyle-owned-row" key={asset.id}>
                      <span>{asset.name} <small>×{game.ownedAssets[asset.id]}</small></span>
                      <strong>{formatMoney(asset.price * game.ownedAssets[asset.id])}</strong>
                    </div>
                  ))}
              </div>
              <div className="lifestyle-bill-cycle">
                <div className="lifestyle-cycle-header">
                  <div><span>Next tax & bill day</span><strong>In {BILLING_CYCLE_DAYS - (game.day % BILLING_CYCLE_DAYS)} market days</strong></div>
                  <small>Every {BILLING_CYCLE_DAYS} days</small>
                </div>
                <div className="lifestyle-owned-row"><span>Property & vehicle taxes</span><strong>{formatMoney(lifestyleTotals.taxes)}</strong></div>
                <div className="lifestyle-owned-row"><span>Utilities, insurance & upkeep</span><strong>{formatMoney(lifestyleTotals.bills)}</strong></div>
                <div className="lifestyle-owned-row lifestyle-cycle-total"><span>Estimated next charges</span><strong>{formatMoney(lifestyleTotals.taxes + lifestyleTotals.bills)}</strong></div>
              </div>
              <div className={`lifestyle-debt ${game.debt > 0 ? "has-debt" : ""}`}>
                <div><span>Overdue taxes & bills</span><strong>{formatMoney(game.debt)}</strong></div>
                {game.debt > 0 && (
                  <button className="lifestyle-pay-button" type="button" onClick={payOutstandingBills} disabled={game.cash <= 0}>
                    Pay from available cash
                  </button>
                )}
              </div>
            </aside>
          </div>
        </section>
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
  return <Layout><Routes><Route path="/" element={<Home />} /><Route path="/media" element={<Media />} /><Route path="/future" element={<Future />} /><Route path="/stocks" element={<StockGame />} /><Route path="/choice-1" element={<ChoicePage number={1} />} /><Route path="/choice-2" element={<ChoicePage number={2} />} /><Route path="/boxing-game" element={<BoxingGame />} /><Route path="/contact" element={<Contact />} /><Route path="/admin" element={<Admin />} /></Routes></Layout>;
}