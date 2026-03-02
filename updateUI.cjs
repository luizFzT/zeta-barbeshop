const fs = require('fs');
let lines = fs.readFileSync('src/client/ClientQueuePage.jsx', 'utf8').split('\n');

const newCode = `                                {/* Status Overview Circular */}
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                                    
                                    {/* Main Circular Timer */}
                                    <div className="cq-circular-progress" style={{ width: '160px', height: '160px' }}>
                                        <svg className="cq-progress-svg" viewBox="0 0 100 100">
                                            <defs>
                                                <linearGradient id="neonGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="var(--accent)" />
                                                    <stop offset="100%" stopColor="var(--neon-secondary)" />
                                                </linearGradient>
                                            </defs>
                                            <circle className="cq-progress-ring-bg" cx="50" cy="50" r="45" />
                                            <circle
                                                className="cq-progress-ring-fg"
                                                cx="50" cy="50" r="45"
                                                stroke="url(#neonGradientMain)"
                                                strokeDasharray="283"
                                                strokeDashoffset={283 - (283 * Math.min(100, Math.max(5, (barbershop.wait_time_minutes / 120) * 100))) / 100}
                                            />
                                        </svg>
                                        <div className="cq-wait-time-central">
                                            <div className="cq-wait-number-massive" style={{ fontSize: '3.5rem' }}>
                                                ~{barbershop.wait_time_minutes}
                                            </div>
                                            <div className="cq-wait-label-inline" style={{ marginTop: 0 }}>MINUTOS</div>
                                        </div>
                                    </div>

                                    {/* Discreet Queue Count */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 20px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)' }}>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '24px', marginBottom: '4px' }}>groups</span>
                                        <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1' }}>{queue.length}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Na Fila</div>
                                    </div>

                                </div>`;

lines.splice(573, 11, newCode);
fs.writeFileSync('src/client/ClientQueuePage.jsx', lines.join('\n'));
console.log("Success");
