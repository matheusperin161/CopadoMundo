// Country and group data for Copa 2026
window.COUNTRIES = [
  // Group A
  { code: 'MEX', name: 'México', flag: '🇲🇽', colors: ['#006847', '#ffffff', '#ce1126'], group: 'A' },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦', colors: ['#ff0000', '#ffffff'], group: 'A' },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', colors: ['#3c3b6e', '#b22234', '#ffffff'], group: 'A' },
  // South America
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷', colors: ['#009c3b', '#ffdf00', '#002776'], group: 'B' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', colors: ['#74acdf', '#ffffff', '#f6b40e'], group: 'B' },
  { code: 'URU', name: 'Uruguai', flag: '🇺🇾', colors: ['#0038a8', '#ffffff', '#fcd116'], group: 'B' },
  { code: 'COL', name: 'Colômbia', flag: '🇨🇴', colors: ['#fcd116', '#003893', '#ce1126'], group: 'C' },
  { code: 'ECU', name: 'Equador', flag: '🇪🇨', colors: ['#ffd100', '#0072ce', '#ed1c24'], group: 'C' },
  { code: 'PAR', name: 'Paraguai', flag: '🇵🇾', colors: ['#d52b1e', '#ffffff', '#0038a8'], group: 'C' },
  // Europe
  { code: 'FRA', name: 'França', flag: '🇫🇷', colors: ['#0055a4', '#ffffff', '#ef4135'], group: 'D' },
  { code: 'ESP', name: 'Espanha', flag: '🇪🇸', colors: ['#aa151b', '#f1bf00'], group: 'D' },
  { code: 'GER', name: 'Alemanha', flag: '🇩🇪', colors: ['#000000', '#dd0000', '#ffce00'], group: 'D' },
  { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', colors: ['#ce1124', '#ffffff'], group: 'E' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', colors: ['#006600', '#ff0000', '#ffd700'], group: 'E' },
  { code: 'NED', name: 'Holanda', flag: '🇳🇱', colors: ['#ae1c28', '#ffffff', '#21468b'], group: 'E' },
  { code: 'ITA', name: 'Itália', flag: '🇮🇹', colors: ['#008c45', '#ffffff', '#cd212a'], group: 'F' },
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪', colors: ['#000000', '#fae042', '#ed2939'], group: 'F' },
  { code: 'CRO', name: 'Croácia', flag: '🇭🇷', colors: ['#ff0000', '#ffffff', '#171796'], group: 'F' },
  { code: 'SUI', name: 'Suíça', flag: '🇨🇭', colors: ['#ff0000', '#ffffff'], group: 'G' },
  // Africa
  { code: 'MAR', name: 'Marrocos', flag: '🇲🇦', colors: ['#c1272d', '#006233'], group: 'G' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', colors: ['#00853f', '#fdef42', '#e31b23'], group: 'G' },
  { code: 'EGY', name: 'Egito', flag: '🇪🇬', colors: ['#ce1126', '#ffffff', '#000000'], group: 'H' },
  // Asia
  { code: 'JPN', name: 'Japão', flag: '🇯🇵', colors: ['#bc002d', '#ffffff'], group: 'H' },
  { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', colors: ['#0047a0', '#cd2e3a', '#ffffff'], group: 'H' },
  { code: 'AUS', name: 'Austrália', flag: '🇦🇺', colors: ['#012169', '#e4002b', '#ffffff'], group: 'I' },
];

// Build gradient from country colors
window.countryGradient = (colors) => {
  if (!colors || colors.length === 0) return 'linear-gradient(135deg, #1f2a4d 0%, #141a30 100%)';
  if (colors.length === 1) return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]}aa 100%)`;
  if (colors.length === 2) return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
};

// Generate full sticker list — 985 stickers organized in groups
window.GROUPS = [
  { id: 'fwc', title: 'História da Copa', icon: '🏆', prefix: 'FWC', total: 25, kind: 'history' },
  { id: 'mascot', title: 'Mascotes & Mundial', icon: '⭐', prefix: 'WC', total: 18, kind: 'special' },
  { id: 'host-can', title: 'Sede — Canadá', icon: '🇨🇦', prefix: 'CAN', total: 12, kind: 'host', country: 'CAN' },
  { id: 'host-mex', title: 'Sede — México', icon: '🇲🇽', prefix: 'MEX', total: 18, kind: 'host', country: 'MEX' },
  { id: 'host-usa', title: 'Sede — Estados Unidos', icon: '🇺🇸', prefix: 'USA', total: 18, kind: 'host', country: 'USA' },
  { id: 'team-bra', title: 'Brasil', icon: '🇧🇷', prefix: 'BRA', total: 20, kind: 'team', country: 'BRA' },
  { id: 'team-arg', title: 'Argentina', icon: '🇦🇷', prefix: 'ARG', total: 20, kind: 'team', country: 'ARG' },
  { id: 'team-fra', title: 'França', icon: '🇫🇷', prefix: 'FRA', total: 20, kind: 'team', country: 'FRA' },
  { id: 'team-esp', title: 'Espanha', icon: '🇪🇸', prefix: 'ESP', total: 20, kind: 'team', country: 'ESP' },
  { id: 'team-ger', title: 'Alemanha', icon: '🇩🇪', prefix: 'GER', total: 20, kind: 'team', country: 'GER' },
  { id: 'team-eng', title: 'Inglaterra', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', prefix: 'ENG', total: 20, kind: 'team', country: 'ENG' },
  { id: 'team-por', title: 'Portugal', icon: '🇵🇹', prefix: 'POR', total: 20, kind: 'team', country: 'POR' },
  { id: 'team-jpn', title: 'Japão', icon: '🇯🇵', prefix: 'JPN', total: 20, kind: 'team', country: 'JPN' },
];

window.findCountry = (code) => window.COUNTRIES.find(c => c.code === code);
