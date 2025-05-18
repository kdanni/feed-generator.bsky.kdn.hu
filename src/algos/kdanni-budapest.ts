import dotenv from 'dotenv';
import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import { FeedGenerationResult } from '../types'

dotenv.config();

// Short name (identifier) for your feed (max 15 chars, used in the record URI)
export const shortname = 'kdanni.hu-Bud';

export const FEEDGEN_CONFIG = {
  publisherDid: `${process.env.FEEDGEN_PUBLISHER_DID}`,
  feeds: [
    {
      uri: `at://${process.env.FEEDGEN_PUBLISHER_DID}/app.bsky.feed.generator/${shortname}`,
      id: `${shortname}`,
      displayName: '@kdanni.hu - #Budapest',
      description: 'My posts with #Budapest or #Danube hashtags',
      avatarFile: 'avatars/budapest.jpg',
    },
  ],
}


export const handler = async (
    ctx: AppContext,
    params: QueryParams
): Promise<FeedGenerationResult> => {

    const TARGET_AUTHOR_DID = process.env.KDANNI_DID || process.env.FEEDGEN_PUBLISHER_DID;
    const DEV_ENV = process.env.ENV === 'DEV';
    
    DEV_ENV && console.log(`[${shortname}]`, 'kdanni-budapest algo called', `Target author: ${TARGET_AUTHOR_DID}`, `Params: ${JSON.stringify(params)}`);

    const db = ctx.db;  // Database (Kysely interface to SQLite) provided in context

    // Build a query to select posts from the indexed database
    let builder = db.selectFrom('post')
        .selectAll()  // select all columns (we'll use uri, text, replyParent, etc.)
        .where('uri', 'like', `%/app.bsky.feed.post/%`);  // ensure it’s a feed post

    // Filter: only the target author’s posts (match the author’s DID in the URI)
    builder = builder.where('author', '=', `${TARGET_AUTHOR_DID}`);

    builder = builder.where((eb) =>
        eb('text', 'like', `%#Budapest%`).or('text', 'like', `%#Danube%`)
    );

    // Filter: exclude replies – i.e. only posts with no reply parent
    builder = builder.where('replyParent', 'is', null);

    // Order by recent (e.g. indexedAt descending) and apply limit for pagination
    builder = builder.orderBy('indexedAt', 'desc').limit(params.limit ?? 30);

    // If a cursor (pagination) is provided in params, apply it (to get older posts)
    if (params.cursor) {
        const [timestamp, cid] = params.cursor.split('::');
        if (timestamp) {
            builder = builder.where('indexedAt', '<', timestamp);
        }
    }

    // Execute the query
    const posts = await builder.execute();

    // Construct feed skeleton: list of post URIs
    const feed = posts.map((row) => ({ post: row.uri }));
    // Construct new cursor from last post in the list (timestamp::cid)
    let cursor: string | undefined = undefined;
    if (posts.length > 0) {
        const last = posts[posts.length - 1];
        cursor = `${last.indexedAt}::${last.cid}`;  // use indexedAt and cid of last item
    }

    return { feed, cursor };
};
