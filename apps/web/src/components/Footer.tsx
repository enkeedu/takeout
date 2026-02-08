export function Footer() {
  return (
    <footer className="border-t border-[#ddd3c6] bg-[#f7f1e7]">
      <div className="mx-auto flex max-w-[1720px] flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-[#6d6255] md:flex-row md:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} chinese-takeout.com</p>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.16em]">
          <span>Built for Chinese restaurants</span>
          <span className="text-[#a49684]">Web + AI + Ordering</span>
        </div>
      </div>
    </footer>
  );
}
