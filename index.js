// 📦 XNXX Scraper Lengkap dengan Header & Cookie
// Jalankan: npm i axios cheerio

const axios = require('axios');
const cheerio = require('cheerio');

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

    const res = await axios.get(searchUrl, { headers });
    const $ = cheerio.load(res.data);
    const firstVideo = $('div.mozaique .thumb-inside a').first();
    const videoLink = 'https://www.xnxx.com' + firstVideo.attr('href');
    const thumb = firstVideo.find('img').attr('data-src') || firstVideo.find('img').attr('src');
    const title = firstVideo.find('p.metadata span').text().trim();

    console.log('🎬 Judul:', title);
    console.log('🔗 Link:', videoLink);
    console.log('🖼️ Thumbnail:', thumb);

    const vidRes = await axios.get(videoLink, { headers });
    const $$ = cheerio.load(vidRes.data);
    const script = $$('script').filter((i, el) => $$(el).html().includes('setVideoUrlHigh')).first().html();
    const mp4Match = script.match(/setVideoUrlHigh\('(.*?)'\)/);

    const mp4Url = mp4Match ? mp4Match[1] : null;
    if (mp4Url) {
      console.log('✅ Link MP4:', mp4Url);
    } else {
      console.log('❌ Tidak ditemukan link .mp4');
    }
  } catch (err) {
    console.error('💥 Gagal scrape:', err.message);
  }
}

scrapeXNXX('bocil indo');
