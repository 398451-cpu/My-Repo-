import { useRef, useState } from "react";
import "./boxing-game.css";

const CAREER_KEY = "boxing-career-v1";
const ACTIONS = [
  { id: "jab", label: "Jab", note: "Quick · measure" },
  { id: "cross", label: "Cross", note: "Straight · commit" },
  { id: "hook", label: "Hook", note: "Arc · close range" },
  { id: "guard", label: "Guard", note: "Cover · read" },
  { id: "recover", label: "Recover", note: "Breathe · reset" },
];

const blankCareer = () => ({
  fighter: null,
  cash: 250,
  wins: 0,
  losses: 0,
  draws: 0,
  fight: null,
  creditedFightIds: [],
});

function loadCareer() {
  try {
    const raw = window.localStorage.getItem(CAREER_KEY);
    if (!raw) return blankCareer();
    const saved = JSON.parse(raw);
    return {
      ...blankCareer(),
      ...saved,
      cash: Number.isFinite(saved.cash) ? saved.cash : 250,
      wins: Number.isFinite(saved.wins) ? saved.wins : 0,
      losses: Number.isFinite(saved.losses) ? saved.losses : 0,
      draws: Number.isFinite(saved.draws) ? saved.draws : 0,
      creditedFightIds: Array.isArray(saved.creditedFightIds) ? saved.creditedFightIds : [],
    };
  } catch {
    return blankCareer();
  }
}

async function postBoxing(payload) {
  const response = await fetch("/api/boxing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The club could not read the server's reply. Try again.");
  }
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || result?.message || `The bout desk returned ${response.status}. Try again.`);
  }
  return result;
}

