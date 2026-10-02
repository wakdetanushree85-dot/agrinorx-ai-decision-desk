import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChartNoAxesColumn,
  CircleHelp,
  Clock3,
  Leaf,
  MapPin,
  Scale,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { calculateDecision, type ScenarioInput, type ScenarioResult, type Urgency } from '@/lib/decision-engine';

type Language = 'en' | 'mr';
type View = 'desk' | 'simulator' | 'markets';

const copy = {
  en: {
    brand: 'AGRINORX', brandSub: 'FIELD DECISION DESK', prototype: 'ILLUSTRATIVE PROTOTYPE',
    eyebrow: 'A clearer way to weigh your options',
    heroTitle: <>One harvest.<br />Three <em>ways forward.</em></>,
    heroCopy: 'Compare a sale today, a three-day wait, or another nearby market. Change the assumptions and see exactly how each estimate is built.',
    tryJury: 'Try Jury Demo', farmerMode: 'Enter Farmer Mode', liveEstimate: 'CURRENT TOP ESTIMATE',
    demoNote: 'This is a transparent demonstration using illustrative values—not live mandi data or a forecast.',
    juryMode: 'Jury demo view · every estimate is editable and shown as arithmetic.',
    farmerModeNote: 'Farmer view · adjust the figures to explore your own scenario.',
    tabDesk: 'Decision Desk', tabSimulator: 'Loss Simulator', tabMarkets: 'Market Comparison',
    tabsAria: 'Decision tools', languageAria: 'Choose language',
    deskTitle: 'Your decision, laid out', deskDesc: 'A side-by-side estimate from the same editable scenario.',
    simulatorTitle: 'What does waiting cost?', simulatorDesc: 'See the net-value difference between acting now and waiting, with all costs included.',
    marketsTitle: 'Compare nearby markets', marketsDesc: 'Illustrative price lifts and extra transport are applied to the same base scenario.',
    illustrative: 'ILLUSTRATIVE ESTIMATES', scenarioInputs: 'SCENARIO INPUTS', editAny: 'Edit any figure',
    quantity: 'Cotton / orange quantity', expectedPrice: 'Expected selling price', transport: 'Base transport cost',
    storage: 'Base storage cost', risk: 'Base risk adjustment', waitPrice: 'Expected 3-day price change',
    extraStorage: 'Extra 3-day storage', urgency: 'Selling urgency',
    kg: 'kg', perKg: 'per kg', percent: '%', flexible: 'Flexible', planned: 'Planned', urgent: 'Urgent',
    urgencyRates: 'Delay-risk cost applied to WAIT only: Flexible ₹0/kg · Planned ₹0.50/kg · Urgent ₹1.25/kg.',
    topEstimate: 'TOP ESTIMATE IN THIS SCENARIO', recommended: 'Illustrative option',
    bestMarket: 'ALTERNATIVE MARKET', sellNow: 'SELL NOW', wait3: 'WAIT 3 DAYS',
    net: 'Net estimate', gross: 'Gross value', totalCost: 'Total costs', transportCost: 'Transport',
    storageCost: 'Storage', riskCost: 'Risk adjustment', delayRisk: 'Delay risk',
    costs: 'COST BREAKDOWN', basis: 'Arithmetic, not a score',
    urgencyReason: (qty: string, rate: string, charge: string, net: string, urgencyName: string) =>
      `Without urgency cost, waiting would lead (₹${net} + ₹${charge}). ${urgencyName} urgency adds ${qty} kg × ₹${rate}/kg = ₹${charge} to WAIT costs, bringing its net estimate to ₹${net}.`,
    waitCost: 'Urgency cost on WAIT', waitBefore: 'WAIT net before urgency',
    currentNet: 'SELL NOW net', waitNet: 'WAIT 3 DAYS net', bestAltNet: 'BEST ALTERNATIVE net',
    waitDifference: 'Difference: WAIT vs SELL NOW', marketAdded: 'Added transport',
    distance: 'km away', priceLift: 'Illustrative lift',
    marketCardHeading: 'MARKET ESTIMATES', pickOne: 'Highest-net market is the alternative option.',
    base: 'Base scenario', disclaimerTitle: 'ESTIMATED PROTOTYPE VALUE',
    disclaimer: 'AgrinorX Decision Desk is a transparent, illustrative decision tool. All prices, costs, distances, expected changes, and risks shown are illustrative estimates only. This is not live mandi data, a real prediction, or financial advice. Verify current prices and costs independently before making a sale or transport decision.',
    footer: 'Built for exploring trade-offs · No live market feed · No prediction',
    modeNudge: 'Update any input to refresh every estimate.',
    languageEnglish: 'EN', languageMarathi: 'मराठी',
  },
  mr: {
    brand: 'AGRINORX', brandSub: 'शेत निर्णय डेस्क', prototype: 'प्रात्यक्षिक नमुना',
    eyebrow: 'पर्याय समजून घेण्याची अधिक स्पष्ट पद्धत',
    heroTitle: <>एक पीक.<br />पुढे जाण्याचे <em>तीन मार्ग.</em></>,
    heroCopy: 'आज विक्री, तीन दिवस प्रतीक्षा किंवा जवळची दुसरी बाजारपेठ—तुलना करा. गृहीतके बदला आणि प्रत्येक अंदाजाची गणना पाहा.',
    tryJury: 'ज्युरी डेमो पाहा', farmerMode: 'शेतकरी मोडमध्ये जा', liveEstimate: 'सध्याचा सर्वोत्तम अंदाज',
    demoNote: 'हे दाखवण्यासाठीचे उदाहरण आहे; यात अंदाजित आकडे वापरले आहेत. हा थेट मंडी डेटा किंवा भावाचा अंदाज नाही.',
    juryMode: 'ज्युरी डेमो · प्रत्येक अंदाज बदलता येतो आणि गणनेसह दाखवला आहे.',
    farmerModeNote: 'शेतकरी दृश्य · आपल्या परिस्थितीचा विचार करण्यासाठी आकडे बदला.',
    tabDesk: 'निर्णय डेस्क', tabSimulator: 'तोटा सिम्युलेटर', tabMarkets: 'बाजार तुलना',
    tabsAria: 'निर्णय साधने', languageAria: 'भाषा निवडा',
    deskTitle: 'तुमचा निर्णय, स्पष्टपणे', deskDesc: 'एकाच संपादनयोग्य परिस्थितीवर आधारित पर्यायांची तुलना.',
    simulatorTitle: 'प्रतीक्षा करण्याचा खर्च किती?', simulatorDesc: 'सर्व खर्च धरून आत्ताची विक्री आणि प्रतीक्षा यांतील निव्वळ फरक पाहा.',
    marketsTitle: 'जवळच्या बाजारांची तुलना', marketsDesc: 'त्याच मूळ परिस्थितीवर बाजारभावातील अंदाजित वाढ आणि अतिरिक्त वाहतूक लागू.',
    illustrative: 'प्रात्यक्षिक अंदाज', scenarioInputs: 'परिस्थितीतील आकडे', editAny: 'कोणताही आकडा बदला',
    quantity: 'कापूस / संत्र्याचे प्रमाण', expectedPrice: 'अपेक्षित विक्रीभाव', transport: 'मूळ वाहतूक खर्च',
    storage: 'मूळ साठवण खर्च', risk: 'मूळ जोखीम समायोजन', waitPrice: '३ दिवसांतील अपेक्षित भावबदल',
    extraStorage: '३ दिवसांचा अतिरिक्त साठवण खर्च', urgency: 'विक्रीची निकड',
    kg: 'कि.ग्रॅ.', perKg: 'प्रति कि.ग्रॅ.', percent: '%', flexible: 'लवचिक', planned: 'नियोजित', urgent: 'तातडीची',
    urgencyRates: 'फक्त प्रतीक्षेवर लागू विलंब-जोखीम खर्च: लवचिक ₹०/कि.ग्रॅ. · नियोजित ₹०.५०/कि.ग्रॅ. · तातडीची ₹१.२५/कि.ग्रॅ.',
    topEstimate: 'या परिस्थितीतील सर्वोत्तम अंदाज', recommended: 'उदाहरणार्थ पर्याय',
    bestMarket: 'पर्यायी बाजार', sellNow: 'आत्ताच विक्री', wait3: '३ दिवस प्रतीक्षा',
    net: 'निव्वळ अंदाज', gross: 'एकूण मूल्य', totalCost: 'एकूण खर्च', transportCost: 'वाहतूक',
    storageCost: 'साठवण', riskCost: 'जोखीम समायोजन', delayRisk: 'विलंब जोखीम',
    costs: 'खर्चाचा तपशील', basis: 'गणित; गुणांकन नाही',
    urgencyReason: (qty: string, rate: string, charge: string, net: string, urgencyName: string) =>
      `निकड खर्चाशिवाय प्रतीक्षा पर्याय पुढे होता (₹${net} + ₹${charge}). ${urgencyName} निकडीमुळे ${qty} कि.ग्रॅ. × ₹${rate}/कि.ग्रॅ. = ₹${charge} हा खर्च फक्त प्रतीक्षेला जोडला जातो; त्यामुळे निव्वळ अंदाज ₹${net} होतो.`,
    waitCost: 'प्रतीक्षेवरील निकड खर्च', waitBefore: 'निकड खर्चापूर्वी प्रतीक्षा',
    currentNet: 'आत्ताची विक्री निव्वळ', waitNet: '३ दिवस प्रतीक्षा निव्वळ', bestAltNet: 'सर्वोत्तम पर्यायी निव्वळ',
    waitDifference: 'फरक: प्रतीक्षा विरुद्ध आत्ताची विक्री', marketAdded: 'अतिरिक्त वाहतूक',
    distance: 'कि.मी. अंतरावर', priceLift: 'उदाहरणार्थ भाववाढ',
    marketCardHeading: 'बाजारपेठेचे अंदाज', pickOne: 'सर्वाधिक निव्वळ अंदाजाचा बाजार पर्यायी पर्याय आहे.',
    base: 'मूळ परिस्थिती', disclaimerTitle: 'ESTIMATED PROTOTYPE VALUE',
    disclaimer: 'AgrinorX Decision Desk हे पारदर्शक, उदाहरणार्थ निर्णय साधन आहे. येथे दाखवलेले सर्व भाव, खर्च, अंतर, अपेक्षित बदल आणि जोखीम हे केवळ उदाहरणार्थ अंदाज आहेत. हा थेट मंडी डेटा, खरा भावाचा अंदाज किंवा आर्थिक सल्ला नाही. विक्री किंवा वाहतुकीचा निर्णय घेण्यापूर्वी सध्याचे भाव आणि खर्च स्वतंत्रपणे तपासा.',
    footer: 'पर्याय समजून घेण्यासाठी · थेट बाजार माहिती नाही · भावाचा अंदाज नाही',
    modeNudge: 'सर्व अंदाज बदलण्यासाठी कोणताही आकडा बदला.',
    languageEnglish: 'EN', languageMarathi: 'मराठी',
  },
} as const;

