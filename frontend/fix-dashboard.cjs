const fs = require('fs');
const p = require('path');
const f = p.join(__dirname, 'src/components/dashboard/Dashboard.tsx');
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  '        <div className="relative z-10 max-w-[1380px] mx-auto px-6 py-10 flex gap-6">\r',
  '        <div className="relative z-10 max-w-[1380px] mx-auto px-3 sm:px-6 py-6 sm:py-10 flex flex-col lg:flex-row gap-6">\r'
);
c = c.replace(
  '<aside className="w-[240px] shrink-0">\r',
  '<aside className="w-full lg:w-[240px] shrink-0">\r'
);
c = c.replace(
  '          <aside className="w-[210px] shrink-0">\r',
  '          <aside className="w-full lg:w-[210px] shrink-0">\r'
);
c = c.replace(
  '            <div className="relative mb-8">\r',
  '            <div className="relative mb-6 sm:mb-8">\r'
);
c = c.replace(
  '            <div className="flex items-center gap-2 mb-6">\r',
  '            <div className="flex items-center gap-2 mb-4 sm:mb-6">\r'
);
c = c.replace(
  '            <div className="flex items-center gap-2 mb-4">\r',
  '            <div className="flex items-center gap-2 mb-3 sm:mb-4">\r'
);

fs.writeFileSync(f, c, 'utf8');
console.log('Dashboard.tsx updated');
