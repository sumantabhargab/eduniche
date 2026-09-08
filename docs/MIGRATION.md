# PadhaiShuru — Migration Guide

## Applying Migrations

### Development

```bash
# Push all local migrations to dev database
npx supabase db push

# Or apply one specific migration
npx supabase db reset
```

### Production

1. Test migration locally first
2. Apply via Supabase Dashboard → SQL Editor
3. Or use CI/CD with Supabase CLI:
```bash
supabase link --project-ref <project-id>
supabase db push
```

## Migration Conventions

- File naming: `YYYYMMDDHHMMSS_description.sql`
- Always include rollback instructions in comments
- Never modify applied migrations — create new ones
- Test on staging before production

## Schema Change Workflow

1. Create migration file in `supabase/migrations/`
2. Update `docs/DATABASE.md`
3. Update affected API routes
4. Run `npx next build` to verify types
5. Test in local Supabase
6. Deploy and apply migration

## Rollback Strategy

For critical migrations, include rollback SQL in comments:

```sql
-- ROLLBACK: DROP TABLE IF EXISTS new_table;
-- ROLLBACK: ALTER TABLE existing_table DROP COLUMN new_col;
```