const initialScenario: ScenarioInput = {
  quantityKg: 1200, expectedPrice: 70, transport: 1400, storage: 600,
  riskAdjustment: 500, waitPriceChangePct: 3.2, waitExtraStorage: 400, urgency: 'planned',
};

function money(value: number, language: Language) {
  return `₹${Math.round(value).toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN')}`;
}

function scenarioLabel(result: ScenarioResult, t: (typeof copy)[Language]) {
  if (result.id === 'sell') return t.sellNow;
  if (result.id === 'wait') return t.wait3;
  return `${t.bestMarket} · ${result.name}`;
}

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeView, setActiveView] = useState<View>('desk');
  const [scenario, setScenario] = useState<ScenarioInput>(initialScenario);
  const [entryMode, setEntryMode] = useState<'jury' | 'farmer' | null>(null);
  const t = copy[language];
  const results = useMemo(() => calculateDecision(scenario), [scenario]);
  const updateNumber = (field: NumberField, value: string) => {
    const parsed = Number(value);
    setScenario((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }));
  };
  const enterMode = (mode: 'jury' | 'farmer') => {
    setEntryMode(mode);
    if (mode === 'jury') setScenario(initialScenario);
    document.getElementById('decision-desk')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const views = [
    { id: 'desk' as const, label: t.tabDesk, icon: Scale },
    { id: 'simulator' as const, label: t.tabSimulator, icon: ChartNoAxesColumn },
    { id: 'markets' as const, label: t.tabMarkets, icon: MapPin },
  ];
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand" aria-label={`${t.brand} ${t.brandSub}`}>
          <span className="brand-mark"><Leaf size={19} strokeWidth={1.8} /></span>
          <span><span className="brand-name">{t.brand}</span><span className="brand-sub">{t.brandSub}</span></span>
        </div>
        <div className="header-tools">
          <span className="prototype-pill"><i className="prototype-dot" />{t.prototype}</span>
          <div className="language-switch" role="group" aria-label={t.languageAria}>
            <button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} data-testid="button-language-en" onClick={() => setLanguage('en')}>{t.languageEnglish}</button>
            <button type="button" className={language === 'mr' ? 'active' : ''} aria-pressed={language === 'mr'} data-testid="button-language-mr" onClick={() => setLanguage('mr')}>{t.languageMarathi}</button>
          </div>
        </div>
      </header>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" />{t.eyebrow}</div>
            <h1>{t.heroTitle}</h1>
            <p className="hero-copy">{t.heroCopy}</p>
            <div className="hero-actions">
              <button className="button-primary" type="button" data-testid="button-try-jury-demo" onClick={() => enterMode('jury')}><Sparkles size={15} />{t.tryJury}<ArrowRight size={14} /></button>
              <button className="button-outline" type="button" data-testid="button-enter-farmer-mode" onClick={() => enterMode('farmer')}><Leaf size={15} />{t.farmerMode}<ArrowRight size={14} /></button>
            </div>
            {entryMode && <div className="mode-note" data-testid="status-entry-mode"><CircleHelp size={13} />{entryMode === 'jury' ? t.juryMode : t.farmerModeNote}</div>}
          </div>
          <aside className="hero-aside">
            <div className="hero-aside-label">{t.liveEstimate}</div>
            <div className="hero-aside-value" data-testid="value-hero-best-net">{money(results.recommendation.net, language)}</div>
            <div className="hero-aside-note">{t.demoNote}</div>
          </aside>
        </div>
      </section>
      <main className="main-wrap" id="decision-desk">
        <nav className="nav-tabs" aria-label={t.tabsAria}>
          {views.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`nav-tab ${activeView === id ? 'active' : ''}`} aria-current={activeView === id ? 'page' : undefined} data-testid={`tab-${id}`} onClick={() => setActiveView(id)}><Icon size={15} strokeWidth={1.8} />{label}</button>
          ))}
        </nav>
        <div className="content-head">
          <div>
            <h2 className="content-title">{activeView === 'desk' ? t.deskTitle : activeView === 'simulator' ? t.simulatorTitle : t.marketsTitle}</h2>
            <p className="content-description">{activeView === 'desk' ? t.deskDesc : activeView === 'simulator' ? t.simulatorDesc : t.marketsDesc}</p>
          </div>
          <span className="illustrative-tag">{t.illustrative}</span>
        </div>
        <div className="desk-grid">
          <InputPanel scenario={scenario} updateNumber={updateNumber} setUrgency={(urgency) => setScenario((current) => ({ ...current, urgency }))} t={t} />
          <div className="results">
            {activeView === 'desk' && <DecisionDesk results={results} scenario={scenario} t={t} language={language} />}
            {activeView === 'simulator' && <LossSimulator results={results} scenario={scenario} t={t} language={language} />}
            {activeView === 'markets' && <MarketComparison results={results} scenario={scenario} t={t} language={language} />}
          </div>
        </div>
        <Disclaimer t={t} />
        <div className="footer-note">{t.footer}</div>
      </main>
    </div>
  );
}

