// ✅ UPDATED VERSION PUPPETEER + CLOUDFLARE BYPASS ✨
// Pastikan install:
// npm i puppeteer-extra puppeteer-extra-plugin-stealth axios cheerio tough-cookie axios-cookiejar-support

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const axios = require('axios').default;
const cheerio = require('cheerio');
const fs = require('fs');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const baseURL = 'https://wap.bokepmama.sbs';
const jar = new tough.CookieJar();
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  }
}));

async function getSessionAndSearch(keyword) {
  console.log('🔗 Getting cookies session...');
  await client.get(baseURL);

  console.log(`🔍 Searching for keyword: ${keyword}`);
  const res = await client.get(`${baseURL}/?id=${keyword}`);
  const $ = cheerio.load(res.data);
  const links = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/watch/')) {
      links.push(baseURL + href);
    }
  });

  return links;
}

async function getDownloadParam(watchUrl) {
  console.log(`🎬 Visiting: ${watchUrl}`);
  const res = await client.get(watchUrl);
  const $ = cheerio.load(res.data);
  let param = null;

  $('a.btn.btn-primary').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('xtubeid')) {
      const match = href.match(/v=([^&]+)/);
      if (match) param = match[1];
    }
  });

  return param;
}

async function getFinalDownloadLink(param) {
  const waitedUrl = `https://musik-mp3.info/downl0ad.php?v=${encodeURIComponent(param)}`;
  console.log('🧭 Launching Puppeteer with stealth to visit:', waitedUrl);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36');
  await page.goto(waitedUrl, { waitUntil: 'networkidle2', timeout: 0 });
  await page.waitForTimeout(12000); // nunggu muncul tombol dl

  const html = await page.content();
  fs.writeFileSync('download_page.html', html);

  const finalLink = await page.evaluate(() => {
    const link = [...document.querySelectorAll('a')].find(a => a.href.includes('cdn77-vid-mp4.others-cdn.com') && a.href.endsWith('.mp4'));
    return link ? link.href.split('?')[0] : null;
  });

  await browser.close();
  return finalLink;
}

(async () => {
  try {
    const keyword = 'cute';
    const results = await getSessionAndSearch(keyword);
    if (!results.length) throw new Error('No video links found');

    const selected = results[0];
    const param = await getDownloadParam(selected);
    if (!param) throw new Error('Download param not found');

    const final = await getFinalDownloadLink(param);
    if (final) {
      console.log('✅ Final video link:', final);
    } else {
      console.log('❌ No final video link found. Check download_page.html.');
    }
  } catch (err) {
    console.error('💥 Error:', err.message);
  }
})();
