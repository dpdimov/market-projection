import React, { useState, useMemo } from 'react';

const TAMSAMSOMExplorer = () => {
  const industryPresets = {
    b2bSaas: {
      name: 'B2B SaaS (Enterprise)',
      globalTAM: 250,
      avgPrice: 50000,
      purchaseFrequency: 'annual',
      defaultSegment: 25,
      description: 'Enterprise software with annual subscriptions. High ASP, longer sales cycles.'
    },
    consumerApp: {
      name: 'Consumer App (Freemium)',
      globalTAM: 180,
      avgPrice: 120,
      purchaseFrequency: 'annual',
      defaultSegment: 40,
      description: 'Mass-market consumer application. Low ARPU, high volume potential.'
    },
    marketplace: {
      name: 'Marketplace / Platform',
      globalTAM: 320,
      avgPrice: 2500,
      purchaseFrequency: 'annual',
      defaultSegment: 30,
      description: 'Two-sided marketplace. Revenue from take rate on transactions.'
    },
    hardwareIot: {
      name: 'Hardware / IoT',
      globalTAM: 150,
      avgPrice: 800,
      purchaseFrequency: 'one-time',
      defaultSegment: 20,
      description: 'Physical product with potential recurring services. Higher unit economics complexity.'
    },
    healthtech: {
      name: 'Healthtech (Regulated)',
      globalTAM: 200,
      avgPrice: 25000,
      purchaseFrequency: 'annual',
      defaultSegment: 15,
      description: 'Healthcare technology. Regulatory constraints limit addressable segments.'
    },
    fintech: {
      name: 'Fintech / Payments',
      globalTAM: 280,
      avgPrice: 5000,
      purchaseFrequency: 'annual',
      defaultSegment: 35,
      description: 'Financial services technology. Compliance requirements vary by geography.'
    },
    custom: {
      name: 'Custom Market',
      globalTAM: 100,
      avgPrice: 10000,
      purchaseFrequency: 'annual',
      defaultSegment: 25,
      description: 'Define your own market parameters.'
    }
  };

  const geoDefaults = {
    northAmerica: 35,
    europe: 28,
    apac: 25,
    latam: 7,
    mena: 5
  };

  const [selectedIndustry, setSelectedIndustry] = useState('b2bSaas');
  const [viewMode, setViewMode] = useState('topDown');
  const [globalTAM, setGlobalTAM] = useState(industryPresets.b2bSaas.globalTAM);
  const [avgPrice, setAvgPrice] = useState(industryPresets.b2bSaas.avgPrice);
  const [geoScope, setGeoScope] = useState({
    northAmerica: true,
    europe: true,
    apac: false,
    latam: false,
    mena: false
  });
  const [geoWeights, setGeoWeights] = useState(geoDefaults);
  const [targetSegmentPct, setTargetSegmentPct] = useState(25);
  const [channelReachPct, setChannelReachPct] = useState(70);
  const [regulatoryAccessPct, setRegulatoryAccessPct] = useState(90);
  const [timeHorizon, setTimeHorizon] = useState(3);
  const [competitorCount, setCompetitorCount] = useState(5);
  const [yearOneShare, setYearOneShare] = useState(2);
  const [growthRate, setGrowthRate] = useState(80);
  const [salesReps, setSalesReps] = useState(5);
  const [dealsPerRepPerYear, setDealsPerRepPerYear] = useState(12);
  const [avgDealSize, setAvgDealSize] = useState(50000);
  const [repGrowthPerYear, setRepGrowthPerYear] = useState(3);

  const handleIndustryChange = (industry) => {
    setSelectedIndustry(industry);
    const preset = industryPresets[industry];
    setGlobalTAM(preset.globalTAM);
    setAvgPrice(preset.avgPrice);
    setTargetSegmentPct(preset.defaultSegment);
  };

  const calculations = useMemo(() => {
    const tam = globalTAM;
    const geoMultiplier = Object.entries(geoScope)
      .filter(([_, enabled]) => enabled)
      .reduce((sum, [region]) => sum + (geoWeights[region] / 100), 0);

    const samFromGeo = tam * geoMultiplier;
    const samFromSegment = samFromGeo * (targetSegmentPct / 100);
    const samFromChannel = samFromSegment * (channelReachPct / 100);
    const sam = samFromChannel * (regulatoryAccessPct / 100);

    const impliedMaxShare = Math.min(40, 100 / (competitorCount + 1));
    const somYear1TopDown = sam * (yearOneShare / 100);

    const somProjectionsTopDown = [];
    let currentShare = yearOneShare;
    for (let y = 1; y <= 5; y++) {
      const yearSom = sam * (currentShare / 100);
      somProjectionsTopDown.push({
        year: y,
        som: yearSom,
        share: currentShare,
        capped: currentShare >= impliedMaxShare
      });
      currentShare = Math.min(impliedMaxShare, currentShare * (1 + growthRate / 100));
    }

    const bottomUpProjections = [];
    let currentReps = salesReps;
    for (let y = 1; y <= 5; y++) {
      const yearRevenue = currentReps * dealsPerRepPerYear * avgDealSize;
      const yearRevenueInBn = yearRevenue / 1e9;
      bottomUpProjections.push({
        year: y,
        som: yearRevenueInBn,
        reps: Math.round(currentReps),
        deals: Math.round(currentReps * dealsPerRepPerYear),
        impliedShare: sam > 0 ? (yearRevenueInBn / sam) * 100 : 0
      });
      currentReps += repGrowthPerYear;
    }

    const waterfall = [
      { label: 'Global TAM', value: tam, pct: 100 },
      { label: 'Geographic Scope', value: samFromGeo, pct: (samFromGeo / tam) * 100, filter: `${(geoMultiplier * 100).toFixed(0)}% of regions` },
      { label: 'Target Segment', value: samFromSegment, pct: (samFromSegment / tam) * 100, filter: `${targetSegmentPct}% segment` },
      { label: 'Channel Reach', value: samFromChannel, pct: (samFromChannel / tam) * 100, filter: `${channelReachPct}% reachable` },
      { label: 'Regulatory Access', value: sam, pct: (sam / tam) * 100, filter: `${regulatoryAccessPct}% accessible` },
    ];

    return {
      tam,
      sam,
      samFromGeo,
      geoMultiplier,
      somYear1TopDown,
      somProjectionsTopDown,
      bottomUpProjections,
      waterfall,
      impliedMaxShare,
      somAtHorizonTopDown: somProjectionsTopDown[timeHorizon - 1]?.som || 0,
      somAtHorizonBottomUp: bottomUpProjections[timeHorizon - 1]?.som || 0
    };
  }, [globalTAM, geoScope, geoWeights, targetSegmentPct, channelReachPct,
      regulatoryAccessPct, competitorCount, yearOneShare, growthRate, timeHorizon,
      salesReps, dealsPerRepPerYear, avgDealSize, repGrowthPerYear]);

  const formatBn = (val) => {
    if (val >= 1) return `$${val.toFixed(1)}bn`;
    if (val >= 0.001) return `$${(val * 1000).toFixed(0)}m`;
    return `$${(val * 1e6).toFixed(0)}k`;
  };

  const CircleVisualization = () => {
    const cx = 160;
    const cy = 160;
    const maxRadius = 120;
    const tamRadius = maxRadius;
    const samRadius = calculations.sam > 0 ? maxRadius * Math.sqrt(calculations.sam / calculations.tam) : 0;
    const somValue = viewMode === 'topDown' ? calculations.somAtHorizonTopDown : calculations.somAtHorizonBottomUp;
    const somRadius = somValue > 0 ? maxRadius * Math.sqrt(somValue / calculations.tam) : 0;
    const effectiveSomRadius = Math.max(somRadius, 8);

    // Label positions on the right side - spread them out vertically
    const tamLabelY = cy - 70;
    const samLabelY = cy;
    const somLabelY = cy + 70;

    // Connection points on circles (right side at circle edge)
    const tamConnectX = cx + tamRadius;
    const samConnectX = cx + samRadius;
    const somConnectX = cx + effectiveSomRadius;

    return (
      <svg viewBox="0 0 380 320" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', margin: '0 auto', width: '100%', maxWidth: '380px' }}>
        <defs>
          <radialGradient id="tamGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="samGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.95" />
          </radialGradient>
          <radialGradient id="somGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="1" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="1" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Circles */}
        <circle cx={cx} cy={cy} r={tamRadius} fill="url(#tamGrad)" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={samRadius} fill="url(#samGrad)" stroke="#0f766e" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={Math.max(somRadius, 8)} fill="url(#somGrad)" stroke="#0d9488" strokeWidth="2" filter="url(#glow)" />

        {/* TAM label with connector */}
        <line x1={tamConnectX} y1={cy} x2="295" y2={tamLabelY} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
        <circle cx={tamConnectX} cy={cy} r="3" fill="#cbd5e1" />
        <text x="300" y={tamLabelY - 6} textAnchor="start" fill="#64748b" fontSize="10" fontWeight="500">TAM</text>
        <text x="300" y={tamLabelY + 10} textAnchor="start" fill="#8aa0b0" fontSize="13" fontFamily="'JetBrains Mono', monospace">{formatBn(calculations.tam)}</text>

        {/* SAM label with connector */}
        {samRadius > 10 && (
          <>
            <line x1={samConnectX} y1={cy} x2="295" y2={samLabelY} stroke="#0f766e" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx={samConnectX} cy={cy} r="3" fill="#0f766e" />
            <text x="300" y={samLabelY - 6} textAnchor="start" fill="#64748b" fontSize="10" fontWeight="500">SAM</text>
            <text x="300" y={samLabelY + 10} textAnchor="start" fill="#475569" fontSize="13" fontFamily="'JetBrains Mono', monospace">{formatBn(calculations.sam)}</text>
          </>
        )}

        {/* SOM label with connector */}
        <line x1={somConnectX} y1={cy} x2="295" y2={somLabelY} stroke="#0d9488" strokeWidth="1" strokeDasharray="2,2" />
        <circle cx={somConnectX} cy={cy} r="3" fill="#0d9488" />
        <text x="300" y={somLabelY - 6} textAnchor="start" fill="#0f766e" fontSize="10" fontWeight="600">SOM Y{timeHorizon}</text>
        <text x="300" y={somLabelY + 10} textAnchor="start" fill="#0d9488" fontSize="13" fontFamily="'JetBrains Mono', monospace" fontWeight="500">{formatBn(somValue)}</text>
      </svg>
    );
  };

  return (
    <div className="page-wrapper" style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg, #f8fafc 0%, #ffffff 40%, #f8fafc 100%)',
      color: '#334155',
      fontFamily: "'DM Sans', -apple-system, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        .page-wrapper { padding: 40px; }
        .page-title { font-size: 36px; }

        .industry-btn {
          padding: 10px 16px;
          border: 1px solid rgba(107, 184, 201, 0.15);
          background: rgba(241, 245, 249, 0.8);
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 6px;
        }
        .industry-btn:hover {
          background: rgba(226, 232, 240, 0.8);
          border-color: rgba(107, 184, 201, 0.3);
          color: #475569;
        }
        .industry-btn.active {
          background: rgba(74, 144, 164, 0.15);
          border-color: rgba(107, 184, 201, 0.5);
          color: #0d9488;
        }

        .mode-toggle {
          display: flex;
          background: rgba(241, 245, 249, 0.9);
          border-radius: 8px;
          padding: 4px;
          border: 1px solid rgba(107, 184, 201, 0.1);
        }
        .mode-btn {
          padding: 10px 20px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .mode-btn.active {
          background: rgba(74, 144, 164, 0.2);
          color: #0d9488;
        }

        .slider-row { margin-bottom: 20px; }
        .slider-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 12px;
        }
        .slider-label { color: #64748b; }
        .slider-value {
          font-family: 'JetBrains Mono', monospace;
          color: #0d9488;
          font-weight: 500;
        }
        input[type="range"] {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          background: rgba(107, 184, 201, 0.15);
          border-radius: 2px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, #0d9488, #0f766e);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(107, 184, 201, 0.3);
        }

        .geo-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(107, 184, 201, 0.08);
        }
        .geo-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #0f766e;
          cursor: pointer;
        }
        .geo-label { flex: 1; font-size: 12px; color: #64748b; }
        .geo-pct {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #0d9488;
        }

        .metric-box {
          background: rgba(241, 245, 249, 0.8);
          border: 1px solid rgba(107, 184, 201, 0.1);
          border-radius: 10px;
          padding: 16px;
          text-align: center;
        }
        .metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 22px;
          color: #0d9488;
          font-weight: 500;
        }
        .metric-label {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 4px;
        }

        .waterfall-bar {
          height: 28px;
          background: linear-gradient(90deg, rgba(74, 144, 164, 0.3), rgba(74, 144, 164, 0.15));
          border-radius: 4px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: 11px;
          position: relative;
          overflow: hidden;
        }
        .waterfall-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg, rgba(107, 184, 201, 0.4), rgba(74, 144, 164, 0.2));
          border-radius: 4px;
        }
        .waterfall-text {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
        }

        .projection-row {
          display: grid;
          grid-template-columns: 50px 1fr 80px;
          gap: 12px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(107, 184, 201, 0.06);
        }
        .projection-year {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #94a3b8;
        }
        .projection-bar-container {
          height: 20px;
          background: rgba(241, 245, 249, 0.8);
          border-radius: 4px;
          overflow: hidden;
        }
        .projection-bar {
          height: 100%;
          background: linear-gradient(90deg, #0f766e, #0d9488);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .projection-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #475569;
          text-align: right;
        }

        .section-header {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #94a3b8;
          margin-bottom: 16px;
          font-weight: 500;
        }

        .panel {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(107, 184, 201, 0.08);
          border-radius: 12px;
          padding: 24px;
        }

        .main-layout {
          display: grid;
          grid-template-columns: 340px 1fr 320px;
          gap: 32px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        @media (max-width: 1200px) {
          .main-layout {
            grid-template-columns: 1fr 1fr;
          }
          .main-layout > div:nth-child(3) {
            grid-column: span 2;
          }
        }

        @media (max-width: 900px) {
          .main-layout {
            grid-template-columns: 1fr;
          }
          .main-layout > div:nth-child(3) {
            grid-column: span 1;
          }
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .page-wrapper { padding: 20px; }
          .page-title { font-size: 28px; }
          .metric-value { font-size: 18px; }
          .industry-btn {
            padding: 8px 12px;
            font-size: 11px;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#94a3b8', marginBottom: '10px' }}>
            Market Sizing Framework
          </div>
          <h1 className="page-title" style={{ fontWeight: 300, marginBottom: '12px', color: '#1e293b', letterSpacing: '-0.5px' }}>
            TAM → SAM → SOM
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '600px', lineHeight: 1.6 }}>
            Build defensible market projections. Interrogate assumptions at each layer
            and see how they cascade through to obtainable market.
          </p>
        </div>

        {/* Industry Selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {Object.entries(industryPresets).filter(([k]) => k !== 'custom').map(([key, preset]) => (
            <button
              key={key}
              className={`industry-btn ${selectedIndustry === key ? 'active' : ''}`}
              onClick={() => handleIndustryChange(key)}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Description */}
        <div style={{
          background: 'rgba(74, 144, 164, 0.06)',
          border: '1px solid rgba(107, 184, 201, 0.12)',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '32px',
          fontSize: '13px',
          color: '#64748b'
        }}>
          {industryPresets[selectedIndustry]?.description}
        </div>

        {/* Mode Toggle */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div className="mode-toggle">
            <button className={`mode-btn ${viewMode === 'topDown' ? 'active' : ''}`} onClick={() => setViewMode('topDown')}>
              Top-Down
            </button>
            <button className={`mode-btn ${viewMode === 'bottomUp' ? 'active' : ''}`} onClick={() => setViewMode('bottomUp')}>
              Bottom-Up
            </button>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {viewMode === 'topDown' ? 'Start with total market, apply filters' : 'Start with unit economics, build upward'}
          </span>
        </div>

        <div className="main-layout">
          {/* Left Panel - Parameters */}
          <div>
            <div className="panel" style={{ marginBottom: '20px' }}>
              <h3 className="section-header">Total Addressable Market</h3>

              <div className="slider-row">
                <div className="slider-header">
                  <span className="slider-label">Global TAM</span>
                  <span className="slider-value">${globalTAM}bn</span>
                </div>
                <input type="range" min="10" max="500" step="10" value={globalTAM}
                  onChange={(e) => { setGlobalTAM(Number(e.target.value)); setSelectedIndustry('custom'); }} />
              </div>

              <div className="slider-row">
                <div className="slider-header">
                  <span className="slider-label">Average Price Point</span>
                  <span className="slider-value">${avgPrice.toLocaleString()}</span>
                </div>
                <input type="range" min="50" max="100000" step="50" value={avgPrice}
                  onChange={(e) => { setAvgPrice(Number(e.target.value)); setSelectedIndustry('custom'); }} />
              </div>
            </div>

            <div className="panel" style={{ marginBottom: '20px' }}>
              <h3 className="section-header">Geographic Scope (SAM Filter)</h3>

              {Object.entries(geoScope).map(([region, enabled]) => (
                <div key={region} className="geo-toggle">
                  <input type="checkbox" className="geo-checkbox" checked={enabled}
                    onChange={(e) => setGeoScope(prev => ({ ...prev, [region]: e.target.checked }))} />
                  <span className="geo-label">
                    {region === 'northAmerica' ? 'North America' :
                     region === 'europe' ? 'Europe' :
                     region === 'apac' ? 'Asia-Pacific' :
                     region === 'latam' ? 'Latin America' : 'Middle East & Africa'}
                  </span>
                  <span className="geo-pct">{geoWeights[region]}%</span>
                </div>
              ))}

              <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
                Selected regions: {(calculations.geoMultiplier * 100).toFixed(0)}% of global TAM
              </div>
            </div>

            <div className="panel" style={{ marginBottom: '20px' }}>
              <h3 className="section-header">SAM Filters</h3>

              <div className="slider-row">
                <div className="slider-header">
                  <span className="slider-label">Target Segment</span>
                  <span className="slider-value">{targetSegmentPct}%</span>
                </div>
                <input type="range" min="5" max="100" step="5" value={targetSegmentPct}
                  onChange={(e) => setTargetSegmentPct(Number(e.target.value))} />
              </div>

              <div className="slider-row">
                <div className="slider-header">
                  <span className="slider-label">Channel Reach</span>
                  <span className="slider-value">{channelReachPct}%</span>
                </div>
                <input type="range" min="10" max="100" step="5" value={channelReachPct}
                  onChange={(e) => setChannelReachPct(Number(e.target.value))} />
              </div>

              <div className="slider-row">
                <div className="slider-header">
                  <span className="slider-label">Regulatory Access</span>
                  <span className="slider-value">{regulatoryAccessPct}%</span>
                </div>
                <input type="range" min="10" max="100" step="5" value={regulatoryAccessPct}
                  onChange={(e) => setRegulatoryAccessPct(Number(e.target.value))} />
              </div>
            </div>

            <div className="panel">
              <h3 className="section-header">
                {viewMode === 'topDown' ? 'Market Share Assumptions' : 'Venture Capacity'}
              </h3>

              {viewMode === 'topDown' ? (
                <>
                  <div className="slider-row">
                    <div className="slider-header">
                      <span className="slider-label">Competitors</span>
                      <span className="slider-value">{competitorCount} major players</span>
                    </div>
                    <input type="range" min="1" max="20" step="1" value={competitorCount}
                      onChange={(e) => setCompetitorCount(Number(e.target.value))} />
                  </div>

                  <div className="slider-row">
                    <div className="slider-header">
                      <span className="slider-label">Year 1 Market Share</span>
                      <span className="slider-value">{yearOneShare}%</span>
                    </div>
                    <input type="range" min="0.5" max="15" step="0.5" value={yearOneShare}
                      onChange={(e) => setYearOneShare(Number(e.target.value))} />
                  </div>

                  <div className="slider-row">
                    <div className="slider-header">
                      <span className="slider-label">Annual Share Growth</span>
                      <span className="slider-value">{growthRate}% YoY</span>
                    </div>
                    <input type="range" min="10" max="150" step="5" value={growthRate}
                      onChange={(e) => setGrowthRate(Number(e.target.value))} />
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8' }}>
                    Implied max share ceiling: ~{calculations.impliedMaxShare.toFixed(0)}%
                  </div>
                </>
              ) : (
                <>
                  <div className="slider-row">
                    <div className="slider-header">
                      <span className="slider-label">Sales Reps (Year 1)</span>
                      <span className="slider-value">{salesReps}</span>
                    </div>
                    <input type="range" min="1" max="50" step="1" value={salesReps}
                      onChange={(e) => setSalesReps(Number(e.target.value))} />
                  </div>

                  <div className="slider-row">
                    <div className="slider-header">
                      <span className="slider-label">Deals per Rep / Year</span>
                      <span className="slider-value">{dealsPerRepPerYear}</span>
                    </div>
                    <input type="range" min="4" max="50" step="1" value={dealsPerRepPerYear}
                      onChange={(e) => setDealsPerRepPerYear(Number(e.target.value))} />
                  </div>

                  <div className="slider-row">
                    <div className="slider-header">
                      <span className="slider-label">Average Deal Size</span>
                      <span className="slider-value">${avgDealSize.toLocaleString()}</span>
                    </div>
                    <input type="range" min="1000" max="200000" step="1000" value={avgDealSize}
                      onChange={(e) => setAvgDealSize(Number(e.target.value))} />
                  </div>

                  <div className="slider-row">
                    <div className="slider-header">
                      <span className="slider-label">Reps Added / Year</span>
                      <span className="slider-value">+{repGrowthPerYear}</span>
                    </div>
                    <input type="range" min="0" max="20" step="1" value={repGrowthPerYear}
                      onChange={(e) => setRepGrowthPerYear(Number(e.target.value))} />
                  </div>
                </>
              )}

              <div className="slider-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(107, 184, 201, 0.1)' }}>
                <div className="slider-header">
                  <span className="slider-label">Projection Horizon</span>
                  <span className="slider-value">Year {timeHorizon}</span>
                </div>
                <input type="range" min="1" max="5" step="1" value={timeHorizon}
                  onChange={(e) => setTimeHorizon(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Center Panel */}
          <div>
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-value">{formatBn(calculations.tam)}</div>
                <div className="metric-label">TAM</div>
              </div>
              <div className="metric-box">
                <div className="metric-value">{formatBn(calculations.sam)}</div>
                <div className="metric-label">SAM</div>
              </div>
              <div className="metric-box">
                <div className="metric-value" style={{ color: '#475569' }}>
                  {formatBn(viewMode === 'topDown' ? calculations.somAtHorizonTopDown : calculations.somAtHorizonBottomUp)}
                </div>
                <div className="metric-label">SOM Y{timeHorizon}</div>
              </div>
              <div className="metric-box">
                <div className="metric-value" style={{ color: '#16a34a' }}>
                  {((viewMode === 'topDown' ? calculations.somAtHorizonTopDown : calculations.somAtHorizonBottomUp) / calculations.sam * 100).toFixed(1)}%
                </div>
                <div className="metric-label">SAM Capture</div>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: '24px' }}>
              <CircleVisualization />
            </div>

            <div className="panel">
              <h3 className="section-header">TAM → SAM Waterfall</h3>

              {calculations.waterfall.map((step, i) => (
                <div key={i} className="waterfall-bar">
                  <div className="waterfall-fill" style={{ width: `${step.pct}%` }} />
                  <div className="waterfall-text">
                    <span style={{ color: '#475569' }}>{step.label}</span>
                    <span style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {step.filter && <span style={{ color: '#94a3b8', fontSize: '10px' }}>{step.filter}</span>}
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#0d9488' }}>
                        {formatBn(step.value)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(74, 144, 164, 0.08)', borderRadius: '6px', fontSize: '12px', color: '#64748b' }}>
                <strong>SAM represents {((calculations.sam / calculations.tam) * 100).toFixed(1)}%</strong> of TAM after applying
                geographic, segment, channel, and regulatory filters.
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div>
            <div className="panel">
              <h3 className="section-header">SOM Projections ({viewMode === 'topDown' ? 'Top-Down' : 'Bottom-Up'})</h3>

              {viewMode === 'topDown' ? (
                <>
                  {calculations.somProjectionsTopDown.map((proj) => (
                    <div key={proj.year} className="projection-row">
                      <span className="projection-year">Y{proj.year}</span>
                      <div className="projection-bar-container">
                        <div className="projection-bar" style={{
                          width: `${Math.min(100, (proj.som / calculations.sam) * 100 * 5)}%`,
                          background: proj.capped ? 'linear-gradient(90deg, #16a34a, #15803d)' : 'linear-gradient(90deg, #0f766e, #0d9488)'
                        }} />
                      </div>
                      <span className="projection-value">
                        {formatBn(proj.som)}
                        <span style={{ color: '#94a3b8', fontSize: '10px', marginLeft: '4px' }}>({proj.share.toFixed(1)}%)</span>
                      </span>
                    </div>
                  ))}

                  <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(107, 184, 201, 0.06)', borderRadius: '6px', fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>
                    Share growth capped at ~{calculations.impliedMaxShare.toFixed(0)}% based on {competitorCount} major competitors.
                    {calculations.somProjectionsTopDown.some(p => p.capped) && <span style={{ color: '#16a34a' }}> Ceiling reached.</span>}
                  </div>
                </>
              ) : (
                <>
                  {calculations.bottomUpProjections.map((proj) => (
                    <div key={proj.year} className="projection-row">
                      <span className="projection-year">Y{proj.year}</span>
                      <div className="projection-bar-container">
                        <div className="projection-bar" style={{ width: `${Math.min(100, (proj.som / calculations.sam) * 100 * 5)}%` }} />
                      </div>
                      <span className="projection-value">
                        {formatBn(proj.som)}
                        <span style={{ color: '#94a3b8', fontSize: '10px', marginLeft: '4px' }}>({proj.impliedShare.toFixed(2)}%)</span>
                      </span>
                    </div>
                  ))}

                  <div style={{ marginTop: '20px' }}>
                    <h4 className="section-header" style={{ marginBottom: '12px' }}>Capacity Build-Up</h4>
                    {calculations.bottomUpProjections.map((proj) => (
                      <div key={proj.year} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '6px 0', borderBottom: '1px solid rgba(107, 184, 201, 0.06)' }}>
                        <span style={{ color: '#94a3b8' }}>Y{proj.year}</span>
                        <span style={{ color: '#64748b' }}>{proj.reps} reps</span>
                        <span style={{ color: '#0d9488', fontFamily: "'JetBrains Mono', monospace" }}>{proj.deals} deals</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="panel" style={{ marginTop: '20px' }}>
              <h3 className="section-header">Sanity Check</h3>

              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.7 }}>
                {viewMode === 'topDown' ? (
                  <>
                    <p style={{ marginBottom: '12px' }}>
                      At <strong style={{ color: '#0d9488' }}>{formatBn(calculations.somAtHorizonTopDown)}</strong> in Y{timeHorizon},
                      you're claiming <strong>{((calculations.somAtHorizonTopDown / calculations.sam) * 100).toFixed(1)}%</strong> of SAM.
                    </p>
                    <p style={{ color: '#94a3b8' }}>
                      With {competitorCount} competitors, is {calculations.somProjectionsTopDown[timeHorizon-1]?.share.toFixed(1)}% share realistic
                      in {timeHorizon} years? What's your differentiation?
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ marginBottom: '12px' }}>
                      Bottom-up projects <strong style={{ color: '#0d9488' }}>{formatBn(calculations.somAtHorizonBottomUp)}</strong> in Y{timeHorizon},
                      implying <strong>{calculations.bottomUpProjections[timeHorizon-1]?.impliedShare.toFixed(2)}%</strong> SAM capture.
                    </p>
                    <p style={{ color: '#94a3b8' }}>
                      With {calculations.bottomUpProjections[timeHorizon-1]?.reps} reps closing {dealsPerRepPerYear} deals/year at ${avgDealSize.toLocaleString()} each—is this achievable?
                    </p>
                  </>
                )}
              </div>

              {viewMode === 'bottomUp' && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: calculations.somAtHorizonBottomUp > calculations.somAtHorizonTopDown * 1.5
                    ? 'rgba(180, 100, 100, 0.1)'
                    : 'rgba(100, 150, 100, 0.1)',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}>
                  <strong>Cross-check vs Top-Down:</strong> Bottom-up is{' '}
                  <span style={{
                    color: calculations.somAtHorizonBottomUp > calculations.somAtHorizonTopDown * 1.5
                      ? '#c08080' : '#80a080'
                  }}>
                    {((calculations.somAtHorizonBottomUp / calculations.somAtHorizonTopDown) * 100).toFixed(0)}%
                  </span>{' '}
                  of top-down projection.
                  {calculations.somAtHorizonBottomUp > calculations.somAtHorizonTopDown * 1.5 &&
                    <span style={{ color: '#c08080' }}> Capacity may exceed realistic market capture.</span>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TAMSAMSOMExplorer;
