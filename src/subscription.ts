import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'


export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    const DEV_ENV = process.env.ENV === 'DEV';
    const TARGET_AUTHOR_DID = process.env.KDANNI_DID || process.env.FEEDGEN_PUBLISHER_DID;
    const NEED_TEST_DATA = `${process.env.NEED_TEST_DATA}` === 'true' || false;

    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    // // This logs the text of every post off the firehose.
    // // Just for fun :)
    // // Delete before actually using
    // for (const post of ops.posts.creates) {
    //   console.log(post.record.text)
    // }

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        if(create.author == `${TARGET_AUTHOR_DID}`) {
          return true;
        }
        if (create.record.reply?.parent.uri) {
          return false;
        }
        const hasImage = getMimeStringOrNull(create?.record?.embed);
        if(!hasImage) {
          return false;
        }         
        if (NEED_TEST_DATA) {
          return create.record.text.toLowerCase().includes('#photography');
        }
        return (
          create.record.text.toLowerCase().includes('#budapest') 
          || create.record.text.toLowerCase().includes('#danube')                     
        );
      })
      .map((create) => {
        let filterReason = 'none'
        if (create.record.text.toLowerCase().includes('#budapest')) {
          filterReason = '#budapest'
        } else if (create.record.text.toLowerCase().includes('#danube')) {
          filterReason = '#danube'
        } else if (create.record.text.toLowerCase().includes('#photography')) {
          filterReason = '#photography'
        }
        if(create.author == `${TARGET_AUTHOR_DID}`) {
          filterReason += ` ${create.author}`;
        }
        const hasImage = getMimeStringOrNull(create?.record?.embed);
        return {
          uri: create.uri,
          cid: create.cid,
          author: create.author,
          replyParent: create.record.reply?.parent.uri || null,
          replyRoot: create.record.reply?.root.uri || null,
          text: create.record.text,
          indexedAt: new Date().toISOString(),
          filterReason: filterReason,
          hasImage: hasImage,
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      for (const post of postsToCreate) {
        DEV_ENV && console.dir(post, { depth: 5 })
        !DEV_ENV && console.log('[subscription]', JSON.stringify(post))
      }
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        // .onConflict((oc) => oc.doNothing())
        .ignore()
        .execute()
    }
  }
}

export function getMimeStringOrNull(embed: any): string | null {
  if (!embed) return null
  if (embed.$type === 'app.bsky.embed.images') {
    return embed.images?.some(
      (img: any) => img.image?.mimeType?.startsWith('image/')
    ) ? 'image/' : '?';
  }
  if (embed.$type === 'app.bsky.embed.recordWithMedia') {
    return getMimeStringOrNull(embed.media)
  }
  return 'embed?'
}