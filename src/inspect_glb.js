import fetch from 'node-fetch';

async function main() {
  for (let num of [1, 2, 3, 7]) {
    console.log(`\n=================== MODEL ${num} ===================`);
    const url = `https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/model${num}-.glb`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed to fetch model ${num}`);
      continue;
    }
    const buffer = await res.arrayBuffer();
    
    const view = new DataView(buffer);
    const chunkLength = view.getUint32(12, true);
    const jsonBytes = new Uint8Array(buffer, 20, chunkLength);
    const decoder = new TextDecoder('utf-8');
    const gltf = JSON.parse(decoder.decode(jsonBytes));
    
    const mats = gltf.materials || [];
    console.log('Materials with details:');
    mats.forEach((m, i) => {
      console.log(`- Material ${i}: ${m.name}`);
      console.log(`  pbrMetallicRoughness:`, JSON.stringify(m.pbrMetallicRoughness));
    });
    
    if (gltf.nodes && gltf.meshes) {
      gltf.nodes.forEach((node, nodeIdx) => {
        if (node.mesh !== undefined) {
          const meshObj = gltf.meshes[node.mesh];
          console.log(`Node ${nodeIdx}: name=${node.name || 'unnamed'} -> Mesh ${node.mesh}: ${meshObj.name}`);
          meshObj.primitives.forEach((p, pIdx) => {
            const matIdx = p.material;
            const matName = matIdx !== undefined && mats[matIdx] ? mats[matIdx].name : 'none';
            console.log(`  Primitive ${pIdx}: materialIndex=${matIdx} name=${matName}`);
          });
        }
      });
    }
  }
}

main().catch(console.error);
