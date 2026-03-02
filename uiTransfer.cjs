const fs = require('fs');
let code = fs.readFileSync('src/client/ClientQueuePage.jsx', 'utf8');

// The replacement text string
const AI_STUDIO_UI = `                                {/* AI Studio Reactive Timer & Barbers */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', margin: 'var(--space-4) 0' }}>
                                    <div className="glass-card" style={{ padding: '8px 24px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-secondary)', boxShadow: '0 0 8px var(--neon-secondary)', animation: 'pulse 2s infinite' }}></div>
                                        <span style={{ color: 'var(--neon-secondary)', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Fila Aberta</span>
                                    </div>
                                    
                                    <div className="relative breathe cursor-pointer group" style={{ position: 'relative', width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 280 280">
                                            <circle cx="140" cy="140" fill="none" r="130" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8"></circle>
                                        </svg>
                                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.5))' }} viewBox="0 0 280 280">
                                            <defs>
                                                <linearGradient id="gradientReactive" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#a855f7"></stop>
                                                    <stop offset="100%" stopColor="#22D3EE"></stop>
                                                </linearGradient>
                                            </defs>
                                            <circle
                                                className="progress-ring__circle"
                                                cx="140" cy="140" fill="none" r="130"
                                                stroke="url(#gradientReactive)" strokeWidth="8" strokeLinecap="round"
                                                strokeDasharray="816.8"
                                                strokeDashoffset={816.8 - (816.8 * Math.min(100, Math.max(5, (barbershop.wait_time_minutes / 120) * 100))) / 100}
                                            ></circle>
                                        </svg>
                                        
                                        {/* Spinning Dot */}
                                        <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', transform: 'rotate(270deg)', animation: 'spin 10s linear infinite' }}>
                                            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 15px #fff', zIndex: 10 }}></div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', zIndex: 20 }}>
                                            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '4.5rem', color: '#fff', letterSpacing: '-2px', textShadow: '0 0 15px rgba(255,255,255,0.3)', lineHeight: '1', display: 'flex', alignItems: 'baseline' }}>
                                                {barbershop.wait_time_minutes}<span style={{ fontSize: '1.5rem', opacity: 0.8, marginLeft: '-4px' }}>m</span>
                                            </h1>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '12px' }}>Tempo Estimado</p>
                                        </div>
                                        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.5 }}></div>
                                    </div>
                                    
                                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                                        <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '500' }}>Corte de Cabelo</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Temos <strong style={{ color: 'var(--accent)' }}>{queue.length}</strong> {queue.length === 1 ? 'cliente' : 'clientes'} na fila</p>
                                    </div>
                                </div>

                                {/* Available Barbers Scroll */}
                                <div style={{ width: '100%', marginBottom: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
                                    <div style={{ padding: '0 var(--space-4)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <h3 style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '500', letterSpacing: '1px' }}>Profissionais</h3>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deslize</span>
                                    </div>
                                    <div style={{ display: 'flex', overflowX: 'auto', padding: '0 var(--space-4) 16px', gap: '16px', scrollSnapType: 'x mandatory' }} className="no-scrollbar">
                                        
                                        <div style={{ scrollSnapAlign: 'center', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 1 }}>
                                            <div className="glass-card" style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '16px', padding: '4px', borderColor: 'rgba(168,85,247,0.5)', boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
                                                {barbershop.avatar_url ? (
                                                  <img src={barbershop.avatar_url} alt="Barber" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                                ) : (
                                                  <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✂️</div>
                                                )}
                                                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: 'var(--accent)', borderRadius: '50%', border: '2px solid #0A0A0F', boxShadow: '0 0 8px #a855f7' }}></div>
                                            </div>
                                            <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '-0.5px' }}>{barbershop.name.split(' ')[0]}</span>
                                        </div>

                                        <div style={{ scrollSnapAlign: 'center', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.5, transition: 'all 0.2s' }}>
                                            <div className="glass-card" style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '16px', padding: '4px' }}>
                                                <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-muted)' }}>person_add</span>
                                                </div>
                                            </div>
                                            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '13px', letterSpacing: '-0.5px' }}>Qualquer Um</span>
                                        </div>
                                        
                                        <div style={{ width: '8px', flexShrink: 0 }}></div>
                                    </div>
                                </div>`;

code = code.replace(/\{\/\* Status Overview Circular \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>/s, AI_STUDIO_UI);
fs.writeFileSync('src/client/ClientQueuePage.jsx', code);
console.log('Done!');
