export function HeroVisual() {
  return (
    <div className="hero-visual-glass animate-fluid delay-300">
      <div className="glass-panel-pro" style={{ width: "100%", height: "100%", borderRadius: "40px", padding: "0" }}>
        <svg className="metric-bg-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="greenCardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glow-intense">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Abstract Data Flow Beam */}
          <rect x="198" y="50" width="4" height="300" fill="url(#beamGradient)" className="pulse-glow" />

          {/* Top Glass Pane (Input) */}
          <g transform="translate(200, 100)">
            <rect x="-60" y="-40" width="120" height="80" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" transform="skewY(-10)" />
            <circle cx="0" cy="0" r="12" fill="#38BDF8" opacity="0.8" filter="url(#glow-intense)">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Middle Glass Pane (Process) */}
          <g transform="translate(200, 200)">
            <rect x="-80" y="-50" width="160" height="100" rx="16" fill="url(#greenCardGradient)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" transform="skewY(-10)" />
            <path d="M-20 0 L0 20 L20 -20" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" filter="url(#glow-intense)">
              <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="2s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Bottom Glass Pane (Output) */}
          <g transform="translate(200, 300)">
            <rect x="-60" y="-40" width="120" height="80" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" transform="skewY(-10)" />
            <rect x="-20" y="-15" width="40" height="30" rx="4" fill="#2563EB" opacity="0.8" />
          </g>

          {/* Moving Particles */}
          <circle cx="200" cy="80" r="4" fill="white">
            <animate attributeName="cy" values="80; 320" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>

        <div className="visual-status-badge">
           <span className="status-badge-large" style={{ background: "rgba(255,255,255,0.8)" }}>
             <span className="status-dot"></span>
             System Operational
           </span>
        </div>
      </div>
    </div>
  );
}

