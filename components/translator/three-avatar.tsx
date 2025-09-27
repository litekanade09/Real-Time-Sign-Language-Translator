"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Box, Sphere, Cylinder } from "@react-three/drei"
import * as THREE from "three"
import PixelBlast from "@/components/ui/pixel-blast"

type Emotion = "neutral" | "happy" | "sad" | "angry" | "surprised" | "confused"
type Gesture = "idle" | "hello" | "thanks" | "help" | "wait" | "repeat" | "yes" | "no"

interface ThreeAvatarProps {
  emotion?: Emotion
  gesture?: Gesture
  isAnimating?: boolean
  className?: string
}

// 3D Head Component
function Head({ emotion, gesture, isAnimating }: { emotion: Emotion; gesture: Gesture; isAnimating: boolean }) {
  const headRef = useRef<THREE.Mesh>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  const mouthRef = useRef<THREE.Mesh>(null)
  const leftEyebrowRef = useRef<THREE.Mesh>(null)
  const rightEyebrowRef = useRef<THREE.Mesh>(null)

  // Emotion-based colors
  const emotionColors = {
    neutral: { skin: "#F4C2A1", eye: "#2C1810", mouth: "#2C1810" },
    happy: { skin: "#F4C2A1", eye: "#2C1810", mouth: "#50C878" },
    sad: { skin: "#E8B4A0", eye: "#2C1810", mouth: "#6B73FF" },
    angry: { skin: "#F4A460", eye: "#FF0000", mouth: "#FF6B6B" },
    surprised: { skin: "#F4C2A1", eye: "#2C1810", mouth: "#FFD93D" },
    confused: { skin: "#E8B4A0", eye: "#2C1810", mouth: "#9B59B6" }
  }

  const colors = emotionColors[emotion]

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    // Breathing animation
    if (headRef.current) {
      headRef.current.scale.y = 1 + Math.sin(time * 2) * 0.02
    }

    // Eye blinking
    if (leftEyeRef.current && rightEyeRef.current) {
      const blink = Math.sin(time * 3) > 0.8 ? 0.1 : 1
      leftEyeRef.current.scale.y = blink
      rightEyeRef.current.scale.y = blink
    }

    // Emotion-based facial expressions
    if (mouthRef.current) {
      switch (emotion) {
        case "happy":
          mouthRef.current.rotation.z = Math.sin(time * 4) * 0.1
          mouthRef.current.scale.y = 1.2
          break
        case "sad":
          mouthRef.current.rotation.z = -0.2
          mouthRef.current.scale.y = 0.8
          break
        case "angry":
          mouthRef.current.rotation.z = Math.sin(time * 8) * 0.05
          mouthRef.current.scale.y = 0.6
          break
        case "surprised":
          mouthRef.current.scale.y = 1.5
          mouthRef.current.scale.x = 0.8
          break
        case "confused":
          mouthRef.current.rotation.z = Math.sin(time * 2) * 0.1
          mouthRef.current.scale.y = 0.9
          break
        default:
          mouthRef.current.rotation.z = 0
          mouthRef.current.scale.y = 1
          mouthRef.current.scale.x = 1
      }
    }

    // Eyebrow expressions
    if (leftEyebrowRef.current && rightEyebrowRef.current) {
      switch (emotion) {
        case "angry":
          leftEyebrowRef.current.rotation.z = -0.3
          rightEyebrowRef.current.rotation.z = 0.3
          break
        case "surprised":
          leftEyebrowRef.current.position.y = 0.8
          rightEyebrowRef.current.position.y = 0.8
          break
        case "sad":
          leftEyebrowRef.current.rotation.z = 0.2
          rightEyebrowRef.current.rotation.z = -0.2
          break
        default:
          leftEyebrowRef.current.rotation.z = 0
          rightEyebrowRef.current.rotation.z = 0
          leftEyebrowRef.current.position.y = 0.6
          rightEyebrowRef.current.position.y = 0.6
      }
    }
  })

  return (
    <group>
      {/* Head */}
      <Sphere ref={headRef} args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color={colors.skin} />
      </Sphere>

      {/* Hair */}
      <Sphere args={[1.05, 32, 32]} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#2C1810" />
      </Sphere>

      {/* Left Eye */}
      <Sphere ref={leftEyeRef} args={[0.1, 16, 16]} position={[-0.3, 0.2, 0.8]}>
        <meshStandardMaterial color={colors.eye} />
      </Sphere>

      {/* Right Eye */}
      <Sphere ref={rightEyeRef} args={[0.1, 16, 16]} position={[0.3, 0.2, 0.8]}>
        <meshStandardMaterial color={colors.eye} />
      </Sphere>

      {/* Left Eyebrow */}
      <Box ref={leftEyebrowRef} args={[0.2, 0.05, 0.05]} position={[-0.3, 0.6, 0.7]}>
        <meshStandardMaterial color="#2C1810" />
      </Box>

      {/* Right Eyebrow */}
      <Box ref={rightEyebrowRef} args={[0.2, 0.05, 0.05]} position={[0.3, 0.6, 0.7]}>
        <meshStandardMaterial color="#2C1810" />
      </Box>

      {/* Mouth */}
      <Box ref={mouthRef} args={[0.3, 0.05, 0.05]} position={[0, -0.3, 0.8]}>
        <meshStandardMaterial color={colors.mouth} />
      </Box>
    </group>
  )
}

