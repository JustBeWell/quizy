import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { motion, useInView } from 'framer-motion'

// Hook personalizado para fade-in con scroll
function FadeInWhenVisible({ children, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Activar animaciones después del montaje
  useEffect(() => {
    // Pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const testimonials = [
    {
      name: "María G.",
      role: "Estudiante de Bachillerato",
      text: "Gracias a Quizy subí mi nota en Matemáticas de un 5 a un 8. ¡Es súper fácil de usar!",
      rating: 5
    },
    {
      name: "Carlos R.",
      role: "Preparando Selectividad",
      text: "Lo mejor es que puedo practicar desde el móvil en cualquier momento. El ranking me motiva a estudiar más.",
      rating: 5
    },
    {
      name: "Laura M.",
      role: "Estudiante de 4º ESO",
      text: "Antes odiaba estudiar, ahora es como un juego. Compito con mis amigos y todos hemos mejorado.",
      rating: 5
    },
    {
      name: "David P.",
      role: "Estudiante de Ingeniería",
      text: "Perfecta para repasar antes de los parciales. Me ayudó a aprobar Arquitectura de Computadores a la primera.",
      rating: 5
    },
    {
      name: "Ana S.",
      role: "Estudiante de Gestión de Software",
      text: "Las preguntas están muy bien hechas. Parece que las han sacado de exámenes reales. 100% recomendado.",
      rating: 5
    },
    {
      name: "Jorge M.",
      role: "Estudiante de Ingeniería Web",
      text: "Uso Quizy todos los días. Es adictivo y además aprendes. Ya llevo 3 exámenes aprobados este curso.",
      rating: 5
    },
    {
      name: "Patricia L.",
      role: "Estudiante Universitaria",
      text: "Me encanta que puedas practicar por niveles. Empiezas con lo fácil y vas subiendo. Muy motivador.",
      rating: 5
    }
  ]

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleEnter = () => {
    // Siempre redirigir a la página de autenticación desde la landing
    window.location.href = '/auth'
  }

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <Head>
        <title>Quizy - Aprende Más, Aprueba Más | Plataforma de Práctica de Exámenes</title>
        <meta name="description" content="Tu plataforma definitiva de práctica para exámenes. Más de 1000 preguntas verificadas, rankings competitivos y práctica ilimitada. Mejora tus notas estudiando de forma inteligente. ¡Únete gratis!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="practicar exámenes, tests online, preparar exámenes, estudiar online, plataforma educativa, preguntas de examen, aprobar exámenes, ranking estudiantes, quiz educativo, preparación selectividad" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://quizy.es/" />
        <meta property="og:title" content="Quizy - Aprende Más, Aprueba Más" />
        <meta property="og:description" content="Tu plataforma definitiva de práctica para exámenes. Más de 1000 preguntas verificadas y rankings competitivos. ¡Únete gratis!" />
        <meta property="og:image" content="https://quizy.es/logo.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://quizy.es/" />
        <meta property="twitter:title" content="Quizy - Aprende Más, Aprueba Más" />
        <meta property="twitter:description" content="Tu plataforma definitiva de práctica para exámenes. Más de 1000 preguntas verificadas. ¡Únete gratis!" />
        <meta property="twitter:image" content="https://quizy.es/logo.png" />
        
        <link rel="canonical" href="https://quizy.es/" />
      </Head>

      {/* Banner con imagen de aula escolar - SIN ESPACIOS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden w-full h-[500px] md:h-[600px] lg:h-[650px]"
        style={{ margin: 0, padding: 0, display: 'block' }}
      >
        {/* Imagen de fondo - Aula escolar */}
        <div className="absolute inset-0" style={{ margin: 0, padding: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1920&q=80"
            alt="Aula escolar"
            className="w-full h-full object-cover"
            style={{ margin: 0, padding: 0, display: 'block' }}
          />
          {/* Overlay semi-transparente para mejorar legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/75 via-brand-800/70 to-purple-900/75"></div>
        </div>

        {/* Texto sobre el banner */}
        <div className="relative h-full flex flex-col items-center justify-center px-8 z-10">
          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={mounted ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white text-center mb-6"
            style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
          >
            Aprende Más. Aprueba Más.
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={mounted ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="text-2xl md:text-3xl text-white text-center max-w-4xl font-semibold mb-4"
            style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
          >
            Tu plataforma de práctica definitiva
          </motion.p>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={mounted ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
            className="text-lg md:text-xl text-white/90 text-center max-w-3xl mb-8"
            style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}
          >
            Más de 1000 preguntas verificadas • Compite en rankings • Practica cuando quieras
          </motion.p>

          {/* CTA Button en el Hero */}
          <motion.button
            initial={{ y: 30, opacity: 0, scale: 0.8 }}
            animate={mounted ? { y: 0, opacity: 1, scale: 1 } : { y: 30, opacity: 0, scale: 0.8 }}
            transition={{ duration: 1, delay: 1.1, type: 'spring', stiffness: 100, damping: 15 }}
            whileHover={{ scale: 1.08, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnter}
            className="group relative px-12 py-5 bg-white text-brand-700 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Button content */}
            <span className="relative flex items-center gap-3">
              <span>🚀 Empezar Ahora Gratis</span>
              <motion.svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </motion.svg>
            </span>
          </motion.button>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sin tarjeta de crédito
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              100% Gratis
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Registro en 30 segundos
            </span>
          </motion.div>
        </div>
      </motion.div>

        {/* Contenido Principal con Fondo */}
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <main className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <FadeInWhenVisible delay={0.1}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mb-16"
            >
              {/* Logo Circular de Quizy - SIN BORDES */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.5, type: 'spring', stiffness: 150 }}
                className="inline-block mb-8"
              >
                <div className="relative">
                  {/* Logo cuadrado limpio */}
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform bg-white dark:bg-gray-800">
                    <img 
                      src="/logo.png" 
                      alt="Quizy Logo" 
                      className="w-full h-full object-contain p-4"
                    />
                  </div>
                  {/* Glow effect cuadrado suave */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-blue-400 rounded-2xl blur-3xl opacity-20 -z-10" />
                </div>
              </motion.div>

              {/* Nombre de la marca */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mb-8"
              >
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-2">
                  Quizy
                </h1>
                <p className="text-lg md:text-xl text-brand-600 dark:text-brand-400 font-semibold">
                  Tu compañero de estudio perfecto
                </p>
              </motion.div>

              {/* Título Principal */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight"
              >
                Domina tus
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">
                  Exámenes y Aprueba
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
              >
                La forma más divertida y efectiva de preparar tus exámenes. Miles de preguntas reales para practicar cuando quieras, donde quieras.
              </motion.p>
            </motion.div>
            </FadeInWhenVisible>

            {/* Animated Banner with Educational Visual */}
            <FadeInWhenVisible delay={0.2}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-20 relative overflow-hidden rounded-3xl shadow-2xl"
            >
              <div className="relative h-[300px] md:h-[400px] bg-gradient-to-br from-blue-500 via-brand-600 to-purple-600">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <motion.div
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '60px 60px',
                    }}
                  />
                </div>

                {/* Content Overlay */}
                <div className="relative h-full flex items-center justify-between px-8 md:px-16">
                  <div className="flex-1 text-white z-10">
                    <motion.h2
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="text-3xl md:text-5xl font-extrabold mb-4"
                    >
                      📚 Más de 1000 Preguntas
                    </motion.h2>
                    <motion.p
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                      className="text-lg md:text-xl opacity-90 max-w-xl"
                    >
                      Actualizadas y verificadas por profesores. Practica con preguntas reales de examen.
                    </motion.p>
                  </div>

                  {/* Animated Icons */}
                  <div className="hidden md:block relative w-64 h-64">
                    {[
                      { emoji: '🎯', delay: 0.8, x: 20, y: 20 },
                      { emoji: '📖', delay: 1.0, x: 120, y: 40 },
                      { emoji: '🏆', delay: 1.2, x: 60, y: 120 },
                      { emoji: '⭐', delay: 1.4, x: 160, y: 140 },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: item.delay,
                          type: 'spring',
                          stiffness: 200,
                        }}
                        className="absolute text-5xl"
                        style={{ left: item.x, top: item.y }}
                      >
                        <motion.div
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: item.delay,
                          }}
                        >
                          {item.emoji}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Floating Shapes */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                  className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
                />
                <motion.div
                  animate={{
                    y: [0, 20, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                  }}
                  className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
                />
              </div>
            </motion.div>
            </FadeInWhenVisible>

            {/* How it Works Section */}
            <FadeInWhenVisible delay={0}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
                Así de fácil es usar Quizy
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: '1', emoji: '📝', title: 'Regístrate', desc: 'Crea tu cuenta en 30 segundos' },
                  { step: '2', emoji: '📚', title: 'Elige tu asignatura', desc: 'Selecciona la materia que quieres practicar' },
                  { step: '3', emoji: '🎯', title: 'Haz el test', desc: 'Responde las preguntas a tu ritmo' },
                  { step: '4', emoji: '🎉', title: '¡Aprueba!', desc: 'Mejora tus notas practicando' }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="relative mb-4">
                      <div className="w-16 h-16 mx-auto bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xl">
                        {step.step}
                      </div>
                      <div className="absolute -top-2 -right-2 text-4xl">{step.emoji}</div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            </FadeInWhenVisible>

            {/* Features Grid */}
            <FadeInWhenVisible delay={0}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="grid md:grid-cols-3 gap-8 mb-16"
            >
              {[
                {
                  icon: '📚',
                  title: 'Todas tus Asignaturas',
                  description: 'Encuentra preguntas de todas tus materias en un solo lugar'
                },
                {
                  icon: '🎯',
                  title: 'Practica a tu Ritmo',
                  description: 'Sin prisas, sin estrés. Haz tests cuando quieras y repite hasta que domines cada tema'
                },
                {
                  icon: '🏆',
                  title: 'Compite con tus Compañeros',
                  description: '¿Quién es el mejor? Sube al ranking y demuestra que eres el que más sabe'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
            </FadeInWhenVisible>

            {/* Ranking Competition Section */}
            <FadeInWhenVisible delay={0}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.3 }}
              className="mb-16 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-12 border-2 border-yellow-200 dark:border-yellow-700"
            >
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Compite y Sé el Mejor
                </h2>
                <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                  Cada punto cuenta. Practica más, sube en el ranking y demuéstrales a todos quién sabe más
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* Podium Visual */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.5 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg transform md:translate-y-6"
                >
                  <div className="text-5xl mb-3">🥈</div>
                  <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-2">2º</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Segundo lugar</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.6 }}
                  className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-8 text-center shadow-2xl"
                >
                  <div className="text-6xl mb-3">👑</div>
                  <div className="text-3xl font-bold text-white mb-2">1º</div>
                  <p className="text-sm text-yellow-100 font-semibold">¡Puedes ser tú!</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.7 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg transform md:translate-y-12"
                >
                  <div className="text-5xl mb-3">🥉</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">3º</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tercer lugar</p>
                </motion.div>
              </div>

              <div className="text-center mt-8">
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  💡 Cuanto más practicas, más puntos ganas y más alto llegas
                </p>
              </div>
            </motion.div>
            </FadeInWhenVisible>

            {/* CTA Section - Segunda llamada a la acción */}
            <FadeInWhenVisible delay={0}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.8 }}
              className="relative bg-gradient-to-br from-purple-600 via-brand-600 to-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl mb-16 overflow-hidden"
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                  }}
                  className="absolute -top-1/2 -left-1/2 w-full h-full bg-white rounded-full blur-3xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                  }}
                  className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white rounded-full blur-3xl"
                />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="text-6xl mb-6"
                >
                  🎓
                </motion.div>
                
                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                  Miles de estudiantes ya están mejorando sus notas
                </h2>
                <p className="text-xl md:text-2xl mb-4 opacity-90 max-w-3xl mx-auto">
                  ¿A qué esperas? Tu próximo sobresaliente comienza aquí
                </p>
                <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
                  Únete a la comunidad y descubre por qué Quizy es la plataforma favorita de los estudiantes
                </p>
                
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnter}
                    className="group px-12 py-5 bg-white text-brand-700 rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Crear mi cuenta gratis
                      <motion.svg 
                        className="w-6 h-6"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </motion.svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                </div>

                {/* Feature pills */}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {['✨ Sin publicidad', '📱 Móvil y PC', '⚡ Resultados al instante', '🏆 Rankings semanales'].map((feature, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.9 + index * 0.1 }}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
                    >
                      {feature}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
            </FadeInWhenVisible>

            {/* Testimonials Carousel */}
            <FadeInWhenVisible delay={0}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.8 }}
              className="mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
                Lo que dicen nuestros estudiantes
              </h2>

              <div className="relative max-w-4xl mx-auto">
                {/* Carousel Container */}
                <div className="overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl">
                  <div className="relative h-[300px] md:h-[250px]">
                    {testimonials.map((testimonial, index) => (
                      <motion.div
                        key={index}
                        initial={false}
                        animate={{
                          x: `${(index - currentTestimonial) * 100}%`,
                          opacity: index === currentTestimonial ? 1 : 0.3,
                          scale: index === currentTestimonial ? 1 : 0.8,
                        }}
                        transition={{
                          duration: 0.5,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12"
                      >
                        {/* Stars */}
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <span key={i} className="text-yellow-400 text-2xl">⭐</span>
                          ))}
                        </div>

                        {/* Quote */}
                        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 text-center mb-6 italic font-light max-w-2xl">
                          "{testimonial.text}"
                        </p>

                        {/* Author */}
                        <div className="text-center">
                          <p className="font-bold text-gray-900 dark:text-white text-lg">
                            {testimonial.name}
                          </p>
                          <p className="text-brand-600 dark:text-brand-400 text-sm">
                            {testimonial.role}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial
                          ? 'bg-brand-600 w-8'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-brand-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-brand-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-brand-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
            </FadeInWhenVisible>

            {/* Social Proof Section with Animated Counters */}
            <FadeInWhenVisible delay={0}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 2.0 }}
              className="mt-16 text-center"
            >
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {[
                  { number: '1000+', label: 'Preguntas Disponibles', icon: '📝', color: 'from-blue-500 to-brand-600' },
                  { number: '15+', label: 'Asignaturas Cubiertas', icon: '📚', color: 'from-purple-500 to-pink-600' },
                  { number: '100%', label: 'Gratis Siempre', icon: '🎁', color: 'from-green-500 to-emerald-600' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 2.1 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                  >
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    {/* Icon */}
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.3,
                      }}
                      className="text-5xl mb-3"
                    >
                      {stat.icon}
                    </motion.div>

                    {/* Number */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: 2.2 + index * 0.1,
                        type: 'spring',
                        stiffness: 200,
                      }}
                      className={`text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                    >
                      {stat.number}
                    </motion.div>

                    {/* Label */}
                    <div className="text-gray-600 dark:text-gray-300 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            </FadeInWhenVisible>
          </div>
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.9 }}
          className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-16"
        >
          <p className="mb-2">© 2025 Quizy. Tu compañero de estudio perfecto.</p>
          <p className="text-sm">Hecho con ❤️ para estudiantes que quieren aprobar</p>
        </motion.footer>
        </div>
    </div>
  )
}
