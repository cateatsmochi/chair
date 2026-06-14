const fs = require('fs');

async function main() {
  try {
    const filePath = 'armrest_full.glb';
    const buffer = fs.readFileSync(filePath);
    const chunkLength = buffer.readUInt32LE(12);
    const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
    const gltf = JSON.parse(jsonStr);

    console.log('Materials:');
    gltf.materials.forEach((m, idx) => {
      console.log(`Material ${idx}: Name = "${m.name}"`);
    });

    console.log('\nMeshes & Primitives with Material names:');
    gltf.meshes.forEach((mesh, idx) => {
      console.log(`Mesh ${idx}: "${mesh.name}"`);
      mesh.primitives.forEach((prim, pIdx) => {
        const matName = prim.material !== undefined ? gltf.materials[prim.material].name : 'none';
        const posAccessorIdx = prim.attributes.POSITION;
        const accessor = gltf.accessors[posAccessorIdx];
        console.log(`  Primitive ${pIdx}: Material = "${matName}", Accessor = ${posAccessorIdx}`);
        console.log(`    Min bounds:`, accessor.min);
        console.log(`    Max bounds:`, accessor.max);
        
        // Let's compute local width, depth, height span
        if (accessor.min && accessor.max) {
          const dx = accessor.max[0] - accessor.min[0];
          const dy = accessor.max[1] - accessor.min[1];
          const dz = accessor.max[2] - accessor.min[2];
          console.log(`    Local Dimensions: dx=${dx.toFixed(4)}, dy=${dy.toFixed(4)}, dz=${dz.toFixed(4)}`);
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
}
main();
