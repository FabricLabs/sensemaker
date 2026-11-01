'use strict';

const React = require('react');

const TYPOGRAPHY = {
  fontFamily: 'inherit',
  h1: { fontSize: '24px', lineHeight: '30px', fontWeight: 590 },
  h2: { fontSize: '18px', lineHeight: '24px', fontWeight: 590 },
  h3: { fontSize: '16px', lineHeight: '22px', fontWeight: 590 },
  body: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
  small: { fontSize: '12px', lineHeight: '16px', fontWeight: 400 }
};

const RADIUS = { none: 0, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, full: 9999 };

const chartPalette = {
  green: '#1F8A65E8',
  darkGreen: '#0D855AE0',
  lightGreen: '#52B896E0',
  mintGreen: '#7DCAB0E0',
  blue: '#2E79B5E0',
  lightBlue: '#70B0D8E0',
  indigo: '#5A6CC0F0',
  lightIndigo: '#9AAADCE0',
  purple: '#7B64B8F0',
  lightPurple: '#AA98D8E0',
  warmPink: '#C85898E0',
  lightPink: '#E8A0C4E0',
  brightOrange: '#F0A040E0',
  deepOrange: '#C06028E0',
  goldenYellow: '#E8C030E0',
  darkAmber: '#C04848E0',
  warmPeach: '#F0A088E0',
  vibrantTeal: '#2A9A8AE0',
  muted: '#8888A8E0',
  neutralLine: '#888899D0'
};

const chartPaletteGrok = {
  green: '#00C972E8',
  darkGreen: '#009957E0',
  lightGreen: '#38D591E0',
  mintGreen: '#78E2B4E0',
  blue: '#1084FEE0',
  lightBlue: '#459FFEE0',
  indigo: '#0C64C1F0',
  lightIndigo: '#80BEFEE0',
  purple: '#9159FEF0',
  lightPurple: '#A97EFEE0',
  warmPink: '#FF309BE0',
  lightPink: '#FF5EB1E0',
  brightOrange: '#FF6700E0',
  deepOrange: '#C24E00E0',
  goldenYellow: '#FF9800E0',
  darkAmber: '#FF263CE0',
  warmPeach: '#FF8838E0',
  vibrantTeal: '#00BCA6E0',
  muted: '#777777E0',
  neutralLine: '#777777D0'
};

const chartColorSequence = [
  chartPalette.blue,
  chartPalette.brightOrange,
  chartPalette.purple,
  chartPalette.green,
  chartPalette.goldenYellow,
  chartPalette.warmPink,
  chartPalette.vibrantTeal,
  chartPalette.indigo,
  chartPalette.deepOrange,
  chartPalette.lightBlue,
  chartPalette.mintGreen,
  chartPalette.lightPurple
];

const categoryPaletteDark = {
  gray: '#8a8a8a',
  purple: '#b48cff',
  green: '#3fb950',
  yellow: '#d4b106',
  cyan: '#2ec4b6',
  pink: '#e060a0',
  blue: '#6cb6ff',
  orange: '#e08a3c',
  red: '#f07178'
};

const categoryPaletteLight = {
  gray: '#5c5c5c',
  purple: '#6d4db5',
  green: '#1f8a65',
  yellow: '#9a7200',
  cyan: '#0e7c86',
  pink: '#b03a78',
  blue: '#1d6fbf',
  orange: '#c06028',
  red: '#c43838'
};

const usageColorSequence = ['gray', 'purple', 'green', 'yellow', 'cyan', 'pink', 'blue', 'orange', 'red'];
const colorPalette = categoryPaletteDark;

function paletteFrom (tokens, surfaces) {
  return {
    foreground: tokens.text.primary,
    foregroundSecondary: tokens.text.secondary,
    foregroundTertiary: tokens.text.tertiary,
    foregroundQuaternary: tokens.text.quaternary,
    editor: surfaces.editor,
    chrome: surfaces.chrome,
    sidebar: surfaces.chrome,
    elevated: surfaces.elevated,
    fillPrimary: tokens.fill.primary,
    fillSecondary: tokens.fill.secondary,
    fillTertiary: tokens.fill.tertiary,
    fillQuaternary: tokens.fill.quaternary,
    strokePrimary: tokens.stroke.primary,
    strokeSecondary: tokens.stroke.secondary,
    strokeTertiary: tokens.stroke.tertiary,
    strokeFocused: tokens.stroke.focused,
    accent: tokens.accent.primary,
    buttonBackground: tokens.accent.control,
    buttonForeground: tokens.text.onAccent,
    buttonHoverBackground: tokens.accent.controlHover,
    link: tokens.text.link,
    diffInsertedLine: tokens.diff.insertedLine,
    diffRemovedLine: tokens.diff.removedLine,
    diffStripAdded: tokens.diff.stripAdded,
    diffStripRemoved: tokens.diff.stripRemoved
  };
}

const darkTokens = {
  bg: { editor: '#1e1e1e', chrome: '#181818', elevated: '#252526' },
  text: {
    primary: '#e8e8e8',
    secondary: '#b0b0b0',
    tertiary: '#8a8a8a',
    quaternary: '#5c5c5c',
    link: '#6cb6ff',
    onAccent: '#ffffff'
  },
  stroke: { primary: '#4a4a4a', secondary: '#3a3a3a', tertiary: '#2e2e2e', focused: '#6cb6ff' },
  fill: { primary: '#333333', secondary: '#2a2a2a', tertiary: '#242424', quaternary: '#202020' },
  accent: { primary: '#6cb6ff', control: '#0e639c', controlHover: '#1177bb' },
  diff: {
    insertedLine: '#1e3a2a',
    removedLine: '#3a1e1e',
    stripAdded: '#3fb950',
    stripRemoved: '#f85149'
  },
  category: categoryPaletteDark
};

const lightTokens = {
  bg: { editor: '#ffffff', chrome: '#f3f3f3', elevated: '#fafafa' },
  text: {
    primary: '#1a1a1a',
    secondary: '#444444',
    tertiary: '#666666',
    quaternary: '#8a8a8a',
    link: '#1d6fbf',
    onAccent: '#ffffff'
  },
  stroke: { primary: '#c8c8c8', secondary: '#d8d8d8', tertiary: '#e6e6e6', focused: '#1d6fbf' },
  fill: { primary: '#ececec', secondary: '#f2f2f2', tertiary: '#f6f6f6', quaternary: '#fafafa' },
  accent: { primary: '#1d6fbf', control: '#0e639c', controlHover: '#1177bb' },
  diff: {
    insertedLine: '#e6f4ea',
    removedLine: '#fde8e8',
    stripAdded: '#1f8a65',
    stripRemoved: '#c43838'
  },
  category: categoryPaletteLight
};

