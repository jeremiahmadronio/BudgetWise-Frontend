import { NavLink } from 'react-router-dom'
import { userNavItems, adminNavItems } from '../config/navItems'
interface MobileNavProps {
  menuType: 'admin' | 'user'
}
export function MobileNav({ menuType }: MobileNavProps) {
  const navItems = menuType === 'admin' ? adminNavItems : userNavItems
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-20">
      <div className="flex overflow-x-auto py-2 px-2 gap-2 scrollbar-hide items-center h-full">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({
              isActive,
            }) => `flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 h-full
              ${isActive ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            <item.icon size={22} />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}

        {/* Profile Item at the end */}
        <button className="flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 bg-gray-50 text-gray-600 hover:bg-gray-100 h-full">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Profile"
            className="w-6 h-6 rounded-full border border-gray-200"
          />
          <span className="text-sm">Profile</span>
        </button>
      </div>
    </nav>
  )
}
