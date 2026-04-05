export function Footer() {
  return (
    <footer className="border-t border-[#ddd3c6] bg-[#f7f1e7]">
      <div className="mx-auto flex max-w-[1720px] flex-col gap-4 px-4 py-6 text-sm text-[#6d6255] md:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <p>&copy; {new Date().getFullYear()} chinese-takeout.com</p>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.16em]">
            <span>Built for restaurant owners</span>
            <span className="text-[#a49684]">Find, Claim, Publish</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.14em] text-[#7c6e60] md:justify-start">
          <a href="/terms" className="hover:text-[#4f463f]">
            Terms
          </a>
          <a href="/privacy" className="hover:text-[#4f463f]">
            Privacy
          </a>
          <a href="/refund-policy" className="hover:text-[#4f463f]">
            Refund Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
