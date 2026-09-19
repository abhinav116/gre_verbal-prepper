export default function SiteNav() {
  return (
    <div className="border-b border-gray-100 bg-[#faf9f6]/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-serif font-bold text-base">G</div>
          <span className="font-serif text-2xl font-bold tracking-tight text-gray-900">Greheads</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/articles" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            Archive
          </a>
          <a
            href="/#subscribe"
            className="inline-flex items-center gap-1 bg-gradient-to-b from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
          >
            Subscribe free →
          </a>
        </div>
      </div>
    </div>
  )
}
