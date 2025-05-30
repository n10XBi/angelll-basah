// 🚫 WARNING: This script accesses adult content. Use responsibly.
// ⚠️ For educational/research purposes only. Jangan disalahgunakan yawww 😬

const puppeteer = require('puppeteer');
const axios = require('axios').default;
const cheerio = require('cheerio');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const fs = require('fs');

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
  console.log('🔗 Visiting home page to get session & cookies...');
  await client.get(baseURL);

  console.log(`🔍 Searching for: ${keyword}`);
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

async function getDownloadParamFromWatchPage(watchUrl) {
  console.log(`🎬 Visiting video page: ${watchUrl}`);
  const res = await client.get(watchUrl);
  const $ = cheerio.load(res.data);
  let param = null;

  $('a.btn.btn-primary').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('oload.host') && href.includes('xtubeid')) {
      const match = href.match(/v=([^&]+)/);
      if (match) param = match[1];
    }
  });

  return param;
}

async function getFinalVideoLinkUsingBrowser(waitedUrl) {
  console.log(`🧭 Launching headless browser to visit: ${waitedUrl}`);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36');

  await page.goto(waitedUrl, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(10000); // wait 10 detik kayak countdown

  const content = await page.content();
  fs.writeFileSync('download_page.html', content);

  const finalLink = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a')];
    const mp4 = links.find(link => link.href.includes('cdn77-vid-mp4.others-cdn.com') && link.href.endsWith('.mp4'));
    return mp4 ? mp4.href.split('?')[0] : null;
  });

  await browser.close();
  return finalLink;
}

(async () => {
  try {
    const keyword = 'cute';
    const videoLinks = await getSessionAndSearch(keyword);
    console.log('🎥 Found video links:', videoLinks);

    if (!videoLinks.length) throw new Error('No video links found');

    const selected = videoLinks[0];
    const param = await getDownloadParamFromWatchPage(selected);
    if (!param) throw new Error('Download param not found');

    const waitedUrl = `https://musik-mp3.info/downl0ad.php?v=${encodeURIComponent(param)}`;
    const finalVideoLink = await getFinalVideoLinkUsingBrowser(waitedUrl);

    if (finalVideoLink) {
      console.log('✅ Final video link:', finalVideoLink);
    } else {
      console.log('❌ Failed to retrieve final video link. Check download_page.html for debug.');
    }
  } catch (err) {
    console.error('💥 Error:', err.message);
  }
})();
