export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} chinese-takeout.com
      </div>
    </footer>
  );
}
