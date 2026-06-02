import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const defaultProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

function wrap(props: IconProps, paths: React.ReactNode): React.ReactNode {
  const { size = 16, ...rest } = props
  return (
    <svg {...defaultProps} width={size} height={size} {...rest}>
      {paths}
    </svg>
  )
}

export function IconBold(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </>
  )
}

export function IconItalic(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </>
  )
}

export function IconHeading(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M6 4v16" />
      <path d="M18 4v16" />
      <path d="M6 12h12" />
    </>
  )
}

export function IconQuote(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </>
  )
}

export function IconCode(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  )
}

export function IconLink(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  )
}

export function IconImage(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  )
}

export function IconList(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  )
}

export function IconOrderedList(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </>
  )
}

export function IconDivider(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" opacity="0.3" />
      <line x1="3" y1="18" x2="21" y2="18" opacity="0.3" />
    </>
  )
}

export function IconTaskList(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <rect x="3" y="5" width="6" height="6" rx="1" />
      <path d="M5 8l1 1 2-2" />
      <line x1="13" y1="8" x2="21" y2="8" />
      <rect x="3" y="13" width="6" height="6" rx="1" />
      <line x1="13" y1="16" x2="21" y2="16" />
    </>
  )
}

export function IconSidebar(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </>
  )
}

export function IconEdit(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  )
}

export function IconSplit(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </>
  )
}

export function IconPreview(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  )
}

export function IconSearch(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  )
}

export function IconTheme(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
    </>
  )
}

export function IconSettings(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  )
}

export function IconNewFile(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </>
  )
}

export function IconNewFolder(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </>
  )
}

export function IconImport(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  )
}

export function IconRefresh(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  )
}

export function IconFolderOpen(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v1" />
    </>
  )
}

export function IconFolderClosed(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </>
  )
}

export function IconFile(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  )
}

export function IconImageFile(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </>
  )
}

export function IconClose(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  )
}

export function IconMinimize(props: IconProps): React.ReactNode {
  return wrap(props, <line x1="5" y1="12" x2="19" y2="12" />)
}

export function IconMaximize(props: IconProps): React.ReactNode {
  return wrap(props, <rect x="5" y="5" width="14" height="14" rx="1" />)
}

export function IconRestore(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <rect x="7" y="7" width="14" height="14" rx="1" />
      <path d="M7 3h14v4" />
    </>
  )
}

export function IconChevronRight(props: IconProps): React.ReactNode {
  return wrap(props, <polyline points="9 18 15 12 9 6" />)
}

export function IconChevronDown(props: IconProps): React.ReactNode {
  return wrap(props, <polyline points="6 9 12 15 18 9" />)
}

export function IconSyncScroll(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M8 3 L8 21" />
      <path d="M16 3 L16 21" />
      <path d="M5 8 L8 5 L11 8" />
      <path d="M13 16 L16 19 L19 16" />
    </>
  )
}

export function IconTypewriter(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="10" x2="6" y2="10.01" />
      <line x1="10" y1="10" x2="10" y2="10.01" />
      <line x1="14" y1="10" x2="14" y2="10.01" />
      <line x1="18" y1="10" x2="18" y2="10.01" />
      <line x1="7" y1="14" x2="17" y2="14" />
      <path d="M12 2 L12 6" />
    </>
  )
}

export function IconExport(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  )
}

export function IconOutline(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="6" y1="10" x2="18" y2="10" />
      <line x1="9" y1="14" x2="18" y2="14" />
      <line x1="6" y1="18" x2="15" y2="18" />
    </>
  )
}

// 热力图图标 — 小方块网格
export function IconHeatmap(props: IconProps): React.ReactNode {
  return wrap(
    props,
    <>
      <rect x="3" y="3" width="4" height="4" rx="1" />
      <rect x="9" y="3" width="4" height="4" rx="1" />
      <rect x="15" y="3" width="4" height="4" rx="1" />
      <rect x="3" y="9" width="4" height="4" rx="1" />
      <rect x="9" y="9" width="4" height="4" rx="1" />
      <rect x="15" y="9" width="4" height="4" rx="1" />
      <rect x="3" y="15" width="4" height="4" rx="1" />
      <rect x="9" y="15" width="4" height="4" rx="1" />
      <rect x="15" y="15" width="4" height="4" rx="1" />
    </>
  )
}

