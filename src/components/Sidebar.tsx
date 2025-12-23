import { NavLink } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { userNavItems, adminNavItems } from '../config/navItems'
interface SidebarProps {
  isExpanded: boolean
  toggleSidebar: () => void
  menuType: 'admin' | 'user'
}

export function Sidebar({ isExpanded, toggleSidebar, menuType }: SidebarProps) {
  const navItems = menuType === 'admin' ? adminNavItems : userNavItems;
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-200 text-gray-900 transition-all duration-300 z-40 flex-col ${isExpanded ? 'w-64' : 'w-20'}`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-gray-100">
          <div
            className={`flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}
          >
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-teal-900">
              AdminPanel
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({
                isActive,
              }) => `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group whitespace-nowrap
                ${isActive ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <item.icon
                size={22}
                className={`min-w-[22px] transition-colors duration-200 ${isExpanded ? '' : 'mx-auto'}`}
              />
              <span
                className={`ml-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100">
          <div
            className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}
          >
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User"
              className="w-9 h-9 rounded-full border border-gray-200 flex-shrink-0"
            />
            <div
              className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                Alex Morgan
              </p>
              <p className="text-xs text-gray-500 truncate">alex@example.com</p>
            </div>
            {isExpanded && (
              <button className="p-2 text-gray-400 hover:bg-gray-50 hover:text-red-500 rounded-full transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar (Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16 flex items-center">
        <div className="flex overflow-x-auto py-2 px-2 gap-1 scrollbar-hide items-center w-full h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 h-full
                ${isActive ? 'bg-teal-50 text-teal-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`
              }
            >
              <item.icon size={18} />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
          {/* Profile Item at the end */}
          
        </div>
      </nav>
    </>
  );
}
