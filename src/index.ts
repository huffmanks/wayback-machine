import * as puppeteer from "puppeteer";
import xml2js from "xml2js";
import fs from "fs-extra";
import path from "path";

const sitemapUrl = process.env.SITEMAP_URL;
const websiteName = new URL(sitemapUrl).hostname;

const getTodaysDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const fetchSitemapUrls = async (sitemapUrl: string) => {
  try {
    const response = await fetch(sitemapUrl);
    console.log("response__", response);
    const data = await response.text();
    console.log("data__", data);
    const sitemap = await xml2js.parseStringPromise(data);
    const urls = sitemap.urlset.url.map((u) => u.loc[0]);
    return urls;
  } catch (error) {
    console.error(`Failed to fetch or parse sitemap: ${error}`);
    return [];
  }
};

const captureSnapshot = async (url: string, browser: puppeteer.Browser) => {
  console.log(`Capturing: ${url}`);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  // Define directory structure
  const dateDir = getTodaysDate();
  const fileName = url.split("/").pop().replace(/[\/:]/g, "_") + ".html"; // Simplified file naming
  const dirPath = path.join(__dirname, "snapshots", dateDir, websiteName);

  await fs.ensureDir(dirPath);

  // Save HTML content
  let content = await page.content();
  // Here you could modify `content` to ensure local navigation works. This might involve replacing URLs in the content, etc.
  await fs.writeFile(path.join(dirPath, fileName), content);

  // Save a screenshot
  await page.screenshot({ path: path.join(dirPath, fileName.replace(".html", ".png")) });

  await page.close();
};

(async () => {
  const urls = await fetchSitemapUrls(sitemapUrl);
  const browser = await puppeteer.launch();

  for (let url of urls) {
    await captureSnapshot(url, browser);
  }

  await browser.close();
})();
