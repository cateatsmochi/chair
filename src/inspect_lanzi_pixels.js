import fs from 'fs';
import jpeg from 'jpeg-js';

const jpegData = fs.readFileSync('extracted_texture_accurate.jpeg');
const rawImageData = jpeg.decode(jpegData, { useTArray: true });

console.log('Image dimension:', rawImageData.width, 'x', rawImageData.height);

const data = rawImageData.data;
let totalPixels = rawImageData.width * rawImageData.height;
let countHighSat = 0;
let countLowSat = 0;

let sampleHighSats = [];
let sampleLowSats = [];

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i+1];
  const b = data[i+2];
  
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  
  if (saturation > 15) {
    countHighSat++;
    if (sampleHighSats.length < 5) {
      sampleHighSats.push({ r, g, b, saturation });
    }
  } else {
    countLowSat++;
    if (sampleLowSats.length < 5) {
      sampleLowSats.push({ r, g, b, saturation });
    }
  }
}

console.log('Total pixels:', totalPixels);
console.log('Pixels with saturation > 15:', countHighSat, '(', (countHighSat / totalPixels * 100).toFixed(2), '%)');
console.log('Pixels with saturation <= 15:', countLowSat, '(', (countLowSat / totalPixels * 100).toFixed(2), '%)');

console.log('Sample high-sat pixels:', sampleHighSats);
console.log('Sample low-sat pixels:', sampleLowSats);
