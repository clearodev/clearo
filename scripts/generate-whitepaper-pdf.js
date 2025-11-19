#!/usr/bin/env node

/**
 * Generate PDF from Whitepaper Markdown
 * 
 * This script converts the WHITEPAPER.md file to a professional PDF document.
 * 
 * Requirements:
 * - npm install -g markdown-pdf puppeteer
 * - Or use: npm install markdown-pdf puppeteer
 * 
 * Usage:
 *   node scripts/generate-whitepaper-pdf.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WHITEPAPER_MD = path.join(__dirname, '..', 'WHITEPAPER.md');
const OUTPUT_PDF = path.join(__dirname, '..', 'frontend', 'public', 'whitepaper.pdf');
const OUTPUT_HTML = path.join(__dirname, '..', 'frontend', 'public', 'whitepaper-print.html');

// Check if markdown-pdf is available
function checkDependencies() {
  try {
    require.resolve('markdown-pdf');
    require.resolve('puppeteer');
    return true;
  } catch (e) {
    console.error('Missing dependencies. Installing...');
    console.log('Run: npm install markdown-pdf puppeteer');
    return false;
  }
}

// Generate PDF using markdown-pdf
function generatePDFWithMarkdownPdf() {
  const markdownPdf = require('markdown-pdf');
  
  const options = {
    paperFormat: 'A4',
    paperOrientation: 'portrait',
    paperBorder: '2cm',
    renderDelay: 1000,
    cssPath: path.join(__dirname, 'whitepaper-pdf.css'),
    preProcessHtml: function(html) {
      // Add custom styling
      return html.replace(
        '<head>',
        `<head>
        <style>
          @page {
            margin: 2cm;
            @top-center {
              content: "Clearo Whitepaper";
              font-size: 10pt;
              color: #64748b;
            }
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 10pt;
              color: #64748b;
            }
          }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 100%;
          }
          h1 {
            color: #2b76f0;
            border-bottom: 3px solid #2b76f0;
            padding-bottom: 10px;
            margin-top: 30px;
          }
          h2 {
            color: #0f172a;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 25px;
          }
          h3 {
            color: #1e293b;
            margin-top: 20px;
          }
          code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
          }
          pre {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
          }
          blockquote {
            border-left: 4px solid #2b76f0;
            padding-left: 15px;
            margin-left: 0;
            color: #475569;
            font-style: italic;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 10px;
            text-align: left;
          }
          th {
            background: #eff6ff;
            color: #0f172a;
            font-weight: bold;
          }
        </style>`
      );
    }
  };

  return new Promise((resolve, reject) => {
    markdownPdf(options)
      .from(WHITEPAPER_MD)
      .to(OUTPUT_PDF, () => {
        console.log(`✅ PDF generated successfully: ${OUTPUT_PDF}`);
        resolve();
      });
  });
}

// Alternative: Generate PDF using Puppeteer (more control)
async function generatePDFWithPuppeteer() {
  const puppeteer = require('puppeteer');
  const markdown = fs.readFileSync(WHITEPAPER_MD, 'utf8');
  
  // Convert markdown to HTML (simple conversion)
  // In production, use a proper markdown parser like marked or markdown-it
  const marked = require('marked');
  const html = marked.parse(markdown);

  // Create full HTML document
  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clearo Whitepaper</title>
  <style>
    @page {
      margin: 2cm;
      @top-center {
        content: "Clearo Whitepaper - Version 1.0";
        font-size: 9pt;
        color: #64748b;
        font-family: Arial, sans-serif;
      }
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #64748b;
        font-family: Arial, sans-serif;
      }
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.8;
      color: #1a1a1a;
      max-width: 100%;
      padding: 0;
      margin: 0;
    }
    h1 {
      color: #2b76f0;
      border-bottom: 3px solid #2b76f0;
      padding-bottom: 15px;
      margin-top: 40px;
      margin-bottom: 20px;
      font-size: 2.5em;
    }
    h2 {
      color: #0f172a;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin-top: 35px;
      margin-bottom: 15px;
      font-size: 2em;
      page-break-after: avoid;
    }
    h3 {
      color: #1e293b;
      margin-top: 25px;
      margin-bottom: 12px;
      font-size: 1.5em;
      page-break-after: avoid;
    }
    h4 {
      color: #334155;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 1.2em;
    }
    p {
      margin-bottom: 12px;
      text-align: justify;
    }
    ul, ol {
      margin-bottom: 15px;
      padding-left: 30px;
    }
    li {
      margin-bottom: 8px;
    }
    code {
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #e11d48;
    }
    pre {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 15px 0;
    }
    pre code {
      background: transparent;
      padding: 0;
      color: #1a1a1a;
    }
    blockquote {
      border-left: 4px solid #2b76f0;
      padding-left: 20px;
      margin-left: 0;
      margin-right: 0;
      color: #475569;
      font-style: italic;
      background: #f8fafc;
      padding: 15px 20px;
      margin: 20px 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 25px 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #eff6ff;
      color: #0f172a;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    strong {
      color: #0f172a;
      font-weight: 600;
    }
    a {
      color: #2b76f0;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 30px 0;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
  `;

  // Save HTML for preview
  fs.writeFileSync(OUTPUT_HTML, fullHTML);
  console.log(`✅ HTML generated: ${OUTPUT_HTML}`);

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    margin: {
      top: '2cm',
      right: '2cm',
      bottom: '2cm',
      left: '2cm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 9pt; color: #64748b; width: 100%; text-align: center; padding: 0 2cm;">Clearo Whitepaper - Version 1.0</div>',
    footerTemplate: '<div style="font-size: 9pt; color: #64748b; width: 100%; text-align: center; padding: 0 2cm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });

  await browser.close();
  console.log(`✅ PDF generated successfully: ${OUTPUT_PDF}`);
}

// Main execution
async function main() {
  console.log('📄 Generating Clearo Whitepaper PDF...\n');
  
  // Ensure public directory exists
  const publicDir = path.dirname(OUTPUT_PDF);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  try {
    // Try Puppeteer first (better quality)
    if (checkDependencies()) {
      await generatePDFWithPuppeteer();
    } else {
      console.log('\n⚠️  Using alternative method...');
      console.log('Please install dependencies:');
      console.log('  npm install puppeteer marked');
      console.log('\nOr use online markdown to PDF converters.');
    }
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    console.log('\nAlternative: Use the print-optimized HTML page and print to PDF from browser.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generatePDFWithPuppeteer, generatePDFWithMarkdownPdf };





