import dotenv from 'dotenv';
import SqliteDb from 'better-sqlite3'
import { createPool } from 'mysql2'  // use 'mysql2', not the '/promise' subpath:contentReference[oaicite:5]{index=5}
import { Kysely, Migrator, SqliteDialect, MysqlDialect } from 'kysely'
import { DatabaseSchema } from './schema'
import { migrationProvider } from './migrations'

dotenv.config()

export const createDb = (location: string): Database => {
  if (!location || location === ':off:') {
    const db = new Kysely<DatabaseSchema>({
      dialect: new MysqlDialect({
        pool: createPool({
          host: process.env.FEEDGEN_DB_HOST,
          port: Number(process.env.FEEDGEN_DB_PORT) || 3306,
          database: process.env.FEEDGEN_DB_NAME,
          user: process.env.FEEDGEN_DB_USER,
          password: process.env.FEEDGEN_DB_PASS,
            // ... you can add other pool options here ...
        })
      })
    })
    return db
  } else {
    return new Kysely<DatabaseSchema>({
      dialect: new SqliteDialect({
        database: new SqliteDb(location),
      }),
    })
  }
}

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider })
  const { error } = await migrator.migrateToLatest()
  if (error) throw error
}

export type Database = Kysely<DatabaseSchema>