const canvasPaletteDark = paletteFrom(darkTokens, darkTokens.bg);
const canvasPaletteLight = paletteFrom(lightTokens, lightTokens.bg);
const canvasPaletteGrokDark = canvasPaletteDark;
const canvasPaletteGrokLight = canvasPaletteLight;
const canvasTokens = darkTokens;
const canvasTokensLight = lightTokens;

function buildHostTheme (kind) {
  const dark = kind !== 'light';
  const tokens = dark ? darkTokens : lightTokens;
  return Object.assign({}, tokens, {
    kind: dark ? 'dark' : 'light',
    brand: 'cursor',
    tokens: tokens,
    palette: dark ? canvasPaletteDark : canvasPaletteLight,
    radius: RADIUS,
    typography: TYPOGRAPHY,
    chart: { palette: chartPalette, sequence: chartColorSequence }
  });
}

function prefersDark () {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveHostTheme () {
  return buildHostTheme(prefersDark() ? 'dark' : 'light');
}

function useHostTheme () {
  const [dark, setDark] = React.useState(prefersDark);
  React.useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setDark(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return buildHostTheme(dark ? 'dark' : 'light');
}

let canvasStateSeed = {};

function setCanvasState (next) {
  canvasStateSeed = (next && typeof next === 'object' && !Array.isArray(next)) ? next : {};
}

function useCanvasState (key, defaultValue) {
  const seeded = Object.prototype.hasOwnProperty.call(canvasStateSeed, key);
  const [value, setValue] = React.useState(seeded ? canvasStateSeed[key] : defaultValue);
  return [value, setValue];
}

function useCanvasAction () {
  return React.useCallback(function () {}, []);
}

function mergeStyle (base, override) {
  return Object.assign({}, base || {}, override || {});
}

function flexAlign (value) {
  if (value === 'start') return 'flex-start';
  if (value === 'end') return 'flex-end';
  return value || 'stretch';
}

function flexJustify (value) {
  if (value === 'start') return 'flex-start';
  if (value === 'end') return 'flex-end';
  return value || 'flex-start';
}

function Stack (props) {
  const style = mergeStyle({
    display: 'flex',
    flexDirection: 'column',
    gap: props.gap == null ? 0 : props.gap,
    minWidth: 0
  }, props.style);
  return React.createElement('div', { style: style }, props.children);
}

function Row (props) {
  const style = mergeStyle({
    display: 'flex',
    flexDirection: 'row',
    gap: props.gap == null ? 0 : props.gap,
    alignItems: flexAlign(props.align || 'center'),
    justifyContent: flexJustify(props.justify),
    flexWrap: props.wrap ? 'wrap' : 'nowrap',
    minWidth: 0
  }, props.style);
  return React.createElement('div', { style: style }, props.children);
}

function Grid (props) {
  const columns = typeof props.columns === 'number'
    ? 'repeat(' + props.columns + ', minmax(0, 1fr))'
    : (props.columns || '1fr');
  const style = mergeStyle({
    display: 'grid',
    gridTemplateColumns: columns,
    gap: props.gap == null ? 12 : props.gap,
    alignItems: flexAlign(props.align),
    minWidth: 0
  }, props.style);
  return React.createElement('div', { style: style }, props.children);
}

function Divider (props) {
  const theme = useHostTheme();
  const style = mergeStyle({
    height: 1,
    border: 0,
    margin: 0,
    background: theme.stroke.tertiary,
    width: '100%'
  }, props.style);
  return React.createElement('hr', { style: style });
}

function Spacer () {
  return React.createElement('div', { style: { flex: '1 1 auto' } });
}

const TextNest = React.createContext(false);

const TEXT_WEIGHT = { normal: 400, medium: 500, semibold: 600, bold: 700 };

function parseRich (text) {
  const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  const out = [];
  let last = 0;
  let match;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    if (match[1] != null) out.push(React.createElement(Code, { key: 'c' + key }, match[1]));
    else out.push(React.createElement(Link, { key: 'a' + key, href: match[3] }, match[2]));
    last = match.index + match[0].length;
    key += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : text;
}

function renderRich (children) {
  if (typeof children === 'string') return parseRich(children);
  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === 'string') return React.createElement(React.Fragment, { key: index }, parseRich(child));
      return child;
    });
  }
  return children;
}

function Text (props) {
  const theme = useHostTheme();
  const nested = React.useContext(TextNest);
  const tone = props.tone || 'primary';
  const size = props.size === 'small' ? TYPOGRAPHY.small : TYPOGRAPHY.body;
  const Tag = props.as || (nested ? 'span' : 'p');
  const style = mergeStyle({
    margin: Tag === 'p' ? '0' : undefined,
    color: theme.text[tone] || theme.text.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: size.fontSize,
    lineHeight: size.lineHeight,
    fontWeight: TEXT_WEIGHT[props.weight] || TEXT_WEIGHT.normal,
    fontStyle: props.italic ? 'italic' : 'normal',
    minWidth: props.truncate ? 0 : undefined,
    overflow: props.truncate ? 'hidden' : undefined,
    textOverflow: props.truncate ? 'ellipsis' : undefined,
    whiteSpace: props.truncate ? 'nowrap' : undefined,
    direction: props.truncate === 'start' ? 'rtl' : undefined,
    textAlign: props.truncate === 'start' ? 'left' : undefined
  }, props.style);
  return React.createElement(
    TextNest.Provider,
    { value: true },
    React.createElement(Tag, { style: style }, renderRich(props.children))
  );
}

function heading (tag, preset) {
  return function Heading (props) {
    const theme = useHostTheme();
    const style = mergeStyle({
      margin: 0,
      color: theme.text.primary,
      fontFamily: theme.typography.fontFamily,
      fontSize: preset.fontSize,
      lineHeight: preset.lineHeight,
      fontWeight: preset.fontWeight
    }, props.style);
    return React.createElement(tag, { style: style }, props.children);
  };
}

const H1 = heading('h1', TYPOGRAPHY.h1);
const H2 = heading('h2', TYPOGRAPHY.h2);
const H3 = heading('h3', TYPOGRAPHY.h3);

function Code (props) {
  const theme = useHostTheme();
  const style = mergeStyle({
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '0.92em',
    color: theme.text.primary,
    background: theme.fill.tertiary,
    borderRadius: theme.radius.xs,
    padding: '0 4px'
  }, props.style);
  return React.createElement('code', { style: style }, props.children);
}

function Link (props) {
  const theme = useHostTheme();
  const style = mergeStyle({
    color: theme.text.link,
    textDecoration: 'underline',
    textUnderlineOffset: 2
  }, props.style);
  return React.createElement('a', {
    href: props.href,
    style: style,
    target: '_blank',
    rel: 'noreferrer'
  }, props.children);
}

const CardContext = React.createContext({
  open: true,
  size: 'base',
  sticky: false,
  collapsible: false,
  toggle: function () {}
});

