"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage } from "@react-three/drei";

// Este subcomponente es el que carga el archivo .glb
function Model({ url }: { url: string }) {
	const { scene } = useGLTF(url);
	// primitive renderiza el modelo tal cual viene de Blender
	return <primitive object={scene} />;
}

export default function ModelViewer({ modelPath }: { modelPath: string }) {
	return (
		<div className="w-full h-full cursor-grab active:cursor-grabbing">
			<Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
				<Suspense
					fallback={
						// Mientras carga el modelo, mostramos un pequeño texto
						<mesh>
							<sphereGeometry args={[0.5, 32, 32]} />
							<meshBasicMaterial color="#01C38E" wireframe />
						</mesh>
					}>
					{/* Stage nos da una iluminación de estudio profesional automática */}
					<Stage environment="city" intensity={0.2} adjustCamera={1.1}>
						<Model url={modelPath} />
					</Stage>
				</Suspense>

				{/* OrbitControls permite al usuario rotar el objeto con el dedo/mouse */}
				<OrbitControls
					autoRotate
					autoRotateSpeed={2}
					enableZoom={true}
					minDistance={0.6}
					maxDistance={1.2}
					enablePan={false}
					minPolarAngle={Math.PI / 4}
					maxPolarAngle={Math.PI / 1.8}
				/>
			</Canvas>
		</div>
	);
}
