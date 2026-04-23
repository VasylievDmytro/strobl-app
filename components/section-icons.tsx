import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function SvgBase({ children, className, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeSectionIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M11 29.5 32 12l21 17.5v23a2.5 2.5 0 0 1-2.5 2.5H39V40.5A2.5 2.5 0 0 0 36.5 38h-9A2.5 2.5 0 0 0 25 40.5V55H13.5A2.5 2.5 0 0 1 11 52.5v-23Z" />
      <path d="M7.5 31.5a2 2 0 0 1-1.3-3.52l24.5-20.5a2 2 0 0 1 2.56 0L57.8 28a2 2 0 0 1-2.57 3.05L32 11.66 8.77 31.05a1.99 1.99 0 0 1-1.27.45Z" />
    </SvgBase>
  );
}

export function InvoiceSectionIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M17 7h22l10 10v37a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V10a3 3 0 0 1 3-3Z" />
      <path d="M39 7v11h11" fill="white" opacity=".22" />
      <rect x="21" y="25" width="22" height="4" rx="2" fill="white" opacity=".92" />
      <rect x="21" y="34" width="16" height="4" rx="2" fill="white" opacity=".92" />
      <circle cx="42" cy="44" r="8" fill="white" opacity=".96" />
      <path d="m39.5 44 1.8 1.8 4.2-4.6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </SvgBase>
  );
}

export function BtrSectionIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <rect x="8" y="46" width="48" height="6" rx="3" />
      <rect x="14" y="20" width="15" height="18" rx="2" />
      <path d="M29 23h11l7 9v6H29z" />
      <path d="m39 20 10-8 5 6-8 7z" />
      <path d="m47 17 5-5 3 3-5 5z" />
      <circle cx="21" cy="50" r="6" fill="white" opacity=".96" />
      <circle cx="45" cy="50" r="6" fill="white" opacity=".96" />
      <circle cx="21" cy="50" r="3.2" />
      <circle cx="45" cy="50" r="3.2" />
    </SvgBase>
  );
}

export function TransportSectionIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <path d="M11 20a4 4 0 0 1 4-4h23a4 4 0 0 1 4 4v18H11V20Z" />
      <path d="M42 23h8l6 8v7H42V23Z" />
      <rect x="16" y="22" width="10" height="7" rx="1.5" fill="white" opacity=".2" />
      <circle cx="22" cy="46" r="8" fill="white" opacity=".96" />
      <circle cx="46" cy="46" r="8" fill="white" opacity=".96" />
      <circle cx="22" cy="46" r="3.8" />
      <circle cx="46" cy="46" r="3.8" />
      <rect x="15" y="40" width="37" height="4" rx="2" />
    </SvgBase>
  );
}

export function DailySectionIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <rect x="16" y="9" width="32" height="46" rx="4" />
      <rect x="22" y="18" width="20" height="4" rx="2" fill="white" opacity=".94" />
      <rect x="22" y="28" width="20" height="4" rx="2" fill="white" opacity=".94" />
      <rect x="22" y="38" width="14" height="4" rx="2" fill="white" opacity=".94" />
      <circle cx="45" cy="45" r="9" fill="white" opacity=".96" />
      <path d="m41.3 45.1 2.4 2.5 5-6.4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 6h4v8h-4zM36 6h4v8h-4z" />
    </SvgBase>
  );
}

export function GeoCaptureSectionIcon(props: IconProps) {
  return (
    <SvgBase {...props}>
      <circle cx="22" cy="22" r="9" />
      <path d="M9 50c1.8-7.7 8.3-13 15.8-13 7.7 0 13.8 5 15.3 13H9Z" />
      <circle cx="46" cy="38" r="11" fill="white" opacity=".96" />
      <path
        d="M46 31.8v7.3l4.8 3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path d="M46 27a11 11 0 1 1 0 22 11 11 0 0 1 0-22Z" fill="none" />
    </SvgBase>
  );
}