function CanvasChevron (props) {
  const theme = useHostTheme();
  return React.createElement('svg', {
    width: 12,
    height: 12,
    viewBox: '0 0 12 12',
    'aria-hidden': 'true',
    style: { transform: props.expanded ? 'rotate(90deg)' : 'none', flex: '0 0 auto' }
  }, React.createElement('path', {
    d: 'M4 2 L8 6 L4 10',
    fill: 'none',
    stroke: theme.text.secondary,
    strokeWidth: 1.5
  }));
}

function Card (props) {
  const theme = useHostTheme();
  const [uncontrolled, setUncontrolled] = React.useState(props.defaultOpen !== false);
  const controlled = props.open != null;
  const open = props.collapsible ? (controlled ? props.open : uncontrolled) : true;
  const toggle = () => {
    const next = !open;
    if (props.onOpenChange) props.onOpenChange(next);
    if (!controlled) setUncontrolled(next);
  };
  const bordered = props.variant !== 'borderless';
  const style = mergeStyle({
    background: theme.bg.elevated,
    color: theme.text.primary,
    border: bordered ? '1px solid ' + theme.stroke.tertiary : 'none',
    borderRadius: bordered ? theme.radius.lg : 0,
    minWidth: 0
  }, props.style);
  return React.createElement(
    CardContext.Provider,
    {
      value: {
        open: open,
        size: props.size || 'base',
        sticky: !!props.stickyHeader,
        collapsible: !!props.collapsible,
        toggle: toggle
      }
    },
    React.createElement('section', { style: style }, props.children)
  );
}

function CardHeader (props) {
  const theme = useHostTheme();
  const card = React.useContext(CardContext);
  const height = card.size === 'lg' ? 32 : 28;
  const style = mergeStyle({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: height,
    padding: '0 10px',
    fontSize: 12,
    lineHeight: '16px',
    color: theme.text.secondary,
    position: card.sticky ? 'sticky' : 'static',
    top: 0,
    background: theme.bg.elevated,
    width: '100%',
    textAlign: 'left',
    border: 0,
    font: 'inherit'
  }, props.style);
  const body = React.createElement(React.Fragment, null,
    card.collapsible ? React.createElement(CanvasChevron, { expanded: card.open }) : null,
    React.createElement('span', { style: { flex: '1 1 auto', minWidth: 0 } }, props.children),
    props.trailing ? React.createElement('span', null, props.trailing) : null
  );
  if (!card.collapsible) return React.createElement('div', { style: style }, body);
  return React.createElement('button', { type: 'button', onClick: card.toggle, style: Object.assign({ cursor: 'pointer' }, style) }, body);
}

function CardBody (props) {
  const card = React.useContext(CardContext);
  if (card.collapsible && !card.open) return null;
  const style = mergeStyle({ padding: 12 }, props.style);
  return React.createElement('div', { style: style }, props.children);
}

function Button (props) {
  const theme = useHostTheme();
  const variant = props.variant || 'secondary';
  let background = theme.fill.primary;
  let color = theme.text.primary;
  let border = theme.stroke.tertiary;
  if (variant === 'primary') {
    background = theme.accent.control;
    color = theme.text.onAccent;
    border = 'transparent';
  } else if (variant === 'ghost') {
    background = 'transparent';
    border = 'transparent';
  }
  const style = mergeStyle({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    padding: '0 8px',
    width: 'auto',
    borderRadius: theme.radius.sm,
    border: '1px solid ' + border,
    background: background,
    color: color,
    font: 'inherit',
    fontSize: 13,
    lineHeight: '20px',
    cursor: props.disabled ? 'default' : 'pointer',
    opacity: props.disabled ? 0.5 : 1
  }, props.style);
  return React.createElement('button', {
    type: props.type || 'button',
    disabled: !!props.disabled,
    onClick: props.disabled ? undefined : props.onClick,
    style: style
  }, props.children);
}

function Pill (props) {
  const theme = useHostTheme();
  const small = props.size === 'sm';
  const style = mergeStyle({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: small ? 18 : 22,
    padding: small ? '0 6px' : '0 8px',
    borderRadius: theme.radius.full,
    border: small ? 'none' : '1px solid ' + theme.stroke.tertiary,
    background: props.active ? theme.fill.primary : 'transparent',
    color: theme.text.primary,
    font: 'inherit',
    fontSize: small ? 11 : 12,
    lineHeight: '16px',
    cursor: props.onClick && !props.disabled ? 'pointer' : 'default',
    opacity: props.disabled ? 0.5 : 1
  }, props.style);
  const content = React.createElement(React.Fragment, null,
    props.leadingContent || null,
    props.children,
    props.keyboardHint ? React.createElement('span', { style: { color: theme.text.tertiary } }, props.keyboardHint) : null
  );
  if (!props.onClick) return React.createElement('span', { title: props.title, style: style }, content);
  return React.createElement('button', {
    type: 'button',
    title: props.title,
    disabled: !!props.disabled,
    onClick: props.disabled ? undefined : props.onClick,
    style: style
  }, content);
}

function toneColor (theme, tone) {
  const palette = theme.chart.palette;
  if (tone === 'success') return palette.green;
  if (tone === 'danger') return palette.darkAmber;
  if (tone === 'warning') return palette.goldenYellow;
  if (tone === 'info') return palette.blue;
  return palette.muted;
}

function Stat (props) {
  const theme = useHostTheme();
  const style = mergeStyle({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }, props.style);
  return React.createElement('div', { style: style },
    React.createElement('div', {
      style: {
        color: props.tone ? toneColor(theme, props.tone) : theme.text.primary,
        fontSize: 22,
        lineHeight: '28px',
        fontWeight: 590
      }
    }, props.value),
    React.createElement('div', {
      style: { color: theme.text.tertiary, fontSize: 12, lineHeight: '16px' }
    }, props.label)
  );
}

function Callout (props) {
  const theme = useHostTheme();
  const tone = props.tone || 'info';
  const color = tone === 'neutral' ? theme.text.secondary : toneColor(theme, tone);
  const style = mergeStyle({
    display: 'flex',
    gap: 10,
    padding: '8px 10px',
    background: theme.fill.tertiary,
    borderLeft: '3px solid ' + color,
    color: theme.text.primary
  }, props.style);
  const marker = props.icon != null ? props.icon : React.createElement('span', {
    'aria-hidden': 'true',
    style: { width: 8, height: 8, marginTop: 6, borderRadius: theme.radius.full, background: color, flex: '0 0 auto' }
  });
  return React.createElement('div', { style: style },
    marker,
    React.createElement('div', { style: { minWidth: 0 } },
      props.title ? React.createElement('div', { style: { fontWeight: 600, marginBottom: 2 } }, props.title) : null,
      props.children
    )
  );
}