type T = (typeof copy)[Language];
type NumberField = Exclude<keyof ScenarioInput, 'urgency'>;

function InputPanel({ scenario, updateNumber, setUrgency, t }: {
  scenario: ScenarioInput;
  updateNumber: (field: NumberField, value: string) => void;
  setUrgency: (urgency: Urgency) => void;
  t: T;
}) {
  const fields: { field: NumberField; label: string; unit: string; prefix?: string; step: number; min?: number }[] = [
    { field: 'quantityKg', label: t.quantity, unit: t.kg, step: 50, min: 0 },
    { field: 'expectedPrice', label: t.expectedPrice, unit: t.perKg, prefix: '₹', step: 0.5, min: 0 },
    { field: 'transport', label: t.transport, unit: '', prefix: '₹', step: 100, min: 0 },
    { field: 'storage', label: t.storage, unit: '', prefix: '₹', step: 100, min: 0 },
    { field: 'riskAdjustment', label: t.risk, unit: '', prefix: '₹', step: 100, min: 0 },
    { field: 'waitPriceChangePct', label: t.waitPrice, unit: t.percent, step: 0.1 },
    { field: 'waitExtraStorage', label: t.extraStorage, unit: '', prefix: '₹', step: 100, min: 0 },
  ];
  const urgencyLabels: Record<Urgency, string> = { flexible: t.flexible, planned: t.planned, urgent: t.urgent };
  return (
    <section className="panel" aria-labelledby="scenario-title">
      <div className="panel-heading">
        <h3 id="scenario-title">{t.scenarioInputs}</h3>
        <span><SlidersHorizontal size={12} /> {t.editAny}</span>
      </div>
      <div className="input-body">
        {fields.map(({ field, label, unit, prefix, step, min }) => (
          <div className="field" key={field}>
            <label className="field-label" htmlFor={`scenario-${field}`}><span>{label}</span><span className="field-unit">{unit}</span></label>
            <div className="input-wrap">
              {prefix && <span className="input-prefix">{prefix}</span>}
              <input id={`scenario-${field}`} className={`scenario-input ${prefix ? 'prefix' : ''} ${unit && !prefix ? 'suffix' : ''}`} type="number" inputMode="decimal" min={min} step={step} value={scenario[field]} data-testid={`input-${field}`} onChange={(event) => updateNumber(field, event.target.value)} />
              {unit && !prefix && <span className="input-suffix">{unit}</span>}
            </div>
          </div>
        ))}
        <div className="field">
          <div className="field-label"><span>{t.urgency}</span><Clock3 size={13} /></div>
          <div className="urgency-options" role="group" aria-label={t.urgency}>
            {(['flexible', 'planned', 'urgent'] as const).map((urgency) => (
              <button key={urgency} type="button" className={`urgency-option ${scenario.urgency === urgency ? 'selected' : ''}`} aria-pressed={scenario.urgency === urgency} data-testid={`button-urgency-${urgency}`} onClick={() => setUrgency(urgency)}>{urgencyLabels[urgency]}</button>
            ))}
          </div>
          <div className="urgency-detail" data-testid="text-urgency-delay-cost">{t.urgencyRates}</div>
        </div>
      </div>
    </section>
  );
}

