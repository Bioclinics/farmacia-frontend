import React from 'react'

const Dashboard: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Ventas hoy</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Productos</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Entradas</div>
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