function Table (props) {
  const theme = useHostTheme();
  const headers = props.headers || [];
  const rows = props.rows || [];
  const framed = props.framed !== false;
  const align = props.columnAlign || [];
  const tones = props.rowTone || [];
  const shell = mergeStyle({
    overflow: 'auto',
    border: framed ? '1px solid ' + theme.stroke.tertiary : 'none',
    borderRadius: framed ? theme.radius.md : 0,
    maxWidth: '100%'
  }, props.style);
  const headStyle = {
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 12,
    color: theme.text.secondary,
    padding: '6px 8px',
    borderBottom: '1px solid ' + theme.stroke.tertiary,
    position: props.stickyHeader ? 'sticky' : 'static',
    top: 0,
    background: theme.bg.elevated
  };
  const body = rows.length ? rows.map((row, index) => {
    const cells = headers.map((_, cell) => row[cell]);
    const tone = tones[index];
    return React.createElement('tr', {
      key: index,
      style: { background: props.striped && index % 2 === 1 ? theme.fill.tertiary : 'transparent' }
    }, cells.map((cell, cellIndex) => React.createElement('td', {
      key: cellIndex,
      style: {
        padding: '6px 8px',
        textAlign: align[cellIndex] || 'left',
        borderTop: '1px solid ' + theme.stroke.tertiary,
        color: theme.text.primary,
        verticalAlign: 'top'
      }
    }, cellIndex === 0 && tone ? React.createElement(React.Fragment, null,
      React.createElement('span', {
        'aria-hidden': 'true',
        style: {
          display: 'inline-block',
          width: 8,
          height: 8,
          marginRight: 6,
          borderRadius: theme.radius.full,
          background: toneColor(theme, tone)
        }
      }),
      cell
    ) : cell)));
  }) : [React.createElement('tr', { key: 'empty' }, React.createElement('td', {
    colSpan: Math.max(headers.length, 1),
    style: { padding: 8, color: theme.text.tertiary }
  }, props.emptyMessage || ''))];
  return React.createElement('div', { style: shell },
    React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 } },
      React.createElement('thead', null, React.createElement('tr', null, headers.map((header, index) => (
        React.createElement('th', { key: index, style: Object.assign({}, headStyle, { textAlign: align[index] || 'left' }) }, header)
      )))),
      React.createElement('tbody', null, body)
    )
  );
}

const fieldStyle = (theme, style) => mergeStyle({
  width: '100%',
  boxSizing: 'border-box',
  background: theme.bg.editor,
  color: theme.text.primary,
  border: '1px solid ' + theme.stroke.secondary,
  borderRadius: theme.radius.sm,
  padding: '4px 8px',
  font: 'inherit',
  fontSize: 13,
  lineHeight: '20px'
}, style);

function TextInput (props) {
  const theme = useHostTheme();
  return React.createElement('input', {
    type: props.type || 'text',
    value: props.value == null ? '' : props.value,
    placeholder: props.placeholder,
    disabled: !!props.disabled,
    onChange: (event) => { if (props.onChange) props.onChange(event.target.value); },
    style: fieldStyle(theme, mergeStyle({ height: 28 }, props.style))
  });
}

function TextArea (props) {
  const theme = useHostTheme();
  return React.createElement('textarea', {
    value: props.value == null ? '' : props.value,
    placeholder: props.placeholder,
    disabled: !!props.disabled,
    rows: props.rows || 3,
    onChange: (event) => { if (props.onChange) props.onChange(event.target.value); },
    style: fieldStyle(theme, mergeStyle({ resize: 'vertical', minHeight: 28 }, props.style))
  });
}

function Checkbox (props) {
  const theme = useHostTheme();
  return React.createElement('label', {
    style: mergeStyle({ display: 'inline-flex', alignItems: 'center', gap: 8, color: theme.text.primary }, props.style)
  }, React.createElement('input', {
    type: 'checkbox',
    checked: !!props.checked,
    disabled: !!props.disabled,
    onChange: (event) => { if (props.onChange) props.onChange(event.target.checked); }
  }), props.label || null);
}

function Toggle (props) {
  const theme = useHostTheme();
  const wide = props.size === 'md' ? 36 : 28;
  const high = props.size === 'md' ? 20 : 16;
  return React.createElement('button', {
    type: 'button',
    disabled: !!props.disabled,
    'aria-pressed': !!props.checked,
    onClick: () => { if (!props.disabled && props.onChange) props.onChange(!props.checked); },
    style: mergeStyle({
      width: wide,
      height: high,
      padding: 2,
      border: 0,
      borderRadius: theme.radius.full,
      background: props.checked ? theme.accent.control : theme.fill.primary,
      cursor: props.disabled ? 'default' : 'pointer',
      opacity: props.disabled ? 0.5 : 1
    }, props.style)
  }, React.createElement('span', {
    style: {
      display: 'block',
      width: high - 4,
      height: high - 4,
      borderRadius: theme.radius.full,
      background: theme.text.onAccent,
      transform: props.checked ? 'translateX(' + (wide - high) + 'px)' : 'none'
    }
  }));
}

function Select (props) {
  const theme = useHostTheme();
  const options = props.options || [];
  return React.createElement('select', {
    value: props.value == null ? '' : props.value,
    disabled: !!props.disabled,
    onChange: (event) => { if (props.onChange) props.onChange(event.target.value); },
    style: fieldStyle(theme, mergeStyle({ height: 28 }, props.style))
  }, props.placeholder ? React.createElement('option', { value: '', disabled: true }, props.placeholder) : null,
  options.map((option) => React.createElement('option', {
    key: option.value,
    value: option.value,
    disabled: !!option.disabled
  }, option.label)));
}

function IconButton (props) {
  const theme = useHostTheme();
  const size = props.size === 'sm' ? 16 : 20;
  const style = mergeStyle({
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: 0,
    borderRadius: props.variant === 'circle' ? theme.radius.full : theme.radius.sm,
    background: props.variant === 'circle' ? theme.fill.primary : 'transparent',
    color: theme.text.primary,
    cursor: props.disabled ? 'default' : 'pointer'
  }, props.style);
  return React.createElement('button', {
    type: 'button',
    title: props.title,
    disabled: !!props.disabled,
    onClick: props.disabled ? undefined : props.onClick,
    style: style
  }, props.children);
}

function CollapsibleSection (props) {
  const theme = useHostTheme();
  const [open, setOpen] = React.useState(!!props.defaultOpen);
  const style = mergeStyle({ color: theme.text.primary }, props.style);
  return React.createElement('div', { style: style },
    React.createElement('button', {
      type: 'button',
      onClick: () => setOpen(!open),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '4px 0',
        border: 0,
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer'
      }
    },
    React.createElement(CanvasChevron, { expanded: open }),
    props.leading || null,
    React.createElement('span', { style: { fontWeight: 600 } }, props.title),
    props.count != null ? React.createElement('span', { style: { color: theme.text.tertiary } }, String(props.count)) : null,
    React.createElement(Spacer, null),
    props.trailing ? React.createElement('span', { style: { color: theme.text.tertiary } }, props.trailing) : null
    ),
    open ? React.createElement('div', { style: { paddingLeft: 20 } }, props.children) : null
  );
}

