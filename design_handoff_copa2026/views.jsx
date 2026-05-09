// Coleção, Repetidas, Trocas, Home views
const { useState: uS, useMemo: uM, useEffect: uE, useRef: uR } = React;

// Helpers
function gradFor(country) {
  if (!country) return 'linear-gradient(135deg, #1f2a4d 0%, #141a30 100%)';
  return window.countryGradient(country.colors);
}

function buildAllStickers() {
  const list = [];
  window.GROUPS.forEach(g => {
    for (let i = 1; i <= g.total; i++) {
      const country = g.country ? window.findCountry(g.country) : null;
      list.push({
        id: `${g.prefix}-${i}`,
        num: i,
        groupId: g.id,
        groupTitle: g.title,
        groupIcon: g.icon,
        prefix: g.prefix,
        country,
        kind: g.kind,
        special: g.kind === 'special' && (i === 1 || i === 18),
      });
    }
  });
  return list;
}

function fireConfetti(x, y) {
  const colors = ['#FFD23F', '#FFB800', '#34D399', '#A78BFA', '#F472B6', '#38BDF8', '#FF6B6B'];
  const burst = document.createElement('div');
  burst.className = 'confetti-burst';
  burst.style.left = x + 'px';
  burst.style.top = y + 'px';
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.background = colors[i % colors.length];
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 120;
    p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
    p.style.setProperty('--tr', `${Math.random() * 720 - 360}deg`);
    p.style.animationDelay = (Math.random() * 0.1) + 's';
    burst.appendChild(p);
  }
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1600);
}

