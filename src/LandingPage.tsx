import { ArrowUpRight, ArrowRight, Route, Play, MapPin, ShieldCheck, Compass, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './landing.css';

const appLink = '#app';

function JourneyMap() {
  return <div className="journey-map" aria-label="Illustrated example of a coastal journey">
    <svg className="map-art" viewBox="0 0 700 640" role="img" aria-label="A green journey route winding from the city to the coast">
      <defs><pattern id="blocks" width="76" height="76" patternTransform="rotate(-24)" patternUnits="userSpaceOnUse"><rect width="76" height="76" fill="#eceee5"/><rect x="7" y="7" width="59" height="59" rx="5" fill="#dfe4d8"/><path d="M0 72H76M72 0V76" stroke="#fafbf5" strokeWidth="8"/></pattern></defs>
      <rect width="700" height="640" fill="url(#blocks)"/>
      <path d="M530-30C440 70 620 154 512 248S452 388 555 436 597 542 510 680H730V-30Z" fill="#bed7d5"/>
      <path d="M531-30C441 70 621 154 513 248S453 388 556 436 598 542 511 680" stroke="#f7f6e9" strokeWidth="16" fill="none"/>
      <path d="M-20 110L180 42 259 147 155 214 17 189ZM278 380L367 321 436 388 404 489 300 496Z" fill="#c3d1b6"/>
      <g fill="none" stroke="#fffdf4" strokeWidth="13"><path d="M-40 340L190 236 366 269 530 162"/><path d="M155-20L262 174 230 375 392 670"/><path d="M-20 535L252 454 424 515 537 601"/></g>
      <g fill="#84917f" fontSize="11" fontFamily="Inter, sans-serif" letterSpacing="2"><text x="70" y="281" transform="rotate(-24 70 281)">PACIFIC HEIGHTS</text><text x="300" y="139">THE MARINA</text><text x="54" y="559">SAN FRANCISCO</text><text x="581" y="315" transform="rotate(90 581 315)">THE BAY</text></g>
      <path className="map-route-shadow" d="M171 465L222 442 207 405 269 374 244 318 303 287 287 250 371 210 398 253 457 220 442 180"/>
      <path className="map-route" d="M171 465L222 442 207 405 269 374 244 318 303 287 287 250 371 210 398 253 457 220 442 180"/>
      <circle cx="171" cy="465" r="11" fill="#244c3a" stroke="white" strokeWidth="5"/>
      <circle cx="442" cy="180" r="23" fill="#244c3a" fillOpacity=".12"/><circle cx="442" cy="180" r="10" fill="#244c3a" stroke="white" strokeWidth="5"/>
    </svg>
    <div className="map-label"><span className="live-dot"/> A LITTLE EVERYDAY EXPLORATION</div>
    <div className="destination"><MapPin size={15}/> A new perspective</div>
    <div className="journey-card"><div className="journey-card-top"><span className="route-icon"><Route size={22}/></span><div><strong>The scenic way home</strong><span>Illustrative journey · San Francisco</span></div><span className="saved-tag">Saved</span></div><div className="journey-metrics"><div><strong>6.8 <small>km</small></strong><span>Distance</span></div><div><strong>32 <small>min</small></strong><span>On the move</span></div><a href={appLink} aria-label="Open the app to explore journey replay"><Play size={17} fill="currentColor"/></a></div></div>
    <div className="map-coordinate">37.7749° N &nbsp; 122.4194° W <Compass size={20}/></div>
  </div>;
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="landing">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="landing-header wrap"><a className="wordmark" href="#" aria-label="PastTracks home"><span className="brand-icon"><Route size={23}/></span>PastTracks<span className="brand-period">.</span></a><nav className={menuOpen ? 'landing-nav is-open' : 'landing-nav'} aria-label="Main navigation"><a href="#possibilities" onClick={() => setMenuOpen(false)}>The possibilities</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="https://github.com/rajashekarakula19-spec/past-tracks" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14}/></a></nav><a className="header-cta" href={appLink}>Open app <ArrowUpRight size={17}/></a><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>{menuOpen ? <X/> : <Menu/>}</button></header>
    <main id="main-content">
      <section className="hero wrap"><div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> FOR THE PLACES LIFE TAKES YOU</div><h1>Every journey<br/>has a story.<br/><em>Keep yours.</em></h1><p>The morning walk. The long way home. The road you hadn’t taken. Record your journeys, revisit your routes, and see how far you’ve come.</p><div className="hero-actions"><a className="button-primary" href={appLink}>Start your journey <ArrowUpRight size={20}/></a><a className="text-link" href="#how-it-works"><span className="play-outline"><Play size={11} fill="currentColor"/></span>See how it works</a></div><div className="hero-note"><ShieldCheck size={16}/> No sign-up. Your journeys stay in your browser.</div></div><JourneyMap/></section>
      <div className="benefit-strip wrap"><span>A little more meaning in every mile.</span><div><Route size={18}/> Record in real time</div><div><Play size={17}/> Replay the memories</div><div><ShieldCheck size={18}/> Stored on your device</div></div>
      <section className="possibilities wrap section-space" id="possibilities"><div className="section-intro"><div><span className="eyebrow">MORE THAN A LINE ON A MAP</span><h2>Your world.<br/>A little more connected.</h2></div><p>Turn the places you pass into journeys you can come back to. From familiar streets to somewhere entirely new.</p></div><div className="feature-grid"><article><span className="feature-number">01 / CAPTURE</span><Route size={30}/><h3>Be there. We’ll keep the route.</h3><p>Start live GPS tracking and watch your journey take shape, with distance, duration, and speed along the way.</p></article><article><span className="feature-number">02 / REDISCOVER</span><Compass size={30}/><h3>Find your way back to a moment.</h3><p>Browse your travel history by date. Pick a trip, explore its path, and remember the route that got you there.</p></article><article><span className="feature-number">03 / RELIVE</span><Play size={30}/><h3>Some journeys deserve a replay.</h3><p>Follow your saved route again. Set the pace, move through the timeline, and take it all in a second time.</p></article></div></section>
      <section className="how-section" id="how-it-works"><div className="wrap how-layout"><div><span className="eyebrow">LESS SETUP. MORE EXPLORING.</span><h2>Step outside.<br/>The rest is simple.</h2><a className="text-link" href={appLink}>Let’s get going <ArrowRight size={18}/></a></div><ol className="steps"><li><span>01</span><div><h3>Open up and settle in</h3><p>No account to create. Explore sample journeys first, or allow location access when you’re ready to record.</p></div></li><li><span>02</span><div><h3>Make your next move</h3><p>Start tracking, take your route, and pause whenever you need a moment.</p></div></li><li><span>03</span><div><h3>Save a story worth keeping</h3><p>Finish your trip to save it in this browser. Revisit it anytime, or export your journeys as a JSON backup.</p></div></li></ol></div></section>
      <section className="closing wrap"><Compass size={33}/><span className="eyebrow">THERE’S A WHOLE WORLD OUT THERE</span><h2>Where will your<br/><em>next story begin?</em></h2><a className="button-primary" href={appLink}>Find your next route <ArrowUpRight size={20}/></a><p>Free to explore. No account needed.</p></section>
    </main>
    <footer className="landing-footer wrap"><a className="wordmark" href="#"><span className="brand-icon"><Route size={20}/></span>PastTracks.</a><span>Made for the journey, and the memories.</span><a href="https://github.com/rajashekarakula19-spec/past-tracks" target="_blank" rel="noreferrer">View source <ArrowUpRight size={15}/></a></footer>
  </div>;
}
