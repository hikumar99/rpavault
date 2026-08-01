module.exports = function(eleventyConfig) {
  // Pass through static assets and configuration files
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("functions");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("admin");

  // Ignore OLD directories and files
  eleventyConfig.ignores.add("OLD/**");

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
