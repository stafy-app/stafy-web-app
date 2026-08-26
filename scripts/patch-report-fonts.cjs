// Regenerates src/assets/fonts/inter-latin-ext-*.woff from the installed @fontsource/inter
// package. Run this after bumping the @fontsource/inter version, or if those asset files are
// ever lost/need reproducing.
//
// WHY this exists: @fontsource's `latin` and `latin-ext` Inter subset files for the same
// weight/style both self-report the identical internal `name` table PostScript name (e.g. both
// "Inter-Bold") — they're the same font, just split by Unicode range for web @font-face
// performance. `@react-pdf/pdfkit`'s font embedder caches/dedupes embedded fonts by that
// internal name (`FontsMixin.font()`'s `this._fontFamilies[this._font.name]` check), so once
// `latin-700-normal.woff` is embedded as "Inter-Bold", `latin-ext-700-normal.woff` silently
// reuses that same embedded (diacritic-free) font object instead of being embedded at all —
// react-pdf/textkit still resolves diacritic glyphs against the `latin-ext` font's own glyph
// indices, but those indices get drawn from `latin`'s glyph table, producing a garbage
// character rather than a blank one. See `src/components/reports/ReportDocument.tsx`'s
// top-of-file comment for the full read on where this is used.
//
// The fix: patch only the `latin-ext` copies' `name` table so they report a distinct internal
// name ("Inter" -> "IntrX"). Nothing else in the font changes — same glyf/cmap/numGlyphs,
// verified by opening both the original and patched file with fontkit and diffing
// numGlyphs/characterSet/hasGlyphForCodePoint for every character this document actually uses.
//
// Usage: node scripts/patch-report-fonts.cjs

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SOURCE_DIR = path.join(__dirname, '..', 'node_modules', '@fontsource', 'inter', 'files');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'fonts');
const FILES = [
  'inter-latin-ext-400-normal.woff',
  'inter-latin-ext-700-normal.woff',
  'inter-latin-ext-400-italic.woff',
  'inter-latin-ext-700-italic.woff',
];

const WOFF_HEADER_SIZE = 44;
const TABLE_ENTRY_SIZE = 20;

function sfntChecksum(buf) {
  // Sum as big-endian uint32 words, padded to a 4-byte boundary with zeros, wrapping mod 2^32.
  const padded = Buffer.alloc(Math.ceil(buf.length / 4) * 4);
  buf.copy(padded);
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) {
    sum = (sum + padded.readUInt32BE(i)) >>> 0;
  }
  return sum >>> 0;
}

function readTableDirectory(buf, numTables) {
  const entries = [];
  for (let i = 0; i < numTables; i++) {
    const off = WOFF_HEADER_SIZE + i * TABLE_ENTRY_SIZE;
    entries.push({
      tag: buf.toString('ascii', off, off + 4),
      offset: buf.readUInt32BE(off + 4),
      compLength: buf.readUInt32BE(off + 8),
      origLength: buf.readUInt32BE(off + 12),
      origChecksum: buf.readUInt32BE(off + 16),
    });
  }
  return entries;
}

// In-place, EQUAL-LENGTH substitution of the ASCII token "Inter" -> "IntrX" inside a
// decompressed 'name' table buffer, for both UTF-16BE (Windows platform) and single-byte
// Mac-Roman string encodings. Same byte length either way (5 ASCII chars, or 5 UTF-16BE code
// units = 10 bytes), so no name-record offset/length in the table's own record array needs to
// change — only the string bytes themselves.
function patchNameToken(buf) {
  const patched = Buffer.from(buf);
  const asciiFrom = Buffer.from('Inter', 'ascii');
  const asciiTo = Buffer.from('IntrX', 'ascii');
  const utf16From = Buffer.from('Inter', 'utf16le').swap16();
  const utf16To = Buffer.from('IntrX', 'utf16le').swap16();
  let replacements = 0;

  let i = 0;
  while ((i = patched.indexOf(utf16From, i)) !== -1) {
    utf16To.copy(patched, i);
    i += utf16To.length;
    replacements++;
  }
  i = 0;
  while ((i = patched.indexOf(asciiFrom, i)) !== -1) {
    asciiTo.copy(patched, i);
    i += asciiTo.length;
    replacements++;
  }
  return { patched, replacements };
}

