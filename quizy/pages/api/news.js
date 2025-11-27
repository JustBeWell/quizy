import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const newsPath = path.join(process.cwd(), 'data', 'news.json')
    const newsData = JSON.parse(fs.readFileSync(newsPath, 'utf8'))
    
    res.status(200).json(newsData)
  } catch (error) {
    console.error('Error loading news:', error)
    res.status(500).json({ 
      error: 'Error loading news',
      currentVersion: '1.0.0',
      updates: [],
      hotfixes: []
    })
  }
}
