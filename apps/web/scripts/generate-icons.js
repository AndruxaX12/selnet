// Скрипт за генериране на PNG икони
// За да работи, трябва да инсталираш: npm install sharp
// Използване: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

console.log('⚠️  За генериране на PNG икони от SVG, моля инсталирай sharp:');
console.log('   npm install sharp');
console.log('');
console.log('Или използвай онлайн инструмент като:');
console.log('   https://cloudconvert.com/svg-to-png');
console.log('');
console.log('Размери за генериране:');
console.log('   - icon-192.png (192x192)');
console.log('   - icon-512.png (512x512)');
console.log('   - maskable-192.png (192x192)');
console.log('   - maskable-512.png (512x512)');
console.log('');
console.log('SVG иконата е на: public/icon.svg');
