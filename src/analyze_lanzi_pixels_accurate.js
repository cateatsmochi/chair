import fs from 'fs';

const glb = fs.readFileSync('lanzi1.glb');
const jsonChunkLength = glb.readUInt32LE(12);
const jsonString = glb.toString('utf8', 20, 20 + jsonChunkLength);
const gltf = JSON.parse(jsonString);

console.log('--- GLTF Meshes ---');
console.dir(gltf.meshes, { depth: null });

console.log('--- GLTF Nodes ---');
console.dir(gltf.nodes, { depth: null });

console.log('--- GLTF Materials ---');
console.dir(gltf.materials, { depth: null });
