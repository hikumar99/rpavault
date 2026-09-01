const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

module.exports = function(eleventyConfig) {
  // Ensure all course webp images have JPG & PNG Open Graph versions for WhatsApp & social sharing
  eleventyConfig.on("eleventy.before", async () => {
    try {
      const coursesDir = path.join(__dirname, "assets", "images", "courses");
      if (fs.existsSync(coursesDir)) {
        const files = fs.readdirSync(coursesDir).filter(f => f.endsWith(".webp"));
        for (const file of files) {
          const baseName = path.basename(file, ".webp");
          const srcPath = path.join(coursesDir, file);
          const jpgPath = path.join(coursesDir, `${baseName}.jpg`);
          const pngPath = path.join(coursesDir, `${baseName}.png`);

          if (!fs.existsSync(jpgPath)) {
            try {
              execSync(`sips -s format jpeg -s formatOptions 85 "${srcPath}" --out "${jpgPath}"`, { stdio: "ignore" });
            } catch (e) {}
          }
          if (!fs.existsSync(pngPath)) {
            try {
              execSync(`sips -s format png "${srcPath}" --out "${pngPath}"`, { stdio: "ignore" });
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.warn("Could not auto-generate course OG images:", err.message);
    }
  });

  // Pass through static assets and configuration files
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("functions");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("admin");

  // Ignore OLD, backups, templates, and redundant files
  eleventyConfig.ignores.add("OLD/**");
  eleventyConfig.ignores.add("local_backups/**");
  eleventyConfig.ignores.add("scratch/**");
  eleventyConfig.ignores.add("course/template-course-page.html");

  // Custom blog collection sorted by date descending (newest first)
  eleventyConfig.addCollection("blogPosts", function(collectionApi) {
    return [...collectionApi.getFilteredByTag("blog")]
      .filter(a => !a.data.draft)
      .sort((a, b) => {
      const dateA = new Date(a.data.date || a.date);
      const dateB = new Date(b.data.date || b.date);
      return dateB - dateA;
    });
  });
  eleventyConfig.addCollection("courses", function(collectionApi) {
    return [...collectionApi.getFilteredByTag("course")]
      .filter(a => !a.data.draft)
      .sort((a, b) => {
      const liveA = a.data.card_live ? 0 : 1;
      const liveB = b.data.card_live ? 0 : 1;
      if (liveA !== liveB) return liveA - liveB;
      return (a.data.name || a.data.title || "").localeCompare(b.data.name || b.data.title || "");
    });
  });

  // Date filter for blog posts (e.g. "2026-07-30" -> "30 July 2026")
  eleventyConfig.addFilter("dateFilter", function(dateVal) {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  // ISO Date filter for dynamic sitemap.xml (YYYY-MM-DD)
  eleventyConfig.addFilter("isoDate", function(dateVal) {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Strip HTML tags for indexing page contents
  eleventyConfig.addFilter("stripHtml", function(content) {
    if (!content) return "";
    // Remove HTML comments, scripts, styles first
    let clean = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
    // Strip standard HTML tags
    clean = clean.replace(/<[^>]*>/g, " ");
    // Collapse whitespace
    clean = clean.replace(/\s+/g, " ");
    return clean.trim();
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
