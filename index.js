// 📦 XNXX Scraper + Downloader via aria2c (Fixed SSL + Retry)
// Jalankan: npm i axios cheerio

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // ⚠️ Abaikan sertifikat SSL (tidak disarankan untuk produksi)

const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, { timeout: 15000, ...options });
      return response;
    } catch (err) {
      console.warn(`⚠️ Gagal (${i + 1}/${maxRetries}) fetch: ${url}`);
      if (i < maxRetries - 1) await delay(3000);
      else throw err;
    }
  }
}

async function scrapeXNXX(keyword) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/',
      'Cookie': 'age_verified=1; family_filter=0;'
    };

    const searchUrl = `https://www.xnxx.com/search/${encodeURIComponent(keyword)}`;
    console.log('🔍 Mencari:', searchUrl);

    const res = await fetchWithRetry(searchUrl, { headers });
    const $ = cheerio.load(res.data);
    const firstVideo = $('div.mozaique .thumb-inside a').first();
    const videoLink = 'https://www.xnxx.com' + firstVideo.attr('href');
    const thumb = firstVideo.find('img').attr('data-src') || firstVideo.find('img').attr('src');
    const title = firstVideo.find('p.metadata span').text().trim();

    console.log('🎬 Judul:', title);
    console.log('🔗 Link:', videoLink);
    console.log('🖼️ Thumbnail:', thumb);

    const vidRes = await fetchWithRetry(videoLink, { headers });
    const $$ = cheerio.load(vidRes.data);
    const script = $$('script').filter((i, el) => $$(el).html().includes('setVideoUrlHigh')).first().html();
    const mp4Match = script && script.match(/setVideoUrlHigh\('(.*?)'\)/);

    const mp4Url = mp4Match ? mp4Match[1] : null;
    if (mp4Url) {
      console.log('✅ Link MP4:', mp4Url);
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
      const aria2cCmd = `aria2c -x 16 -s 16 -o "${fileName}" "${mp4Url}"`;
      console.log('🚀 Download pakai aria2c...');
      console.log(`📦 Perintah: ${aria2cCmd}`);
      exec(aria2cCmd, (err, stdout, stderr) => {
        if (err) return console.error('❌ Gagal download:', err.message);
        console.log('✅ Download selesai!');
      });
    } else {
      console.log('❌ Tidak ditemukan link .mp4');
    }
  } catch (err) {
    console.error('💥 Gagal scrape:', err.message);
  }
}

scrapeXNXX('bokep jepan');