function money(value) {
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString("en-US")}`;
}

function percentage(value, maximum) {
  if (!Number.isFinite(Number(value)) || !Number.isFinite(Number(maximum)) || Number(maximum) <= 0) return 0;
  return Math.max(0, Math.min(100, (Number(value) / Number(maximum)) * 100));
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "FC";
}

function RingVisual({ fighter, opponent, round, turn, status }) {
  return (
    <div className="boxing-ring" role="img" aria-label={`${fighter?.name || "Your fighter"} and ${opponent?.name || "opponent"} in the boxing ring`}>
      <svg viewBox="0 0 780 330" aria-hidden="true">
        <ellipse className="boxing-ring-shadow" cx="390" cy="275" rx="284" ry="30" />
        <path className="boxing-rope-back" d="M122 96 L390 61 L658 96 M122 133 L390 98 L658 133 M122 170 L390 135 L658 170" />
        <path className="boxing-ring-rug" d="M122 151 L390 112 L658 151 L658 256 L390 296 L122 256 Z" />
        <path className="boxing-ring-border" d="M122 151 L390 112 L658 151 L658 256 L390 296 L122 256 Z" />
        <path className="boxing-ring-label" d="M201 184 L390 155 L579 184 L579 230 L390 257 L201 230 Z" fill="none" stroke="rgba(112,80,94,.18)" strokeWidth="1" />
        <text className="boxing-ring-label" x="390" y="213" textAnchor="middle">CORNER CLUB · MAIN RING</text>
        <path className="boxing-rope-light" d="M122 183 L390 145 L658 183 M122 220 L390 182 L658 220" />
        <path className="boxing-rope-front" d="M122 229 L390 190 L658 229 M122 266 L390 227 L658 266" />
        <path className="boxing-ring-corner" d="M109 91 L128 88 L128 278 L109 273 Z M652 88 L671 91 L671 273 L652 278 Z" />
        <text className="boxing-corner-label" x="119" y="291" textAnchor="middle">RED</text>
        <text className="boxing-corner-label" x="662" y="291" textAnchor="middle">BLUE</text>
        <ellipse className="boxing-fighter-shadow" cx="300" cy="250" rx="62" ry="12" />
        <ellipse className="boxing-fighter-shadow" cx="490" cy="250" rx="62" ry="12" />
        <g transform="translate(0 2)">
          <path className="boxing-player-body" d="M278 155 Q300 139 326 154 L338 208 L323 229 L276 226 L262 205 Z" />
          <path className="boxing-player-short" d="M267 203 L334 203 L329 234 L272 234 Z" />
          <path className="boxing-player-body" d="M278 226 L297 228 L293 265 L284 278 L271 275 L277 251 Z M309 228 L329 226 L329 249 L339 273 L326 278 L311 261 Z" />
          <path className="boxing-player-body" d="M274 160 L254 178 L242 204 L253 211 L272 193 L286 180 Z M326 160 L348 174 L363 196 L351 205 L331 189 L315 179 Z" />
          <circle className="boxing-player-head" cx="302" cy="133" r="21" />
          <path className="boxing-player-head" d="M281 133 Q285 104 311 113 Q326 119 324 134 L316 125 L296 127 Z" />
          <ellipse className="boxing-player-glove" cx="246" cy="207" rx="13" ry="11" />
          <ellipse className="boxing-player-glove" cx="356" cy="201" rx="13" ry="11" />
        </g>
        <g transform="translate(0 6)">
          <path className="boxing-opponent-body" d="M464 151 Q488 137 513 154 L526 207 L510 228 L464 225 L449 205 Z" />
          <path className="boxing-opponent-short" d="M455 201 L521 201 L516 233 L460 233 Z" />
          <path className="boxing-opponent-body" d="M464 224 L483 227 L479 263 L469 278 L456 274 L463 249 Z M495 226 L515 224 L515 248 L527 273 L513 279 L497 261 Z" />
          <path className="boxing-opponent-body" d="M461 157 L440 174 L428 198 L440 206 L459 190 L474 178 Z M512 157 L534 174 L547 197 L535 205 L516 189 L501 178 Z" />
          <circle className="boxing-opponent-head" cx="488" cy="132" r="21" />
          <path className="boxing-opponent-head" d="M467 131 Q472 103 496 112 Q513 117 510 134 L501 124 L481 126 Z" />
          <ellipse className="boxing-opponent-glove" cx="434" cy="202" rx="13" ry="11" />
          <ellipse className="boxing-opponent-glove" cx="541" cy="201" rx="13" ry="11" />
        </g>
        <text x="42" y="38" className="boxing-ring-label">{`ROUND ${round || 1}  /  TURN ${turn || 0}`}</text>
        <text x="738" y="38" className="boxing-ring-label" textAnchor="end">{status === "active" ? "BELL IS LIVE" : "BOUT COMPLETE"}</text>
      </svg>
      <div className="boxing-ring-caption">
        <span><strong>RED CORNER</strong> · {fighter?.name || "Fighter"}</span>
        <span><strong>BLUE CORNER</strong> · {opponent?.name || "Opponent"}</span>
      </div>
    </div>
  );
}

function Vital({ label, current, maximum, kind = "" }) {
  return (
    <div className={`boxing-vital ${kind === "opponent" ? "boxing-opponent" : ""}`}>
      <div className="boxing-vital-top"><span>{label}</span><strong>{Number(current) || 0} / {Number(maximum) || 0}</strong></div>
      <div className={`boxing-meter ${label.toLowerCase() === "stamina" ? "stamina" : ""}`} role="meter" aria-label={`${label} level`} aria-valuemin="0" aria-valuemax={Number(maximum) || 0} aria-valuenow={Number(current) || 0}>
        <i style={{ width: `${percentage(current, maximum)}%` }} />
      </div>
    </div>
  );
}

function Record({ wins, losses, draws }) {
  return <>{wins}–{losses}–{draws}</>;
}

export default function BoxingGame() {
  const [career, setCareer] = useState(loadCareer);
  const careerRef = useRef(career);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fighterName, setFighterName] = useState("");
  const [power, setPower] = useState(14);
  const [speed, setSpeed] = useState(14);
  const [powerCommit, setPowerCommit] = useState(false);

  const commitCareer = (next) => {
    careerRef.current = next;
    setCareer(next);
    try {
      window.localStorage.setItem(CAREER_KEY, JSON.stringify(next));
    } catch {
      setError("Career storage is unavailable in this browser. Your current session can continue, but it may not persist.");
    }
  };

  const runRequest = async (request) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await request();
    } catch (requestError) {
      setError(requestError?.message || "The bout desk is unavailable. Please try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const createFighter = (event) => {
    event.preventDefault();
    const name = fighterName.trim();
    if (name.length < 2 || name.length > 24 || power + speed !== 28 || power < 6 || power > 18 || speed < 6 || speed > 18) return;
    runRequest(async () => {
      const result = await postBoxing({ action: "create_fighter", name, punch_power: power, punch_speed: speed });
      if (!result.fighter) throw new Error("The club did not return a fighter profile. Please try again.");
      commitCareer({ ...careerRef.current, fighter: result.fighter, fight: null });
      setFighterName("");
    });
  };

  const startFight = () => runRequest(async () => {
    const fighter = careerRef.current.fighter;
    if (!fighter) return;
    const result = await postBoxing({ action: "start_fight", fighter });
    if (!result.fight) throw new Error("The club did not return a bout card. Please try again.");
    commitCareer({ ...careerRef.current, fighter: result.fight.player || fighter, fight: result.fight });
  });

  const takeTurn = (action) => runRequest(async () => {
    const fight = careerRef.current.fight;
    if (!fight || fight.status !== "active") return;
    const result = await postBoxing({
      action: "take_turn",
      fight,
      player_action: action,
      power_modifier: ["jab", "cross", "hook"].includes(action) ? powerCommit : false,
    });
    if (!result.fight) throw new Error("The club did not return the updated bout. Please try again.");
    const updatedFight = result.fight;
    const base = careerRef.current;
    const alreadyCredited = base.creditedFightIds.includes(updatedFight.fight_id);
    let nextCareer = {
      ...base,
      fighter: updatedFight.player || base.fighter,
      fight: updatedFight,
    };
    if (updatedFight.status !== "active" && !alreadyCredited) {
      const reward = Number(updatedFight.reward) || 0;
      nextCareer = {
        ...nextCareer,
        cash: base.cash + reward,
        wins: base.wins + (updatedFight.status === "win" ? 1 : 0),
        losses: base.losses + (updatedFight.status === "loss" ? 1 : 0),
        draws: base.draws + (updatedFight.status === "draw" ? 1 : 0),
        creditedFightIds: [...base.creditedFightIds, updatedFight.fight_id],
      };
    }
    commitCareer(nextCareer);
  });

  const fighter = career.fighter;
  const fight = career.fight;
  const isActive = fight?.status === "active";
  const isTerminal = Boolean(fight && fight.status !== "active");
  const fighterStatus = fight?.player || fighter;
  const opponent = fight?.opponent;
  const statusText = fight?.status === "win" ? "Bout won" : fight?.status === "loss" ? "Bout lost" : fight?.status === "draw" ? "Even at the bell" : "In progress";

  return (
    <main className="boxing-game">
      <div className="boxing-shell">
        <header className="boxing-topline">
          <div className="boxing-brand"><span className="boxing-brand-mark">CC</span><span>Corner Club</span></div>
          <div className="boxing-topline-meta">
            <span><i className="boxing-led" /> local career save</span>
            <span>Fight desk · 01</span>
          </div>
        </header>

        <section className="boxing-intro" aria-labelledby="boxing-title">
          <div>
            <p className="boxing-eyebrow">A first-career fight club</p>
            <h1 id="boxing-title">Every round<br /><em>has a price.</em></h1>
          </div>
          <p className="boxing-intro-copy">Build a boxer, read the moment, and take home what the work earns. <strong>There are no free corners.</strong></p>
        </section>

        <section className="boxing-ledger" aria-label="Career record">
          <div className="boxing-ledger-item"><span>Fight purse</span><strong className="cash">{money(career.cash)}</strong></div>
          <div className="boxing-ledger-item"><span>Wins</span><strong>{career.wins}</strong></div>
          <div className="boxing-ledger-item"><span>Losses</span><strong>{career.losses}</strong></div>
          <div className="boxing-ledger-item"><span>Draws</span><strong>{career.draws}</strong></div>
        </section>

        {error && (
          <div className="boxing-alert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">Dismiss</button>
          </div>
        )}

        {!fighter ? (
          <section className="boxing-setup boxing-panel" aria-labelledby="boxing-setup-title">
            <div className="boxing-setup-copy">
              <div>
                <p className="boxing-eyebrow">Before the first bell</p>
                <h2 id="boxing-setup-title">Make a name<br />in the room.</h2>
                <p>Every prospect gets 28 points to split between power and speed. Pick a style you can live with when the pace turns.</p>
              </div>
              <div className="boxing-rule-note">YOUR CORNER STARTS WITH {money(career.cash)}.<br />SPEND YOUR ENERGY LIKE IT MATTERS.</div>
            </div>
            <form className="boxing-create-form" onSubmit={createFighter}>
              <label>
                <span className="boxing-field-label">Fighter name</span>
                <input className="boxing-input" value={fighterName} onChange={(event) => setFighterName(event.target.value)} maxLength={24} minLength={2} placeholder="Name on the card" required autoComplete="nickname" />
              </label>
              <div>
                <span className="boxing-field-label">Build your style · 28 points total</span>
                <div className="boxing-stat-allocation" aria-live="polite">
                  <div className="boxing-stat-control">
                    <div className="boxing-stat-control-top"><span>Punch power</span><strong>{power}</strong></div>
                    <p>Heavy hands</p>
                  </div>
                  <div className="boxing-stat-control">
                    <div className="boxing-stat-control-top"><span>Punch speed</span><strong>{speed}</strong></div>
                    <p>Fast entries</p>
                  </div>
                  <div className="boxing-stat-allocation-footer"><span>Training points assigned</span><strong>{power + speed} / 28 · 6–18 EACH</strong></div>
                </div>
                <div className="boxing-power-option">
                  <button className="boxing-quiet-button" type="button" disabled={power >= 18 || speed <= 6} onClick={() => { setPower(power + 1); setSpeed(speed - 1); }}>Shift one point to power</button>
                  <button className="boxing-quiet-button" type="button" disabled={speed >= 18 || power <= 6} onClick={() => { setPower(power - 1); setSpeed(speed + 1); }}>Shift one point to speed</button>
                </div>
              </div>
              <button className="boxing-action-button" type="submit" disabled={busy || fighterName.trim().length < 2 || power + speed !== 28}>
                {busy ? "Registering prospect…" : "Register fighter"} <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>
        ) : (
          <>
            <div className="boxing-fighter-strip">
              <div className="boxing-fighter-identity">
                <span className="boxing-monogram" aria-hidden="true">{initials(fighter.name)}</span>
                <div><h2>{fighter.name}</h2><p>Prospect · {fighter.punch_power} power / {fighter.punch_speed} speed</p></div>
              </div>
              <div className="boxing-fighter-record"><span>Career record</span><strong><Record wins={career.wins} losses={career.losses} draws={career.draws} /></strong></div>
            </div>

            {isTerminal && (
              <section className="boxing-terminal-banner" aria-live="polite">
                <div><h2>{statusText}</h2><p>{fight.status === "win" ? "A clean result. Keep the purse; the next round starts from here." : fight.status === "loss" ? "The result is in the book. Take the lesson into the next bout." : "No winner tonight. The draw is recorded and the purse is yours."}</p></div>
                <div className="boxing-terminal-payout"><span>Bout reward</span><strong>{money(fight.reward)}</strong></div>
              </section>
            )}

            {!fight || isTerminal ? (
              <section className="boxing-panel boxing-setup" aria-labelledby="boxing-next-title">
                <div className="boxing-setup-copy">
                  <div>
                    <p className="boxing-eyebrow">{fight ? "A new card is waiting" : "Your first booking"}</p>
                    <h2 id="boxing-next-title">{fight ? "Back to work." : "Find your first bout."}</h2>
                    <p>{fight ? "Your corner restores health and stamina before each new booking." : "The club has a match ready. Step through the ropes when you are set."}</p>
                  </div>
                  <div className="boxing-rule-note">YOUR RECORD AND PURSE ARE SAVED ON THIS DEVICE.<br />RESULTS AND REWARDS COME FROM THE CLUB.</div>
                </div>
                <div className="boxing-create-form">
                  <div>
                    <p className="boxing-eyebrow">Next step</p>
                    <h3 style={{ margin: "0 0 12px", fontSize: "22px", letterSpacing: "-.05em" }}>Take the booking</h3>
                    <p style={{ margin: 0, color: "var(--boxing-dim)", fontSize: "12px", lineHeight: 1.7 }}>The server will set the opponent and the terms. There is no guaranteed result—only the next decision.</p>
                  </div>
                  <button className="boxing-action-button" type="button" onClick={startFight} disabled={busy}>
                    {busy ? "Calling the bout…" : "Start next fight"} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </section>
            ) : (
              <div className="boxing-career">
                <div className="boxing-main-column">
                  <section className="boxing-panel boxing-fight-panel" aria-label="Live bout">
                    <div className="boxing-fight-heading">
                      <div><span>{isActive ? "Club bout · live" : "Club bout"}</span><strong>{opponent?.name ? `vs. ${opponent.name}` : "The opponent"}</strong></div>
                      <span className={`boxing-status-pill ${isTerminal ? "terminal" : ""}`}><i className="boxing-led" />{isActive ? "On the bell" : statusText}</span>
                    </div>
                    <RingVisual fighter={fighterStatus} opponent={opponent} round={fight.round} turn={fight.turn_in_round} status={fight.status} />
                    <div className="boxing-vitals">
                      <Vital label="Health" current={fighterStatus?.current_health} maximum={fighterStatus?.max_health} />
                      <Vital label="Health" current={opponent?.current_health} maximum={opponent?.max_health} kind="opponent" />
                      <Vital label="Stamina" current={fighterStatus?.current_stamina} maximum={fighterStatus?.max_stamina} />
                      <Vital label="Stamina" current={opponent?.current_stamina} maximum={opponent?.max_stamina} kind="opponent" />
                    </div>
                  </section>

                  {isActive && (
                    <section className="boxing-panel boxing-controls" aria-labelledby="boxing-controls-title">
                      <div className="boxing-controls-heading">
                        <h3 id="boxing-controls-title">Choose the next beat</h3>
                        <span>Server-resolved ·<br />one action each turn</span>
                      </div>
                      <div className="boxing-turn-grid">
                        {ACTIONS.map((action) => (
                          <button key={action.id} className="boxing-turn-button" type="button" disabled={busy || !isActive} onClick={() => takeTurn(action.id)} aria-label={`${action.label}. ${action.note}.`}>
                            <strong>{action.label}</strong><span>{action.note}</span>
                          </button>
                        ))}
                      </div>
                      <div className="boxing-power-option">
                        <label className="boxing-check">
                          <input type="checkbox" checked={powerCommit} onChange={(event) => setPowerCommit(event.target.checked)} disabled={busy || !isActive} />
                          <span>Commit extra power</span>
                        </label>
                        <small>For punches only. A stronger choice may cost you later.</small>
                      </div>
                      {busy && <p className="boxing-feedback" role="status"><span className="boxing-loading-note">Waiting on the corner</span></p>}
                      {fight.last_action && !busy && <p className="boxing-feedback" aria-live="polite"><strong>Last action · </strong>{fight.last_action}</p>}
                    </section>
                  )}

                  <section className="boxing-panel boxing-log-panel" aria-labelledby="boxing-log-title">
                    <div className="boxing-log-heading"><h3 id="boxing-log-title">From the corner</h3><span>{fight.logs?.length || 0} entries</span></div>
                    <div className="boxing-log-list" aria-live="polite" aria-relevant="additions text">
                      {fight.logs?.length ? [...fight.logs].slice(-10).reverse().map((entry, index) => (
                        <div className="boxing-log-entry" key={`${entry.turn}-${index}`}><span>TURN {entry.turn}</span><div>{entry.text}</div></div>
                      )) : <p className="boxing-log-empty">No calls yet. The first exchange belongs to you.</p>}
                    </div>
                  </section>
                </div>

                <aside className="boxing-sidebar" aria-label="Fight notes">
                  <section className="boxing-panel boxing-overview-panel">
                    <p className="boxing-eyebrow">Condition report</p>
                    <h3>Know your corner.</h3>
                    {fighterStatus?.is_flat_footed && <p className="boxing-flatfooted" role="status">Flat-footed · stance exposed</p>}
                    {opponent?.is_flat_footed && <p className="boxing-flatfooted" role="status">Opponent flat-footed</p>}
                    <div className="boxing-statline"><span>Round</span><strong>{fight.round}</strong></div>
                    <div className="boxing-statline"><span>Turn</span><strong>{fight.turn_in_round}</strong></div>
                    <div className="boxing-statline"><span>Power</span><strong>{fighter.punch_power}</strong></div>
                    <div className="boxing-statline"><span>Speed</span><strong>{fighter.punch_speed}</strong></div>
                    <div className="boxing-statline"><span>Current purse</span><strong>{money(career.cash)}</strong></div>
                  </section>
                  <section className="boxing-club-note">
                    <p className="boxing-eyebrow">Corner advice</p>
                    <p>Recovery buys room. Guard buys information. A punch is only useful if you can afford the answer.</p>
                  </section>
                </aside>
              </div>
            )}
          </>
        )}

        <footer className="boxing-footer">
          <span>Corner Club · local career record</span>
          <span>Server decides every exchange</span>
        </footer>
      </div>
    </main>
  );
}