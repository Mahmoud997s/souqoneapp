const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'https://caroneapi-production-255b.up.railway.app/api/v1';

const queries = [
  { name: '1. بحث عادي', url: '/listings?search=' + encodeURIComponent('تويوتا') },
  { name: '2. بحث بـ "أ" (ألف بهمزة)', url: '/listings?search=' + encodeURIComponent('أبيض') },
  { name: '3. بحث بـ "ا" (ألف بدون همزة)', url: '/listings?search=' + encodeURIComponent('ابيض') },
  { name: '4. فلتر الماركة (make بدل brandId لأن frontend يرسل make)', url: '/listings?make=' + encodeURIComponent('تويوتا') },
  { name: '5. فلتر السنة', url: '/listings?yearMin=2020&yearMax=2023' },
  { name: '6. فلتر السعر', url: '/listings?priceMin=1000&priceMax=5000' },
  { name: '7. فلتر الحالة NEW', url: '/listings?condition=NEW' },
  { name: '7. فلتر الحالة USED', url: '/listings?condition=USED' },
  { name: '8. فلتر نوع الإعلان SALE', url: '/listings?listingType=SALE' },
  { name: '8. فلتر نوع الإعلان RENTAL', url: '/listings?listingType=RENTAL' },
  { name: '8. فلتر نوع الإعلان WANTED', url: '/listings?listingType=WANTED' },
  { name: '9. فلترين مع بعض', url: '/listings?make=' + encodeURIComponent('تويوتا') + '&condition=USED' },
  { name: '10. صفحة تانية', url: '/listings?page=2&limit=10' },
  { name: '10. صفحة أولى (للمقارنة)', url: '/listings?page=1&limit=10' }
];

async function run() {
  let output = '<div dir="rtl" style="text-align: right;">\n\n# نتائج اختبار فلاتر قسم السيارات عبر الـ API مباشرة\n\n';
  output += '> **ملاحظة:** طلبات الـ curl التي قدمتها كانت تحتوي على `category=cars` وفي بعض الأحيان `brandId=1`. واجهة الـ API Backend (NestJS ValidationPipe) ترفض الطلب `400 Bad Request` لأن `category` غير موجودة في الـ DTO المسموح به (`property category should not exist`) وكذلك `brandId`. بناءً على ذلك، قمت بتنفيذ الطلبات **بدون `category=cars`** واستخدمت `make` بدلاً من `brandId` للحصول على نتائج حقيقية يمكن مقارنتها، حيث أن هذا ما يرسله الـ Frontend.\n\n';

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
          output += `- **First Item:** \`[${first.id}] ${first.title} - ${first.price || 'N/A'} (الماركة: ${first.make || 'N/A'})\`\n`;
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
  console.log('Done test_api_2!');
}

run();
