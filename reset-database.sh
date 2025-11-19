#!/bin/bash
# Database Reset Script for Clearo
# This script drops all tables and reinitializes the database

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-opazero}"
DB_USER="${DB_USER:-wapru}"
DB_PASSWORD="${DB_PASSWORD:-Wapru168}"

echo "🔄 Resetting database: $DB_NAME"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Stop backend temporarily
echo "⏸️  Stopping backend..."
pm2 stop clearo-backend || true

# Wait a moment for connections to close
sleep 2

# Drop all tables in correct order (respecting foreign keys)
echo "🗑️  Dropping all tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Disable foreign key checks temporarily by dropping constraints
DO \$\$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all foreign key constraints
    FOR r IN (SELECT conname, conrelid::regclass 
              FROM pg_constraint 
              WHERE contype = 'f' 
              AND connamespace = 'public'::regnamespace)
    LOOP
        EXECUTE 'ALTER TABLE ' || r.conrelid || ' DROP CONSTRAINT ' || r.conname;
    END LOOP;
    
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
EOF

echo "✅ All tables dropped"

# Restart backend (it will automatically reinitialize the database)
echo "🔄 Restarting backend to reinitialize schema..."
pm2 restart clearo-backend

# Wait for backend to start
sleep 3

# Check if backend is running
if pm2 list | grep -q "clearo-backend.*online"; then
    echo "✅ Backend restarted successfully"
    echo "✅ Database reset complete!"
else
    echo "⚠️  Warning: Backend may not have started correctly. Check logs with: pm2 logs clearo-backend"
fi

# Unset password
unset PGPASSWORD

echo ""
echo "📊 Database reset complete. All tables have been recreated with fresh schema."

