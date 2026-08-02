const getCsvUrl = (configId) => {
  if (configId.startsWith('http')) {
    let url = configId.replace('/pubhtml', '/pub');
    if (url.includes('?')) {
      if (!url.includes('output=csv')) {
        url += '&output=csv';
      }
    } else {
      url += '?output=csv';
    }
    return url;
  }
  return `https://docs.google.com/spreadsheets/d/${configId}/pub?output=csv`;
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

module.exports = async function() {
  const settings = require("./settings.json");
  const sheetId = settings.redirects?.google_sheet_id;
  
  if (!sheetId) {
    console.warn("No redirects.google_sheet_id found in settings.json. Skipping redirects generation.");
    return [];
  }
  
  const csvUrl = getCsvUrl(sheetId);
  
  try {
    console.log(`[Eleventy Redirects Generator] Fetching redirects database from Google Sheet...`);
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const slugIdx = headers.indexOf('slug');
    const urlIdx = headers.indexOf('target url');
    const typeIdx = headers.indexOf('type');
    
    const getColVal = (cols, primaryIdx, fallbackIdx) => {
      if (primaryIdx !== -1 && cols[primaryIdx] && cols[primaryIdx].trim() !== '') {
        return cols[primaryIdx].trim();
      }
      if (fallbackIdx !== -1 && cols[fallbackIdx] && cols[fallbackIdx].trim() !== '') {
        return cols[fallbackIdx].trim();
      }
      return '';
    };

    if (slugIdx === -1 || urlIdx === -1) {
      console.warn("Spreadsheet is missing required headers 'Slug' or 'Target URL'. Skipping generation.");
      return [];
    }
    
    const redirects = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseCSVLine(lines[i]);
      if (cols.length <= Math.max(slugIdx, urlIdx)) continue;
      
      const slug = cols[slugIdx].trim().toLowerCase();
      if (!slug) continue;
      
      redirects.push({
        slug: slug,
        url: cols[urlIdx].trim(),
        type: typeIdx !== -1 && cols[typeIdx] ? cols[typeIdx].trim().toLowerCase() : 'direct',
        title: getColVal(cols, headers.indexOf('preview title'), headers.indexOf('title')) || 'RPAVault Redirect',
        description: getColVal(cols, headers.indexOf('preview description'), headers.indexOf('description')) || 'Click to open redirect link.',
        image: getColVal(cols, headers.indexOf('preview image'), headers.indexOf('image')) || 'https://rpavault.com/assets/images/og-image.png'
      });
    }
    
    console.log(`[Eleventy Redirects Generator] Generated ${redirects.length} static redirect paths.`);
    return redirects;
  } catch (error) {
    console.error("[Eleventy Redirects Generator] Failed to fetch redirects during build:", error.message);
    // Return empty array to prevent build failure when offline
    return [];
  }
};