function patchWoff(inPath, outPath) {
  const buf = fs.readFileSync(inPath);
  const numTables = buf.readUInt16BE(12);
  const entries = readTableDirectory(buf, numTables);

  const nameIdx = entries.findIndex((e) => e.tag === 'name');
  if (nameIdx === -1) throw new Error(`${inPath}: no 'name' table found`);
  const nameEntry = entries[nameIdx];

  const rawTableBytes = buf.subarray(nameEntry.offset, nameEntry.offset + nameEntry.compLength);
  const wasCompressed = nameEntry.compLength < nameEntry.origLength;
  const decompressed = wasCompressed ? zlib.inflateSync(rawTableBytes) : Buffer.from(rawTableBytes);
  if (decompressed.length !== nameEntry.origLength) {
    throw new Error(`${inPath}: decompressed name table length mismatch`);
  }

  const { patched: patchedName, replacements } = patchNameToken(decompressed);
  if (replacements === 0) {
    throw new Error(`${inPath}: no 'Inter' token found in name table — nothing patched`);
  }

  const newChecksum = sfntChecksum(patchedName);
  const compressed = zlib.deflateSync(patchedName);
  const storeCompressed = compressed.length < patchedName.length;
  const newStoredBytes = storeCompressed ? compressed : patchedName;
  const newCompLength = newStoredBytes.length;

  // Rebuild the file in original table order (by original file offset), recomputing each
  // table's start offset since the 'name' table's stored length just changed. Every other
  // table's bytes are copied through unchanged.
  const orderedIdx = entries.map((_, i) => i).sort((a, b) => entries[a].offset - entries[b].offset);
  const newEntries = entries.map((e) => ({ ...e }));

  let cursor = WOFF_HEADER_SIZE + numTables * TABLE_ENTRY_SIZE;
  const dataChunks = [];
  for (const idx of orderedIdx) {
    const isName = idx === nameIdx;
    const srcBytes = isName
      ? newStoredBytes
      : buf.subarray(entries[idx].offset, entries[idx].offset + entries[idx].compLength);
    newEntries[idx].offset = cursor;
    newEntries[idx].compLength = isName ? newCompLength : entries[idx].compLength;
    newEntries[idx].origChecksum = isName ? newChecksum : entries[idx].origChecksum;

    dataChunks.push(srcBytes);
    cursor += srcBytes.length;
    const pad = (4 - (cursor % 4)) % 4;
    if (pad > 0) {
      dataChunks.push(Buffer.alloc(pad));
      cursor += pad;
    }
  }

  const totalLength = cursor;
  const out = Buffer.alloc(totalLength);
  buf.copy(out, 0, 0, WOFF_HEADER_SIZE);
  for (let i = 0; i < numTables; i++) {
    const off = WOFF_HEADER_SIZE + i * TABLE_ENTRY_SIZE;
    out.write(newEntries[i].tag, off, 4, 'ascii');
    out.writeUInt32BE(newEntries[i].offset, off + 4);
    out.writeUInt32BE(newEntries[i].compLength, off + 8);
    out.writeUInt32BE(newEntries[i].origLength, off + 12);
    out.writeUInt32BE(newEntries[i].origChecksum, off + 16);
  }
  let dataCursor = WOFF_HEADER_SIZE + numTables * TABLE_ENTRY_SIZE;
  for (const chunk of dataChunks) {
    chunk.copy(out, dataCursor);
    dataCursor += chunk.length;
  }
  out.writeUInt32BE(totalLength, 8); // header.length; totalSfntSize (offset 16) is unchanged

  fs.writeFileSync(outPath, out);
  return replacements;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const file of FILES) {
  const inPath = path.join(SOURCE_DIR, file);
  const outPath = path.join(OUTPUT_DIR, file);
  const replacements = patchWoff(inPath, outPath);
  console.log(`${file}: ${replacements} name-token replacement(s) -> ${path.relative(process.cwd(), outPath)}`);
}
