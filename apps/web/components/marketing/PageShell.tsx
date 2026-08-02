import { NavbarLight } from '../layout/NavbarLight';
import { FooterLight } from '../layout/FooterLight';

/**
 * Shell for the static marketing pages (about, for-developers, contact…).
 * Light ground with a generous measure — these pages are read, not scanned.
 */
export function PageShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <NavbarLight />

      <header className="border-b border-gray-100 px-6 pb-14 pt-32 sm:px-10">
        <div className="mx-auto max-w-3xl">
          {eyebrow && (
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              {eyebrow}
            </p>
          )}
          <h1
            className="text-[40px] font-semibold leading-[1.1] tracking-tight text-gray-900 sm:text-[52px]"
            style={{ textWrap: 'balance' }}
          >
            {title}
          </h1>
          {lede && (
            <p className="mt-5 text-[19px] leading-relaxed text-gray-600">{lede}</p>
          )}
        </div>
      </header>

      <main className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>

      <FooterLight />
    </div>
  );
}

/** A titled block within a marketing page. */
export function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14 last:mb-0">
      {title && (
        <h2 className="mb-4 text-[26px] font-semibold tracking-tight text-gray-900">{title}</h2>
      )}
      <div className="space-y-4 text-[17px] leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}
