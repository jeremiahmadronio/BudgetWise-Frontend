import { ChevronDown } from 'lucide-react'

export function Orders() {
 
  
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Track and manage customer orders.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 bg-white">
            <span>Last 30 Days</span>
            <ChevronDown size={16} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            Export
          </button>
        </div>
      </div>

      
    </div>
  )
}
