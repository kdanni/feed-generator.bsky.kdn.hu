import { Kysely, Migration, MigrationProvider } from 'kysely'

const migrations: Record<string, Migration> = {}

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}

// migrations['001'] = {
//   async up(db: Kysely<unknown>) {
//     await db.schema
//       .createTable('post')
//       .addColumn('uri', 'varchar', (col) => col.primaryKey())
//       .addColumn('cid', 'varchar', (col) => col.notNull())
//       .addColumn('indexedAt', 'varchar', (col) => col.notNull())
//       .execute()
//     await db.schema
//       .createTable('sub_state')
//       .addColumn('service', 'varchar', (col) => col.primaryKey())
//       .addColumn('cursor', 'integer', (col) => col.notNull())
//       .execute()
//   },
//   async down(db: Kysely<unknown>) {
//     await db.schema.dropTable('post').execute()
//     await db.schema.dropTable('sub_state').execute()
//   },
// }

// migrations['002'] = {
//   async up(db: Kysely<unknown>) {
//     await db.schema
//       .alterTable('post')
//       .addColumn('text', 'varchar', (col) => col.notNull())
//       .execute()
//     await db.schema
//       .alterTable('post')
//       .addColumn('replyParent', 'varchar')
//       .execute()    
//     await db.schema
//       .alterTable('post')
//       .addColumn('replyRoot', 'varchar')
//       .execute()
//   },
//   async down(db: Kysely<unknown>) {
//     await db.schema.alterTable('post').dropColumn('text').execute()
//     await db.schema.alterTable('post').dropColumn('replyParent').execute()
//     await db.schema.alterTable('post').dropColumn('replyRoot').execute()
//   },
// }

// migrations['003'] = {
//   async up(db: Kysely<unknown>) {
//     await db.schema
//       .alterTable('post')
//       .addColumn('author', 'varchar')
//       .execute()
//     await db.schema
//       .alterTable('post')
//       .addColumn('filterReason', 'varchar')
//       .execute()
//   },
//   async down(db: Kysely<unknown>) {
//     await db.schema.alterTable('post').dropColumn('author').execute()
//     await db.schema.alterTable('post').dropColumn('filterReason').execute()
//   },
// }

// migrations['004'] = {
//   async up(db: Kysely<unknown>) {
//     await db.schema
//       .alterTable('post')
//       .addColumn('hasImage', 'varchar')
//       .execute()
//   },
//   async down(db: Kysely<unknown>) {
//     await db.schema.alterTable('post').dropColumn('hasImage').execute()
//   },
// }

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('post')
      .addColumn('uri', 'varchar(255)', (col) => col.primaryKey())
      .addColumn('cid', 'varchar(255)', (col) => col.notNull())
      .addColumn('indexedAt', 'datetime', (col) => col.notNull())
      .addColumn('text', 'varchar(764)')
      .addColumn('replyParent', 'varchar(255)')
      .addColumn('replyRoot', 'varchar(255)')
      .addColumn('author', 'varchar(255)')
      .addColumn('filterReason', 'varchar(255)')
      .addColumn('hasImage', 'varchar(64)')
      .execute()
    await db.schema
      .createTable('sub_state')
      .addColumn('service', 'varchar(255)', (col) => col.primaryKey())
      .addColumn('cursor', 'integer', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('post').execute()
    await db.schema.dropTable('sub_state').execute()
  },
}