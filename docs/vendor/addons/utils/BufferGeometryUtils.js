import {
	BufferAttribute,
	BufferGeometry,
	Float32BufferAttribute,
	InstancedBufferAttribute,
	InterleavedBuffer,
	InterleavedBufferAttribute,
	TriangleFanDrawMode,
	TriangleStripDrawMode,
	TrianglesDrawMode,
	Vector3
} from 'three';

function toTrianglesDrawMode( geometry, drawMode ) {
	if ( drawMode === TrianglesDrawMode ) {
		console.warn( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.' );
		return geometry;
	}

	if ( drawMode === TriangleFanDrawMode || drawMode === TriangleStripDrawMode ) {
		let index = geometry.getIndex();
		// convert to non-indexed if indexed
		if ( index !== null ) {
			geometry = geometry.toNonIndexed();
		}
		const numberOfVertices = geometry.attributes.position.count;
		if ( numberOfVertices >= 3 ) {
			const newIndices = [];
			if ( drawMode === TriangleFanDrawMode ) {
				for ( let i = 1; i < numberOfVertices - 1; i ++ ) {
					newIndices.push( 0, i, i + 1 );
				}
			} else {
				for ( let i = 0; i < numberOfVertices - 2; i ++ ) {
					if ( i % 2 === 0 ) {
						newIndices.push( i, i + 1, i + 2 );
					} else {
						newIndices.push( i + 1, i, i + 2 );
					}
				}
			}
			geometry.setIndex( newIndices );
			geometry.clearGroups();
		}
		return geometry;
	} else {
		console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', drawMode );
		return geometry;
	}
}

export { toTrianglesDrawMode };
