module.exports = function(eleventyConfig) {
  // Pass through static assets and configuration files
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("functions");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("admin");

  // Ignore OLD, backups, templates, and redundant files
  eleventyConfig.ignores.add("OLD/**");
  eleventyConfig.ignores.add("local_backups/**");
  eleventyConfig.ignores.add("scratch/**");
  eleventyConfig.ignores.add("course/template-course-page.html");

  // Custom blog collection sorted by date descending (newest first)
  eleventyConfig.addCollection("blogPosts", function(collectionApi) {
    return [...collectionApi.getFilteredByTag("blog")].sort((a, b) => {
      const dateA = new Date(a.data.date || a.date);
      const dateB = new Date(b.data.date || b.date);
      return dateB - dateA;
    });
  });
  eleventyConfig.addCollection("courses", function(collectionApi) {
    return [...collectionApi.getFilteredByTag("course")].sort((a, b) => {
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
