import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { UserSidebar } from '../components/UserSidebar'
import { Header } from '../components/Header'
export function MainLayout() {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased overflow-x-hidden">
      <UserSidebar isExpanded={isExpanded} toggleSidebar={() => setIsExpanded(!isExpanded)} />

      <Header />

      <main
        className={`transition-all duration-300 h-[calc(100vh-64px)] overflow-y-auto md:h-screen ${isExpanded ? 'md:ml-64' : 'md:ml-20'} pt-16 md:pt-16`}
      >
        <div className="p-4 md:p-8 w-full">
          <Outlet />
        </div>
      </main>
      {/* UserSidebar handles mobile nav as well */}
    </div>
  );
}

 