// 3D Body Component
function Body({ gesture, isAnimating }: { gesture: Gesture; isAnimating: boolean }) {
  const bodyRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const leftHandRef = useRef<THREE.Mesh>(null)
  const rightHandRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    // Breathing animation
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(time * 2) * 0.01
    }

    // Gesture-based arm animations
    if (leftArmRef.current && rightArmRef.current && leftHandRef.current && rightHandRef.current) {
      const gestureIntensity = isAnimating ? 1 : 0.3
      
      switch (gesture) {
        case "hello":
          leftArmRef.current.rotation.z = Math.sin(time * 3) * 0.5 * gestureIntensity
          rightArmRef.current.rotation.z = -Math.sin(time * 3) * 0.5 * gestureIntensity
          leftHandRef.current.rotation.z = Math.sin(time * 3) * 0.3 * gestureIntensity
          rightHandRef.current.rotation.z = -Math.sin(time * 3) * 0.3 * gestureIntensity
          break
          
        case "thanks":
          leftArmRef.current.rotation.z = 0.8 * gestureIntensity
          rightArmRef.current.rotation.z = -0.8 * gestureIntensity
          leftHandRef.current.rotation.z = 0.5 * gestureIntensity
          rightHandRef.current.rotation.z = -0.5 * gestureIntensity
          break
          
        case "help":
          leftArmRef.current.rotation.z = Math.sin(time * 4) * 0.3 * gestureIntensity
          rightArmRef.current.rotation.z = Math.sin(time * 4) * 0.3 * gestureIntensity
          leftHandRef.current.rotation.z = Math.sin(time * 4) * 0.2 * gestureIntensity
          rightHandRef.current.rotation.z = Math.sin(time * 4) * 0.2 * gestureIntensity
          break
          
        case "wait":
          leftArmRef.current.rotation.z = Math.sin(time * 2) * 0.2 * gestureIntensity
          rightArmRef.current.rotation.z = Math.sin(time * 2) * 0.2 * gestureIntensity
          break
          
        case "repeat":
          leftArmRef.current.rotation.z = Math.sin(time * 6) * 0.4 * gestureIntensity
          rightArmRef.current.rotation.z = -Math.sin(time * 6) * 0.4 * gestureIntensity
          break
          
        case "yes":
          leftArmRef.current.rotation.z = Math.sin(time * 8) * 0.2 * gestureIntensity
          rightArmRef.current.rotation.z = Math.sin(time * 8) * 0.2 * gestureIntensity
          break
          
        case "no":
          leftArmRef.current.rotation.z = Math.sin(time * 8) * 0.3 * gestureIntensity
          rightArmRef.current.rotation.z = -Math.sin(time * 8) * 0.3 * gestureIntensity
          break
          
        default: // idle
          leftArmRef.current.rotation.z = Math.sin(time * 0.5) * 0.1
          rightArmRef.current.rotation.z = Math.sin(time * 0.5) * 0.1
          leftHandRef.current.rotation.z = Math.sin(time * 0.5) * 0.05
          rightHandRef.current.rotation.z = Math.sin(time * 0.5) * 0.05
      }
    }
  })

  return (
    <group>
      {/* Body */}
      <Cylinder ref={bodyRef} args={[0.4, 0.6, 1.5, 8]} position={[0, -1.2, 0]}>
        <meshStandardMaterial color="#4A90E2" />
      </Cylinder>

      {/* Left Arm */}
      <Cylinder ref={leftArmRef} args={[0.08, 0.12, 0.8, 8]} position={[-0.7, -0.8, 0]} rotation={[0, 0, 0.3]}>
        <meshStandardMaterial color="#F4C2A1" />
      </Cylinder>

      {/* Right Arm */}
      <Cylinder ref={rightArmRef} args={[0.08, 0.12, 0.8, 8]} position={[0.7, -0.8, 0]} rotation={[0, 0, -0.3]}>
        <meshStandardMaterial color="#F4C2A1" />
      </Cylinder>

      {/* Left Hand */}
      <Sphere ref={leftHandRef} args={[0.12, 16, 16]} position={[-1.1, -1.2, 0]}>
        <meshStandardMaterial color="#F4C2A1" />
      </Sphere>

      {/* Right Hand */}
      <Sphere ref={rightHandRef} args={[0.12, 16, 16]} position={[1.1, -1.2, 0]}>
        <meshStandardMaterial color="#F4C2A1" />
      </Sphere>
    </group>
  )
}

