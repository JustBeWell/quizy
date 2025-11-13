/**
 * Script to migrate existing attempts to have subject_id
 * 
 * This script will:
 * 1. Find all attempts without subject_id
 * 2. Try to infer the subject from the bank name patterns
 * 3. Update the attempts with the correct subject_id
 * 
 * Usage: node scripts/migrate_attempts_subject.js
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function migrateAttempts() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  
  if (!connectionString) {
    console.error('❌ No DATABASE_URL or POSTGRES_URL found in environment')
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('URL') || k.includes('POSTGRES')))
    process.exit(1)
  }

  const pool = new Pool({ connectionString })

  try {
    console.log('🔍 Checking for attempts without subject_id...')
    
    // Get all subjects
    const subjectsResult = await pool.query('SELECT id, slug, name FROM subjects ORDER BY id')
    const subjects = subjectsResult.rows
    
    console.log(`📚 Found ${subjects.length} subjects:`)
    subjects.forEach(s => console.log(`   - ${s.name} (slug: ${s.slug}, id: ${s.id})`))
    
    // Get all attempts without subject_id
    const attemptsResult = await pool.query(
      'SELECT id, bank, user_name, created_at FROM attempts WHERE subject_id IS NULL ORDER BY created_at DESC'
    )
    
    const attemptsToUpdate = attemptsResult.rows
    console.log(`\n📝 Found ${attemptsToUpdate.length} attempts without subject_id`)
    
    if (attemptsToUpdate.length === 0) {
      console.log('✅ All attempts already have subject_id assigned!')
      await pool.end()
      return
    }

    // Try to match attempts to subjects based on bank name patterns
    let updated = 0
    let skipped = 0
    
    for (const attempt of attemptsToUpdate) {
      let matchedSubject = null
      
      // Try to find a subject that matches the bank name
      // Common patterns: rec1, rec2, rec3, etc.
      const bankLower = (attempt.bank || '').toLowerCase()
      
      // Look for exact matches in subject slug within bank name
      for (const subject of subjects) {
        const slugLower = subject.slug.toLowerCase()
        if (bankLower.includes(slugLower) || bankLower.startsWith(slugLower)) {
          matchedSubject = subject
          break
        }
      }
      
      // If we found a match, update the attempt
      if (matchedSubject) {
        await pool.query(
          'UPDATE attempts SET subject_id = $1 WHERE id = $2',
          [matchedSubject.id, attempt.id]
        )
        updated++
        console.log(`✓ Updated attempt ${attempt.id} (bank: ${attempt.bank}) → ${matchedSubject.name}`)
      } else {
        skipped++
        console.log(`⚠ Could not match attempt ${attempt.id} (bank: ${attempt.bank})`)
      }
    }
    
    console.log(`\n📊 Migration complete:`)
    console.log(`   ✅ Updated: ${updated} attempts`)
    console.log(`   ⚠️  Skipped: ${skipped} attempts (no match found)`)
    
    if (skipped > 0) {
      console.log('\n💡 Tip: For unmatched attempts, you may need to:')
      console.log('   1. Create the corresponding subject in the admin panel')
      console.log('   2. Run this script again')
      console.log('   3. Or manually update them in the database')
    }
    
    await pool.end()
  } catch (error) {
    console.error('❌ Error during migration:', error)
    await pool.end()
    process.exit(1)
  }
}

// Run the migration
migrateAttempts()
