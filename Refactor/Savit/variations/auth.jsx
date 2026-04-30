// Auth + Profile screens — Paper aesthetic (warm + calm for first impression)

const P2 = PAPER;

function AuthShell({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '40px 28px 24px',
      position: 'relative',
    }}>
      {children}
    </div>
  );
}

function AuthLogin() {
  return (
    <AuthShell>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginBottom: 36 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: P2.ink, color: P2.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Instrument Serif", serif', fontSize: 24, fontWeight: 500,
        }}>S</div>
        <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.18em', marginTop: 14 }}>SAVIT</div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 42, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          Suas ideias,<br/>
          <span style={{ fontStyle: 'italic', color: P2.accent }}>sempre à mão.</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="EMAIL" value="bia@savit.app"/>
        <Field label="SENHA" value="••••••••••" right={
          <span style={{
            fontSize: 11, color: P2.accent,
            borderBottom: `1px dashed ${P2.accent}`,
            paddingBottom: 1,
          }}>Esqueci</span>
        }/>
        <button style={{
          marginTop: 8, padding: '14px', borderRadius: 12,
          background: P2.ink, color: '#fff',
          fontSize: 14, fontWeight: 500,
        }}>Entrar</button>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: P2.hair }}/>
        <span className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.12em' }}>OU</span>
        <div style={{ flex: 1, height: 1, background: P2.hair }}/>
      </div>

      <div style={{ textAlign: 'center', fontSize: 13, color: P2.ink2 }}>
        Sem conta?{' '}
        <span style={{ color: P2.ink, fontWeight: 500, borderBottom: `1px solid ${P2.ink}` }}>Criar uma</span>
      </div>
    </AuthShell>
  );
}

function AuthRegister() {
  return (
    <AuthShell>
      <button style={{
        position: 'absolute', top: 24, left: 20,
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(29,26,20,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P2.ink} strokeWidth="1.7" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <div style={{ marginBottom: 28, marginTop: 30 }}>
        <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.18em' }}>NOVA CONTA</div>
        <div style={{
          fontFamily: '"Instrument Serif", serif', fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.02em',
          marginTop: 8,
        }}>
          Comece a guardar<br/>seus pensamentos.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="NOME" value="Beatriz Souza"/>
        <Field label="EMAIL" value="bia@savit.app"/>
        <Field label="SENHA" value="••••••••••" />
        <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
          <Strength on color={P2.accent}/>
          <Strength on color={P2.accent}/>
          <Strength on color={P2.accent2}/>
          <Strength color="rgba(29,26,20,0.18)"/>
          <Strength color="rgba(29,26,20,0.18)"/>
        </div>
        <div style={{ fontSize: 11, color: P2.ink2, marginTop: -4 }}>
          Forte. Mínimo 10 caracteres com letras e números.
        </div>
        <button style={{
          marginTop: 8, padding: '14px', borderRadius: 12,
          background: P2.ink, color: '#fff',
          fontSize: 14, fontWeight: 500,
        }}>Criar minha conta</button>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ textAlign: 'center', fontSize: 11, color: P2.ink3, lineHeight: 1.55 }}>
        Ao continuar você aceita os Termos e a Política de Privacidade.
      </div>
    </AuthShell>
  );
}

