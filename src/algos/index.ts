import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import * as kdanniBudapest from './kdanni-budapest'
import * as kdanniPhoto from './kdanni-photography'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [kdanniBudapest.shortname]: kdanniBudapest.handler,
  [kdanniPhoto.shortname]: kdanniPhoto.handler,
}

export default algos
