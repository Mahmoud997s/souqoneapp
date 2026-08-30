const fs = require('fs');
const path = 'C:/Users/DELL/Desktop/SouqoneWepapp/apps/api/package.json';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('"start:prod": "prisma migrate deploy || echo \\"Prisma migration failed, starting app anyway\\" && node dist/main"', '"start:prod": "prisma migrate deploy && node dist/main"');
fs.writeFileSync(path, content);
