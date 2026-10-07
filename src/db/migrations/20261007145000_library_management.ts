import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('borrowers')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.references('users.id').onDelete('cascade').notNull().unique()
    )
    .addColumn('membership_number', 'varchar(255)', (col) =>
      col.notNull().unique()
    )
    .addColumn('status', 'varchar(255)', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('books')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('isbn', 'varchar(255)', (col) => col.notNull().unique())
    .execute();

  await db.schema
    .createTable('authors')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('bio', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('genres')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('description', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('book_authors')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('book_id', 'integer', (col) =>
      col.references('books.id').onDelete('cascade').notNull()
    )
    .addColumn('author_id', 'integer', (col) =>
      col.references('authors.id').onDelete('cascade').notNull()
    )
    .addUniqueConstraint('book_authors_book_id_author_id_unique', [
      'book_id',
      'author_id',
    ])
    .execute();

  await db.schema
    .createTable('book_genres')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('book_id', 'integer', (col) =>
      col.references('books.id').onDelete('cascade').notNull()
    )
    .addColumn('genre_id', 'integer', (col) =>
      col.references('genres.id').onDelete('cascade').notNull()
    )
    .addUniqueConstraint('book_genres_book_id_genre_id_unique', [
      'book_id',
      'genre_id',
    ])
    .execute();

  await db.schema
    .createTable('loans')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('book_id', 'integer', (col) =>
      col.references('books.id').onDelete('cascade').notNull()
    )
    .addColumn('borrower_id', 'integer', (col) =>
      col.references('borrowers.id').onDelete('cascade').notNull()
    )
    .addColumn('loaned_at', 'timestamp', (col) => col.notNull())
    .addColumn('due_at', 'timestamp', (col) => col.notNull())
    .addColumn('returned_at', 'timestamp')
    .execute();

  await db.schema
    .createIndex('loans_active_book_unique')
    .on('loans')
    .column('book_id')
    .unique()
    .where(sql.ref('returned_at'), 'is', null)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('loans').execute();
  await db.schema.dropTable('book_genres').execute();
  await db.schema.dropTable('book_authors').execute();
  await db.schema.dropTable('genres').execute();
  await db.schema.dropTable('authors').execute();
  await db.schema.dropTable('books').execute();
  await db.schema.dropTable('borrowers').execute();
}