// COLECAO ==================================================================
function Colecao({ stickers, owned, dupes, onCollect, onUncollect, query, setQuery, filter, setFilter }) {
  const filteredStickers = uM(() => {
    let s = stickers;
    if (query) {
      const q = query.toLowerCase();
      s = s.filter(x => (x.country?.name || '').toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || x.groupTitle.toLowerCase().includes(q));
    }
    if (filter === 'have') s = s.filter(x => owned.has(x.id));
    if (filter === 'missing') s = s.filter(x => !owned.has(x.id));
    return s;
  }, [stickers, query, filter, owned]);

  const grouped = uM(() => {
    const g = {};
    filteredStickers.forEach(s => { (g[s.groupId] = g[s.groupId] || { ...window.GROUPS.find(x => x.id === s.groupId), items: [] }).items.push(s); });
    return Object.values(g);
  }, [filteredStickers]);

  const total = stickers.length;
  const have = owned.size;
  const pct = total ? (have / total) * 100 : 0;

  const milestones = [25, 50, 75, 100];

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Sua coleção</div>
        <h1 className="page-title">Minha <span className="accent">Coleção</span></h1>
        <div className="page-sub">Toque em uma figurinha para colar no álbum. Solte uma figurinha repetida em "Repetidas" para liberar para troca.</div>
      </div>

      <div className="progress-hero">
        <div className="ph-row">
          <div>
            <div className="ph-label">Progresso Total</div>
            <div className="ph-count">{have}<span className="of"> / {total}</span></div>
          </div>
          <div className="ph-pct">{Math.round(pct)}%</div>
        </div>
        <div className="bar"><div className="bar-fill" style={{ width: pct + '%' }} /></div>
        <div className="milestones">
          {milestones.map(m => (
            <div key={m} className={'milestone ' + (pct >= m ? 'hit' : '')} style={{ left: m + '%' }}>
              <div className="dot" />
              {m}%
            </div>
          ))}
        </div>
      </div>

      <div className="search-row">
        <div className="search-box">
          <Icon name="search" />
          <input placeholder="Buscar seleção, número ou grupo…" value={query} onChange={e => setQuery(e.target.value)} />
          <span className="kbd">⌘K</span>
        </div>
        <div className="pills">
          {['all', 'have', 'missing'].map(f => (
            <button key={f} className={'pill ' + (filter === f ? 'active' : '')} onClick={() => setFilter(f)}>
              {f === 'all' && 'Todas'}{f === 'have' && '✓ Tenho'}{f === 'missing' && '○ Faltam'}
              <span className="count">{f === 'all' ? total : f === 'have' ? have : total - have}</span>
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="empty"><div className="icon-big">🔍</div><div>Nenhuma figurinha encontrada</div></div>
      )}

      {grouped.map(g => {
        const totalG = g.items.length;
        const haveG = g.items.filter(x => owned.has(x.id)).length;
        const pctG = totalG ? (haveG / totalG) * 100 : 0;
        return (
          <div key={g.id} className="group">
            <div className="group-head">
              <div className="group-icon">{g.icon}</div>
              <div>
                <div className="group-title">{g.title}</div>
                <div className="group-meta">{haveG} de {totalG} coletadas</div>
              </div>
              <div className="group-progress">
                <div className="group-progress-bar"><div className="group-progress-fill" style={{ width: pctG + '%' }} /></div>
                <div className="group-progress-pct">{Math.round(pctG)}%</div>
              </div>
            </div>
            <div className="stickers">
              {g.items.map(s => {
                const isOwned = owned.has(s.id);
                const dupeCount = dupes.get(s.id) || 0;
                const cls = ['sticker'];
                if (isOwned) cls.push('collected');
                else cls.push('empty');
                if (s.special && isOwned) cls.push('special');
                const style = isOwned ? { '--country-bg': gradFor(s.country) } : {};
                return (
                  <button
                    key={s.id}
                    className={cls.join(' ')}
                    style={style}
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      if (!isOwned) {
                        onCollect(s.id);
                        fireConfetti(r.left + r.width / 2, r.top + r.height / 2);
                      } else {
                        onUncollect(s.id);
                      }
                    }}
                  >
                    {isOwned && dupeCount > 0 && <span className="dupe-badge">×{dupeCount + 1}</span>}
                    {isOwned && dupeCount === 0 && <span className="check"><Icon name="check" size={14} /></span>}
                    <div>
                      <div className="num">{s.num}</div>
                      <div className="code">{s.prefix}</div>
                    </div>
                    <div className="country">
                      {s.country ? <><span className="flag">{s.country.flag}</span><span>{s.country.code}</span></> : <span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.groupTitle}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// REPETIDAS ===================================================================
function Repetidas({ stickers, owned, dupes, setDupes, onPublishTrade }) {
  const [filter, setFilter] = uS('all');
  const [query, setQuery] = uS('');
  const totalDupes = uM(() => Array.from(dupes.values()).reduce((a, b) => a + b, 0), [dupes]);

  const filtered = uM(() => {
    let s = stickers;
    if (filter === 'has') s = s.filter(x => (dupes.get(x.id) || 0) > 0);
    if (query) {
      const q = query.toLowerCase();
      s = s.filter(x => (x.country?.name || '').toLowerCase().includes(q) || x.id.toLowerCase().includes(q));
    }
    return s;
  }, [stickers, dupes, filter, query]);

  const byGroup = uM(() => {
    const g = {};
    filtered.forEach(s => { (g[s.groupId] = g[s.groupId] || { ...window.GROUPS.find(x => x.id === s.groupId), items: [] }).items.push(s); });
    return Object.values(g);
  }, [filtered]);

  const updateDupe = (id, delta) => {
    setDupes(prev => {
      const nx = new Map(prev);
      const v = (nx.get(id) || 0) + delta;
      if (v <= 0) nx.delete(id); else nx.set(id, v);
      return nx;
    });
  };

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Suas duplicadas</div>
        <h1 className="page-title">Figurinhas <span className="accent">Repetidas</span></h1>
        <div className="page-sub">Use + e − para registrar quantas repetidas você tem. Publique direto na troca com 1 clique.</div>
      </div>

      <div className="progress-hero" style={{ padding: '20px 28px' }}>
        <div className="ph-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="stat-icon gold" style={{ width: 56, height: 56, borderRadius: 14 }}>
              <Icon name="repeat" size={26} />
            </div>
            <div>
              <div className="ph-label">Total de Repetidas</div>
              <div className="ph-count" style={{ fontSize: 48 }}>{totalDupes}<span className="of"> figurinha{totalDupes !== 1 ? 's' : ''}</span></div>
            </div>
          </div>
          <button className="btn primary" onClick={onPublishTrade}><Icon name="plus" size={14} /> Publicar Troca</button>
        </div>
      </div>

      <div className="search-row">
        <div className="search-box">
          <Icon name="search" />
          <input placeholder="Buscar por seleção ou código…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="pills">
          <button className={'pill ' + (filter === 'all' ? 'active' : '')} onClick={() => setFilter('all')}>Todas</button>
          <button className={'pill ' + (filter === 'has' ? 'active' : '')} onClick={() => setFilter('has')}>Com repetidas <span className="count">{Array.from(dupes.keys()).length}</span></button>
        </div>
      </div>

      {byGroup.map(g => (
        <div key={g.id} className="group">
          <div className="group-head">
            <div className="group-icon">{g.icon}</div>
            <div className="group-title">{g.title}</div>
          </div>
          <div className="dupe-list">
            {g.items.map(s => {
              const count = dupes.get(s.id) || 0;
              const has = count > 0;
              return (
                <div key={s.id} className={'dupe-card ' + (has ? 'has-dupes' : '')}>
                  <div className="mini" style={{ '--country-bg': gradFor(s.country) }}>{s.num}</div>
                  <div className="info">
                    <div className="t">{s.prefix} {s.num} {s.country && `· ${s.country.name}`}</div>
                    <div className="s">{s.country?.flag} {s.groupTitle}</div>
                  </div>
                  <div className="counter">
                    <button onClick={() => updateDupe(s.id, -1)} disabled={count === 0}><Icon name="minus" size={12} /></button>
                    <span className={'val ' + (has ? 'has' : '')}>{count}</span>
                    <button onClick={() => updateDupe(s.id, 1)}><Icon name="plus" size={12} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// TROCAS =====================================================================
function Trocas({ trades, setTrades, missing, onAddSample }) {
  const [filter, setFilter] = uS('all');
  const [query, setQuery] = uS('');

  const filteredTrades = uM(() => {
    let t = trades;
    if (filter === 'matches') t = t.filter(x => !x.mine && missing.has(x.want.id));
    if (filter === 'mine') t = t.filter(x => x.mine);
    if (filter === 'open') t = t.filter(x => !x.mine && x.status === 'open');
    if (query) {
      const q = query.toLowerCase();
      t = t.filter(x => x.user.toLowerCase().includes(q) || x.offer.id.toLowerCase().includes(q) || x.want.id.toLowerCase().includes(q));
    }
    return t;
  }, [trades, filter, query, missing]);

  const matchCount = trades.filter(x => !x.mine && missing.has(x.want.id)).length;

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Mural de trocas</div>
        <h1 className="page-title">Mural de <span className="accent">Trocas</span></h1>
        <div className="page-sub">Trocas que combinam com suas faltantes aparecem com um selo MATCH verde no canto.</div>
      </div>

      <div className="search-row">
        <div className="search-box">
          <Icon name="search" />
          <input placeholder="Buscar usuário, seleção ou código…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="btn primary" onClick={onAddSample}><Icon name="plus" size={14} /> Publicar Troca</button>
      </div>

      <div className="pills" style={{ marginTop: 14 }}>
        <button className={'pill ' + (filter === 'all' ? 'active' : '')} onClick={() => setFilter('all')}>Todas <span className="count">{trades.length}</span></button>
        <button className={'pill ' + (filter === 'matches' ? 'active' : '')} onClick={() => setFilter('matches')}>✨ Combinam comigo <span className="count">{matchCount}</span></button>
        <button className={'pill ' + (filter === 'open' ? 'active' : '')} onClick={() => setFilter('open')}>Abertas</button>
        <button className={'pill ' + (filter === 'mine' ? 'active' : '')} onClick={() => setFilter('mine')}>Minhas</button>
      </div>

      {filteredTrades.length === 0 && (
        <div className="empty">
          <div className="icon-big">🔄</div>
          <div>Nenhuma troca encontrada</div>
        </div>
      )}

      <div className="trade-grid">
        {filteredTrades.map(t => {
          const isMatch = !t.mine && missing.has(t.want.id);
          const initials = t.user.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
          return (
            <div key={t.id} className={'trade-card ' + (isMatch ? 'match' : '')}>
              <div className="trade-head">
                <div className="av" style={{ background: t.color || 'linear-gradient(135deg, #A78BFA, #F472B6)' }}>{initials}</div>
                <div>
                  <div className="name">{t.user}</div>
                  <div className="meta">{t.date} · {t.rep ? `★ ${t.rep}` : 'Novo'}</div>
                </div>
                <div className="badges">
                  {t.mine && <span className="trade-status mine">Minha</span>}
                  <span className="trade-status open">Aberta</span>
                </div>
              </div>

              <div className="trade-row">
                <div className="trade-side">
                  <div className="mini-card" style={{ '--country-bg': gradFor(t.offer.country) }}>{t.offer.num}</div>
                  <div>
                    <div className="lbl">Oferece</div>
                    <div className="ttl">{t.offer.id}</div>
                    <div className="sub">{t.offer.country?.flag} {t.offer.country?.name || ''}</div>
                  </div>
                </div>
                <div className="swap"><Icon name="swap" size={14} /></div>
                <div className="trade-side right">
                  <div className="mini-card" style={{ '--country-bg': gradFor(t.want.country) }}>{t.want.num}</div>
                  <div>
                    <div className="lbl">Quer</div>
                    <div className="ttl">{t.want.id}</div>
                    <div className="sub">{t.want.country?.flag} {t.want.country?.name || ''}</div>
                  </div>
                </div>
              </div>

              {isMatch && (
                <div className="match-meter">
                  <span>Você tem o que ele quer</span>
                  <div className="bar-mini"><div className="bar-mini-fill" style={{ width: '100%' }} /></div>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>100%</span>
                </div>
              )}

              {t.msg && <div className="trade-msg">"{t.msg}"</div>}

              <div className="trade-actions">
                {t.mine ? (
                  <>
                    <button className="btn"><Icon name="settings" size={14} /> Editar</button>
                    <button className="btn success"><Icon name="check" size={14} /> Marcar como realizada</button>
                    <button className="btn danger" onClick={() => setTrades(p => p.filter(x => x.id !== t.id))}><Icon name="x" size={14} /> Remover</button>
                  </>
                ) : (
                  <>
                    <button className="btn primary"><Icon name="swap" size={14} /> Propor troca</button>
                    <button className="btn"><Icon name="bell" size={14} /> Salvar</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// HOME =====================================================================
function Home({ stickers, owned, dupes, trades, missing, setPage }) {
  const total = stickers.length;
  const have = owned.size;
  const pct = total ? (have / total) * 100 : 0;
  const totalDupes = Array.from(dupes.values()).reduce((a, b) => a + b, 0);
  const matches = trades.filter(t => !t.mine && missing.has(t.want.id));

  const recentStickers = uM(() => stickers.filter(s => owned.has(s.id)).slice(-6).reverse(), [stickers, owned]);
  const milestones = [25, 50, 75, 100];

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Olá, matheus</div>
        <h1 className="page-title">Faltam <span className="accent">{total - have}</span> figurinhas</h1>
        <div className="page-sub">Você está a {Math.round(100 - pct)}% de completar o álbum. Bora?</div>
      </div>

      <div className="progress-hero">
        <div className="ph-row">
          <div>
            <div className="ph-label">Progresso Total</div>
            <div className="ph-count">{have}<span className="of"> / {total}</span></div>
          </div>
          <div className="ph-pct">{Math.round(pct)}%</div>
        </div>
        <div className="bar"><div className="bar-fill" style={{ width: pct + '%' }} /></div>
        <div className="milestones">
          {milestones.map(m => (
            <div key={m} className={'milestone ' + (pct >= m ? 'hit' : '')} style={{ left: m + '%' }}>
              <div className="dot" />{m}%
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon gold"><Icon name="book" /></div>
          <div className="stat-num">{have}</div>
          <div className="stat-lbl">Coladas</div>
          <div className="stat-sub">no álbum</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><Icon name="repeat" /></div>
          <div className="stat-num">{totalDupes}</div>
          <div className="stat-lbl">Repetidas</div>
          <div className="stat-sub">prontas para trocar</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink"><Icon name="swap" /></div>
          <div className="stat-num">{matches.length}</div>
          <div className="stat-lbl">Matches</div>
          <div className="stat-sub">trocas que combinam</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon violet"><Icon name="fire" /></div>
          <div className="stat-num">5</div>
          <div className="stat-lbl">Sequência</div>
          <div className="stat-sub">dias colando</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="card">
          <div className="section-head">
            <h3>Coladas recentemente</h3>
            <a className="see-all" onClick={() => setPage('colecao')} style={{ cursor: 'pointer' }}>Ver tudo →</a>
          </div>
          <div className="stickers">
            {recentStickers.length === 0 && <div className="empty" style={{ gridColumn: '1 / -1', padding: 30 }}><div>Nenhuma figurinha colada ainda</div></div>}
            {recentStickers.map(s => (
              <div key={s.id} className="sticker collected" style={{ '--country-bg': gradFor(s.country) }}>
                <div>
                  <div className="num">{s.num}</div>
                  <div className="code">{s.prefix}</div>
                </div>
                <div className="country">
                  {s.country ? <><span className="flag">{s.country.flag}</span><span>{s.country.code}</span></> : <span>{s.groupTitle}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-head">
            <h3>Trocas que combinam</h3>
            <a className="see-all" onClick={() => setPage('trocas')} style={{ cursor: 'pointer' }}>Ver mural →</a>
          </div>
          <div className="suggested-trades">
            {matches.length === 0 && <div className="empty" style={{ padding: 20 }}><div style={{ fontSize: 13 }}>Nenhum match no momento</div></div>}
            {matches.slice(0, 4).map(t => (
              <div key={t.id} className="sug-trade">
                <div className="sug-mini" style={{ '--country-bg': gradFor(t.want.country) }}>{t.want.num}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.user} oferece {t.offer.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>quer {t.want.id} — você tem!</div>
                </div>
                <button className="btn-trade">Trocar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Colecao = Colecao;
window.Repetidas = Repetidas;
window.Trocas = Trocas;
window.Home = Home;
window.buildAllStickers = buildAllStickers;
