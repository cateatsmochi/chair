import fetch from 'node-fetch';

async function main() {
  const urlMap = {
    'LANZI': 'https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/lanzi1.glb',
    'PINK_BLUE': 'https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/%E7%B2%89%E8%93%9D2.glb',
    'MODEL1': 'https://raw.githubusercontent.com/cateatsmochi/blender-model/refs/heads/main/model1-.glb'
  };

  for (let [name, url] of Object.entries(urlMap)) {
    console.log(`\n=================== ${name} ===================`);
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed to fetch ${name}`);
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
