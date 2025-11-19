#!/bin/bash

# Generate PDF from Whitepaper
# This script generates a professional PDF version of the Clearo Whitepaper

echo "📄 Generating Clearo Whitepaper PDF..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if required packages are installed
if [ ! -d "node_modules/puppeteer" ] && [ ! -d "node_modules/marked" ]; then
    echo "📦 Installing required packages..."
    npm install puppeteer marked --save-dev
fi

# Run the PDF generation script
node scripts/generate-whitepaper-pdf.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PDF generated successfully!"
    echo "📁 Location: frontend/public/whitepaper.pdf"
    echo ""
    echo "The PDF is now available for download at /whitepaper.pdf"
else
    echo ""
    echo "⚠️  PDF generation failed. You can:"
    echo "   1. Install dependencies: npm install puppeteer marked"
    echo "   2. Use the print page: /whitepaper/print"
    echo "   3. Use online markdown to PDF converters"
fi





