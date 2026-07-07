const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/jobs/**/*.tsx');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace <AppHeader title="XYZ" /> with <AppHeader title="XYZ" showBack variant="jobs" />
  content = content.replace(/<AppHeader title="([^"]+)" \/>/g, '<AppHeader title="$1" showBack variant="jobs" />');
  
  // Replace <AppHeader title="XYZ" showBack /> with <AppHeader title="XYZ" showBack variant="jobs" />
  content = content.replace(/<AppHeader title="([^"]+)" showBack \/>/g, '<AppHeader title="$1" showBack variant="jobs" />');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
