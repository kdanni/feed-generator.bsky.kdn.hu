import dotenv from 'dotenv';
import { Database } from '../../db'
import { AtpAgent } from '@atproto/api'
import { getMimeStringOrNull } from '../../subscription'

dotenv.config();

const AUTHOR_HANDLE = process.env.BACKFILL_AUTHOR_HANDLE || process.env.FEEDGEN_PUBLISHER_DID || ''

const BSKY_HANDLE = process.env.BACKFILL_APP_HANDLE
const BSKY_APP_PASSWORD = process.env.BACKFILL_APP_PASSWORD

export async function backfill(db: Database) {
  try {
    // Authenticated API client
    const agent = new AtpAgent({ service: 'https://bsky.social' })
    // console.log('DB:', db)
    // Login using App Password
    const loginRes = await agent.login({
      identifier: BSKY_HANDLE!,
      password: BSKY_APP_PASSWORD!,
    })

    console.log(`🔐 Logged in as ${loginRes.data.handle}`)

    let cursor: string | undefined = undefined

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

    type PostWithRecord = typeof posts[number] & { record: { embed?: unknown } };

    const postsToCreate = posts.map((create: PostWithRecord) => {
      const hasImage = getMimeStringOrNull(create?.record?.embed);
      const filterReason = 'backfill'
      return {
          uri: create.uri,
          cid: create.cid,
          author: typeof create.author === 'string' ? create.author : create.author.did, // Use DID or handle string
          replyParent: (create.record as any).reply?.parent?.uri || null,
          replyRoot: (create.record as any).reply?.root?.uri || null,
          text: (create.record as any).text,
          indexedAt: new Date().toISOString(),
          filterReason: filterReason,
          hasImage: hasImage,
      }
    })
        
    await db
        .insertInto('post')
        .values(postsToCreate)
        // .onConflict((oc) => oc.doNothing())
        .ignore()
        .execute()

    console.log(`📥 Indexed ${posts.length} posts`)
    if (!res.data.cursor) break
    cursor = res.data.cursor
  }

  } catch (error) {
    console.error('❌ Backfill error:', error)
  }
}