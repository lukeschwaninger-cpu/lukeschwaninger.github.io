const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const ignoredDirs = new Set([".git", "node_modules", "playwright-report", "test-results", "lukeschwaninger.github.io-main"]);
const entryPattern = /<(a|img|script|link)\b[^>]+\b(href|src)=["']([^"'#]+)(?:#[^"']*)?["']/gi;
const imgPattern = /<img\b[^>]*>/gi;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function isExternal(target) {
  return /^(https?:|mailto:|tel:|javascript:|data:)/i.test(target);
}

function fileExists(targetPath) {
  if (fs.existsSync(targetPath)) return true;
  if (!path.extname(targetPath) && fs.existsSync(`${targetPath}.html`)) return true;
  if (fs.existsSync(path.join(targetPath, "index.html"))) return true;
  return false;
}

function resolveTarget(htmlFile, target) {
  if (target.startsWith("/")) {
    return path.join(rootDir, target.replace(/^\/+/, ""));
  }

  return path.resolve(path.dirname(htmlFile), target);
}

const allFiles = walk(rootDir);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));
const failures = [];

for (const htmlFile of htmlFiles) {
  const source = fs.readFileSync(htmlFile, "utf8");

  for (const imageTag of source.match(imgPattern) || []) {
    if (!/\balt=/.test(imageTag)) {
      failures.push(`${path.relative(rootDir, htmlFile)} has an <img> without alt text`);
    }
  }

  for (const match of source.matchAll(entryPattern)) {
    const target = match[3].trim();
    if (!target || isExternal(target)) continue;

    const resolved = resolveTarget(htmlFile, target);
    if (!fileExists(resolved)) {
      failures.push(`${path.relative(rootDir, htmlFile)} references missing ${match[2]}="${target}"`);
    }
  }
}

if (failures.length > 0) {
  console.error("Static link and asset checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files with no broken local links or missing local assets.`);
