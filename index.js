// 💥 FINAL VERSION: BYPASS CLOUDFLARE EXTRA MODE
// install dulu semua dependensi:
// npm i puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-extra-plugin-user-preferences axios cheerio tough-cookie axios-cookiejar-support fs

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserPrefs = require('puppeteer-extra-plugin-user-preferences');
puppeteer.use(StealthPlugin());
puppeteer.use(UserPrefs({
  userPrefs: {
    credentials_enable_service: false,
    profile: {
      password_manager_enabled: false
    }
  }
}));

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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': baseURL
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

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  console.log('⏳ Navigating to waited link...');
  await page.goto(waitedUrl, { waitUntil: 'domcontentloaded', timeout: 0 });
  await page.waitForTimeout(15000); // tunggu 15 detik

  const html = await page.content();
  fs.writeFileSync('download_page.html', html);

  const finalLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const match = links.find(a => a.href.includes('cdn77-vid-mp4.others-cdn.com') && a.href.endsWith('.mp4'));
    return match ? match.href.split('?')[0] : null;
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
