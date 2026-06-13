export function Footer() {
  return (
    <footer className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-gray-400">
        <p>© {new Date().getFullYear()} SkyFreight Airlines. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="/api/v1/swagger-ui.html" target="_blank" rel="noreferrer"
             className="hover:text-brand-600 transition-colors">
            API Docs
          </a>
          <span className="text-gray-300">·</span>
          <span>Cargo Portal v1.0</span>
        </div>
      </div>
    </footer>
  )
}
