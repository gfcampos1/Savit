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

Object.assign(window, { AuthLogin, AuthRegister, ProfileScreen });
