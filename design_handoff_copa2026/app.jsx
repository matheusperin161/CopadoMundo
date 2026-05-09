// Main app
const { useState: usS, useMemo: usM, useEffect: usE } = React;

function App() {
  const [page, setPage] = usS('home');
  const [stickers] = usS(() => window.buildAllStickers());
  const [owned, setOwned] = usS(() => {
    try { const s = localStorage.getItem('copa26_owned'); if (s) return new Set(JSON.parse(s)); } catch {}
    // start with some seed coleção
    return new Set(['FWC-1', 'FWC-2', 'FWC-3', 'BRA-1', 'BRA-2', 'BRA-7', 'ARG-10', 'ARG-1', 'FRA-7', 'ESP-9', 'POR-7', 'JPN-10', 'GER-13', 'ENG-9', 'WC-1', 'WC-18', 'CAN-1', 'MEX-1', 'USA-1', 'USA-2', 'BRA-9', 'BRA-11', 'ARG-19']);
  });
  const [dupes, setDupes] = usS(() => {
    try { const s = localStorage.getItem('copa26_dupes'); if (s) return new Map(JSON.parse(s)); } catch {}
    return new Map([['ARG-4', 2], ['BRA-9', 1], ['FRA-3', 1]]);
  });
  const [query, setQuery] = usS('');
  const [filter, setFilter] = usS('all');
  const [toast, setToast] = usS(null);

  const [trades, setTrades] = usS([
    {
      id: 't1', user: 'matheus perin', date: '08/05/2026', mine: true, status: 'open',
      color: 'linear-gradient(135deg, #A78BFA, #F472B6)',
      offer: { id: 'ARG 4', num: 4, country: window.findCountry('ARG') },
      want: { id: 'BEL 3', num: 3, country: window.findCountry('BEL') },
      msg: 'Aceito qualquer figurinha europeia em bom estado',
    },
    {
      id: 't2', user: 'Ana Costa', date: '08/05/2026', rep: '4.8', status: 'open',
      color: 'linear-gradient(135deg, #38BDF8, #34D399)',
      offer: { id: 'BRA 4', num: 4, country: window.findCountry('BRA') },
      want: { id: 'BRA 5', num: 5, country: window.findCountry('BRA') },
      msg: 'Ajudem a fechar o álbum do Brasil!',
    },
    {
      id: 't3', user: 'Lucas R.', date: '07/05/2026', rep: '5.0', status: 'open',
      color: 'linear-gradient(135deg, #FFD23F, #FF6B6B)',
      offer: { id: 'POR 8', num: 8, country: window.findCountry('POR') },
      want: { id: 'ARG 19', num: 19, country: window.findCountry('ARG') },
      msg: 'Última pra completar o time da Argentina',
    },
    {
      id: 't4', user: 'Beatriz S.', date: '07/05/2026', rep: '4.6', status: 'open',
      color: 'linear-gradient(135deg, #F472B6, #A78BFA)',
      offer: { id: 'JPN 5', num: 5, country: window.findCountry('JPN') },
      want: { id: 'FWC 12', num: 12, country: null },
      msg: 'Procuro a edição da copa de 1994',
    },
    {
      id: 't5', user: 'Pedro M.', date: '06/05/2026', rep: '4.9', status: 'open',
      color: 'linear-gradient(135deg, #34D399, #38BDF8)',
      offer: { id: 'GER 11', num: 11, country: window.findCountry('GER') },
      want: { id: 'BRA 9', num: 9, country: window.findCountry('BRA') },
      msg: 'Tenho várias da Alemanha pra trocar',
    },
    {
      id: 't6', user: 'Júlia O.', date: '06/05/2026', rep: '4.5', status: 'open',
      color: 'linear-gradient(135deg, #FF6B6B, #FFD23F)',
      offer: { id: 'ENG 14', num: 14, country: window.findCountry('ENG') },
      want: { id: 'ESP 9', num: 9, country: window.findCountry('ESP') },
    },
  ]);

  usE(() => { try { localStorage.setItem('copa26_owned', JSON.stringify(Array.from(owned))); } catch {} }, [owned]);
  usE(() => { try { localStorage.setItem('copa26_dupes', JSON.stringify(Array.from(dupes.entries()))); } catch {} }, [dupes]);

  const collect = (id) => {
    setOwned(prev => {
      const nx = new Set(prev);
      nx.add(id);
      return nx;
    });
    const newPct = Math.round(((owned.size + 1) / stickers.length) * 100);
    const milestones = [25, 50, 75, 100];
    const oldPct = Math.round((owned.size / stickers.length) * 100);
    const hit = milestones.find(m => oldPct < m && newPct >= m);
    if (hit) {
      setToast({ msg: `🎉 ${hit}% completo!`, big: true });
      setTimeout(() => setToast(null), 3500);
    } else {
      setToast({ msg: '✓ Figurinha colada!' });
      setTimeout(() => setToast(null), 1800);
    }
  };

  const uncollect = (id) => {
    setOwned(prev => {
      const nx = new Set(prev);
      nx.delete(id);
      return nx;
    });
    setDupes(prev => { const nx = new Map(prev); nx.delete(id); return nx; });
  };

  const missing = usM(() => {
    const m = new Set();
    stickers.forEach(s => { if (!owned.has(s.id)) m.add(s.id); });
    return m;
  }, [stickers, owned]);

  const dupesCount = Array.from(dupes.values()).reduce((a, b) => a + b, 0);
  const openTradesCount = trades.filter(t => !t.mine && missing.has(t.want.id)).length;

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} dupesCount={dupesCount} openTradesCount={openTradesCount} />
      <main className="main">
        {page === 'home' && <Home stickers={stickers} owned={owned} dupes={dupes} trades={trades} missing={missing} setPage={setPage} />}
        {page === 'colecao' && (
          <Colecao
            stickers={stickers} owned={owned} dupes={dupes}
            onCollect={collect} onUncollect={uncollect}
            query={query} setQuery={setQuery} filter={filter} setFilter={setFilter}
          />
        )}
        {page === 'repetidas' && (
          <Repetidas
            stickers={stickers} owned={owned} dupes={dupes} setDupes={setDupes}
            onPublishTrade={() => setPage('trocas')}
          />
        )}
        {page === 'trocas' && (
          <Trocas trades={trades} setTrades={setTrades} missing={missing}
            onAddSample={() => setToast({ msg: 'Em breve: criar troca!' }) || setTimeout(() => setToast(null), 1800)}
          />
        )}
      </main>
      {toast && (
        <div className="toast" style={toast.big ? { fontSize: 18, padding: '18px 28px' } : {}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