function Swatch (props) {
  const theme = useHostTheme();
  const color = (theme.category && theme.category[props.color]) || theme.text.tertiary;
  const style = mergeStyle({
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    background: color,
    flex: '0 0 auto'
  }, props.style);
  return React.createElement('span', { style: style });
}

function UsageBar (props) {
  const theme = useHostTheme();
  const total = Number(props.total);
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const segments = props.segments || [];
  let used = 0;
  const pieces = segments.map((segment, index) => {
    const value = Number(segment.value);
    const weight = Number.isFinite(value) && value > 0 ? value : 0;
    used += weight;
    const colorName = segment.color || usageColorSequence[index % usageColorSequence.length];
    const color = theme.category[colorName] || theme.fill.primary;
    return React.createElement('span', {
      key: segment.id,
      style: { display: 'block', height: '100%', width: safeTotal ? (weight / safeTotal * 100) + '%' : 0, background: color }
    });
  });
  const remainder = Math.max(0, safeTotal - used);
  const style = mergeStyle({ display: 'flex', flexDirection: 'column', gap: 4 }, props.style);
  return React.createElement('div', { style: style },
    (props.topLeftLabel || props.topRightLabel) ? React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', color: theme.text.tertiary, fontSize: 12 }
    }, React.createElement('span', null, props.topLeftLabel || ''), React.createElement('span', null, props.topRightLabel || '')) : null,
    React.createElement('div', {
      style: { display: 'flex', height: 8, borderRadius: theme.radius.full, overflow: 'hidden', background: theme.fill.tertiary }
    }, pieces, React.createElement('span', {
      style: { display: 'block', height: '100%', width: safeTotal ? (remainder / safeTotal * 100) + '%' : '100%', background: theme.fill.secondary }
    }))
  );
}

function DiffStats (props) {
  const theme = useHostTheme();
  const additions = props.additions || 0;
  const deletions = props.deletions || 0;
  if (!additions && !deletions) return null;
  const style = mergeStyle({
    display: 'inline-flex',
    gap: 6,
    fontVariantNumeric: 'tabular-nums',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12
  }, props.style);
  return React.createElement('span', { style: style },
    additions ? React.createElement('span', { style: { color: theme.diff.stripAdded } }, '+' + additions) : null,
    deletions ? React.createElement('span', { style: { color: theme.diff.stripRemoved } }, '-' + deletions) : null
  );
}

function DiffView (props) {
  const theme = useHostTheme();
  const showNumbers = props.showLineNumbers !== false;
  const colorNumbers = props.coloredLineNumbers !== false;
  const showStrip = props.showAccentStrip !== false;
  const style = mergeStyle({
    margin: 0,
    overflow: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 12,
    lineHeight: '18px'
  }, props.style);
  const lines = props.lines || [];
  return React.createElement('div', { style: style }, lines.map((line, index) => {
    const added = line.type === 'added';
    const removed = line.type === 'removed';
    const background = added ? theme.diff.insertedLine : removed ? theme.diff.removedLine : 'transparent';
    const strip = added ? theme.diff.stripAdded : removed ? theme.diff.stripRemoved : 'transparent';
    const numberColor = colorNumbers && added ? theme.diff.stripAdded : colorNumbers && removed ? theme.diff.stripRemoved : theme.text.quaternary;
    return React.createElement('div', {
      key: index,
      style: { display: 'flex', background: background }
    },
    showStrip ? React.createElement('span', { style: { width: 3, background: strip, flex: '0 0 auto' } }) : null,
    showNumbers ? React.createElement('span', {
      style: { width: 40, padding: '0 8px', textAlign: 'right', color: numberColor, flex: '0 0 auto' }
    }, line.lineNumber == null ? '' : String(line.lineNumber)) : null,
    React.createElement('span', { style: { whiteSpace: 'pre', paddingRight: 8, color: theme.text.primary } }, line.content)
    );
  }));
}

const TODO_LABEL = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Done',
  cancelled: 'Cancelled'
};

function TodoList (props) {
  const theme = useHostTheme();
  const todos = props.todos || [];
  if (!todos.length) return null;
  const dimmed = props.dimmedTodoIds;
  const style = mergeStyle({ display: 'flex', flexDirection: 'column', gap: 4 }, props.style);
  return React.createElement('div', { style: style }, todos.map((todo) => {
    const faded = dimmed && dimmed.has && dimmed.has(todo.id);
    const rowStyle = {
      display: 'flex',
      gap: 8,
      width: '100%',
      textAlign: 'left',
      border: 0,
      background: 'transparent',
      color: theme.text.primary,
      font: 'inherit',
      opacity: faded ? 0.45 : 1,
      cursor: props.onTodoClick ? 'pointer' : 'default',
      padding: '2px 0'
    };
    const body = React.createElement(React.Fragment, null,
      React.createElement('span', { style: { color: theme.text.tertiary, width: 84, flex: '0 0 auto', fontSize: 12 } }, TODO_LABEL[todo.status] || todo.status),
      React.createElement('span', {
        style: { textDecoration: todo.status === 'completed' || todo.status === 'cancelled' ? 'line-through' : 'none' }
      }, todo.content)
    );
    if (!props.onTodoClick) return React.createElement('div', { key: todo.id, style: rowStyle }, body);
    return React.createElement('button', {
      key: todo.id,
      type: 'button',
      onClick: () => props.onTodoClick(todo),
      style: rowStyle
    }, body);
  }));
}

function TodoListCard (props) {
  const todos = props.todos || [];
  if (!todos.length) return null;
  const done = todos.filter((todo) => todo.status === 'completed').length;
  return React.createElement(Card, { collapsible: true, defaultOpen: !!props.defaultExpanded, style: props.style },
    React.createElement(CardHeader, { trailing: done + ' of ' + todos.length + ' done' }, 'Tasks'),
    React.createElement(CardBody, null, React.createElement(TodoList, {
      todos: todos,
      dimmedTodoIds: props.dimmedTodoIds,
      onTodoClick: props.onTodoClick
    }))
  );
}