function DecisionDesk({ results, scenario, t, language }: { results: ReturnType<typeof calculateDecision>; scenario: ScenarioInput; t: T; language: Language }) {
  const options = [results.sellNow, results.wait, results.bestAlternative];
  return (
    <>
      <section className="recommend-card" data-testid="card-recommendation">
        <div className="recommend-top"><Sparkles size={13} />{t.topEstimate}</div>
        <div className="recommend-name">{scenarioLabel(results.recommendation, t)}</div>
        <div className="recommend-net">{t.net}<strong data-testid="value-recommended-net">{money(results.recommendation.net, language)}</strong></div>
        {results.waitLosesDueToUrgency && (
          <div className="reason-box" data-testid="text-urgency-reason">
            {t.urgencyReason(
              scenario.quantityKg.toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN'),
              scenario.urgency === 'planned' ? '0.50' : '1.25',
              money(results.urgencyCost, language).replace('₹', ''),
              money(results.wait.net, language).replace('₹', ''),
              scenario.urgency === 'planned' ? t.planned : t.urgent,
            )}
          </div>
        )}
      </section>
      <div className="scenario-cards">
        {options.map((option) => (
          <div className={`scenario-card ${option.id === results.recommendation.id ? 'best' : ''}`} key={option.id} data-testid={`card-option-${option.id}`}>
            <div className="scenario-name">{option.id === results.bestAlternative.id ? `${t.bestMarket} · ${option.name}` : scenarioLabel(option, t)}</div>
            <div className="scenario-net" data-testid={`value-net-${option.id}`}>{money(option.net, language)}</div>
            <div className="scenario-mini">{t.totalCost}: {money(option.totalCost, language)}</div>
          </div>
        ))}
      </div>
      <BreakdownList scenarios={options} scenario={scenario} t={t} language={language} />
    </>
  );
}

