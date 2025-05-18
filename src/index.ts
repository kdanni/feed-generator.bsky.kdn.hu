import dotenv from 'dotenv'
import fs from 'fs'
import FeedGenerator from './server'

const run = async () => {
  dotenv.config()

  let sqliteDir = process.env.FEEDGEN_SQLITE_LOCATION
  if (sqliteDir && sqliteDir !== ':memory:') {
    // Remove the DB file of the end of sqliteDir varible only the directory is left
    sqliteDir = sqliteDir.replace(/\/[^/]+$/, '')
    // Check if the directory exists
    if (!sqliteDir) {
      console.error(
        'FEEDGEN_SQLITE_LOCATION is not a valid directory. Please check your environment variables.',
      )
      process.exit(1)
    }
    // Create the directory if it doesn't exist
    try {
      await fs.promises.mkdir(sqliteDir, { recursive: true })
    }
    catch (err) {
      console.error(
        `FEEDGEN_SQLITE_LOCATION is not writable. Please check your environment variables. ${err}`,
      )
      process.exit(1)
    }
  }

  const hostname = maybeStr(process.env.FEEDGEN_HOSTNAME) ?? 'example.com'
  const serviceDid =
    maybeStr(process.env.FEEDGEN_SERVICE_DID) ?? `did:web:${hostname}`
  const server = FeedGenerator.create({
    port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000,
    listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'localhost',
    sqliteLocation: maybeStr(process.env.FEEDGEN_SQLITE_LOCATION) ?? ':memory:',
    subscriptionEndpoint:
      maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ??
      'wss://bsky.network',
    publisherDid:
      maybeStr(process.env.FEEDGEN_PUBLISHER_DID) ?? 'did:example:alice',
    subscriptionReconnectDelay:
      maybeInt(process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY) ?? 3000,
    hostname,
    serviceDid,
  })
  await server.start()
  console.log(
    `🤖 running feed generator at http://${server.cfg.listenhost}:${server.cfg.port}`,
  )
}

const maybeStr = (val?: string) => {
  if (!val) return undefined
  return val
}

const maybeInt = (val?: string) => {
  if (!val) return undefined
  const int = parseInt(val, 10)
  if (isNaN(int)) return undefined
  return int
}

run()
