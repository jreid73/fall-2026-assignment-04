---
name: kysely-migration-generator
description: Use when the user asks to generate a Kysely database migration from a Mermaid ERD (.mmd or .svg in docs/architecture/), or to turn an ER diagram into a TypeScript migration script. Writes a type-safe migration with up and down functions into src/db/migrations/.
---

# Kysely Migration Generator

Translate a Mermaid `erDiagram` into a production-ready Kysely migration.

## Workflow

1. **Read the ERD.** Default to `docs/architecture/schema.mmd`. If only an `.svg` is given, use the `.mmd` next to it.
2. **Read the existing migrations** in `src/db/migrations/` (especially `001_initial_schema.ts`). Match their import
   style, primary key type, timestamp type, and naming. FK column types MUST match the referenced PK type.
3. **Skip existing tables.** Entities marked `%% existing:` in the ERD, or already created by an earlier migration,
   are NOT created and NOT dropped. They can still be referenced by foreign keys.
4. **Write the migration** to `src/db/migrations/<timestamp>_<migration_name>.ts`, where `<timestamp>` is
   `YYYYMMDDHHmmss` (current time) and `<migration_name>` is snake_case, for example
   `20261007140000_library_management.ts`.
5. **Verify.** Run `npm run build`, then `npm run migrate:up`. If either fails, read the error, fix the file, and
   re-run (up to 3 retries). Report the final result to the user.

## Translation rules

- **Entities to tables:** snake_case, plural (`USERS` becomes `users`, `BOOK_AUTHORS` becomes `book_authors`).
- **Primary keys:** `serial` with `.primaryKey()`, matching the existing `users` table.
- **Foreign keys:** `integer` columns with `.references('<parent_table>.id').onDelete('cascade').notNull()`.
  Omit `.notNull()` only if the ERD comment or the user's request says the relationship is optional.
- **Cardinalities:**
  - `||--o{` (one-to-many): FK column on the child table, no unique constraint.
  - `||--o|` (one-to-one): FK column on the child table with `.unique()`.
  - Junction tables (many-to-many): keep the junction's own `id` PK and FK columns as the ERD defines them, and
    add a unique constraint on the pair of FK columns using `.addUniqueConstraint('<table>_<a>_<b>_unique', ['<a>_id', '<b>_id'])`.
- **Types:** `string` becomes `varchar(255)`, `text` becomes `text`, `int` becomes `integer`, `boolean` becomes `boolean`,
  `decimal` becomes `numeric(10, 2)`, `date` becomes `date`, `datetime` becomes `timestamp`.
- **Constraints:** attributes tagged `UK` get `.unique()`. Columns are `.notNull()` by default, except columns the ERD
  comments or the user's request describe as nullable (for example a `returned_at` that is empty until a book is returned).
- **Timestamps:** a `created_at` column defaults to ``sql`NOW()` `` and is `.notNull()`, as in 001.
- **Rules the ERD cannot express:** if the user's request states a constraint Mermaid cannot show (for example "only one
  active loan per book"), implement it in the migration, such as a partial unique index
  `.createIndex('<name>').on('<table>').column('<col>').unique().where('<other_col>', 'is', null)`, and mention it in
  your final answer.
- **Column names:** snake_case, copied from the ERD attribute names.

## File structure (mandatory)

- `import { Kysely, sql } from 'kysely';`
- `export async function up(db: Kysely<any>): Promise<void>` creates tables with **parents first** (dependency order).
- `export async function down(db: Kysely<any>): Promise<void>` drops tables in **reverse dependency order**
  (junction tables and children first, then their parents) with `db.schema.dropTable('<name>').execute()`.
- Only drop tables this migration created. Never drop pre-existing tables such as `users`.
- The file must compile under `tsc --noEmit` with no errors.