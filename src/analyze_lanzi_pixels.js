import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';

const url = 'https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/lanzi1.glb';
const file = fs.createWriteStream("lanzi1.glb");

https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', () => {
    console.log("Downloaded lanzi1.glb");
    
    // Read the GLB
    const glbBuffer = fs.readFileSync("lanzi1.glb");
    
    // Parse GLB format
    // GLB starts with a 12-byte header: magic (4 bytes), version (4 bytes), length (4 bytes)
    const magic = glbBuffer.toString('utf8', 0, 4);
    if (magic !== 'glTF') {
      console.log("Not a valid glTF file");
      return;
    }
    
    // We can run a short node snippet to find PNG or JPEG buffers in the GLB
    let idx = 0;
    const images = [];
    while (idx < glbBuffer.length - 4) {
      // Look for JPEG SOI (FFD8) or PNG signature (89504E47)
      if (glbBuffer[idx] === 0xFF && glbBuffer[idx+1] === 0xD8) {
        // Find next JPEG EOI (FFD9)
        let endIdx = idx + 2;
        while (endIdx < glbBuffer.length - 2) {
          if (glbBuffer[endIdx] === 0xFF && glbBuffer[endIdx+1] === 0xD9) {
            endIdx += 2;
            break;
          }
          endIdx++;
        }
        images.push({ type: 'jpeg', start: idx, end: endIdx });
        idx = endIdx;
      } else if (glbBuffer[idx] === 0x89 && glbBuffer[idx+1] === 0x50 && glbBuffer[idx+2] === 0x4E && glbBuffer[idx+3] === 0x47) {
        // Find logical end of PNG or arbitrary length (PNG ends with IEND chunk block)
        let endIdx = idx + 8;
        while (endIdx < glbBuffer.length - 4) {
          if (glbBuffer.toString('utf8', endIdx, endIdx + 4) === 'IEND') {
            endIdx += 8; // chunk size + CRC
            break;
          }
          endIdx++;
        }
        images.push({ type: 'png', start: idx, end: endIdx });
        idx = endIdx;
      } else {
        idx++;
      }
    }
    
    console.log(`Found ${images.length} images inside GLB`);
    if (images.length > 0) {
      const img = images[0];
      const imgBuffer = glbBuffer.subarray(img.start, img.end);
      fs.writeFileSync(`extracted_texture.${img.type}`, imgBuffer);
      console.log(`Saved extracted_texture.${img.type} of size ${imgBuffer.length} bytes`);
    }
  });
});
