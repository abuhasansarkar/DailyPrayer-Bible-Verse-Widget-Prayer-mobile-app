import Svg, { Circle, Path, Rect, Line, Polyline } from 'react-native-svg';

export type AppIconName =
  | 'home'
  | 'compass'
  | 'pray'
  | 'journal'
  | 'library'
  | 'widget'
  | 'settings'
  | 'bell'
  | 'book'
  | 'moon'
  | 'globe'
  | 'shield'
  | 'sparkle'
  | 'help'
  | 'info'
  | 'chevronRight'
  | 'arrowLeft'
  | 'plus'
  | 'lock'
  | 'ai'
  | 'palette'
  | 'phone'
  | 'grid'
  | 'heart'
  | 'check';

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function AppIcon({ name, size = 24, color = '#292B28', strokeWidth = 2 }: AppIconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      {name === 'home' && (
        <>
          <Path {...common} d="M3 11.5 12 4l9 7.5" />
          <Path {...common} d="M6 10.5V20h12v-9.5" />
          <Path {...common} d="M10 20v-5h4v5" />
        </>
      )}
      {name === 'compass' && (
        <>
          <Circle {...common} cx="12" cy="12" r="8.5" />
          <Path {...common} d="m15.5 8.5-2.2 5-5 2.2 2.2-5 5-2.2Z" />
        </>
      )}
      {name === 'pray' && (
        <>
          <Path {...common} d="M9 21V9.5c0-1.4.9-2.5 2-2.5s2 1.1 2 2.5V21" />
          <Path {...common} d="M13 11.5V6.8c0-1.2.8-2.2 1.8-2.2S16.5 5.6 16.5 7v6.5" />
          <Path {...common} d="M9 12.5 6.8 9.6c-.7-.9-1.9-.4-1.8.7.2 3.3 1.6 6.6 4 8.7" />
          <Path {...common} d="M16.5 13.5 18 11c.6-1 1.9-.6 1.8.6-.2 3.5-1.6 5.7-4.2 7.4" />
        </>
      )}
      {name === 'journal' && (
        <>
          <Path {...common} d="M7 4h9.5A2.5 2.5 0 0 1 19 6.5V20H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <Path {...common} d="M8 4v16" />
          <Path {...common} d="M11 8h5" />
          <Path {...common} d="M11 12h4" />
        </>
      )}
      {name === 'library' && (
        <>
          <Path {...common} d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z" />
          <Path {...common} d="M5 18.5A2.5 2.5 0 0 1 7.5 16H20" />
          <Path {...common} d="M9 7h7" />
        </>
      )}
      {name === 'widget' && (
        <>
          <Rect {...common} x="4" y="4" width="7" height="7" rx="2" />
          <Rect {...common} x="13" y="4" width="7" height="7" rx="2" />
          <Rect {...common} x="4" y="13" width="16" height="7" rx="2" />
        </>
      )}
      {name === 'settings' && (
        <>
          <Circle {...common} cx="12" cy="12" r="3" />
          <Path {...common} d="M12 2.8v2.1M12 19.1v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
        </>
      )}
      {name === 'bell' && <Path {...common} d="M18 10a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7ZM9.8 21h4.4" />}
      {name === 'book' && <Path {...common} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />}
      {name === 'moon' && <Path {...common} d="M20 15.3A8 8 0 0 1 8.7 4 7 7 0 1 0 20 15.3Z" />}
      {name === 'globe' && <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" /></>}
      {name === 'shield' && <Path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />}
      {name === 'sparkle' && <><Path {...common} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><Path {...common} d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z" /></>}
      {name === 'help' && <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M9.8 9a2.4 2.4 0 1 1 4.1 1.7c-1.1 1-1.9 1.5-1.9 3" /><Line {...common} x1="12" y1="17" x2="12" y2="17.1" /></>}
      {name === 'info' && <><Circle {...common} cx="12" cy="12" r="9" /><Line {...common} x1="12" y1="10" x2="12" y2="16" /><Line {...common} x1="12" y1="7" x2="12" y2="7.1" /></>}
      {name === 'heart' && <Path {...common} d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 0 1 19.3 13L12 20.3Z" />}
      {name === 'chevronRight' && <Polyline {...common} points="9 6 15 12 9 18" />}
      {name === 'arrowLeft' && <><Line {...common} x1="19" y1="12" x2="5" y2="12" /><Polyline {...common} points="12 5 5 12 12 19" /></>}
      {name === 'plus' && <><Line {...common} x1="12" y1="5" x2="12" y2="19" /><Line {...common} x1="5" y1="12" x2="19" y2="12" /></>}
      {name === 'lock' && <><Rect {...common} x="5" y="10" width="14" height="10" rx="2" /><Path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" /></>}
      {name === 'ai' && <><Path {...common} d="M12 3l1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3L12 3Z" /><Rect {...common} x="4" y="15" width="16" height="5" rx="2.5" /></>}
      {name === 'palette' && <><Path {...common} d="M12 3a9 9 0 0 0 0 18h1.5a1.8 1.8 0 0 0 1.3-3.1 1.8 1.8 0 0 1 1.3-3.1H18a6 6 0 0 0 0-12h-6Z" /><Circle {...common} cx="7.5" cy="10" r=".4" /><Circle {...common} cx="10" cy="7.5" r=".4" /><Circle {...common} cx="13.5" cy="7.5" r=".4" /></>}
      {name === 'phone' && <Rect {...common} x="7" y="3" width="10" height="18" rx="2" />}
      {name === 'grid' && <><Rect {...common} x="4" y="4" width="6" height="6" rx="1.5" /><Rect {...common} x="14" y="4" width="6" height="6" rx="1.5" /><Rect {...common} x="4" y="14" width="6" height="6" rx="1.5" /><Rect {...common} x="14" y="14" width="6" height="6" rx="1.5" /></>}
      {name === 'check' && <Polyline {...common} points="5 13 9 17 19 7" />}
    </Svg>
  );
}