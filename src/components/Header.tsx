import { Bell } from 'lucide-react'
export function Header() {
  return (
    <>
      {/* Mobile Header - Always visible at top */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-lg text-gray-900">AdminPanel</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Profile"
            className="w-8 h-8 rounded-full border border-gray-200"
          />
        </div>
      </header>

      {/* Desktop Header - Hidden on mobile */}
      <header className="hidden md:flex fixed top-0 right-0 left-0 z-30 h-16 bg-white border-b border-gray-200 items-center justify-end px-8 transition-all duration-300">
        <button className="p-2 text-gray-400 hover:bg-gray-50 hover:text-teal-600 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </header>
    </>
  )
}