function finite (value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatChartValue (value, prefix, suffix) {
  const rounded = Math.round(value * 100) / 100;
  return (prefix || '') + String(rounded) + (suffix || '');
}

function chartColor (theme, tone, index) {
  if (tone) return toneColor(theme, tone);
  const sequence = theme.chart.sequence;
  return sequence[index % sequence.length];
}

function axisDomain (values, props, lockedZero) {
  let lo = values.length ? Math.min.apply(null, values) : 0;
  let hi = values.length ? Math.max.apply(null, values) : 0;
  (props.referenceLines || []).forEach((line) => {
    const value = finite(line.value);
    lo = Math.min(lo, value);
    hi = Math.max(hi, value);
  });
  if (lockedZero) return { min: 0, max: hi <= 0 ? 1 : hi * 1.05 };
  let min = props.yMin != null ? finite(props.yMin) : (props.beginAtZero === false ? lo : Math.min(0, lo));
  let max = props.yMax != null ? finite(props.yMax) : hi;
  if (max <= min) max = min + 1;
  return { min: min, max: max + (max - min) * 0.05 };
}

function ChartFrame (props) {
  const theme = useHostTheme();
  const style = mergeStyle({ color: theme.text.secondary, fontSize: 12 }, props.style);
  return React.createElement('div', { style: style },
    React.createElement('svg', {
      viewBox: '0 0 ' + props.width + ' ' + props.height,
      width: '100%',
      role: 'img',
      style: { display: 'block', overflow: 'visible' }
    }, props.children),
    props.legend
  );
}

function legendRow (theme, items) {
  if (!items || items.length < 2) return null;
  return React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 } },
    items.map((item) => React.createElement('span', {
      key: item.name,
      style: { display: 'inline-flex', alignItems: 'center', gap: 6, color: theme.text.secondary }
    }, React.createElement('span', {
      style: { width: 8, height: 8, background: item.color, borderRadius: theme.radius.xs }
    }), item.name))
  );
}

