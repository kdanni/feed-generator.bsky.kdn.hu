export type DatabaseSchema = {
  post: Post
  sub_state: SubState
}

export type Post = {
  uri: string
  cid: string
  author: string
  text: string;
  replyParent: string | null;
  replyRoot: string | null;
  indexedAt: string
  filterReason: string | null;
  hasImage: string | null;
}

export type SubState = {
  service: string
  cursor: number
}
