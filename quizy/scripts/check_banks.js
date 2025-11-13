// scripts/check_banks.js
// Node script to validate that /api/banks and /api/bank/<id> return questions > 0
// Run with: node scripts/check_banks.js

const base = process.env.BASE_URL || 'http://localhost:3000'

async function ok(){
  try{
    const res = await fetch(base + '/api/banks')
    if(!res.ok) throw new Error(`GET /api/banks failed ${res.status}`)
    const banks = await res.json()
    if(!Array.isArray(banks)) throw new Error('Invalid banks response')
    let failed = false
    for(const b of banks){
      const id = b.id
      process.stdout.write(`Checking ${id} ... `)
      const r = await fetch(`${base}/api/bank/${id}`)
      if(!r.ok){
        console.error(`ERROR ${r.status}`)
        failed = true
        continue
      }
      const body = await r.json()
      const qlen = Array.isArray(body.questions)? body.questions.length : 0
      console.log(`${qlen} preguntas`)
      if(qlen===0) failed = true
    }
    if(failed){
      console.error('\nOne or more banks are empty or failed')
      process.exit(2)
    }
    console.log('\nAll banks ok')
    process.exit(0)
  }catch(e){
    console.error('check failed', e)
    process.exit(3)
  }
}

ok()
