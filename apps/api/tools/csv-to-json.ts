import * as fs from 'fs';
import * as path from 'path';

/**
 * CSV-to-JSON Conversion Utility
 * Converts a CSV file into structured JSON objects.
 * Handles quoted cells with commas and trims whitespace.
 */
export function parseCsv(csvContent: string): Record<string, string>[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  // Parse header
  const headers = splitCsvLine(lines[0]);

  // Parse data rows
  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Line ${i + 1} column count mismatch: expected ${headers.length}, got ${values.length}`);
      continue;
    }
    const row: Record<string, string> = {};
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = values[h];
    }
    results.push(row);
  }

  return results;
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// Standalone CLI runner
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputPath = args[0] || path.join(__dirname, '../data/sample-tickets.csv');
  const outputPath = args[1] || path.join(__dirname, '../data/sample-tickets.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const rawCsv = fs.readFileSync(inputPath, 'utf-8');
  const jsonData = parseCsv(rawCsv);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`Successfully converted ${jsonData.length} records from ${inputPath} to ${outputPath}`);
}
