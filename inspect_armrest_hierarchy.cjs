const https = require('https');

function fetchGLB(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const magic = buffer.readUInt32LE(0);
        if (magic !== 0x46546C67) {
          reject(new Error('Not a GLB file'));
          return;
        }
        const chunkLength = buffer.readUInt32LE(12);
        const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
        resolve(JSON.parse(jsonStr));
      });
      res.on('error', reject);
    });
  });
}

async function main() {
  try {
    const url = 'https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/%E6%89%B6%E6%89%8B%E6%A4%85.glb';
    const gltf = await fetchGLB(url);
    console.log('Nodes structure:');
    gltf.nodes.forEach((n, i) => {
      console.log(`Node ${i}:`, JSON.stringify(n));
    });
    if (gltf.materials) {
      console.log('Materials:');
      gltf.materials.forEach((m, i) => {
        console.log(`Material ${i}:`, m.name);
      });
    }
  } catch (err) {
    console.error(err);
  }
}
main();
