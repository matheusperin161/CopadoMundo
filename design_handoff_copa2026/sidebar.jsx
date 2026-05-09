// Sidebar component
const { useState } = React;

function Icon({ name, size = 18 }) {
  const icons = {
    home: <path d="M3 12l9-9 9 9M5 10v10h14V10" />,
    book: <path d="M4 4h12a3 3 0 013 3v13H7a3 3 0 01-3-3V4zM4 4v13a3 3 0 003 3" />,
    repeat: <path d="M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />,
    swap: <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    check: <path d="M5 12l5 5L20 7" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v.1a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></>,
    bell: <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></>,
    sparkle: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />,
    trophy: <><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55.47.98.97 1.21C12.15 18.75 13 20.24 13 22M14 14.66V17c0 .55-.47.98-.97 1.21C11.85 18.75 11 20.24 11 22M18 2H6v7a6 6 0 0012 0V2z" /></>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22V15" /></>,
    arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
    fire: <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />,
    chart: <><path d="M3 3v18h18M7 14l4-4 4 4 5-5" /></>,
    star: <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
    x: <><path d="M18 6L6 18M6 6l12 12" /></>,
  };
  return (
    <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

function Sidebar({ page, setPage, dupesCount, openTradesCount }) {
  const items = [
    { id: 'home', label: 'Início', icon: 'home' },
    { id: 'colecao', label: 'Coleção', icon: 'book' },
    { id: 'repetidas', label: 'Repetidas', icon: 'repeat', badge: dupesCount > 0 ? dupesCount : null },
    { id: 'trocas', label: 'Trocas', icon: 'swap', badge: openTradesCount > 0 ? openTradesCount : null },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">26</div>
        <div>
          <div className="brand-title">COPA 2026</div>
          <div className="brand-sub">Álbum Digital</div>
        </div>
      </div>
      <nav className="nav">
        {items.map(it => (
          <button key={it.id} className={'nav-item ' + (page === it.id ? 'active' : '')} onClick={() => setPage(it.id)}>
            <Icon name={it.icon} />
            <span>{it.label}</span>
            {it.badge && <span className="nav-badge">{it.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="avatar">M</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="user-name">matheus perin</div>
          <div className="user-handle">@matheusperin2026</div>
        </div>
        <button className="icon-btn" title="Sair"><Icon name="logout" size={16} /></button>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
window.Icon = Icon;
