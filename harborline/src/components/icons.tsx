// Minimal line-icon set drawn by hand — no emoji, no icon library dependency.
// 24×24 viewBox, currentColor stroke, 1.6px weight to match the terminal feel.
type P = { className?: string };
const S = ({ className, children }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-4 w-4"} aria-hidden>
    {children}
  </svg>
);
export const IconAnchor = (p: P) => <S {...p}><circle cx="12" cy="5" r="2.5" /><path d="M12 7.5V21M5 12H3a9 9 0 0 0 18 0h-2M8 10l-3 2m11-2 3 2" /></S>;
export const IconSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></S>;
export const IconHome = (p: P) => <S {...p}><path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></S>;
export const IconUsers = (p: P) => <S {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1.2-3.2 3.7-5 6.5-5s5.3 1.8 6.5 5M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 15.4c1.9.7 3 2.2 3.5 4.6" /></S>;
export const IconBookmark = (p: P) => <S {...p}><path d="M6 3h12v18l-6-4-6 4z" /></S>;
export const IconTag = (p: P) => <S {...p}><path d="M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01" /></S>;
export const IconCalculator = (p: P) => <S {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12v5M8 17h.01M12 17h.01" /></S>;
export const IconGlobe = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c-3 3-3 15 0 18m0-18c3 3 3 15 0 18" /></S>;
export const IconGift = (p: P) => <S {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8c-4 0-5-5-2-5 2 0 2 3 2 5zm0 0c4 0 5-5 2-5-2 0-2 3-2 5z" /></S>;
export const IconDoc = (p: P) => <S {...p}><path d="M6 2h8l4 4v16H6zM14 2v5h5" /></S>;
export const IconSpark = (p: P) => <S {...p}><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z" /></S>;
export const IconChart = (p: P) => <S {...p}><path d="M4 20V4M4 20h16M8 16v-5m4 5V8m4 8v-3" /></S>;
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5" /></S>;
export const IconSun = (p: P) => <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4 12H2m20 0h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></S>;
export const IconMoon = (p: P) => <S {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" /></S>;
export const IconBell = (p: P) => <S {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0" /></S>;
export const IconChevron = (p: P) => <S {...p}><path d="m9 6 6 6-6 6" /></S>;
export const IconX = (p: P) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const IconMenu = (p: P) => <S {...p}><path d="M4 6h16M4 12h16M4 18h16" /></S>;
export const IconCopy = (p: P) => <S {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></S>;
export const IconLock = (p: P) => <S {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></S>;
export const IconMail = (p: P) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></S>;
export const IconPhone = (p: P) => <S {...p}><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z" /></S>;
export const IconPrint = (p: P) => <S {...p}><path d="M7 8V3h10v5M7 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-3M7 14h10v7H7z" /></S>;
export const IconCheck = (p: P) => <S {...p}><path d="m4 12 5 5L20 6" /></S>;
export const IconAlert = (p: P) => <S {...p}><path d="M12 3 2 20h20zM12 10v4m0 3h.01" /></S>;
export const IconArrowRight = (p: P) => <S {...p}><path d="M4 12h16m-6-6 6 6-6 6" /></S>;
export const IconArrowLeft = (p: P) => <S {...p}><path d="M20 12H4m6 6-6-6 6-6" /></S>;
export const IconPanel = (p: P) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></S>;
export const IconLogout = (p: P) => <S {...p}><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9" /></S>;
export const IconTrash = (p: P) => <S {...p}><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h8l1-13" /></S>;
export const IconDownload = (p: P) => <S {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" /></S>;
