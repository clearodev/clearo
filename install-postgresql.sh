#!/bin/bash

# PostgreSQL Installation Script for Clearo

echo "🔧 Installing PostgreSQL..."

# Detect OS
if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    echo "Detected Debian/Ubuntu system"
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL
    echo "Detected CentOS/RHEL system"
    sudo yum install -y postgresql-server postgresql-contrib
    sudo postgresql-setup --initdb
else
    echo "Unknown system. Please install PostgreSQL manually."
    exit 1
fi

# Start PostgreSQL service
echo "🚀 Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Wait for PostgreSQL to start
sleep 3

# Create database and user
echo "📦 Creating database and user..."
sudo -u postgres psql << EOF
CREATE DATABASE clearo;
CREATE USER wapru WITH PASSWORD 'Wapru168';
GRANT ALL PRIVILEGES ON DATABASE clearo TO wapru;
\q
EOF

echo "✅ PostgreSQL installed and configured!"
echo ""
echo "Database: clearo"
echo "User: wapru"
echo "Password: Wapru168"
echo ""
echo "You can now run: ./start-dev.sh"


