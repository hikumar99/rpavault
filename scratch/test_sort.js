const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '../blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

const posts = files.map(f => {
  const content = fs.readFileSync(path.join(blogDir, f), 'utf-8');
  // Simple regex parser for date frontmatter to avoid external dependency issues
  const match = content.match(/date:\s*["']?([\d-]+)["']?/);
  const dateStr = match ? match[1] : '';
  return {
    filename: f,
    dateStr: dateStr,
    dateObj: new Date(dateStr)
  };
});

console.log('Original posts:');
posts.forEach(p => console.log(`${p.filename} -> ${p.dateStr}`));

console.log('\nSorted posts (dateB - dateA):');
const sorted = [...posts].sort((a, b) => b.dateObj - a.dateObj);
sorted.forEach(p => console.log(`${p.filename} -> ${p.dateStr}`));
