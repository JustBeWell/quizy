import { useEffect, useState } from 'react'

export default function StatsPage(){
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/stats').then(r=>r.json()).then(d=>{ setStats(d); setLoading(false) }).catch(e=>{ console.error(e); setLoading(false) })
  },[])

  if(loading) return <div className="container"><p>Cargando estadísticas...</p></div>
  if(!stats) return <div className="container"><p>No hay datos disponibles.</p></div>

  return (
    <div className="container">
      <h2 className="text-2xl font-semibold mb-3">Estadísticas globales</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Intentos totales</div>
          <div className="text-2xl font-bold">{stats.totalAttempts}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Puntuación media</div>
          <div className="text-2xl font-bold">{stats.avgScore}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Mejor puntuación</div>
          <div className="text-2xl font-bold">{stats.bestScore}</div>
        </div>
      </div>

      <h3 className="text-lg font-medium mb-2">Por banco</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.perBank && stats.perBank.length ? stats.perBank.map(b=> (
          <div key={b.bank} className="p-3 bg-white rounded shadow">
            <div className="flex justify-between"><strong>{b.bank}</strong><span className="text-sm text-gray-500">Intentos: {b.attempts}</span></div>
            <div className="mt-2">Media: <strong>{b.avg}</strong> — Mejor: <strong>{b.best}</strong></div>
          </div>
        )) : <div>No hay datos por banco</div>}
      </div>
    </div>
  )
}
