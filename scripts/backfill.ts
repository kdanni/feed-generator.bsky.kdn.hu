import { AtpAgent } from '@atproto/api'
import sqlite from 'better-sqlite3'
import dotenv from 'dotenv'
import { getMimeStringOrNull } from '../src/subscription'

dotenv.config()

const AUTHOR_HANDLE = process.env.BACKFILL_AUTHOR_HANDLE || process.env.FEEDGEN_PUBLISHER_DID || 'kdanni.hu'

const BSKY_HANDLE = process.env.BACKFILL_APP_HANDLE
const BSKY_APP_PASSWORD = process.env.BACKFILL_APP_PASSWORD

const FEEDGEN_SQLITE_LOCATION = process.env.FEEDGEN_SQLITE_LOCATION

// Print current directory
console.log('Current directory:', process.cwd())
console.log('SQLite location:', FEEDGEN_SQLITE_LOCATION)



const db = sqlite(FEEDGEN_SQLITE_LOCATION)

// Authenticated API client
const agent = new AtpAgent({ service: 'https://bsky.social' })

async function backfill() {
  // Login using App Password
  const loginRes = await agent.login({
    identifier: BSKY_HANDLE!,
    password: BSKY_APP_PASSWORD!,
  })

  console.log(`🔐 Logged in as ${loginRes.data.handle}`)

  let cursor: string | undefined = undefined

  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO post
      (uri, cid, author, text, indexedAt, replyParent, replyRoot, hasImage, filterReason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)


  while (true) {
    const res = await agent.app.bsky.feed.getAuthorFeed({
      actor: AUTHOR_HANDLE,
      limit: 50,
      cursor,
    })

    const posts = res.data.feed.map(item => item.post).filter(post =>
      // @ts-ignore
      post.record?.$type === 'app.bsky.feed.post' && !post.record.reply
    )

    const tx = db.transaction(() => {
      for (const post of posts) {
        const { uri, cid, author, indexedAt, record } = post
        // @ts-ignore
        const replyParent = record.reply?.parent?.uri ?? null
        // @ts-ignore
        const replyRoot = record.reply?.root?.uri ?? null
        // @ts-ignore
        const text = record.text ?? ''
        // @ts-ignore
        const image = getMimeStringOrNull(record.embed)

        insertPost.run(uri, cid, author.did, text, indexedAt, replyParent, replyRoot, image, 'backfill')
        
      }
    })

    tx()

    console.log(`📥 Indexed ${posts.length} posts`)
    if (!res.data.cursor) break
    cursor = res.data.cursor
  }

  console.log('✅ Backfill complete.')
}

backfill().catch(err => {
  console.error('❌ Backfill error:', err)
})