// Gesture Effects Component
function GestureEffects({ gesture, isAnimating }: { gesture: Gesture; isAnimating: boolean }) {
  const effectsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    if (effectsRef.current && isAnimating) {
      effectsRef.current.rotation.y = time * 0.5
      effectsRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.1)
    }
  })

  if (!isAnimating) return null

  return (
    <group ref={effectsRef}>
      {gesture === "hello" && (
        <Box args={[0.2, 0.2, 0.05]} position={[0, 2, 0]}>
          <meshStandardMaterial color="#FFD700" />
        </Box>
      )}
      
      {gesture === "thanks" && (
        <Sphere args={[0.15]} position={[0, 2, 0]}>
          <meshStandardMaterial color="#FF69B4" />
        </Sphere>
      )}
      
      {gesture === "help" && (
        <Box args={[0.3, 0.1, 0.1]} position={[0, 2, 0]}>
          <meshStandardMaterial color="#FF6B6B" />
        </Box>
      )}
      
      {gesture === "wait" && (
        <Cylinder args={[0.1, 0.1, 0.2]} position={[0, 2, 0]}>
          <meshStandardMaterial color="#FFA500" />
        </Cylinder>
      )}
      
      {gesture === "yes" && (
        <Box args={[0.1, 0.3, 0.1]} position={[0, 2, 0]}>
          <meshStandardMaterial color="#00FF00" />
        </Box>
      )}
      
      {gesture === "no" && (
        <Box args={[0.3, 0.1, 0.1]} position={[0, 2, 0]}>
          <meshStandardMaterial color="#FF0000" />
        </Box>
      )}
      
      {gesture === "repeat" && (
        <Cylinder args={[0.1, 0.1, 0.3]} position={[0, 2, 0]}>
          <meshStandardMaterial color="#00FFFF" />
        </Cylinder>
      )}
    </group>
  )
}

// Main Avatar Component
function Avatar({ emotion, gesture, isAnimating }: { emotion: Emotion; gesture: Gesture; isAnimating: boolean }) {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />
      
      <Head emotion={emotion} gesture={gesture} isAnimating={isAnimating} />
      <Body gesture={gesture} isAnimating={isAnimating} />
      <GestureEffects gesture={gesture} isAnimating={isAnimating} />
    </group>
  )
}

// Main ThreeAvatar Component
export function ThreeAvatar({ 
  emotion = "neutral", 
  gesture = "idle", 
  isAnimating = false,
  className 
}: ThreeAvatarProps) {
  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* PixelBlast Background */}
      <div className="absolute inset-0 -z-10 bg-black">
        <PixelBlast
          variant="circle"
          pixelSize={6}
          color="#B19EEF"
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.6}
          edgeFade={0.25}
          transparent={false}
        />
      </div>
      
      {/* 3D Avatar */}
      <div className="relative z-10">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <Avatar emotion={emotion} gesture={gesture} isAnimating={isAnimating} />
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={3}
            maxDistance={10}
          />
        </Canvas>
      </div>
    </div>
  )
}