function BarChart (props) {
  const theme = useHostTheme();
  const categories = props.categories || [];
  const series = props.series || [];
  const stacked = !!(props.stacked || props.normalized);
  const normalized = !!props.normalized;
  const horizontal = !!props.horizontal;
  const height = props.height || 240;
  const width = 640;
  const pad = { left: horizontal ? 88 : 36, right: 12, top: 16, bottom: horizontal ? 28 : 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const prefix = normalized ? '' : (props.valuePrefix || '');
  const suffix = normalized ? (props.valueSuffix || '%') : (props.valueSuffix || '');
  const single = series.length === 1;
  const showValues = props.showValues != null ? props.showValues : (single && !stacked && categories.length <= 8);

  const matrix = series.map((entry) => categories.map((_, index) => finite(entry.data && entry.data[index])));
  if (normalized) {
    categories.forEach((_, index) => {
      const sum = matrix.reduce((total, row) => total + row[index], 0) || 1;
      matrix.forEach((row) => { row[index] = row[index] / sum * 100; });
    });
  }
  const flat = [];
  if (stacked) {
    categories.forEach((_, index) => {
      flat.push(matrix.reduce((total, row) => total + row[index], 0));
    });
  } else {
    matrix.forEach((row) => row.forEach((value) => flat.push(value)));
  }
  const domain = axisDomain(flat, props, stacked || normalized);
  const span = domain.max - domain.min || 1;
  const scale = (value) => (value - domain.min) / span;

  const group = categories.length || 1;
  const band = (horizontal ? plotH : plotW) / group;
  const barCount = stacked ? 1 : Math.max(series.length, 1);
  const barSize = Math.max(2, (band * 0.7) / barCount);
  const shapes = [];
  categories.forEach((category, catIndex) => {
    let stack = 0;
    series.forEach((entry, seriesIndex) => {
      const value = matrix[seriesIndex][catIndex];
      const color = chartColor(theme, entry.tone, single ? catIndex : seriesIndex);
      const start = stacked ? stack : 0;
      const end = stacked ? stack + value : value;
      if (stacked) stack += value;
      const slot = stacked ? 0 : seriesIndex;
      if (horizontal) {
        const y = pad.top + catIndex * band + (band - barCount * barSize) / 2 + slot * barSize;
        const x0 = pad.left + scale(Math.min(start, domain.min)) * plotW;
        const x1 = pad.left + scale(end) * plotW;
        shapes.push(React.createElement('rect', {
          key: catIndex + '-' + seriesIndex,
          x: Math.min(x0, x1),
          y: y,
          width: Math.abs(x1 - x0),
          height: barSize - 1,
          fill: color
        }, React.createElement('title', null, entry.name + ': ' + formatChartValue(value, prefix, suffix))));
      } else {
        const x = pad.left + catIndex * band + (band - barCount * barSize) / 2 + slot * barSize;
        const y0 = pad.top + plotH - scale(end) * plotH;
        const y1 = pad.top + plotH - scale(Math.max(start, domain.min)) * plotH;
        shapes.push(React.createElement('rect', {
          key: catIndex + '-' + seriesIndex,
          x: x,
          y: Math.min(y0, y1),
          width: barSize - 1,
          height: Math.abs(y1 - y0),
          fill: color
        }, React.createElement('title', null, entry.name + ': ' + formatChartValue(value, prefix, suffix))));
        if (showValues) {
          shapes.push(React.createElement('text', {
            key: 'v' + catIndex + '-' + seriesIndex,
            x: x + barSize / 2,
            y: Math.min(y0, y1) - 4,
            textAnchor: 'middle',
            fill: theme.text.tertiary,
            fontSize: 10
          }, formatChartValue(value, prefix, suffix)));
        }
      }
    });
  });

  const labels = categories.map((category, index) => {
    const text = String(category);
    if (horizontal) {
      return React.createElement('text', {
        key: 'l' + index,
        x: pad.left - 6,
        y: pad.top + index * band + band / 2,
        textAnchor: 'end',
        dominantBaseline: 'middle',
        fill: theme.text.tertiary,
        fontSize: 11
      }, text);
    }
    return React.createElement('text', {
      key: 'l' + index,
      x: pad.left + index * band + band / 2,
      y: height - 14,
      textAnchor: 'middle',
      fill: theme.text.tertiary,
      fontSize: 11
    }, text);
  });

  const guides = (props.referenceLines || []).map((line, index) => {
    const at = scale(finite(line.value));
    const color = line.tone ? toneColor(theme, line.tone) : theme.chart.palette.neutralLine;
    if (horizontal) {
      const x = pad.left + at * plotW;
      return React.createElement('line', {
        key: 'r' + index,
        x1: x,
        x2: x,
        y1: pad.top,
        y2: pad.top + plotH,
        stroke: color,
        strokeDasharray: '4 3'
      });
    }
    const y = pad.top + plotH - at * plotH;
    return React.createElement('g', { key: 'r' + index },
      React.createElement('line', { x1: pad.left, x2: pad.left + plotW, y1: y, y2: y, stroke: color, strokeDasharray: '4 3' }),
      line.label ? React.createElement('text', { x: pad.left + plotW, y: y - 2, textAnchor: 'end', fill: color, fontSize: 10 }, line.label) : null
    );
  });

  return React.createElement(ChartFrame, {
    width: width,
    height: height,
    style: props.style,
    legend: legendRow(theme, series.map((entry, index) => ({
      name: entry.name,
      color: chartColor(theme, entry.tone, index)
    })))
  }, guides, shapes, labels);
}

function LineChart (props) {
  const theme = useHostTheme();
  const categories = props.categories || [];
  const series = props.series || [];
  const height = props.height || 240;
  const width = 640;
  const pad = { left: 36, right: 12, top: 16, bottom: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const [hover, setHover] = React.useState(null);
  const flat = [];
  series.forEach((entry) => (entry.data || []).forEach((value) => flat.push(finite(value))));
  const domain = axisDomain(flat, props, false);
  const span = domain.max - domain.min || 1;
  const step = categories.length > 1 ? plotW / (categories.length - 1) : plotW;
  const xAt = (index) => pad.left + (categories.length > 1 ? index * step : plotW / 2);
  const yAt = (value) => pad.top + plotH - ((finite(value) - domain.min) / span) * plotH;
  const showValues = !!props.showValues && categories.length <= 20;
  const showGuide = props.showHoverGuide !== false;
  const shapes = [];
  series.forEach((entry, seriesIndex) => {
    const color = chartColor(theme, entry.tone, seriesIndex);
    const points = categories.map((_, index) => xAt(index) + ',' + yAt(entry.data && entry.data[index]));
    if (props.fill) {
      const base = pad.top + plotH;
      const area = xAt(0) + ',' + base + ' ' + points.join(' ') + ' ' + xAt(categories.length - 1) + ',' + base;
      shapes.push(React.createElement('polygon', { key: 'f' + seriesIndex, points: area, fill: color, opacity: 0.18 }));
    }
    shapes.push(React.createElement('polyline', {
      key: 'p' + seriesIndex,
      points: points.join(' '),
      fill: 'none',
      stroke: color,
      strokeWidth: 2
    }));
    categories.forEach((_, index) => {
      const value = finite(entry.data && entry.data[index]);
      shapes.push(React.createElement('circle', {
        key: 'c' + seriesIndex + '-' + index,
        cx: xAt(index),
        cy: yAt(value),
        r: 3,
        fill: color
      }, React.createElement('title', null, entry.name + ': ' + formatChartValue(value, props.valuePrefix, props.valueSuffix))));
      if (showValues) {
        shapes.push(React.createElement('text', {
          key: 't' + seriesIndex + '-' + index,
          x: xAt(index),
          y: yAt(value) - 6,
          textAnchor: 'middle',
          fill: theme.text.tertiary,
          fontSize: 10
        }, formatChartValue(value, props.valuePrefix, props.valueSuffix)));
      }
    });
  });
  const labels = categories.map((category, index) => React.createElement('text', {
    key: 'l' + index,
    x: xAt(index),
    y: height - 14,
    textAnchor: 'middle',
    fill: theme.text.tertiary,
    fontSize: 11
  }, String(category)));
  const guide = showGuide && hover != null ? React.createElement('line', {
    x1: xAt(hover),
    x2: xAt(hover),
    y1: pad.top,
    y2: pad.top + plotH,
    stroke: theme.stroke.secondary
  }) : null;
  return React.createElement(ChartFrame, {
    width: width,
    height: height,
    style: props.style,
    legend: legendRow(theme, series.map((entry, index) => ({ name: entry.name, color: chartColor(theme, entry.tone, index) })))
  }, React.createElement('rect', {
    x: pad.left,
    y: pad.top,
    width: plotW,
    height: plotH,
    fill: 'transparent',
    onMouseMove: (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
      const index = Math.round(ratio * Math.max(categories.length - 1, 0));
      setHover(Math.max(0, Math.min(categories.length - 1, index)));
    },
    onMouseLeave: () => setHover(null)
  }), guide, shapes, labels);
}

function PieChart (props) {
  const theme = useHostTheme();
  const data = props.data || [];
  const size = props.size || 200;
  const [hover, setHover] = React.useState(null);
  const total = data.reduce((sum, point) => sum + Math.max(0, finite(point.value)), 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;
  let angle = -Math.PI / 2;
  const slices = data.map((point, index) => {
    const value = Math.max(0, finite(point.value));
    const sweep = (value / total) * Math.PI * 2;
    const start = angle;
    angle += sweep;
    return { point: point, index: index, start: start, end: angle, value: value };
  });
  const paths = slices.map((slice) => {
    const color = chartColor(theme, slice.point.tone, slice.index);
    const active = hover === slice.index;
    if (slices.length === 1) {
      return React.createElement('circle', {
        key: slice.index,
        cx: cx,
        cy: cy,
        r: props.donut ? radius * 0.7 : radius,
        fill: props.donut ? 'none' : color,
        stroke: color,
        strokeWidth: props.donut ? radius * 0.45 : 0,
        onMouseEnter: () => setHover(slice.index),
        onMouseLeave: () => setHover(null)
      });
    }
    const outer = active ? radius + 4 : radius;
    const inner = props.donut ? radius * 0.55 : 0;
    const large = slice.end - slice.start > Math.PI ? 1 : 0;
    const arc = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const startOuter = arc(outer, slice.start);
    const endOuter = arc(outer, slice.end);
    const endInner = arc(inner, slice.end);
    const startInner = arc(inner, slice.start);
    const d = inner
      ? 'M ' + startOuter[0] + ' ' + startOuter[1] + ' A ' + outer + ' ' + outer + ' 0 ' + large + ' 1 ' + endOuter[0] + ' ' + endOuter[1] + ' L ' + endInner[0] + ' ' + endInner[1] + ' A ' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + startInner[0] + ' ' + startInner[1] + ' Z'
      : 'M ' + cx + ' ' + cy + ' L ' + startOuter[0] + ' ' + startOuter[1] + ' A ' + outer + ' ' + outer + ' 0 ' + large + ' 1 ' + endOuter[0] + ' ' + endOuter[1] + ' Z';
    return React.createElement('path', {
      key: slice.index,
      d: d,
      fill: color,
      opacity: hover == null || active ? 1 : 0.45,
      onMouseEnter: () => setHover(slice.index),
      onMouseLeave: () => setHover(null)
    }, React.createElement('title', null, slice.point.label + ': ' + slice.value));
  });
  const hovered = hover == null ? null : slices[hover];
  const caption = hovered
    ? hovered.point.label + ' · ' + hovered.value + ' (' + Math.round(hovered.value / total * 100) + '%)'
    : '';
  return React.createElement('div', { style: mergeStyle({ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }, props.style) },
    React.createElement('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size, role: 'img' },
      paths,
      props.donut ? React.createElement('text', {
        x: cx,
        y: cy,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: theme.text.primary,
        fontSize: 16,
        fontWeight: 600
      }, String(Math.round(total))) : null
    ),
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
      data.map((point, index) => React.createElement('span', {
        key: point.label + index,
        onMouseEnter: () => setHover(index),
        onMouseLeave: () => setHover(null),
        style: { display: 'inline-flex', alignItems: 'center', gap: 6, color: theme.text.secondary, fontSize: 12 }
      }, React.createElement('span', {
        style: { width: 8, height: 8, background: chartColor(theme, point.tone, index) }
      }), point.label)),
      caption ? React.createElement('span', { style: { color: theme.text.tertiary, fontSize: 12 } }, caption) : null
    )
  );
}

function numberOr (value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function computeDAGLayout (options) {
  const opts = options || {};
  const nodesIn = Array.isArray(opts.nodes) ? opts.nodes : [];
  const edgesIn = Array.isArray(opts.edges) ? opts.edges : [];
  const direction = opts.direction === 'horizontal' ? 'horizontal' : 'vertical';
  const nodeWidth = numberOr(opts.nodeWidth, 160);
  const nodeHeight = numberOr(opts.nodeHeight, 40);
  const rankGap = numberOr(opts.rankGap, 64);
  const nodeGap = numberOr(opts.nodeGap, 48);
  const padding = numberOr(opts.padding, 24);
  const ids = [];
  const seen = {};
  nodesIn.forEach((node) => {
    if (!node || node.id == null || seen[node.id]) return;
    seen[node.id] = true;
    ids.push(String(node.id));
  });
  const outgoing = {};
  ids.forEach((id) => { outgoing[id] = []; });
  const edgeList = [];
  edgesIn.forEach((edge) => {
    if (!edge || !seen[edge.from] || !seen[edge.to]) return;
    const from = String(edge.from);
    const to = String(edge.to);
    outgoing[from].push(to);
    edgeList.push({ from: from, to: to });
  });
  const color = {};
  ids.forEach((id) => { color[id] = 0; });
  const back = {};
  function walk (id) {
    color[id] = 1;
    outgoing[id].forEach((to) => {
      if (color[to] === 1) back[id + '\0' + to] = true;
      else if (color[to] === 0) walk(to);
    });
    color[id] = 2;
  }
  ids.forEach((id) => { if (color[id] === 0) walk(id); });
  const indeg = {};
  ids.forEach((id) => { indeg[id] = 0; });
  edgeList.forEach((edge) => {
    if (!back[edge.from + '\0' + edge.to]) indeg[edge.to] += 1;
  });
  const rankOf = {};
  ids.forEach((id) => { rankOf[id] = 0; });
  const queue = ids.filter((id) => indeg[id] === 0);
  const queued = {};
  queue.forEach((id) => { queued[id] = true; });
  while (queue.length) {
    const id = queue.shift();
    outgoing[id].forEach((to) => {
      if (back[id + '\0' + to]) return;
      if (rankOf[to] < rankOf[id] + 1) rankOf[to] = rankOf[id] + 1;
      indeg[to] -= 1;
      if (indeg[to] === 0 && !queued[to]) {
        queued[to] = true;
        queue.push(to);
      }
    });
  }
  const byRank = [];
  ids.forEach((id) => {
    const rank = rankOf[id];
    if (!byRank[rank]) byRank[rank] = [];
    byRank[rank].push(id);
  });
  const placed = {};
  let maxOrder = 0;
  byRank.forEach((group, rank) => {
    if (!group) return;
    group.forEach((id, order) => {
      if (order > maxOrder) maxOrder = order;
      placed[id] = {
        id: id,
        rank: rank,
        order: order,
        x: direction === 'horizontal' ? padding + rank * (nodeWidth + rankGap) : padding + order * (nodeWidth + nodeGap),
        y: direction === 'horizontal' ? padding + order * (nodeHeight + nodeGap) : padding + rank * (nodeHeight + rankGap)
      };
    });
  });
  const rankCount = byRank.filter(Boolean).length;
  const orderCount = ids.length ? maxOrder + 1 : 0;
  const width = direction === 'horizontal'
    ? padding * 2 + rankCount * nodeWidth + Math.max(0, rankCount - 1) * rankGap
    : padding * 2 + orderCount * nodeWidth + Math.max(0, orderCount - 1) * nodeGap;
  const height = direction === 'horizontal'
    ? padding * 2 + orderCount * nodeHeight + Math.max(0, orderCount - 1) * nodeGap
    : padding * 2 + rankCount * nodeHeight + Math.max(0, rankCount - 1) * rankGap;
  const nodes = ids.map((id) => placed[id]);
  const edges = edgeList.map((edge) => {
    const from = placed[edge.from];
    const to = placed[edge.to];
    const vertical = direction !== 'horizontal';
    return {
      from: edge.from,
      to: edge.to,
      sourceX: vertical ? from.x + nodeWidth / 2 : from.x + nodeWidth,
      sourceY: vertical ? from.y + nodeHeight : from.y + nodeHeight / 2,
      targetX: vertical ? to.x + nodeWidth / 2 : to.x,
      targetY: vertical ? to.y : to.y + nodeHeight / 2,
      isBackEdge: !!back[edge.from + '\0' + edge.to]
    };
  });
  const ranks = [];
  byRank.forEach((group, rank) => {
    if (!group || !group.length) return;
    const first = placed[group[0]];
    const last = placed[group[group.length - 1]];
    ranks.push(direction === 'horizontal' ? {
      rank: rank,
      x: first.x,
      y: first.y,
      width: nodeWidth,
      height: last.y + nodeHeight - first.y,
      nodeIds: group.slice()
    } : {
      rank: rank,
      x: first.x,
      y: first.y,
      width: last.x + nodeWidth - first.x,
      height: nodeHeight,
      nodeIds: group.slice()
    });
  });
  return { nodes: nodes, edges: edges, ranks: ranks, direction: direction, width: width, height: height };
}

const { useEffect, useMemo, useRef, useState } = React;

module.exports = {
  useEffect,
  useMemo,
  useRef,
  useState,
  categoryPaletteDark,
  categoryPaletteLight,
  colorPalette,
  usageColorSequence,
  BarChart,
  LineChart,
  PieChart,
  CollapsibleSection,
  computeDAGLayout,
  DiffStats,
  DiffView,
  Checkbox,
  IconButton,
  Select,
  TextArea,
  TextInput,
  Toggle,
  useCanvasAction,
  useCanvasState,
  useHostTheme,
  Swatch,
  canvasPaletteDark,
  canvasPaletteGrokDark,
  canvasPaletteGrokLight,
  canvasPaletteLight,
  canvasTokens,
  canvasTokensLight,
  TodoList,
  TodoListCard,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Link,
  mergeStyle,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  UsageBar,
  setCanvasState,
  resolveHostTheme
};
