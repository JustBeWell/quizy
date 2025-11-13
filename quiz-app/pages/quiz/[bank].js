import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { getToken } from '../../lib/auth-client'

function shuffleArray(arr){
  const a = arr.slice()
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1))
    const tmp = a[i]; a[i]=a[j]; a[j]=tmp
  }
  return a
}

export default function QuizBank(){
  const router = useRouter()
  const { bank, subject } = router.query
  const [data, setData] = useState(null)
  const [shuffled, setShuffled] = useState([])
  const [pos, setPos] = useState(0) // position in shuffled array
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState({})
  const [checkedMap, setCheckedMap] = useState({})
  const [pendingSaved, setPendingSaved] = useState(null)
  const [offerResume, setOfferResume] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [pendingRoute, setPendingRoute] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewShuffled, setPreviewShuffled] = useState([])
  const [previewPos, setPreviewPos] = useState(0)
  // keyboard shortcut helper state
  const keyHandlerRef = useRef(null)
  const [correctFlash, setCorrectFlash] = useState(false)
  const [checkResults, setCheckResults] = useState({})
  const [incorrectFlash, setIncorrectFlash] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const mounted = useRef(false)
  const correctTimerRef = useRef(null)
  const incorrectTimerRef = useRef(null)
  const allowNavigationRef = useRef(false)
  
  // Estados para favoritos
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  // load bank
  useEffect(()=>{
    if(!bank) return
    const url = subject ? `/api/bank/${bank}?subject=${encodeURIComponent(subject)}` : `/api/bank/${bank}`
    fetch(url).then(async r=>{
      if(!r.ok){
        const err = await r.json().catch(()=>({message:'unknown'}))
        console.error('bank load error', err)
        setData({name:bank,questions:[]})
        return
      }
      return r.json()
    }).then(d=>{
      if(!d) return
      setData(d)
      if(Array.isArray(d.questions) && d.questions.length>0){
        const idxs = d.questions.map((_,i)=>i)
        const s = shuffleArray(idxs)
        setShuffled(s)
        setPos(0)
      }else{
        setShuffled([])
      }

      // load saved state but don't apply it immediately — offer resume/discard choices
      try{
        console.log('🔍 Cargando estado guardado para bank:', bank)
        const savedA = JSON.parse(localStorage.getItem(`quiz_${bank}_answers`)||'{}')
        const savedF = JSON.parse(localStorage.getItem(`quiz_${bank}_flags`)||'{}')
        const savedC = JSON.parse(localStorage.getItem(`quiz_${bank}_checked`)||'{}')
        const savedTraw = localStorage.getItem(`quiz_${bank}_time`)
        const savedT = savedTraw !== null ? Number(savedTraw) : NaN
        const isCompleted = localStorage.getItem(`quiz_${bank}_completed`) === 'true'
        const defaultTime = d.questions.length * 2 * 60 // 2 minutos por pregunta
        
        console.log('📊 Estado guardado:', {
          answers: Object.keys(savedA).length,
          flags: Object.keys(savedF).length,
          checked: Object.keys(savedC).length,
          time: savedT,
          completed: isCompleted
        })
        
        // IMPORTANTE: Solo considerar "tiene guardado" si hay respuestas, flags o checked guardados
        // El tiempo solo NO cuenta como progreso guardado
        const hasSaved = (savedA && Object.keys(savedA).length>0) || (savedF && Object.keys(savedF).length>0) || (savedC && Object.keys(savedC).length>0)
        
        // Si el intento ya está completado, descartarlo automáticamente
        if(isCompleted && hasSaved){
          console.log('Quiz already completed, discarding saved state')
          localStorage.removeItem(`quiz_${bank}_answers`)
          localStorage.removeItem(`quiz_${bank}_flags`)
          localStorage.removeItem(`quiz_${bank}_checked`)
          localStorage.removeItem(`quiz_${bank}_time`)
          localStorage.removeItem(`quiz_${bank}_completed`)
          setTimeLeft(defaultTime)
        } else if(hasSaved){
          // keep pending and ask the user whether to resume
          console.log('✅ Tiene progreso guardado, mostrando modal de reanudar')
          setPendingSaved({answers: savedA||{}, flags: savedF||{}, checked: savedC||{}, time: (!isNaN(savedT) && savedT>0)? savedT : null})
          setOfferResume(true)
        }else{
          // no saved state — use defaults
          console.log('ℹ️ No hay progreso guardado, iniciando nuevo')
          if(!isNaN(savedT) && savedT>0) setTimeLeft(savedT)
          else setTimeLeft(defaultTime)
        }
      }catch(e){ 
        console.error('Error cargando estado:', e)
        setTimeLeft(d.questions.length * 2 * 60) 
      }
    }).catch(e=>{ console.error(e); setData({name:bank,questions:[]}) })
  },[bank])

  // Cargar si está en favoritos
  useEffect(() => {
    if (!bank || !subject) return
    
    const loadFavoriteStatus = async () => {
      try {
        const token = getToken()
        if (!token) {
          console.log('No hay token para cargar favoritos')
          return
        }
        
        const response = await fetch('/api/favorites', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.status === 401) {
          console.log('Token inválido al cargar favoritos')
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          const favorite = data.favorites.find(f => f.bank_id === bank)
          setIsFavorite(!!favorite)
        }
      } catch (error) {
        console.error('Error loading favorite status:', error)
      }
    }
    
    loadFavoriteStatus()
  }, [bank, subject])

  useEffect(()=>{ mounted.current=true; return ()=>mounted.current=false },[])

  // Compute these BEFORE early returns to avoid conditional hook execution
  const qIdx = (shuffled && shuffled.length>0) ? shuffled[pos] : undefined
  const q = (qIdx!==undefined && data && data.questions && data.questions[qIdx]) ? data.questions[qIdx] : null

  // Global keyboard shortcuts refs - MUST be declared before any early returns
  const offerResumeRef = useRef(offerResume)
  const showPreviewRef = useRef(showPreview)
  const showFinishConfirmRef = useRef(showFinishConfirm)
  const previewPosRef = useRef(previewPos)
  const previewShuffledRef = useRef(previewShuffled)
  const qRef = useRef(q)
  const answersRef = useRef(answers)
  const posRef = useRef(pos)
  const shuffledRef = useRef(shuffled)

  // keep refs in sync with state - MUST be before any early returns
  useEffect(()=>{ offerResumeRef.current = offerResume },[offerResume])
  useEffect(()=>{ showPreviewRef.current = showPreview },[showPreview])
  useEffect(()=>{ showFinishConfirmRef.current = showFinishConfirm },[showFinishConfirm])
  useEffect(()=>{ previewPosRef.current = previewPos },[previewPos])
  useEffect(()=>{ previewShuffledRef.current = previewShuffled },[previewShuffled])
  useEffect(()=>{ qRef.current = q },[q])
  useEffect(()=>{ answersRef.current = answers },[answers])
  useEffect(()=>{ posRef.current = pos },[pos])
  useEffect(()=>{ shuffledRef.current = shuffled },[shuffled])

  // Keyboard handler - MUST be before any early returns
  useEffect(()=>{
    function isTypingTarget(e){
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : ''
      if(tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return true
      return false
    }

    function handleKey(e){
      if(isTypingTarget(e)) return
      const k = e.key.toLowerCase()

      // Preview modal shortcuts
      if(showPreviewRef.current){
        if(k === 'arrowright' || k === 'right') { 
          e.preventDefault()
          const pPos = previewPosRef.current
          const pShuf = previewShuffledRef.current
          if(pPos < pShuf.length-1) setPreviewPos(p=>p+1)
          return 
        }
        if(k === 'arrowleft' || k === 'left') { 
          e.preventDefault()
          const pPos = previewPosRef.current
          if(pPos>0) setPreviewPos(p=>p-1)
          return 
        }
        if(k === 'escape' || k === 'q') { setShowPreview(false); return }
        return
      }

      // Resume modal shortcuts
      if(offerResumeRef.current){
        if(k === 'd') { 
          // inline discardSavedAndStartFresh logic
          try{ localStorage.removeItem(`quiz_${bank}_answers`) }catch(e){}
          try{ localStorage.removeItem(`quiz_${bank}_flags`) }catch(e){}
          try{ localStorage.removeItem(`quiz_${bank}_checked`) }catch(e){}
          try{ localStorage.removeItem(`quiz_${bank}_time`) }catch(e){}
          try{ localStorage.removeItem(`quiz_${bank}_completed`) }catch(e){}
          setAnswers({}); setFlags({}); setCheckedMap({}); setTimeLeft(data.questions.length * 2 * 60)
          setOfferResume(false); setPendingSaved(null)
          return 
        }
        if(k === 'v') { 
          // inline openPreview logic
          const copy = Array.isArray(shuffledRef.current) && shuffledRef.current.length>0 ? shuffledRef.current.slice() : (Array.isArray(data?.questions) ? data.questions.map((_,i)=>i) : [])
          setPreviewShuffled(copy)
          setPreviewPos(0)
          setOfferResume(false)
          setShowPreview(true)
          return 
        }
        if(k === 'c') { 
          // inline continueFromSaved logic
          if(pendingSaved) {
            const {answers: sa, flags: sf, checked: sc, time: st} = pendingSaved
            setAnswers(sa||{})
            setFlags(sf||{})
            setCheckedMap(sc||{})
            if(st!==null && st!==undefined) setTimeLeft(st)
            else setTimeLeft(data.questions.length * 2 * 60)
          }
          setOfferResume(false); setPendingSaved(null)
          return 
        }
        if(k === 'escape') { setOfferResume(false); return }
        return
      }

      // Finish confirm shortcuts
      if(showFinishConfirmRef.current){
        if(k === 'enter' || k === 'y') { 
          // inline finishExam logic
          try{ localStorage.setItem(`quiz_${bank}_answers`, JSON.stringify(answersRef.current)) }catch(e){}
          try{ localStorage.setItem(`quiz_${bank}_flags`, JSON.stringify(flags)) }catch(e){}
          try{ localStorage.setItem(`quiz_${bank}_checked`, JSON.stringify(checkedMap)) }catch(e){}
          try{ if(timeLeft!==null) localStorage.setItem(`quiz_${bank}_time`, String(timeLeft)) }catch(e){}
          try{ localStorage.setItem(`quiz_${bank}_completed`, 'true') }catch(e){}
          router.push(`/results?bank=${bank}`)
          return 
        }
        if(k === 'escape' || k === 'n') { setShowFinishConfirm(false); return }
        return
      }

      // Default page shortcuts
      if(k === 'arrowright' || k === 'right') { 
        e.preventDefault()
        const p = posRef.current
        const s = shuffledRef.current
        if(p < s.length-1) setPos(p=>p+1)
        else router.push(`/results?bank=${bank}`)
        return 
      }
      if(k === 'arrowleft' || k === 'left') { 
        e.preventDefault()
        const p = posRef.current
        if(p>0) setPos(p=>p-1)
        return 
      }
      if(k === 'c') { 
        e.preventDefault()
        const currentQ = qRef.current
        if(currentQ){ 
          const ua = answersRef.current[currentQ.id]
          if(isAnswered(ua)) {
            // inline checkAnswer logic
            const ok = isCorrectFor(currentQ, ua)
            setCheckResults(cr=>{ const nxt = {...cr, [currentQ.id]: ok}; return nxt })
            if(ok){
              setCorrectFlash(true)
              if(correctTimerRef.current) clearTimeout(correctTimerRef.current)
              correctTimerRef.current = setTimeout(()=>setCorrectFlash(false), 900)
            }else{
              setIncorrectFlash(true)
              if(incorrectTimerRef.current) clearTimeout(incorrectTimerRef.current)
              incorrectTimerRef.current = setTimeout(()=>setIncorrectFlash(false), 900)
            }
            setCheckedMap(cm=>{ const nxt = {...cm, [currentQ.id]: ok}; saveChecked(nxt); return nxt })
            setTimeout(()=>{
              setCheckResults(cr=>{ const nxt = {...cr}; delete nxt[currentQ.id]; return nxt })
            }, 2200)
          }
        }
        return 
      }
      if(k === 'm') { 
        e.preventDefault()
        const currentQ = qRef.current
        if(currentQ) setFlags(f=>{ const nxt = {...f, [currentQ.id]: !f[currentQ.id]}; saveFlags(nxt); return nxt })
        return 
      }
      if(k === 'n') {
        e.preventDefault()
        const currentQ = qRef.current
        if(currentQ && !checkedMap[currentQ.id]){
          // inline markNoAnswer logic
          setAnswers(a=>{ const nxt = {...a, [currentQ.id]: null}; saveAnswers(nxt); return nxt })
          setCheckedMap(cm=>{ const nxt = {...cm, [currentQ.id]: false}; saveChecked(nxt); return nxt })
          setCheckResults(cr=>{ const nxt = {...cr, [currentQ.id]: false}; return nxt })
          setIncorrectFlash(true)
          if(incorrectTimerRef.current) clearTimeout(incorrectTimerRef.current)
          incorrectTimerRef.current = setTimeout(()=>setIncorrectFlash(false), 900)
          setTimeout(()=>{
            setCheckResults(cr=>{ const nxt = {...cr}; delete nxt[currentQ.id]; return nxt })
          },2200)
          setTimeout(()=>{
            const currentPos = posRef.current
            if(currentPos < (shuffledRef.current?.length||0) - 1){
              setPos(p=>p+1)
            }else{
              setShowFinishConfirm(true)
            }
          }, 700)
        }
        return
      }
      if(k === 'f') { e.preventDefault(); setShowFinishConfirm(true); return }
      if(k === 'p') { 
        e.preventDefault()
        // inline openPreview logic
        const copy = Array.isArray(shuffledRef.current) && shuffledRef.current.length>0 ? shuffledRef.current.slice() : (Array.isArray(data?.questions) ? data.questions.map((_,i)=>i) : [])
        setPreviewShuffled(copy)
        setPreviewPos(0)
        setOfferResume(false)
        setShowPreview(true)
        return 
      }
    }

    window.addEventListener('keydown', handleKey)
    return ()=> window.removeEventListener('keydown', handleKey)
  },[])

  // Prevent navigation when quiz is in progress
  useEffect(() => {
    // Warn user when trying to leave page (refresh, close tab, etc)
    const handleBeforeUnload = (e) => {
      if (!allowNavigationRef.current && data && answers && Object.keys(answers).length > 0) {
        e.preventDefault()
        e.returnValue = '¿Estás seguro de que quieres salir? Tu progreso se guardará automáticamente para que puedas continuar después.'
        return e.returnValue
      }
    }

    // Intercept internal navigation (clicking links, back button, etc)
    const handleRouteChange = (url) => {
      // Don't block if we're allowing navigation or going to results
      if (allowNavigationRef.current || url.includes('/results')) {
        return
      }

      // Don't block if no progress has been made
      if (!data || !answers || Object.keys(answers).length === 0) {
        return
      }

      // Show confirmation modal and block navigation
      setPendingRoute(url)
      setShowExitConfirm(true)
      router.events.emit('routeChangeError')
      throw 'Navigation cancelled by user'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    router.events.on('routeChangeStart', handleRouteChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [data, answers, router])

  // timer
  useEffect(()=>{
    if(timeLeft===null) return
    if(timeLeft<=0){
      router.push(`/results?bank=${bank}`)
      return
    }
    const t = setTimeout(()=>{
      setTimeLeft(s=>{
        const next = s-1
        try{ localStorage.setItem(`quiz_${bank}_time`, String(next)) }catch(e){}
        return next
      })
    },1000)
    return ()=>clearTimeout(t)
  },[timeLeft,bank,router])

  // NOW we can do early returns - all hooks are declared above
  if(!data) return <div className="container"><p>Cargando...</p></div>
  if(!Array.isArray(data.questions) || data.questions.length===0) return <div className="container"><p>No hay preguntas en este banco.</p></div>

  // Calculate default time: 2 minutes per question
  const defaultTime = data.questions.length * 2 * 60

  // Helper functions that MUST be defined before use in handlers
  function saveAnswers(next){ try{ localStorage.setItem(`quiz_${bank}_answers`, JSON.stringify(next)) }catch(e){} }
  function saveFlags(next){ try{ localStorage.setItem(`quiz_${bank}_flags`, JSON.stringify(next)) }catch(e){} }
  function saveChecked(next){ try{ localStorage.setItem(`quiz_${bank}_checked`, JSON.stringify(next)) }catch(e){} }

  // helper used by keyboard handler to check if a userAnswer value counts as answered
  function isAnswered(userAnswer){
    if(userAnswer === undefined || userAnswer === null) return false
    if(Array.isArray(userAnswer)) return userAnswer.length>0
    return String(userAnswer).trim().length>0
  }

  function isCorrectFor(qobj, userAnswer){
    if(!qobj) return false
    const correct = Array.isArray(qobj.answers)? qobj.answers.map(String) : []
    // text answer (no options)
    if(!qobj.options || qobj.options.length===0){
      if(!userAnswer) return false
      const ua = String(userAnswer||'').trim().toLowerCase()
      return correct.some(c=>String(c||'').trim().toLowerCase()===ua)
    }
    // options exist
    if(correct.length>1){
      const ua = Array.isArray(userAnswer)? userAnswer.map(String): []
      const setA = new Set(ua)
      const setC = new Set(correct)
      if(setA.size!==setC.size) return false
      for(const v of setC) if(!setA.has(v)) return false
      return true
    }
    // single choice
    return String(userAnswer) === String(correct[0])
  }

  function selectOption(k){
    if(!q) return
    const correctAnswers = Array.isArray(q.answers)? q.answers.map(String): []
    const isMulti = Array.isArray(correctAnswers) && correctAnswers.length>1 && Array.isArray(q.options) && q.options.length>0
    // compute new user answer synchronously so we can trigger animation
    const current = answers[q.id]
    let userAnswer
    if(isMulti){
      const set = new Set(Array.isArray(current)? current : [])
      if(set.has(k)) set.delete(k)
      else set.add(k)
      userAnswer = Array.from(set)
    }else{
      userAnswer = k
    }
    setAnswers(a=>{ const nxt = {...a, [q.id]: userAnswer}; saveAnswers(nxt); return nxt })
  }


  function toggleFlag(){ if(!q) return; setFlags(f=>{ const nxt = {...f, [q.id]: !f[q.id]}; saveFlags(nxt); return nxt }) }

  function setTextAnswer(text){ if(!q) return; setAnswers(a=>{ const nxt={...a, [q.id]: String(text)}; saveAnswers(nxt); return nxt }) }

  // removed revealSolution: test flow is conventional (no revealing during test)

  // Check current user's answer for the active question (without revealing the solution)
  function checkAnswer(){
    if(!q) return
    const ua = answers[q.id]
    const ok = isCorrectFor(q, ua)
    setCheckResults(cr=>{ const nxt = {...cr, [q.id]: ok}; return nxt })

    if(ok){
      setCorrectFlash(true)
      if(correctTimerRef.current) clearTimeout(correctTimerRef.current)
      correctTimerRef.current = setTimeout(()=>setCorrectFlash(false), 900)
    }else{
      setIncorrectFlash(true)
      if(incorrectTimerRef.current) clearTimeout(incorrectTimerRef.current)
      incorrectTimerRef.current = setTimeout(()=>setIncorrectFlash(false), 900)
    }

    // persist the checked result (counts as an attempt for this question)
    setCheckedMap(cm=>{ const nxt = {...cm, [q.id]: ok}; saveChecked(nxt); return nxt })
    // auto-clear the textual check feedback after a short delay
    setTimeout(()=>{
      setCheckResults(cr=>{ const nxt = {...cr}; delete nxt[q.id]; return nxt })
    }, 2200)

    // after showing short feedback, auto-advance to next question or show finish modal
    setTimeout(()=>{
      const currentPos = posRef.current
      if(currentPos < (shuffledRef.current?.length||0) - 1){
        setPos(p=>p+1)
      }else{
        // last question -> confirm finish
        setShowFinishConfirm(true)
      }
    }, 700)
  }

  // Mark current question as 'no responder' (count as incorrect) and reveal solution
  function markNoAnswer(){
    if(!q) return
    // record as no answer (null) and mark as incorrect
    setAnswers(a=>{ const nxt = {...a, [q.id]: null}; saveAnswers(nxt); return nxt })
    setCheckedMap(cm=>{ const nxt = {...cm, [q.id]: false}; saveChecked(nxt); return nxt })
    // show transient 'Incorrecto' feedback similar to checkAnswer
    setCheckResults(cr=>{ const nxt = {...cr, [q.id]: false}; return nxt })
    setIncorrectFlash(true)
    if(incorrectTimerRef.current) clearTimeout(incorrectTimerRef.current)
    incorrectTimerRef.current = setTimeout(()=>setIncorrectFlash(false), 900)
    setTimeout(()=>{
      setCheckResults(cr=>{ const nxt = {...cr}; delete nxt[q.id]; return nxt })
    },2200)

    // auto-advance after marking no answer
    setTimeout(()=>{
      const currentPos = posRef.current
      if(currentPos < (shuffledRef.current?.length||0) - 1){
        setPos(p=>p+1)
      }else{
        setShowFinishConfirm(true)
      }
    }, 700)
  }

  function hasAnsweredQuestion(qobj){
    if(!qobj) return false
    const ua = answers[qobj.id]
    if(ua === undefined || ua === null) return false
    if(Array.isArray(ua)) return ua.length>0
    return String(ua).trim().length>0
  }

  function next(){
    // when navigating forward, if current question wasn't finalized, finalize it
    if(q){
      setCheckedMap(cm=>{
        if(cm.hasOwnProperty(q.id)) return cm
        const ok = isCorrectFor(q, answers[q.id])
        const nxt = {...cm, [q.id]: ok}
        saveChecked(nxt)
        return nxt
      })
    }
    if(pos < shuffled.length-1) setPos(p=>p+1)
    else {
      // Mark quiz as completed when finishing
      try{ localStorage.setItem(`quiz_${bank}_completed`, 'true') }catch(e){}
      // Allow navigation to results
      allowNavigationRef.current = true
      const url = subject ? `/results?bank=${bank}&subject=${encodeURIComponent(subject)}` : `/results?bank=${bank}`
      router.push(url)
    }
  }
  function prev(){ if(pos>0) setPos(p=>p-1) }

  function finishExam(){
    // ensure current progress is saved then go to results
    // finalize any unanswered questions so results show correct/incorrect coloring
    try{
      const allChecked = {...checkedMap}
      for(const qq of data.questions){
        if(!allChecked.hasOwnProperty(qq.id)){
          allChecked[qq.id] = isCorrectFor(qq, answers[qq.id])
        }
      }
      try{ localStorage.setItem(`quiz_${bank}_checked`, JSON.stringify(allChecked)) }catch(e){}
    }catch(e){}
    try{ localStorage.setItem(`quiz_${bank}_answers`, JSON.stringify(answers)) }catch(e){}
    try{ localStorage.setItem(`quiz_${bank}_flags`, JSON.stringify(flags)) }catch(e){}
    try{ if(timeLeft!==null) localStorage.setItem(`quiz_${bank}_time`, String(timeLeft)) }catch(e){}
    // Mark quiz as completed
    try{ localStorage.setItem(`quiz_${bank}_completed`, 'true') }catch(e){}
    // Allow navigation to results
    allowNavigationRef.current = true
    const url = subject ? `/results?bank=${bank}&subject=${encodeURIComponent(subject)}` : `/results?bank=${bank}`
    router.push(url)
  }

  function discardSavedAndStartFresh(){
    try{ localStorage.removeItem(`quiz_${bank}_answers`) }catch(e){}
    try{ localStorage.removeItem(`quiz_${bank}_flags`) }catch(e){}
    try{ localStorage.removeItem(`quiz_${bank}_checked`) }catch(e){}
    try{ localStorage.removeItem(`quiz_${bank}_time`) }catch(e){}
    try{ localStorage.removeItem(`quiz_${bank}_completed`) }catch(e){}
    setAnswers({}); setFlags({}); setCheckedMap({}); setTimeLeft(defaultTime)
    setOfferResume(false); setPendingSaved(null)
  }

  function continueFromSaved(){
    if(!pendingSaved) { setOfferResume(false); return }
    const {answers: sa, flags: sf, checked: sc, time: st} = pendingSaved
    setAnswers(sa||{})
    setFlags(sf||{})
    setCheckedMap(sc||{})
    if(st!==null && st!==undefined) setTimeLeft(st)
    else setTimeLeft(defaultTime)
    setOfferResume(false); setPendingSaved(null)
  }

  function confirmExit(){
    // User confirmed they want to leave - allow navigation
    allowNavigationRef.current = true
    setShowExitConfirm(false)
    if(pendingRoute){
      router.push(pendingRoute)
    }
  }

  function cancelExit(){
    // User wants to stay - just close modal
    setShowExitConfirm(false)
    setPendingRoute(null)
  }

  function openPreview(){
    // prepare a read-only preview copy of the shuffled indices
    const copy = Array.isArray(shuffled) && shuffled.length>0 ? shuffled.slice() : (Array.isArray(data?.questions) ? data.questions.map((_,i)=>i) : [])
    setPreviewShuffled(copy)
    setPreviewPos(0)
    setOfferResume(false)
    setShowPreview(true)
  }

  function previewNext(){ if(previewPos < previewShuffled.length-1) setPreviewPos(p=>p+1) }
  function previewPrev(){ if(previewPos>0) setPreviewPos(p=>p-1) }

  function goToIndex(i){ if(i>=0 && i<shuffled.length) setPos(i) }

  function formatTime(s){ const m=Math.floor(s/60); const r=s%60; return `${m}:${String(r).padStart(2,'0')}` }

  // Toggle favorite
  async function toggleFavorite(){
    if(favoriteLoading || !bank || !subject) return
    setFavoriteLoading(true)
    try{
      const token = getToken()
      if(!token){
        alert('Debes iniciar sesión para guardar favoritos')
        setFavoriteLoading(false)
        return
      }
      const method = isFavorite ? 'DELETE' : 'POST'
      const res = await fetch('/api/favorites', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bank_id: bank, subject_slug: subject })
      })
      
      if(res.status === 401){
        // Token inválido o expirado
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
        localStorage.removeItem('quiz_token')
        setFavoriteLoading(false)
        router.push('/auth')
        return
      }
      
      if(!res.ok){
        const err = await res.json().catch(()=>({}))
        throw new Error(err.error || 'Error al actualizar favorito')
      }
      setIsFavorite(!isFavorite)
    }catch(err){
      console.error('Error toggling favorite:', err)
      alert(err.message || 'Error al actualizar favorito')
    }finally{
      setFavoriteLoading(false)
    }
  }

  // statistics for the ongoing test
  const totalQuestions = Array.isArray(data.questions) ? data.questions.length : 0
  const correctCount = Object.values(checkedMap).filter(v=>v===true).length
  const incorrectCount = Object.values(checkedMap).filter(v=>v===false).length
  const points = (correctCount - 0.33 * incorrectCount)
  const percentage = totalQuestions>0 ? Math.max(0, Math.min(100, (points/totalQuestions)*100)) : 0
  const nota = Math.round((percentage/100*10 + Number.EPSILON) * 100) / 100

  return (
    <div className="container">
      {/* Resume / Discard modal shown when entering with saved progress */}
      {offerResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-[520px]">
            <h3 className="text-lg font-semibold mb-2">⏸️ Cuestionario en Progreso</h3>
            <p className="text-sm text-gray-600 mb-4">Detectamos que tenías este cuestionario en curso. ¿Qué deseas hacer?</p>
            <div className="space-y-2 mb-4 text-sm bg-blue-50 border border-blue-200 rounded p-3">
              <p><strong>Continuar:</strong> Retoma desde donde lo dejaste</p>
              <p><strong>Vista previa:</strong> Revisa las preguntas sin afectar tu progreso</p>
              <p><strong>Descartar:</strong> Elimina tu progreso y empieza de nuevo</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={discardSavedAndStartFresh} className="px-3 py-2 border rounded hover:bg-gray-50 transition-colors">🗑️ Descartar y reiniciar</button>
              <button onClick={openPreview} className="px-3 py-2 border rounded hover:bg-gray-50 transition-colors">👁️ Vista previa</button>
              <button onClick={continueFromSaved} className="px-3 py-2 bg-brand-700 dark:bg-brand-500 text-white rounded hover:bg-brand-800 dark:hover:bg-brand-600 transition-colors font-semibold">▶️ Continuar cuestionario</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal: read-only exam viewer (does not modify state or count as attempt) */}
      <AnimatePresence>
        {showPreview && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div initial={{scale:0.98,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.98,opacity:0}} className="bg-white rounded-lg p-4 w-[900px] max-w-full max-h-[90vh] overflow-auto">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold">👁️ Vista Previa del Cuestionario</h3>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">Pregunta {previewPos+1} de {previewShuffled.length}</div>
                  <button onClick={()=>setShowPreview(false)} className="px-2 py-1 border rounded hover:bg-gray-50 transition-colors">✕ Cerrar</button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
                ℹ️ Modo solo lectura - No se guardarán cambios ni afectará tu progreso
              </div>

              {/* preview content area */}
              {(() => {
                const pIndex = previewShuffled && previewShuffled.length>0 ? previewShuffled[previewPos] : undefined
                const pq = (pIndex!==undefined && data.questions && data.questions[pIndex]) ? data.questions[pIndex] : null
                return (
                  <div>
                    {pq ? (
                      <div className={`card ${''}`}>
                        <h4 className="text-lg font-medium mb-2" dangerouslySetInnerHTML={{__html: pq.question}} />
                        <div>
                          {(pq.options && pq.options.length>0) ? (
                            <ul className="space-y-2">
                              {pq.options.map(o=> (
                                <li key={o.key} className="p-2 border rounded bg-gray-50 text-gray-700 opacity-90">
                                  <strong className="inline-block w-6">{o.key}.</strong>
                                  <span dangerouslySetInnerHTML={{__html:o.text}} />
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <textarea value={''} readOnly disabled className="w-full p-2 border rounded bg-gray-50 text-gray-600" rows={3} />
                          )}
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                          <button onClick={previewPrev} disabled={previewPos===0} className="px-3 py-2 border rounded">Atrás</button>
                          <button onClick={previewNext} disabled={previewPos===previewShuffled.length-1} className="px-3 py-2 bg-brand-700 dark:bg-brand-500 text-white rounded font-semibold disabled:opacity-50">{previewPos===previewShuffled.length-1? 'Cerrar':'Siguiente'}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-gray-600">No hay preguntas disponibles para la vista previa.</div>
                    )}
                  </div>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{data.name}</h2>
            <p className="text-sm text-gray-600">📝 Pregunta {pos+1} de {shuffled.length}</p>
          </div>
          <button 
            onClick={toggleFavorite} 
            disabled={favoriteLoading}
            className={`text-2xl transition-all ${isFavorite? 'text-yellow-500 hover:text-yellow-600':'text-gray-400 hover:text-yellow-500'} disabled:opacity-50`}
            title={isFavorite? 'Quitar de favoritos':'Añadir a favoritos'}
          >
            {favoriteLoading? '⏳' : isFavorite? '★':'☆'}
          </button>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">⏱️ Tiempo restante</div>
          <div className="text-lg font-medium">{timeLeft!==null? formatTime(timeLeft) : '—'}</div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="container mb-4">
        {(() => {
          const pct = shuffled.length? Math.round(((pos+1)/shuffled.length)*100):0
          return (
            <div className="progress-outer" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Progreso: ${pct}%`}>
              <motion.div className="progress-inner" style={{width: `${pct}%`}} transition={{duration:0.36,ease:[0.2,0.8,0.2,1]}} />
            </div>
          )
        })()}
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-6">
        <div>
          <AnimatePresence mode="wait">
            <motion.div key={q ? q.id : pos} initial={{opacity:0,y:8,scale:0.995}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.995}} transition={{duration:0.28}} className={`card relative ${checkedMap[q?.id] === true ? 'border-green-300 bg-green-50' : checkedMap[q?.id] === false ? 'border-red-300 bg-red-50' : ''}`}>
              {q ? (
                <div>
                  <h3 className="text-lg font-medium mb-3" dangerouslySetInnerHTML={{__html:q.question}} />
              <div>
                  {(q.options && q.options.length>0) ? (
                  <motion.ul className="space-y-2" animate={ checkResults[q.id] === false ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 } } transition={{ duration: 0.45 }}>
                    {q.options.map(o=>{
                        const user = answers[q.id]
                        const isMulti = Array.isArray(q.answers) && q.answers.length>1
                        const selected = isMulti ? (Array.isArray(user) && user.includes(o.key)) : user===o.key
                        // if the question has been finalized (checkedMap has an entry), reveal the solution:
                        // - correct options -> green
                        // - incorrect options -> red
                        const result = checkedMap.hasOwnProperty(q.id) ? checkedMap[q.id] : undefined
                        let cls = 'p-3 border rounded-lg cursor-pointer transition-all duration-200'
                        if(result === undefined){
                          // not finalized: show selection only
                          if(selected) cls += ' bg-blue-50 border-blue-400 shadow-sm'
                          else cls += ' hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                          if(selected && result === true) cls += ' border-green-400 bg-green-50'
                          if(selected && result === false) cls += ' border-red-400 bg-red-50'
                        } else {
                          // finalized: highlight correct/incorrect regardless of selection
                          const correctAnswers = Array.isArray(q.answers)? q.answers.map(String) : []
                          const isCorrectOption = correctAnswers.includes(String(o.key))
                          if(isCorrectOption) cls += ' border-green-400 bg-green-50'
                          else cls += ' border-red-400 bg-red-50'
                        }
                      return (
                        <motion.li key={o.key} className={cls} onClick={()=>{ if(!checkedMap.hasOwnProperty(q.id)) selectOption(o.key) }} whileTap={{scale:0.99}} transition={{type:'spring',stiffness:400,damping:28}} layout>
                          <strong className="inline-block w-6">{o.key}.</strong>
                          <span dangerouslySetInnerHTML={{__html:o.text}} />
                        </motion.li>
                      )
                    })}
                  </motion.ul>
                ) : (
                  <div className="space-y-2">
                    {/* persist textarea coloring using checkedMap so it remains after the check feedback expires */}
                    <textarea value={answers[q.id] || ''} onChange={(e)=>setTextAnswer(e.target.value)} readOnly={checkedMap.hasOwnProperty(q.id)} className={`w-full p-2 border rounded ${checkedMap[q.id]===true? 'border-green-400 bg-green-50': checkedMap[q.id]===false? 'border-red-400 bg-red-50':''}`} rows={3} />
                    <div className="text-sm text-gray-600">Respuesta de texto. Se guardará automáticamente.</div>
                    {checkedMap.hasOwnProperty(q.id) && (
                      <div className={`mt-2 p-2 rounded ${checkedMap[q.id]===true? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                        <strong>Solución:</strong> {Array.isArray(q.answers)? q.answers.join(', ') : String(q.answers)}
                      </div>
                    )}
                  </div>
                )}
              </div>

                <div className="flex gap-2 justify-end mt-4">
                  <motion.button whileTap={{scale:0.98}} onClick={toggleFlag} className={`px-3 py-2 rounded ${flags[q.id]? 'bg-yellow-400 text-white':'border'}`}>{flags[q.id]? 'Marcada':'Marcar'}</motion.button>
                  <motion.button whileTap={{scale:0.98}} onClick={markNoAnswer} disabled={checkedMap.hasOwnProperty(q.id)} className={`px-3 py-2 border rounded ${checkedMap.hasOwnProperty(q.id)? 'opacity-50 cursor-not-allowed':''}`}>No responder</motion.button>
                  <motion.button whileTap={{scale:0.98}} onClick={checkAnswer} disabled={!hasAnsweredQuestion(q) || checkedMap.hasOwnProperty(q.id)} title={!hasAnsweredQuestion(q)? 'Responde la pregunta antes de comprobar': checkedMap.hasOwnProperty(q.id)? 'Ya has comprobado esta pregunta':''} className={`px-3 py-2 border rounded ${(!hasAnsweredQuestion(q) || checkedMap.hasOwnProperty(q.id))? 'opacity-50 cursor-not-allowed':''}`}>Comprobar</motion.button>
                </div>

                {/* Inline feedback when checking the answer (without revealing the solution) */}
                { (checkResults[q.id] === true || checkResults[q.id] === false) && (
                  <div className="mt-3 flex items-center gap-3">
                    {checkResults[q.id] === true ? (
                      <div className="text-green-700 font-medium">✓ Respuesta correcta</div>
                    ) : (
                      <div className="text-red-700 font-medium">✗ Respuesta incorrecta</div>
                    )}
                    <div className="text-sm text-gray-500">Pulsa "Siguiente" para continuar. La solución se mostrará al finalizar el cuestionario.</div>
                  </div>
                )}

              {/* solutions are not revealed during the test */}
                {/* Checkmark animation when a correct answer is chosen */}
                <AnimatePresence>
                  {correctFlash && (
                    <motion.div initial={{opacity:0,scale:0, y:0}} animate={{opacity:1,scale:1,y:-8}} exit={{opacity:0,scale:0,y:-4}} transition={{duration:0.45}} className="absolute top-4 right-4">
                      <div className="w-10 h-10 rounded-full bg-green-700 dark:bg-green-500 text-white flex items-center justify-center shadow-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              ) : (
                <div className="p-4 text-gray-600">Pregunta no disponible.</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="bg-white rounded-xl p-4 card-shadow">
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2 text-gray-800">📊 Estadísticas</h4>
            <div className="flex justify-between text-sm"><span className="text-gray-600">✓ Correctas</span><strong className="text-green-600">{correctCount}</strong></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-gray-600">✗ Incorrectas</span><strong className="text-red-600">{incorrectCount}</strong></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-gray-600">Porcentaje</span><strong className="text-brand-600">{percentage.toFixed(1)}%</strong></div>
            <div className="flex justify-between text-sm mt-1"><span className="text-gray-600">Nota (0-10)</span><strong className="text-brand-600">{nota}</strong></div>
          </div>
          <div className="mb-4 flex justify-end">
            <button onClick={()=>setShowFinishConfirm(true)} className="px-3 py-2 bg-red-700 dark:bg-red-500 text-white rounded hover:bg-red-800 dark:hover:bg-red-600 transition-colors text-sm font-semibold">🏁 Finalizar cuestionario</button>
          </div>
          <h4 className="font-medium mb-2">🔢 Índice de Preguntas</h4>
            <div className="grid grid-cols-5 gap-2">
            {shuffled.map((orig,i)=> {
              const qid = data.questions[orig].id
              const res = checkedMap[qid]
              const btnCls = i===pos ? 'bg-blue-700 dark:bg-blue-600 text-white font-semibold' : res === true ? 'bg-green-600 dark:bg-green-500 text-white' : res === false ? 'bg-red-600 dark:bg-red-500 text-white' : 'bg-gray-50 dark:bg-gray-700'
              const title = res === true ? 'Acertada' : res === false ? 'Fallada' : (flags[data.questions[orig].id]? 'Marcada para revisar':'' )
              return (
                <button key={i} onClick={()=>goToIndex(i)} title={title} className={`py-2 rounded-md ${btnCls} hover:opacity-90 transition-opacity`}>{i+1}{flags[data.questions[orig].id]? ' •':''}</button>
              )
            })}
          </div>
          <div className="mt-4">
            <h5 className="text-sm font-medium">🚩 Marcadas para revisar</h5>
            {Object.entries(flags).filter(([k,v])=>v).length > 0 ? (
              <ul className="text-sm mt-2 space-y-1">
                {Object.entries(flags).filter(([k,v])=>v).map(([k])=> {
                  const qobj = data.questions.find(x=>String(x.id)===String(k))
                  return <li key={k} className="py-1 text-gray-700">{qobj? (qobj.question||'Pregunta').slice(0,80): 'Pregunta '+k}</li>
                })}
              </ul>
            ) : (
              <p className="text-sm mt-2 text-gray-500">No hay preguntas marcadas</p>
            )}
          </div>

          <div className="mt-4">
            <h5 className="text-sm font-medium">⌨️ Leyenda y Atajos</h5>
            <div className="text-sm mt-2 space-y-2">
              <div><span className="inline-block w-3 h-3 mr-2 rounded-full bg-green-500 align-middle" /> Pregunta acertada</div>
              <div><span className="inline-block w-3 h-3 mr-2 rounded-full bg-red-500 align-middle" /> Pregunta fallada</div>
              <div><span className="inline-block w-3 h-3 mr-2 rounded-full bg-gray-200 border" /> Sin comprobar</div>
              <div className="pt-2 text-xs text-gray-600 leading-relaxed">
                <strong>Atajos de teclado:</strong><br/>
                ← / → Navegar | C Comprobar | M Marcar | N No responder | P Vista previa | F Terminar
                <br/>En modales: C=Continuar, D=Descartar, V=Vista previa, Esc=Cerrar
              </div>
            </div>
          </div>
        </aside>
      </main>
        {/* Confirmation modal for finishing exam */}
        <AnimatePresence>
          {showFinishConfirm && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} className="bg-white rounded-lg p-6 w-[420px]">
                <h3 className="text-lg font-semibold mb-2">🏁 Finalizar Cuestionario</h3>
                <p className="text-sm text-gray-600 mb-4">¿Estás seguro de que quieres finalizar este cuestionario ahora? Se guardará tu progreso actual y verás los resultados detallados.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={()=>setShowFinishConfirm(false)} className="px-3 py-2 border rounded">Cancelar</button>
                  <button onClick={()=>{ setShowFinishConfirm(false); finishExam(); }} className="px-3 py-2 bg-red-700 dark:bg-red-600 text-white rounded font-semibold hover:bg-red-800 dark:hover:bg-red-700">Terminar y ver resultados</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation modal for exiting quiz */}
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} className="bg-white rounded-lg p-6 w-[480px]">
                <h3 className="text-lg font-semibold mb-2">⚠️ ¿Salir del examen?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Si sales ahora, tu progreso se guardará automáticamente y podrás continuar más tarde desde donde lo dejaste.
                  ¿Estás seguro de que quieres salir?
                </p>
                <div className="flex gap-3 justify-end">
                  <button onClick={cancelExit} className="px-4 py-2 bg-blue-700 dark:bg-blue-600 text-white rounded hover:bg-blue-800 dark:hover:bg-blue-700 font-semibold">
                    Continuar con el examen
                  </button>
                  <button onClick={confirmExit} className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">
                    Sí, salir y guardar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )
}
