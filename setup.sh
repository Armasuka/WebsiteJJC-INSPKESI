#!/bin/bash

# 🚗 Jasamarga - Project Setup Script
# Automatic setup script untuk memulai project

echo "🚗 Jasamarga - Setup Script"
echo "=================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
echo "✓ Node.js found: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Create .env if not exists
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    echo "✓ Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials"
else
    echo "✓ .env already exists"
fi
echo ""

# Check database connection
echo "🗄️  Checking database..."
if grep -q "postgresql://" .env; then
    echo "✓ PostgreSQL connection string found in .env"
else
    echo "⚠️  PostgreSQL connection string not found in .env"
    echo "   Please configure DATABASE_URL before migration"
fi
echo ""

echo "=================================="
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Edit .env with your database credentials:"
echo "   DATABASE_URL=postgresql://user:password@host:port/db?schema=public"
echo ""
echo "2. Run Prisma migration:"
echo "   npm run prisma:migrate"
echo ""
echo "3. (Optional) Seed test data:"
echo "   npm run prisma:seed"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Documentation:"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - SETUP_GUIDE.md - Detailed setup instructions"
echo "   - USAGE_GUIDE.md - How to use the system"
echo "   - CONFIG_SUMMARY.md - Technical configuration"
echo ""
echo "🎉 Happy coding!"
