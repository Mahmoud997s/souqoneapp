const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'https://caroneapi-production-255b.up.railway.app/api/v1';

const queries = [
  { name: '1. بحث عادي', url: '/listings?search=' + encodeURIComponent('تويوتا') + '&category=cars' },
  { name: '2. بحث بـ "أ" (ألف بهمزة)', url: '/listings?search=' + encodeURIComponent('أبيض') + '&category=cars' },
  { name: '3. بحث بـ "ا" (ألف بدون همزة)', url: '/listings?search=' + encodeURIComponent('ابيض') + '&category=cars' },
  { name: '4. فلتر الماركة', url: '/listings?brandId=1&category=cars' },
  { name: '5. فلتر السنة', url: '/listings?yearMin=2020&yearMax=2023&category=cars' },
  { name: '6. فلتر السعر', url: '/listings?priceMin=1000&priceMax=5000&category=cars' },
  { name: '7. فلتر الحالة NEW', url: '/listings?condition=NEW&category=cars' },
  { name: '7. فلتر الحالة USED', url: '/listings?condition=USED&category=cars' },
  { name: '8. فلتر نوع الإعلان SALE', url: '/listings?listingType=SALE&category=cars' },
  { name: '8. فلتر نوع الإعلان RENTAL', url: '/listings?listingType=RENTAL&category=cars' },
  { name: '8. فلتر نوع الإعلان WANTED', url: '/listings?listingType=WANTED&category=cars' },
  { name: '9. فلترين مع بعض', url: '/listings?brandId=1&condition=USED&category=cars' },
  { name: '10. صفحة تانية', url: '/listings?category=cars&page=2&limit=10' },
  { name: '10. صفحة أولى (للمقارنة)', url: '/listings?category=cars&page=1&limit=10' }
];

async function run() {
  let output = '<div dir="rtl" style="text-align: right;">\n\n# نتائج اختبار فلاتر قسم السيارات عبر الـ API مباشرة\n\n';
  
  for (const q of queries) {
    const fullUrl = BASE_URL + q.url;
    output += `### ${q.name}\n`;
    output += `- **URL:** \`${decodeURIComponent(fullUrl)}\`\n`;
    
    try {
      const res = await axios.get(fullUrl, { validateStatus: () => true });
      output += `- **Status Code:** \`${res.status}\`\n`;
      
      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        const items = data.items || [];
        const meta = data.meta || {};
        output += `- **Total Count:** \`${meta.totalItems || items.length}\` نتيجة\n`;
        
        if (items.length > 0) {
          const first = items[0];
          output += `- **First Item:** \`[${first.id}] ${first.title} - ${first.price || 'N/A'}\`\n`;
        } else {
          output += `- **First Item:** (لا يوجد نتائج)\n`;
        }
      } else {
        output += `- **Error:** \`${JSON.stringify(res.data)}\`\n`;
      }
    } catch (e) {
      output += `- **Error:** \`${e.message}\`\n`;
    }
    
    output += '\n---\n\n';
  }
  
  output += '</div>';
  fs.writeFileSync('C:/Users/DELL/Desktop/Souqoneapp/docs/session-reports/048_cars_api_filter_test.md', output, 'utf8');
  console.log('Done!');
}

run();
