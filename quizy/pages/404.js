import Link from 'next/link'

export default function Custom404() {
  return (
    <div className="container flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Quizy Logo" className="w-24 h-24 object-contain" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página no encontrada</h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
                <Link href="/levels">
          <a className="btn-primary">Volver al inicio</a>
        </Link>
      </div>
    </div>
  )
}
