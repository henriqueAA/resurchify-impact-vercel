import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const issn = req.query.issn;
  if (!issn) return res.status(400).json({ error: "ISSN não fornecido" });

  const url = `https://www.resurchify.com/find/?query=${issn}`;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const score = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span.badge-orange"));
    const span = spans.find(el => el.textContent.includes("Impact Score:"));
    return span ? span.textContent.replace("Impact Score:", "").trim() : null;
  });

  await browser.close();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ issn, score });
}