function Field({ label, value, right }) {
  return (
    <div style={{
      borderBottom: `1px solid ${P2.hair}`,
      paddingBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.12em' }}>{label}</div>
        {right}
      </div>
      <div style={{ fontSize: 16, color: P2.ink, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Strength({ color, on }) {
  return <div style={{ flex: 1, height: 3, borderRadius: 2, background: on ? color : color }}/>;
}

function ProfileScreen() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(29,26,20,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P2.ink} strokeWidth="1.7" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.14em' }}>PERFIL</div>
        <div style={{ width: 36 }}/>
      </div>

      <div style={{ padding: '24px 20px 12px', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: P2.ink, color: P2.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Instrument Serif", serif', fontSize: 46, fontWeight: 500,
          margin: '0 auto',
        }}>B</div>
        <div style={{ fontSize: 22, fontWeight: 500, marginTop: 14, letterSpacing: '-0.01em' }}>Beatriz Souza</div>
        <div style={{ fontSize: 12, color: P2.ink2, marginTop: 2 }}>bia@savit.app · membro desde abr/26</div>
      </div>

      {/* Stats strip */}
      <div style={{
        margin: '16px 20px 8px',
        background: P2.card,
        border: `1px solid ${P2.hair}`,
        borderRadius: 14,
        padding: '14px 4px',
        display: 'flex', justifyContent: 'space-around',
        boxShadow: P2.shadow,
      }}>
        {[
          { n: '128', l: 'NOTAS' },
          { n: '84', l: 'TAREFAS' },
          { n: '12d', l: 'STREAK' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 8px' }}>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.n}</div>
            <div className="mono" style={{ fontSize: 9, color: P2.ink3, letterSpacing: '0.14em', marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 24px' }}>
        <SettingGroup label="CONTA">
          <SettingRow label="Editar perfil" icon="user"/>
          <SettingRow label="Email e senha" icon="lock"/>
          <SettingRow label="Autenticação em 2 fatores" icon="shield" right={<span style={{ fontSize: 11, color: '#3a8a6a' }}>Ativa</span>}/>
          <SettingRow label="Sessões ativas" icon="device" right={<span style={{ fontSize: 11, color: P2.ink3 }}>2 dispositivos</span>} last/>
        </SettingGroup>

        <SettingGroup label="DADOS">
          <SettingRow label="Exportar tudo" icon="down"/>
          <SettingRow label="Importar JSON" icon="up"/>
          <SettingRow label="Limpar histórico" icon="trash" danger last/>
        </SettingGroup>

        <SettingGroup label="APARÊNCIA">
          <SettingRow label="Tema" icon="theme" right={<span style={{ fontSize: 11, color: P2.ink2 }}>Paper</span>}/>
          <SettingRow label="Cor de destaque" icon="color" right={<span style={{ width: 14, height: 14, borderRadius: 4, background: P2.accent }}/>} last/>
        </SettingGroup>

        <button style={{
          marginTop: 16, padding: '12px', borderRadius: 12,
          width: '100%',
          background: 'transparent', color: '#c0563a',
          fontSize: 13, fontWeight: 500,
          border: '1px solid rgba(192,86,58,0.35)',
        }}>Sair</button>
      </div>
    </div>
  );
}

function SettingGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.14em', marginBottom: 8 }}>{label}</div>
      <div style={{
        background: P2.card,
        border: `1px solid ${P2.hair}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}>{children}</div>
    </div>
  );
}

function SettingRow({ label, icon, right, danger, last }) {
  const ic = {
    user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
    lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
    shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3z"/></svg>,
    device: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="6" width="14" height="12" rx="2"/><rect x="17" y="9" width="5" height="9" rx="1"/></svg>,
    down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 4v12M6 12l6 6 6-6M4 22h16"/></svg>,
    up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 20V8M6 12l6-6 6 6M4 22h16"/></svg>,
    trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></svg>,
    theme: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/></svg>,
    color: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="15" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/></svg>,
  }[icon];
  return (
    <div style={{
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 'none' : `1px solid ${P2.hair}`,
      color: danger ? '#c0563a' : P2.ink,
    }}>
      <div style={{ color: danger ? '#c0563a' : P2.ink2 }}>{ic}</div>
      <div style={{ flex: 1, fontSize: 14 }}>{label}</div>
      {right || <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P2.ink3} strokeWidth="1.7" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>}
    </div>
  );
}

// =============================================
// R-27 — auth-mfa (6-digit OTP, bottom-sheet over login)
// =============================================
function AuthMFA() {
  const digits = ['4', '8', '2', '1', '', ''];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Login background (faded) */}
      <div style={{ filter: 'blur(0.5px)', opacity: 0.45, pointerEvents: 'none' }}>
        <AuthLogin/>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(29,26,20,0.42)' }}/>

      {/* MFA sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: P2.card,
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -16px 48px -12px rgba(29,26,20,0.45)',
        padding: '14px 24px calc(env(safe-area-inset-bottom) + 24px)',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ width: 40, height: 4, background: P2.hair, borderRadius: 2, margin: '0 auto' }}/>

        <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.18em', textAlign: 'center' }}>
          AUTENTICAÇÃO EM 2 FATORES
        </div>

        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 30, lineHeight: 1.15, letterSpacing: '-0.02em',
          textAlign: 'center', maxWidth: 280, margin: '0 auto',
        }}>
          Olha o código do<br/>
          <span style={{ fontStyle: 'italic', color: P2.accent }}>seu app autenticador.</span>
        </div>

        {/* 6 digit inputs */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'center',
          padding: '10px 0',
        }}>
          {digits.map((d, i) => {
            const isActive = i === 4 && !d;
            return (
              <div key={i} style={{
                width: 42, height: 56, borderRadius: 12,
                background: P2.bg,
                border: `1.5px solid ${isActive ? P2.accent : P2.hair}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 22, fontWeight: 500,
                color: P2.ink,
                position: 'relative',
              }}>
                {d || (isActive && (
                  <span style={{
                    width: 1.5, height: 24, background: P2.accent,
                  }}/>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: P2.ink2, textAlign: 'center', lineHeight: 1.55 }}>
          Não tem o app? <span style={{ color: P2.ink, borderBottom: `1px dashed ${P2.ink}` }}>Use um código de backup</span>
        </div>

        <button style={{
          padding: 14, borderRadius: 12,
          background: P2.ink, color: '#fff',
          fontSize: 14, fontWeight: 500,
          opacity: 0.5,
        }}>Verificar e entrar</button>

        <div className="mono" style={{
          fontSize: 10, color: P2.ink3, letterSpacing: '0.16em',
          textAlign: 'center',
        }}>NÃO RECEBEU? · REENVIAR EM 0:42</div>
      </div>
    </div>
  );
}

// =============================================
// N-16 — auth-login-linear (Power-user vibe)
// =============================================
function AuthLoginLinear() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0a0c10',
      color: '#e6e8ec',
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '40px 28px 24px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginBottom: 36 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 7,
          background: 'linear-gradient(135deg, #7c8bf5, #4d5db5)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Geist", sans-serif', fontSize: 17, fontWeight: 700,
        }}>S</div>
        <div className="mono" style={{ fontSize: 10, color: '#5a6172', letterSpacing: '0.18em', marginTop: 14 }}>SAVIT</div>
        <div style={{
          fontFamily: '"Geist", sans-serif',
          fontSize: 30, lineHeight: 1.15, letterSpacing: '-0.02em',
          fontWeight: 600,
        }}>
          Capture-se.<br/>
          <span style={{ color: '#7c8bf5', fontWeight: 500 }}>Com pressa.</span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: '#9097a6', letterSpacing: '0.06em', marginTop: 4 }}>
          atalhos · ⌘K · texto natural · sem cliques
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <LinearField label="email" value="bia@savit.app"/>
        <LinearField label="password" value="••••••••••" right={
          <span style={{ fontSize: 11, color: '#7c8bf5', borderBottom: '1px dashed #7c8bf5' }}>esqueci</span>
        }/>
        <button style={{
          marginTop: 8, padding: '12px', borderRadius: 6,
          background: '#7c8bf5', color: '#fff',
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Entrar
          <span className="mono" style={{
            fontSize: 10, opacity: 0.7,
            padding: '2px 5px', background: 'rgba(255,255,255,0.15)', borderRadius: 3,
          }}>↵</span>
        </button>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}/>
        <span className="mono" style={{ fontSize: 10, color: '#5a6172', letterSpacing: '0.12em' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }}/>
      </div>
      <div style={{ textAlign: 'center', fontSize: 13, color: '#9097a6' }}>
        no account? <span style={{ color: '#e6e8ec', borderBottom: '1px solid #e6e8ec' }}>create one</span>
      </div>
    </div>
  );
}

function LinearField({ label, value, right }) {
  return (
    <div style={{
      background: '#0f1218',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 6,
      padding: '8px 12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div className="mono" style={{ fontSize: 9, color: '#5a6172', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</div>
        {right}
      </div>
      <div style={{ fontSize: 14, color: '#e6e8ec', fontFamily: '"JetBrains Mono", monospace' }}>{value}</div>
    </div>
  );
}

// =============================================
// N-16 — auth-login-playful
// =============================================
function AuthLoginPlayful() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0e0a1a',
      color: '#f5f0ff',
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '40px 28px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow blobs */}
      <div style={{
        position: 'absolute', top: -120, right: -80, width: 320, height: 320,
        background: 'radial-gradient(circle, #7c5cff55 0%, transparent 65%)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: -100, left: -100, width: 280, height: 280,
        background: 'radial-gradient(circle, #ff6b9d33 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div style={{ position: 'relative' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'linear-gradient(135deg, #7c5cff 0%, #ff6b9d 100%)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 22,
          boxShadow: '0 12px 32px -8px #ff6b9d88',
        }}>S</div>
        <div className="mono" style={{ fontSize: 10, color: '#a89cc4', letterSpacing: '0.18em', marginTop: 18 }}>SAVIT</div>
        <div style={{
          fontFamily: '"Geist", sans-serif',
          fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.02em',
          fontWeight: 700, marginTop: 6,
        }}>
          Bem-vinda<br/>
          <span style={{
            background: 'linear-gradient(135deg, #ff6b9d 0%, #ffb84a 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent',
          }}>de volta ✦</span>
        </div>
      </div>

      <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        <PlayfulFieldAuth label="EMAIL" value="bia@savit.app"/>
        <PlayfulFieldAuth label="SENHA" value="••••••••••" right={<span style={{ fontSize: 11, color: '#ff6b9d' }}>esqueci</span>}/>
        <button style={{
          marginTop: 8, padding: '14px', borderRadius: 16,
          background: 'linear-gradient(135deg, #7c5cff 0%, #ff6b9d 100%)',
          color: '#fff', fontSize: 14, fontWeight: 600,
          boxShadow: '0 12px 32px -8px #ff6b9d88',
        }}>Entrar</button>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ textAlign: 'center', fontSize: 13, color: '#a89cc4', position: 'relative' }}>
        Sem conta? <span style={{ color: '#f5f0ff', fontWeight: 500, borderBottom: '1px solid #f5f0ff' }}>Criar uma</span>
      </div>
    </div>
  );
}

function PlayfulFieldAuth({ label, value, right }) {
  return (
    <div style={{
      background: 'rgba(24,18,40,0.6)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="mono" style={{ fontSize: 10, color: '#a89cc4', letterSpacing: '0.18em' }}>{label}</div>
        {right}
      </div>
      <div style={{ fontSize: 16, color: '#f5f0ff', marginTop: 4 }}>{value}</div>
    </div>
  );
}

// =============================================
// N-17 — profile-sessions (dispositivos com swipe-to-revoke)
// =============================================
function ProfileSessions() {
  const sessions = [
    { name: 'iPhone 14 · Safari', meta: 'São Paulo, BR · ativo agora', current: true, revealed: false },
    { name: 'MacBook Pro · Chrome', meta: 'São Paulo, BR · 2h atrás', revealed: true }, // showing swipe action
    { name: 'iPad · Safari', meta: 'Belo Horizonte, BR · 3 dias atrás' },
    { name: 'Android · Chrome', meta: 'Local desconhecido · 12 dias atrás', warn: true },
  ];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(29,26,20,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P2.ink} strokeWidth="1.7" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.14em' }}>SESSÕES ATIVAS</div>
        <div style={{ width: 36 }}/>
      </div>

      <div style={{ padding: '16px 20px 6px' }}>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.02em',
        }}>4 dispositivos<br/>
          <span style={{ fontStyle: 'italic', color: P2.accent }}>conectados.</span>
        </div>
        <div style={{ fontSize: 13, color: P2.ink2, marginTop: 8, lineHeight: 1.55 }}>
          Deslize pra esquerda pra encerrar uma sessão. Sessões antigas são removidas em 30 dias.
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 0 24px' }}>
        {sessions.map((s, i) => (
          <SessionRow key={i} {...s}/>
        ))}

        <div style={{ padding: '20px 20px 0' }}>
          <button style={{
            width: '100%', padding: 12, borderRadius: 12,
            background: 'transparent',
            color: '#c0563a',
            border: '1px solid rgba(192,86,58,0.35)',
            fontSize: 13, fontWeight: 500,
          }}>Encerrar todas as outras sessões</button>
        </div>
      </div>
    </div>
  );
}

function SessionRow({ name, meta, current, revealed, warn }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Revealed action bg (red) */}
      {revealed && (
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 100,
          background: '#c0563a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6,
          color: '#fff',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></svg>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Encerrar</span>
        </div>
      )}

      <div style={{
        background: P2.bg,
        padding: '14px 20px',
        borderTop: `1px solid ${P2.hair}`,
        display: 'flex', alignItems: 'center', gap: 12,
        transform: revealed ? 'translateX(-100px)' : 'translateX(0)',
        transition: 'transform 200ms',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: P2.card,
          border: `1px solid ${P2.hair}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: P2.ink2,
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="6" width="14" height="12" rx="2"/><rect x="17" y="9" width="5" height="9" rx="1"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
            {current && (
              <span className="mono" style={{
                fontSize: 9, color: '#3a8a6a',
                padding: '1px 6px', background: '#3a8a6a18',
                borderRadius: 4, letterSpacing: '0.12em',
              }}>ATUAL</span>
            )}
            {warn && (
              <span className="mono" style={{
                fontSize: 9, color: '#c0563a',
                padding: '1px 6px', background: '#c0563a18',
                borderRadius: 4, letterSpacing: '0.12em',
              }}>SUSPEITA</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: P2.ink2, marginTop: 2 }}>{meta}</div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// N-18 — profile-export & profile-import
// =============================================
function ProfileExport() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(29,26,20,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P2.ink} strokeWidth="1.7" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.14em' }}>EXPORTAR</div>
        <div style={{ width: 36 }}/>
      </div>

      <div style={{ flex: 1, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em',
          }}>
            Tudo seu,<br/>
            <span style={{ fontStyle: 'italic', color: P2.accent }}>num arquivo só.</span>
          </div>
          <div style={{ fontSize: 13, color: P2.ink2, marginTop: 10, lineHeight: 1.55 }}>
            Exporta suas notas, tarefas e categorias em JSON. Sem perder nada — sem trancar você no Savit.
          </div>
        </div>

        <div style={{
          background: P2.card,
          border: `1px solid ${P2.hair}`,
          borderRadius: 16,
          padding: 18,
          display: 'flex', flexDirection: 'column', gap: 10,
          boxShadow: P2.shadow,
        }}>
          <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.16em' }}>
            CONTEÚDO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Notas',      count: 128, included: true },
              { label: 'Tarefas',    count: 84,  included: true },
              { label: 'Categorias', count: 6,   included: true },
              { label: 'Imagens (base64)', count: 23, included: false },
            ].map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 14,
                opacity: c.included ? 1 : 0.55,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: `1.5px solid ${c.included ? P2.ink : P2.ink3}`,
                  background: c.included ? P2.ink : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {c.included && (
                    <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2.5 6.5L5 9L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                  )}
                </div>
                <span style={{ flex: 1 }}>{c.label}</span>
                <span className="mono" style={{ fontSize: 11.5, color: P2.ink3 }}>{c.count}</span>
              </div>
            ))}
          </div>
          <div style={{
            paddingTop: 10, marginTop: 4,
            borderTop: `1px dashed ${P2.hair}`,
            display: 'flex', justifyContent: 'space-between', fontSize: 12,
            color: P2.ink2,
          }}>
            <span>Tamanho estimado</span>
            <span className="mono">~340 KB</span>
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        <button style={{
          padding: 16, borderRadius: 14,
          background: P2.ink, color: '#fff',
          fontSize: 15, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 8px 24px -8px rgba(29,26,20,0.55)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 4v12M6 12l6 6 6-6M4 22h16"/></svg>
          Baixar savit-2026-04-30.json
        </button>
      </div>
    </div>
  );
}

function ProfileImport() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(29,26,20,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P2.ink} strokeWidth="1.7" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.14em' }}>IMPORTAR JSON</div>
        <div style={{ width: 36 }}/>
      </div>

      <div style={{ flex: 1, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.02em',
          }}>
            Cole, solte<br/>
            <span style={{ fontStyle: 'italic', color: P2.accent }}>ou escolha um arquivo.</span>
          </div>
        </div>

        {/* Drop zone */}
        <div style={{
          background: P2.card,
          border: `2px dashed ${P2.accent}55`,
          borderRadius: 18,
          padding: '28px 22px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: P2.accent + '18',
            color: P2.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 20V8M6 12l6-6 6 6M4 22h16"/></svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            Solte um <code style={{
              fontFamily: '"JetBrains Mono", monospace',
              background: P2.bg, padding: '1px 6px', borderRadius: 4,
              fontSize: 12,
            }}>.json</code> aqui
          </div>
          <div style={{ fontSize: 12, color: P2.ink2 }}>
            ou <span style={{ color: P2.accent, borderBottom: `1px dashed ${P2.accent}` }}>escolha um arquivo</span>
          </div>
        </div>

        {/* Live validation card — file detected */}
        <div style={{
          background: P2.card,
          border: '1px solid rgba(58,138,106,0.30)',
          borderRadius: 14,
          padding: 14,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, background: '#3a8a6a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2.5 6.5L5 9L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
            </span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>backup-2026-04-15.json</span>
            <div style={{ flex: 1 }}/>
            <span className="mono" style={{ fontSize: 11, color: P2.ink3 }}>312 KB</span>
          </div>
          <div className="mono" style={{ fontSize: 10, color: '#3a8a6a', letterSpacing: '0.12em' }}>
            ✓ 128 NOTAS · 84 TAREFAS · 6 CATEGORIAS DETECTADAS
          </div>
          <div style={{
            padding: '8px 10px',
            background: P2.bg,
            borderRadius: 8,
            fontSize: 11.5, color: P2.ink2,
            lineHeight: 1.5,
          }}>
            <span style={{ color: P2.accent2 }}>Atenção:</span> as categorias com nomes iguais às suas serão fundidas. Itens duplicados serão ignorados.
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            flex: 1, padding: 14, borderRadius: 12,
            background: P2.card, color: P2.ink,
            border: `1px solid ${P2.hair}`,
            fontSize: 13, fontWeight: 500,
          }}>Cancelar</button>
          <button style={{
            flex: 2, padding: 14, borderRadius: 12,
            background: P2.ink, color: '#fff',
            fontSize: 14, fontWeight: 600,
          }}>Importar 218 itens</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// N-13 — paper-404 & paper-error
// =============================================
function Paper404() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '40px 32px',
    }}>
      <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.18em' }}>SAVIT · 404</div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 84, lineHeight: 0.95, letterSpacing: '-0.04em',
          color: P2.accent,
        }}>404</div>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 36, lineHeight: 1.15, letterSpacing: '-0.02em',
        }}>
          Esta página<br/>
          <span style={{ fontStyle: 'italic' }}>fugiu.</span>
        </div>
        <div style={{ fontSize: 14, color: P2.ink2, lineHeight: 1.55, maxWidth: 280 }}>
          Talvez o link tenha quebrado, ou a página tenha sido arquivada. Não foi você.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={{
            padding: '12px 18px', borderRadius: 12,
            background: P2.ink, color: '#fff',
            fontSize: 13, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
            Voltar pro Inbox
          </button>
          <button style={{
            padding: '12px 18px', borderRadius: 12,
            background: 'transparent', color: P2.ink2,
            border: `1px solid ${P2.hair}`,
            fontSize: 13, fontWeight: 500,
          }}>Reportar</button>
        </div>
      </div>

      <div className="mono" style={{ fontSize: 10, color: P2.ink3, letterSpacing: '0.16em' }}>
        savit.app/perdido — código de referência: SAV-LOST-32
      </div>
    </div>
  );
}

function PaperError500() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '40px 32px',
    }}>
      <div className="mono" style={{ fontSize: 10, color: '#c0563a', letterSpacing: '0.18em' }}>SAVIT · ERRO 500</div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: '#c0563a18',
          color: '#c0563a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 32, lineHeight: 1.15, letterSpacing: '-0.02em',
        }}>
          Algo deu errado.<br/>
          <span style={{ fontStyle: 'italic', color: P2.accent }}>Já fomos avisados.</span>
        </div>
        <div style={{ fontSize: 14, color: P2.ink2, lineHeight: 1.55, maxWidth: 320 }}>
          Sua última captura tá salva localmente — nada se perdeu. A gente já tá olhando.
        </div>

        <div style={{
          padding: '10px 14px',
          background: P2.card,
          border: `1px dashed ${P2.hair}`,
          borderRadius: 10,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11, color: P2.ink2,
          lineHeight: 1.5,
        }}>
          <span style={{ color: P2.ink3 }}>$ </span>
          GET /api/messages → 503 Upstream timeout<br/>
          <span style={{ color: P2.ink3 }}>· </span>
          retry em 8s · backoff exponencial
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button style={{
            padding: '12px 18px', borderRadius: 12,
            background: P2.ink, color: '#fff',
            fontSize: 13, fontWeight: 500,
          }}>Tentar de novo</button>
          <button style={{
            padding: '12px 18px', borderRadius: 12,
            background: 'transparent', color: P2.ink2,
            border: `1px solid ${P2.hair}`,
            fontSize: 13,
          }}>Continuar offline</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// N-14 — onboarding-1 / -2 / -3
// =============================================
function OnboardingShell({ step, title, subtitle, children, action = 'Próximo' }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: P2.bg,
      color: P2.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '36px 28px 24px',
    }}>
      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: s <= step ? P2.ink : P2.hair,
          }}/>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.02em',
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 15, color: P2.ink2, lineHeight: 1.55, maxWidth: 320 }}>{subtitle}</div>
        )}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
          {children}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12 }}>
        <button style={{
          padding: '12px 16px', borderRadius: 12,
          background: 'transparent', color: P2.ink3,
          fontSize: 13, fontWeight: 500,
        }}>Pular</button>
        <div style={{ flex: 1 }}/>
        <button style={{
          padding: '12px 22px', borderRadius: 12,
          background: P2.ink, color: '#fff',
          fontSize: 14, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {action}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

function Onboarding1() {
  return (
    <OnboardingShell
      step={1}
      title={<>Capture qualquer<br/>pensamento <span style={{ fontStyle: 'italic', color: P2.accent }}>em 2 segundos.</span></>}
      subtitle="Abre o app, digita, sai. Vira nota se for ideia, vira tarefa se tiver prazo. Nada de campos."
    >
      {/* Stylized capture animation placeholder */}
      <div style={{
        width: '100%', maxWidth: 320,
        background: P2.card,
        border: `1px solid ${P2.hair}`,
        borderRadius: 18,
        padding: 18,
        boxShadow: P2.shadow,
        display: 'flex', flexDirection: 'column', gap: 12,
        transform: 'rotate(-1deg)',
      }}>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 18, lineHeight: 1.4, color: P2.ink,
        }}>
          amanhã 9h #trabalho lembrar do PR
          <span style={{ display: 'inline-block', width: 1.5, height: 18, background: P2.accent, marginLeft: 2, verticalAlign: 'middle' }}/>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {[
            { label: 'Tarefa', isTask: true },
            { label: 'Sex 1/5 09:00' },
            { label: 'trabalho', color: '#c0563a' },
          ].map((c, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px',
              background: P2.bg,
              border: `1px solid ${P2.hair}`,
              borderRadius: 999,
              fontSize: 10.5,
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.04em',
            }}>
              {c.color && <span style={{ width: 6, height: 6, borderRadius: 2, background: c.color }}/>}
              {c.isTask && <span style={{ fontSize: 9, color: P2.accent, fontWeight: 600 }}>TAREFA</span>}
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </OnboardingShell>
  );
}

function Onboarding2() {
  const cats = [
    { name: 'Trabalho', color: '#c0563a', sel: true },
    { name: 'Pessoal', color: '#3a8a6a', sel: true },
    { name: 'Casa', color: '#7a5cc7', sel: true },
    { name: 'Leitura', color: '#e6b540' },
    { name: 'Saúde', color: '#d96fa0' },
    { name: 'Ideias', color: '#5b8cff' },
  ];
  return (
    <OnboardingShell
      step={2}
      title={<>Categorias dão<br/><span style={{ fontStyle: 'italic', color: P2.accent }}>cor à sua vida.</span></>}
      subtitle="Escolha algumas pra começar — cada cor vira um espaço na sua cabeça."
    >
      <div style={{
        width: '100%', maxWidth: 320,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      }}>
        {cats.map((c, i) => (
          <div key={i} style={{
            background: c.sel ? c.color + '12' : P2.card,
            border: `1.5px solid ${c.sel ? c.color : P2.hair}`,
            borderRadius: 14,
            padding: '14px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
            position: 'relative',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: c.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontFamily: '"Instrument Serif", serif',
              fontSize: 14, fontWeight: 500,
            }}>{c.name[0]}</div>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: c.sel ? c.color : P2.ink }}>{c.name}</span>
            {c.sel && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                width: 16, height: 16, borderRadius: 8,
                background: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="9" height="9" viewBox="0 0 12 12"><path d="M2.5 6.5L5 9L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </OnboardingShell>
  );
}

function Onboarding3() {
  return (
    <OnboardingShell
      step={3}
      title={<>Use linguagem<br/><span style={{ fontStyle: 'italic', color: P2.accent }}>natural.</span></>}
      subtitle="O Savit entende quando você escreve. Não precisa preencher formulário."
      action="Começar"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, width: '100%' }}>
        {[
          { in: 'amanhã 9h #trabalho call cliente', out: 'Tarefa · Sex 1/5 09:00 · trabalho' },
          { in: 'sex 17h dentista !!', out: 'Tarefa · Sex 1/5 17:00 · prioridade alta' },
          { in: 'Ideia pra app de pomodoro', out: 'Nota livre · sem categoria' },
          { in: 'daqui 2h responder Maria', out: 'Tarefa · hoje 11:42' },
        ].map((ex, i) => (
          <div key={i} style={{
            background: P2.card,
            border: `1px solid ${P2.hair}`,
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12, color: P2.ink,
              letterSpacing: '0.02em',
            }}>{ex.in}</div>
            <div style={{
              fontSize: 11, color: P2.ink2, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={P2.accent} strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              <span>{ex.out}</span>
            </div>
          </div>
        ))}
      </div>
    </OnboardingShell>
  );
}

Object.assign(window, {
  AuthLogin, AuthRegister, ProfileScreen,
  AuthMFA, AuthLoginLinear, AuthLoginPlayful,
  ProfileSessions, ProfileExport, ProfileImport,
  Paper404, PaperError500,
  Onboarding1, Onboarding2, Onboarding3,
});