function LossSimulator({ results, scenario, t, language }: { results: ReturnType<typeof calculateDecision>; scenario: ScenarioInput; t: T; language: Language }) {
  const difference = results.waitVsSellDifference;
  return (
    <>
      <section className="panel wide-panel">
        <div className="simulator-grid">
          <div className="simulator-callout">
            <small>{t.waitDifference}</small>
            <strong data-testid="value-wait-difference">{difference >= 0 ? '+' : '−'}{money(Math.abs(difference), language)}</strong>
            <p>{t.waitNet}: {money(results.wait.net, language)} · {t.currentNet}: {money(results.sellNow.net, language)}</p>
          </div>
          <div className="simulator-callout">
            <small>{t.waitCost}</small>
            <strong data-testid="value-urgency-cost">{money(results.urgencyCost, language)}</strong>
            <p>{scenario.quantityKg.toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN')} {t.kg} × ₹{scenario.urgency === 'flexible' ? '0' : scenario.urgency === 'planned' ? '0.50' : '1.25'} {t.perKg}</p>
          </div>
        </div>
      </section>
      <BreakdownList scenarios={[results.sellNow, results.wait, results.bestAlternative]} scenario={scenario} t={t} language={language} />
    </>
  );
}

function MarketComparison({ results, scenario, t, language }: { results: ReturnType<typeof calculateDecision>; scenario: ScenarioInput; t: T; language: Language }) {
  const maxNet = Math.max(...results.markets.map((market) => Math.abs(market.net)), 1);
  const winner = results.bestAlternative;
  return (
    <>
      <section className="panel wide-panel">
        <div className="breakdown-head"><strong>{t.marketCardHeading}</strong><span>{t.pickOne}</span></div>
        <div className="market-list">
          {results.markets.map((market) => (
            <article className={`panel market-row ${market.id === winner.id ? 'winner' : ''}`} key={market.id} data-testid={`card-market-${market.id}`}>
              <div>
                <div className="market-place" data-testid={`text-market-location-${market.id}`}><MapPin size={13} /> {market.name} · {market.distanceKm} {t.distance}</div>
              </div>
              <div className="bar-track" aria-label={`${market.name} · ${t.net}: ${money(market.net, language)}`}>
                <div className="bar-fill" style={{ transform: `scaleX(${Math.max(.02, Math.abs(market.net) / maxNet)})` }} />
              </div>
              <div className="market-net" data-testid={`value-market-net-${market.id}`}>{money(market.net, language)}<small>+₹{market.priceLift} {t.perKg} · +{money(market.addedTransport, language)} {t.marketAdded.toLowerCase()}</small></div>
            </article>
          ))}
        </div>
        <div className="market-costs">
          <div className="breakdown-row"><span>{t.base} · {t.expectedPrice}</span><b>{money(scenario.expectedPrice, language)} / {t.perKg}</b></div>
          <div className="breakdown-row"><span>{t.bestMarket}</span><b>{winner.name} · {money(winner.net, language)}</b></div>
        </div>
      </section>
      <BreakdownList scenarios={results.markets} scenario={scenario} t={t} language={language} />
    </>
  );
}

function BreakdownList({ scenarios, scenario, t, language }: { scenarios: ScenarioResult[]; scenario: ScenarioInput; t: T; language: Language }) {
  return (
    <div className="breakdown">
      {scenarios.map((item) => {
        const delayCost = item.delayRiskPerKg * scenario.quantityKg;
        const baseRisk = item.id === 'wait' ? item.riskAdjustment - delayCost : item.riskAdjustment;
        return (
          <section className="panel breakdown-card" key={item.id} data-testid={`breakdown-${item.id}`}>
            <div className="breakdown-head"><strong>{item.id === 'nagpur' || item.id === 'amravati' || item.id === 'wardha' ? `${t.bestMarket} · ${item.name}` : scenarioLabel(item, t)}</strong><span>{t.basis}</span></div>
            <div className="breakdown-row"><span>{t.gross} · {money(item.pricePerKg, language)}/{t.perKg}</span><b data-testid={`value-gross-${item.id}`}>{money(item.gross, language)}</b></div>
            <div className="breakdown-row"><span>{t.transportCost}</span><b>− {money(item.transport, language)}</b></div>
            <div className="breakdown-row"><span>{t.storageCost}</span><b>− {money(item.storage, language)}</b></div>
            <div className="breakdown-row"><span>{t.riskCost}</span><b>− {money(baseRisk, language)}</b></div>
            {item.id === 'wait' && <div className="breakdown-row"><span>{t.delayRisk} · {scenario.quantityKg.toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN')} × ₹{item.delayRiskPerKg.toFixed(2)}</span><b>− {money(delayCost, language)}</b></div>}
            <div className="breakdown-row"><span>{t.totalCost}</span><b>{money(item.totalCost, language)}</b></div>
            <div className="breakdown-row total"><span>{t.net}</span><b data-testid={`value-breakdown-net-${item.id}`}>{money(item.net, language)}</b></div>
          </section>
        );
      })}
    </div>
  );
}

function Disclaimer({ t }: { t: T }) {
  return <aside className="prototype-disclaimer" data-testid="disclaimer-prototype"><div className="disclaimer-title">{t.disclaimerTitle}</div>{t.disclaimer}</aside>;
}

export default App;