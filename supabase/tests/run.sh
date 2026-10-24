#!/usr/bin/env bash
# =============================================================================
# supabase/tests/run.sh: runs the database tests on a throwaway local database
#
# Needs a local PostgreSQL server (not Supabase). Connection details come from
# the standard PG* settings, for example:
#   PGHOST=127.0.0.1 PGPORT=54329 PGUSER=postgres npm run test:db
# It creates a fresh database called fhb_test, runs the tests, then deletes it.
# =============================================================================
set -euo pipefail   # stop at the first error

DB=fhb_test
psql -q -d postgres -c "drop database if exists $DB;"
psql -q -d postgres -c "create database $DB;"
# Remove the throwaway database and its test roles however the run ends.
cleanup() {
  psql -q -d postgres -c "drop database if exists $DB;" >/dev/null
  psql -q -d postgres -c "drop role if exists anon; drop role if exists authenticated; drop role if exists service_role;" >/dev/null
}
trap cleanup EXIT

psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/nudges-table.test.sql
