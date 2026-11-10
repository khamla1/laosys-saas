"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Activity,
  Cpu,
  Sliders,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Gauge,
  Compass,
  ChevronDown,
  Tag,
  Power,
  X,
  Home,
  Layers,
  ShieldAlert,
} from "lucide-react";

export type MachineCategory =
  | "ROBOT"
  | "CONVEYOR"
  | "WRAPPER"
  | "SCANNER"
  | "SORTER"
  | "PACKAGER"
  | "INSPECTOR"
  | "STORAGE"
  | "AGV";

export type RoofMode = "VISIBLE" | "TRANSPARENT" | "HIDDEN";

export interface MachineStatusInfo {
  id: string;
  name: string;
  code: string;
  zone: string;
  category: MachineCategory;
  running: boolean;
  speed: number;
  throughput: number;
  cycleTimeSec: number;
  powerKw: number;
  temperatureC: number;
  description: string;
  position: [number, number, number];
  cameraView: {
    pos: [number, number, number];
    target: [number, number, number];
  };
}

const INITIAL_MACHINES: MachineStatusInfo[] = [
  {
    id: "ROBOT-01",
    name: "Robotic Palletizer & Transfer Arm #1",
    code: "RBT-6AX-01",
    zone: "Zone A • Central Core",
    category: "ROBOT",
    running: true,
    speed: 1.0,
    throughput: 428,
    cycleTimeSec: 4.2,
    powerKw: 7.8,
    temperatureC: 46.5,
    description:
      "Heavy-duty 6-axis yellow articulated industrial robot with multi-zone vacuum gripper. Transfers cartons between the central pallet spur and the lower-left dual-lane package conveyor loop.",
    position: [-5.8, 2.5, 1.8],
    cameraView: {
      pos: [-12.5, 8.2, 9.2],
      target: [-5.5, 1.6, 2.0],
    },
  },
  {
    id: "ROBOT-02",
    name: "High-Speed Multi-Pick Palletizer Arm #2",
    code: "RBT-6AX-02",
    zone: "Zone A • Central Core",
    category: "ROBOT",
    running: true,
    speed: 1.0,
    throughput: 612,
    cycleTimeSec: 3.6,
    powerKw: 8.4,
    temperatureC: 48.2,
    description:
      "Upper-center 6-axis yellow robotic palletizer mounted on an elevated steel pedestal. Picks grouped cartons from the upper infeed conveyor and builds multi-layer unit loads on wooden pallets.",
    position: [0.35, 2.8, -5.1],
    cameraView: {
      pos: [-4.8, 8.5, -0.2],
      target: [0.4, 2.0, -4.5],
    },
  },
  {
    id: "CONV-UPPER",
    name: "Upper Infeed & Accumulator Conveyor Line",
    code: "CNV-INF-101",
    zone: "Zone A • Central Core",
    category: "CONVEYOR",
    running: true,
    speed: 1.0,
    throughput: 1240,
    cycleTimeSec: 1.8,
    powerKw: 3.2,
    temperatureC: 38.0,
    description:
      "Elevated motorized roller conveyor feeding cardboard cartons from the eastern barcode scanning hub toward the sorting diverter spur and Robot Arm #2 pickup buffer.",
    position: [5.5, 1.4, -7.2],
    cameraView: {
      pos: [9.0, 8.2, -1.2],
      target: [4.5, 1.0, -6.5],
    },
  },
  {
    id: "SORT-01",
    name: "Optical Barcode Scanner & Pneumatic Diverter",
    code: "SRT-OPT-204",
    zone: "Zone A • Central Core",
    category: "SORTER",
    running: true,
    speed: 1.0,
    throughput: 980,
    cycleTimeSec: 1.5,
    powerKw: 1.9,
    temperatureC: 35.4,
    description:
      "High-speed photoelectric laser gate and motorized sorting arm that routes incoming cartons between the accumulator spur and the primary robotic palletizing feed.",
    position: [4.8, 1.8, -7.2],
    cameraView: {
      pos: [7.2, 6.2, -1.8],
      target: [4.5, 1.2, -6.2],
    },
  },
  {
    id: "SCAN-01",
    name: "Automatic Carton Erector & Dimensioning Portal",
    code: "SCN-GNT-301",
    zone: "Zone A • Central Core",
    category: "SCANNER",
    running: true,
    speed: 1.0,
    throughput: 315,
    cycleTimeSec: 5.0,
    powerKw: 4.5,
    temperatureC: 41.0,
    description:
      "White twin-arch industrial gantry performing automated vertical strapping, optical dimension verification, and pallet stabilization on incoming loads from the west packaging line.",
    position: [-7.8, 2.5, -1.8],
    cameraView: {
      pos: [-13.5, 7.8, 4.2],
      target: [-7.8, 1.6, -1.8],
    },
  },
  {
    id: "CONV-MAIN",
    name: "Central Heavy-Duty Pallet Roller Spine",
    code: "CNV-PLT-400",
    zone: "Zone A • Central Core",
    category: "CONVEYOR",
    running: true,
    speed: 1.0,
    throughput: 540,
    cycleTimeSec: 3.0,
    powerKw: 6.4,
    temperatureC: 43.1,
    description:
      "Heavy-duty galvanized steel roller conveyor network with 90-degree cross-transfer modules, yellow safety side guards, and automated pallet buffering zones.",
    position: [-0.8, 1.2, -1.8],
    cameraView: {
      pos: [-4.5, 9.8, 6.8],
      target: [-0.8, 0.9, -1.8],
    },
  },
  {
    id: "WRAP-01",
    name: "KAUFMAN Rotary Ring Stretch-Film Wrapper",
    code: "WRP-KFM-500",
    zone: "Zone A • Central Core",
    category: "WRAPPER",
    running: true,
    speed: 1.0,
    throughput: 290,
    cycleTimeSec: 6.5,
    powerKw: 9.2,
    temperatureC: 49.0,
    description:
      "Four-post black structural steel portal stretch wrapper featuring a motorized rotary ring, vertical film carriage mast, top platen stabilizer, and automatic film cut-and-seal.",
    position: [6.4, 3.2, -1.8],
    cameraView: {
      pos: [9.5, 7.8, 5.8],
      target: [6.4, 2.0, -1.8],
    },
  },
  {
    id: "CONV-LOWER",
    name: "Lower-Left Dual-Lane Package Sorting Loop",
    code: "CNV-OUT-602",
    zone: "Zone A • Central Core",
    category: "CONVEYOR",
    running: true,
    speed: 1.0,
    throughput: 860,
    cycleTimeSec: 2.1,
    powerKw: 3.8,
    temperatureC: 39.2,
    description:
      "U-shaped twin-lane roller conveyor system in the southwest dispatch zone. Receives cartons from Robot Arm #1 and transports sorted packages toward outbound sealing.",
    position: [-7.5, 1.2, 4.8],
    cameraView: {
      pos: [-13.2, 7.8, 11.2],
      target: [-7.5, 0.9, 4.8],
    },
  },
  {
    id: "SEAL-01",
    name: "Automatic Box Flap Folder & Tape Sealer",
    code: "PKG-SLR-701",
    zone: "Zone B • West Packaging Line",
    category: "PACKAGER",
    running: true,
    speed: 1.0,
    throughput: 1120,
    cycleTimeSec: 2.0,
    powerKw: 5.1,
    temperatureC: 44.8,
    description:
      "Automated inline carton forming and top-and-bottom pressure-sensitive tape sealing machine with pneumatic side-belt drives and compression rollers.",
    position: [-16.5, 2.2, -6.8],
    cameraView: {
      pos: [-22.0, 7.5, -0.5],
      target: [-16.5, 1.4, -6.8],
    },
  },
  {
    id: "INSP-01",
    name: "Vision X-Ray Inspection & Checkweigher",
    code: "INS-XRY-705",
    zone: "Zone B • West Packaging Line",
    category: "INSPECTOR",
    running: true,
    speed: 1.0,
    throughput: 1115,
    cycleTimeSec: 1.6,
    powerKw: 4.2,
    temperatureC: 37.5,
    description:
      "High-precision optical camera array, laser profiler, and dynamic checkweigher verifying package weight, seal integrity, and label compliance before palletizing.",
    position: [-16.5, 2.2, -2.2],
    cameraView: {
      pos: [-22.5, 7.2, 3.5],
      target: [-16.5, 1.4, -1.8],
    },
  },
  {
    id: "ROBOT-03",
    name: "West Packaging Pick-and-Place Robot #3",
    code: "RBT-6AX-03",
    zone: "Zone B • West Packaging Line",
    category: "ROBOT",
    running: true,
    speed: 1.0,
    throughput: 740,
    cycleTimeSec: 3.1,
    powerKw: 7.2,
    temperatureC: 45.0,
    description:
      "Articulated 6-axis yellow packaging robot transferring sealed master cartons from the West Inspection & Sealing line onto the Heavy Pallet Infeed Conveyor.",
    position: [-13.5, 2.5, -4.4],
    cameraView: {
      pos: [-19.5, 8.2, 1.5],
      target: [-13.5, 1.8, -4.4],
    },
  },
  {
    id: "SCAN-02",
    name: "Multi-Angle Laser Barcode Tunnel & Sorter",
    code: "SCN-TUN-801",
    zone: "Zone C • East Sorting Hub",
    category: "SCANNER",
    running: true,
    speed: 1.0,
    throughput: 1580,
    cycleTimeSec: 1.2,
    powerKw: 3.6,
    temperatureC: 36.8,
    description:
      "5-sided omnidirectional laser barcode reading tunnel and multi-lane cross-belt sorter inducting high-speed parcels into the upper conveyor network.",
    position: [15.5, 2.2, -7.2],
    cameraView: {
      pos: [21.5, 7.8, -1.0],
      target: [15.5, 1.4, -7.2],
    },
  },
  {
    id: "ROBOT-04",
    name: "East High-Speed Induction Robot Arm #4",
    code: "RBT-6AX-04",
    zone: "Zone C • East Sorting Hub",
    category: "ROBOT",
    running: true,
    speed: 1.0,
    throughput: 890,
    cycleTimeSec: 2.8,
    powerKw: 7.5,
    temperatureC: 47.1,
    description:
      "High-speed 6-axis robotic induction cell picking incoming parcels from bulk arrival tables and feeding the East Barcode Scanning Tunnel.",
    position: [18.2, 2.5, -4.2],
    cameraView: {
      pos: [24.0, 8.2, 2.2],
      target: [18.2, 1.8, -4.2],
    },
  },
  {
    id: "ROBOT-05",
    name: "Outbound Dock Heavy Palletizing Robot #5",
    code: "RBT-6AX-05",
    zone: "Zone D • Outbound Dock",
    category: "ROBOT",
    running: true,
    speed: 1.0,
    throughput: 510,
    cycleTimeSec: 4.5,
    powerKw: 9.6,
    temperatureC: 48.9,
    description:
      "End-of-line heavy-payload robotic arm transferring stretch-wrapped pallets and outbound shipping cases between the Kaufman wrapper discharge and the South-East Loading Dock.",
    position: [13.5, 2.5, 1.5],
    cameraView: {
      pos: [19.5, 8.5, 8.2],
      target: [13.5, 1.8, 1.5],
    },
  },
  {
    id: "RACK-01",
    name: "Automated High-Bay AS/RS Storage Racks",
    code: "WHS-ASR-901",
    zone: "Zone E • North Warehouse",
    category: "STORAGE",
    running: true,
    speed: 1.0,
    throughput: 380,
    cycleTimeSec: 7.5,
    powerKw: 11.4,
    temperatureC: 34.2,
    description:
      "Multi-tier selective steel pallet racking served by an automated rail-guided AS/RS stacker shuttle crane that stores and retrieves unit loads continuously.",
    position: [0.0, 3.8, -13.5],
    cameraView: {
      pos: [0.0, 9.5, -4.5],
      target: [0.0, 3.2, -13.5],
    },
  },
  {
    id: "AGV-FLEET",
    name: "Autonomous Mobile Robot (AGV) Fleet",
    code: "AGV-FLT-950",
    zone: "Zone F • Perimeter Logistics Loop",
    category: "AGV",
    running: true,
    speed: 1.0,
    throughput: 640,
    cycleTimeSec: 8.0,
    powerKw: 6.0,
    temperatureC: 40.5,
    description:
      "Fleet of 4 LiDAR-guided industrial flatbed AGVs circulating along the perimeter safety loop to transport palletized goods between the loading docks, AS/RS racks, and infeed lines.",
    position: [2.5, 0.9, 8.8],
    cameraView: {
      pos: [0.0, 12.5, 18.5],
      target: [0.0, 1.0, 5.5],
    },
  },
];

const CAMERA_PRESETS = [
  {
    id: "isometric",
    label: "Core Line (Reference)",
    pos: [-6.5, 13.8, 13.5] as [number, number, number],
    target: [0.2, 1.0, -1.2] as [number, number, number],
  },
  {
    id: "overview",
    label: "Full Factory Overview",
    pos: [-22.0, 22.5, 26.5] as [number, number, number],
    target: [0.0, 1.5, -1.5] as [number, number, number],
  },
  {
    id: "top",
    label: "Top View (Through Roof)",
    pos: [0.0, 38.0, 0.01] as [number, number, number],
    target: [0.0, 0.0, -1.5] as [number, number, number],
  },
  {
    id: "front",
    label: "Front Elevation",
    pos: [0.0, 8.5, 28.0] as [number, number, number],
    target: [0.0, 2.0, -1.5] as [number, number, number],
  },
  {
    id: "side",
    label: "East Wing & Docks",
    pos: [29.5, 11.0, 4.5] as [number, number, number],
    target: [8.0, 1.8, -1.5] as [number, number, number],
  },
  {
    id: "west",
    label: "West Packaging Wing",
    pos: [-28.5, 11.0, 4.5] as [number, number, number],
    target: [-12.0, 1.8, -3.5] as [number, number, number],
  },
];

// Procedural canvas texture for cardboard boxes & printed cases
function createCartonTexture(variant: "brown" | "printed" | "sheet"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  if (variant === "brown") {
    ctx.fillStyle = "#b98958";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    for (let i = 0; i < 256; i += 4) {
      ctx.fillRect(0, i, 256, 1);
    }
    ctx.fillStyle = "#d6b588";
    ctx.fillRect(114, 0, 28, 256);
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(32, 40, 64, 44);
    ctx.fillStyle = "#27272a";
    for (let b = 0; b < 48; b += 6) {
      ctx.fillRect(40 + b, 52, 3, 20);
    }
    ctx.strokeStyle = "#7c5329";
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 248, 248);
  } else if (variant === "printed") {
    ctx.fillStyle = "#d6cfc7";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#3f4d45";
    ctx.fillRect(14, 28, 228, 68);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(24, 42, 85, 38);
    ctx.fillStyle = "#18181b";
    ctx.fillRect(32, 50, 50, 10);
    ctx.fillRect(32, 65, 68, 8);
    ctx.fillStyle = "#52525b";
    ctx.fillRect(14, 140, 228, 80);
    ctx.strokeStyle = "#8c7a65";
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, 250, 250);
  } else {
    ctx.fillStyle = "#c4945a";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#8a5a2b";
    ctx.lineWidth = 3;
    for (let y = 16; y < 256; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Create "KAUFMAN" vertical column logo texture matching the reference photo
function createKaufmanColumnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#222428";
  ctx.fillRect(0, 0, 128, 512);

  ctx.save();
  ctx.translate(64, 230);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#e4e4e7";
  ctx.font = "900 38px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("KAUFMAN", 0, 0);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Create yellow-and-black diagonal hazard stripe texture for safety zones
function createHazardStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#eab308";
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = "#18181b";
  for (let i = -128; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 0);
    ctx.lineTo(i - 112, 128);
    ctx.lineTo(i - 128, 128);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Create transparent glass roof skylight panel texture with subtle frame grid
function createGlassRoofTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "rgba(186, 230, 253, 0.28)";
  ctx.fillRect(0, 0, 256, 256);

  // Subtle skylight pane mullions
  ctx.strokeStyle = "rgba(71, 85, 105, 0.65)";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();

  // Diagonal specular reflection streak
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "rgba(255,255,255,0.0)");
  grad.addColorStop(0.48, "rgba(255,255,255,0.18)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export interface FactoryProductionLine3DProps {
  embeddedHero?: boolean;
  bottomActions?: React.ReactNode;
}

export default function FactoryProductionLine3D({
  embeddedHero = false,
  bottomActions,
}: FactoryProductionLine3DProps = {}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [machines, setMachines] = useState<MachineStatusInfo[]>(INITIAL_MACHINES);
  const machinesRef = useRef<MachineStatusInfo[]>(INITIAL_MACHINES);
  useEffect(() => {
    machinesRef.current = machines;
  }, [machines]);

  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    embeddedHero ? null : "ROBOT-01"
  );
  const [hoveredMachineId, setHoveredMachineId] = useState<string | null>(null);
  const [globalSpeed, setGlobalSpeed] = useState<number>(1.0);
  const globalSpeedRef = useRef<number>(1.0);
  useEffect(() => {
    globalSpeedRef.current = globalSpeed;
  }, [globalSpeed]);

  const [isAllRunning, setIsAllRunning] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showCameraMenu, setShowCameraMenu] = useState<boolean>(false);
  const [roofMode, setRoofMode] = useState<RoofMode>("VISIBLE");
  const [activePreset, setActivePreset] = useState<string>("isometric");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Refs for camera, controls, and roof groups
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const roofStructureGroupRef = useRef<THREE.Group | null>(null);
  const roofGlassMeshesRef = useRef<THREE.Mesh[]>([]);
  const roofTrussMeshesRef = useRef<THREE.Mesh[]>([]);

  // Projected 2D screen coordinates for 3D floating machine badges
  const [badgeCoords, setBadgeCoords] = useState<
    Record<string, { x: number; y: number; visible: boolean }>
  >({});

  // Apply roof visibility mode dynamically without rebuilding scene
  useEffect(() => {
    const roofGroup = roofStructureGroupRef.current;
    if (!roofGroup) return;

    if (roofMode === "HIDDEN") {
      roofGroup.visible = false;
    } else {
      roofGroup.visible = true;
      const targetGlassOpacity = roofMode === "VISIBLE" ? 0.34 : 0.11;
      for (const gMesh of roofGlassMeshesRef.current) {
        const mat = gMesh.material as THREE.MeshPhysicalMaterial;
        if (mat) {
          mat.opacity = targetGlassOpacity;
          mat.needsUpdate = true;
        }
      }
    }
  }, [roofMode]);

  // Smooth camera transition via GSAP
  const flyToCamera = useCallback(
    (pos: [number, number, number], target: [number, number, number], presetId?: string) => {
      if (!cameraRef.current || !controlsRef.current) return;
      if (presetId !== undefined) setActivePreset(presetId);

      gsap.killTweensOf(cameraRef.current.position);
      gsap.killTweensOf(controlsRef.current.target);

      gsap.to(cameraRef.current.position, {
        x: pos[0],
        y: pos[1],
        z: pos[2],
        duration: 1.15,
        ease: "power3.out",
      });

      gsap.to(controlsRef.current.target, {
        x: target[0],
        y: target[1],
        z: target[2],
        duration: 1.15,
        ease: "power3.out",
        onUpdate: () => {
          controlsRef.current?.update();
        },
      });
    },
    []
  );

  // Toggle single machine running state
  const toggleMachineRunning = useCallback((id: string) => {
    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, running: !m.running } : m))
    );
  }, []);

  // Update single machine speed
  const updateMachineSpeed = useCallback((id: string, speed: number) => {
    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, speed } : m))
    );
  }, []);

  // Toggle all machines
  const handleToggleAll = useCallback(() => {
    setIsAllRunning((prev) => {
      const next = !prev;
      setMachines((list) => list.map((m) => ({ ...m, running: next })));
      return next;
    });
  }, []);

  // Increment throughput counters periodically for running machines
  useEffect(() => {
    const interval = setInterval(() => {
      setMachines((prev) =>
        prev.map((m) => {
          if (!m.running || globalSpeedRef.current <= 0) return m;
          const inc = Math.max(1, Math.round(m.speed * globalSpeedRef.current));
          return {
            ...m,
            throughput: m.throughput + inc,
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 1200;
    const height = mount.clientHeight || 720;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#b4bac2");
    scene.fog = new THREE.FogExp2("#b4bac2", 0.0065);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 220);
    camera.position.set(-6.5, 13.8, 13.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.025;
    controls.minDistance = 3.5;
    controls.maxDistance = 75;
    controls.target.set(0.2, 1.0, -1.2);
    controls.update();
    controlsRef.current = controls;

    // 5. Studio & Industrial Factory Lighting
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.9);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight("#f8fafc", "#64748b", 0.7);
    hemiLight.position.set(0, 32, 0);
    scene.add(hemiLight);

    const mainDirLight = new THREE.DirectionalLight("#fffbeb", 1.75);
    mainDirLight.position.set(-16, 28, 18);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 2048;
    mainDirLight.shadow.mapSize.height = 2048;
    mainDirLight.shadow.camera.near = 2;
    mainDirLight.shadow.camera.far = 85;
    const d = 30;
    mainDirLight.shadow.camera.left = -d;
    mainDirLight.shadow.camera.right = d;
    mainDirLight.shadow.camera.top = d;
    mainDirLight.shadow.camera.bottom = -d;
    mainDirLight.shadow.bias = -0.0005;
    scene.add(mainDirLight);

    const fillDirLight = new THREE.DirectionalLight("#e0f2fe", 0.65);
    fillDirLight.position.set(22, 18, -16);
    scene.add(fillDirLight);

    // 6. Shared Materials & Textures
    const brownBoxTex = createCartonTexture("brown");
    const printedBoxTex = createCartonTexture("printed");
    const sheetBoxTex = createCartonTexture("sheet");
    const kaufmanTex = createKaufmanColumnTexture();
    const hazardTex = createHazardStripeTexture();
    const glassRoofTex = createGlassRoofTexture();

    const matFloor = new THREE.MeshStandardMaterial({
      color: "#c5c9cf",
      roughness: 0.82,
      metalness: 0.06,
    });
    const matRoadStrip = new THREE.MeshStandardMaterial({
      color: "#888d96",
      roughness: 0.85,
      metalness: 0.08,
    });
    const matHazardStripe = new THREE.MeshBasicMaterial({
      map: hazardTex,
    });
    const matYellowRail = new THREE.MeshStandardMaterial({
      color: "#eab308",
      roughness: 0.32,
      metalness: 0.25,
    });
    const matRobotYellow = new THREE.MeshStandardMaterial({
      color: "#f5d000",
      roughness: 0.25,
      metalness: 0.3,
    });
    const matRedCap = new THREE.MeshStandardMaterial({
      color: "#dc2626",
      roughness: 0.35,
      metalness: 0.3,
    });
    const matDarkSteel = new THREE.MeshStandardMaterial({
      color: "#27272a",
      roughness: 0.45,
      metalness: 0.65,
    });
    const matStructuralSteel = new THREE.MeshStandardMaterial({
      color: "#334155",
      roughness: 0.42,
      metalness: 0.68,
    });
    const matTrussSteel = new THREE.MeshStandardMaterial({
      color: "#475569",
      roughness: 0.38,
      metalness: 0.62,
    });
    const matBlackGantry = new THREE.MeshStandardMaterial({
      color: "#1f2124",
      roughness: 0.4,
      metalness: 0.55,
    });
    const matPedestalGrey = new THREE.MeshStandardMaterial({
      color: "#71717a",
      roughness: 0.5,
      metalness: 0.5,
    });
    const matWhiteFrame = new THREE.MeshStandardMaterial({
      color: "#f1f5f9",
      roughness: 0.35,
      metalness: 0.2,
    });
    const matRollerMetal = new THREE.MeshStandardMaterial({
      color: "#94a3b8",
      roughness: 0.28,
      metalness: 0.78,
    });
    const matRackBlue = new THREE.MeshStandardMaterial({
      color: "#1d4ed8",
      roughness: 0.4,
      metalness: 0.45,
    });
    const matRackOrange = new THREE.MeshStandardMaterial({
      color: "#ea580c",
      roughness: 0.35,
      metalness: 0.35,
    });
    const matMachineTeal = new THREE.MeshStandardMaterial({
      color: "#0f766e",
      roughness: 0.35,
      metalness: 0.45,
    });
    const matWoodPallet = new THREE.MeshStandardMaterial({
      color: "#8c6239",
      roughness: 0.8,
      metalness: 0.05,
    });
    const matBrownCarton = new THREE.MeshStandardMaterial({
      map: brownBoxTex,
      roughness: 0.72,
      metalness: 0.04,
    });
    const matPrintedCarton = new THREE.MeshStandardMaterial({
      map: printedBoxTex,
      roughness: 0.65,
      metalness: 0.06,
    });
    const matSheetCarton = new THREE.MeshStandardMaterial({
      map: sheetBoxTex,
      roughness: 0.75,
      metalness: 0.05,
    });

    // Registry for raycasting interactive machines
    const machineGroups: Record<string, THREE.Group> = {};
    const clickableMeshes: THREE.Object3D[] = [];

    const registerMachineGroup = (id: string): THREE.Group => {
      const grp = new THREE.Group();
      grp.userData.machineId = id;
      scene.add(grp);
      machineGroups[id] = grp;
      return grp;
    };

    const tagMeshForMachine = (obj: THREE.Object3D, machineId: string) => {
      obj.traverse((child) => {
        child.userData.machineId = machineId;
        if ((child as THREE.Mesh).isMesh) {
          clickableMeshes.push(child);
        }
      });
    };

    // ─────────────────────────────────────────────────────────────
    // 7. EXPANDED FACTORY FLOOR, ZONE MARKINGS, SAFETY BARRIERS & HMI PANELS
    // ─────────────────────────────────────────────────────────────
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(76, 52), matFloor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(72, 36, "#9ca3af", "#b0b6bf");
    gridHelper.position.y = 0.005;
    scene.add(gridHelper);

    // Top-left dark asphalt/concrete road strip with white arrows (from reference image)
    const roadGroup = new THREE.Group();
    const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(26, 5.2), matRoadStrip);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(-6, 0.01, -10.8);
    roadMesh.rotation.z = -0.14;
    roadGroup.add(roadMesh);

    const createFloorArrow = (x: number, z: number, dir: number) => {
      const arrGrp = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.32),
        new THREE.MeshBasicMaterial({ color: "#f8fafc" })
      );
      shaft.rotation.x = -Math.PI / 2;
      arrGrp.add(shaft);

      const headShape = new THREE.Shape();
      headShape.moveTo(0, 0.38);
      headShape.lineTo(0.48, 0);
      headShape.lineTo(0, -0.38);
      headShape.closePath();
      const head = new THREE.Mesh(
        new THREE.ShapeGeometry(headShape),
        new THREE.MeshBasicMaterial({ color: "#f8fafc" })
      );
      head.rotation.x = -Math.PI / 2;
      head.position.x = 0.45;
      arrGrp.add(head);

      arrGrp.position.set(x, 0.02, z);
      arrGrp.rotation.y = dir;
      return arrGrp;
    };
    scene.add(createFloorArrow(-11.2, -9.6, Math.PI + 0.14));
    scene.add(createFloorArrow(-9.4, -9.3, 0.14));
    scene.add(roadGroup);

    // Green pedestrian safety walkway along the front & sides
    const createFloorLine = (
      x1: number,
      z1: number,
      x2: number,
      z2: number,
      thickness: number,
      colorHex: string,
      yOffset = 0.014
    ) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(len, thickness),
        new THREE.MeshBasicMaterial({ color: colorHex })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = -Math.atan2(z2 - z1, x2 - x1);
      mesh.position.set((x1 + x2) / 2, yOffset, (z1 + z2) / 2);
      scene.add(mesh);
    };

    // Perimeter AGV track markings (dashed/solid yellow guide path)
    const agvTrackRect: [number, number][] = [
      [-23, 9.2],
      [23, 9.2],
      [23, -10.5],
      [-23, -10.5],
    ];
    for (let i = 0; i < agvTrackRect.length; i++) {
      const [x1, z1] = agvTrackRect[i];
      const [x2, z2] = agvTrackRect[(i + 1) % agvTrackRect.length];
      createFloorLine(x1, z1, x2, z2, 0.18, "#eab308", 0.015);
    }

    // Green pedestrian walkway strip along south side
    createFloorLine(-28, 12.2, 28, 12.2, 1.15, "#15803d", 0.012);
    createFloorLine(-28, 11.6, 28, 11.6, 0.08, "#facc15", 0.015);
    createFloorLine(-28, 12.8, 28, 12.8, 0.08, "#facc15", 0.015);

    // Yellow & black hazard boundary strips around robotic cells
    const addHazardZoneBorder = (cx: number, cz: number, w: number, d: number) => {
      const stripH = 0.16;
      const top = new THREE.Mesh(new THREE.PlaneGeometry(w, stripH), matHazardStripe);
      top.rotation.x = -Math.PI / 2;
      top.position.set(cx, 0.016, cz - d / 2);
      scene.add(top);

      const bot = new THREE.Mesh(new THREE.PlaneGeometry(w, stripH), matHazardStripe);
      bot.rotation.x = -Math.PI / 2;
      bot.position.set(cx, 0.016, cz + d / 2);
      scene.add(bot);
    };
    addHazardZoneBorder(-5.8, 1.8, 3.2, 3.2);
    addHazardZoneBorder(0.35, -5.1, 3.2, 3.2);
    addHazardZoneBorder(-13.5, -4.4, 3.0, 3.0);
    addHazardZoneBorder(18.2, -4.2, 3.0, 3.0);
    addHazardZoneBorder(13.5, 1.5, 3.2, 3.2);

    // Reusable Yellow Safety Barrier Fence & Bollards
    const addSafetyFence = (x1: number, z1: number, x2: number, z2: number) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const ang = Math.atan2(z2 - z1, x2 - x1);

      const fenceGrp = new THREE.Group();
      fenceGrp.position.set(midX, 0, midZ);
      fenceGrp.rotation.y = -ang;

      const postCount = Math.max(2, Math.ceil(len / 2.2) + 1);
      for (let i = 0; i < postCount; i++) {
        const px = -len / 2 + (i * len) / (postCount - 1);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 1.05, 8),
          matYellowRail
        );
        post.position.set(px, 0.525, 0);
        post.castShadow = true;
        fenceGrp.add(post);

        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.04, 0.18),
          matDarkSteel
        );
        base.position.set(px, 0.02, 0);
        fenceGrp.add(base);
      }

      // Top and middle horizontal yellow safety rails
      [0.48, 0.92].forEach((ry) => {
        const rail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, len, 8),
          matYellowRail
        );
        rail.rotation.z = Math.PI / 2;
        rail.position.set(0, ry, 0);
        fenceGrp.add(rail);
      });

      scene.add(fenceGrp);
    };

    addSafetyFence(-21.5, 7.8, -12.5, 7.8);
    addSafetyFence(-2.5, 7.8, 9.5, 7.8);
    addSafetyFence(11.5, 7.8, 21.5, 7.8);
    addSafetyFence(-22.5, -9.2, -13.5, -9.2);

    // Reusable Operator HMI Control Panel Pedestal & 3-Color Andon Stack Light
    const stackLightBeacons: THREE.Mesh[] = [];
    const addHmiControlPanel = (x: number, z: number, rotY = 0) => {
      const hmiGrp = new THREE.Group();
      hmiGrp.position.set(x, 0, z);
      hmiGrp.rotation.y = rotY;

      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.055, 1.15, 10),
        matDarkSteel
      );
      stand.position.y = 0.575;
      hmiGrp.add(stand);

      const consoleBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.34, 0.28),
        matWhiteFrame
      );
      consoleBox.position.set(0, 1.2, 0.05);
      consoleBox.rotation.x = -0.35;
      hmiGrp.add(consoleBox);

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.36, 0.22),
        new THREE.MeshBasicMaterial({ color: "#0284c7" })
      );
      screen.position.set(0, 1.22, 0.195);
      screen.rotation.x = -0.35;
      hmiGrp.add(screen);

      // Tall Andon 3-color warning light pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8),
        matRollerMetal
      );
      pole.position.set(0.16, 1.65, 0);
      hmiGrp.add(pole);

      const colors = ["#ef4444", "#eab308", "#22c55e"];
      colors.forEach((col, idx) => {
        const lamp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.09, 10),
          new THREE.MeshStandardMaterial({
            color: col,
            emissive: col,
            emissiveIntensity: idx === 2 ? 0.9 : 0.2,
          })
        );
        lamp.position.set(0.16, 1.92 + idx * 0.1, 0);
        hmiGrp.add(lamp);
        if (idx === 2) stackLightBeacons.push(lamp);
      });

      scene.add(hmiGrp);
    };

    addHmiControlPanel(-4.2, 3.6, 0.4);
    addHmiControlPanel(2.2, -3.8, -0.5);
    addHmiControlPanel(4.8, 0.4, 0.2);
    addHmiControlPanel(-14.8, -0.4, 0.0);
    addHmiControlPanel(14.5, -5.2, -0.3);

    // ─────────────────────────────────────────────────────────────
    // 8. TRANSPARENT INDUSTRIAL WAREHOUSE ROOF & STEEL BUILDING STRUCTURE
    // ─────────────────────────────────────────────────────────────
    const warehouseBuildingGroup = new THREE.Group();
    scene.add(warehouseBuildingGroup);

    const roofOverheadGroup = new THREE.Group();
    warehouseBuildingGroup.add(roofOverheadGroup);
    roofStructureGroupRef.current = roofOverheadGroup;

    const glassMeshes: THREE.Mesh[] = [];
    const trussMeshes: THREE.Mesh[] = [];

    const bldgHalfW = 32.0; // Total width X = 64m (-32 to +32)
    const bldgHalfD = 20.5; // Total depth Z = 41m (-22.5 to +18.5)
    const bldgCenterZ = -2.0;
    const eaveH = 11.2;
    const ridgeH = 14.8;
    const numBaysX = 8; // 9 portal frames along X

    // Perimeter Steel H-Columns (Always visible so building groundedness is clear)
    for (let i = 0; i <= numBaysX; i++) {
      const bx = -bldgHalfW + (i * (bldgHalfW * 2)) / numBaysX;
      [bldgCenterZ - bldgHalfD, bldgCenterZ + bldgHalfD].forEach((bz) => {
        // Concrete pedestal base
        const ped = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.45, 0.65),
          matPedestalGrey
        );
        ped.position.set(bx, 0.225, bz);
        warehouseBuildingGroup.add(ped);

        // Yellow/black safety bumper at column base
        const colGuard = new THREE.Mesh(
          new THREE.BoxGeometry(0.54, 0.9, 0.54),
          matYellowRail
        );
        colGuard.position.set(bx, 0.45, bz);
        warehouseBuildingGroup.add(colGuard);

        // Tall steel column up to eave
        const col = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, eaveH, 0.36),
          matStructuralSteel
        );
        col.position.set(bx, eaveH / 2, bz);
        col.castShadow = true;
        roofOverheadGroup.add(col);
      });

      // Pitched Steel Roof Truss spanning from North eave to Center Ridge to South eave
      const halfSpanZ = bldgHalfD;
      const riseY = ridgeH - eaveH;
      const rafterLen = Math.hypot(halfSpanZ, riseY);
      const rafterPitch = Math.atan2(riseY, halfSpanZ);

      // North & South pitched top & bottom chords
      [-1, 1].forEach((side) => {
        const chordTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.22, rafterLen),
          matTrussSteel
        );
        chordTop.position.set(
          bx,
          eaveH + riseY / 2,
          bldgCenterZ + (side * halfSpanZ) / 2
        );
        chordTop.rotation.x = side * rafterPitch;
        roofOverheadGroup.add(chordTop);
        trussMeshes.push(chordTop);

        const chordBot = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.16, rafterLen),
          matTrussSteel
        );
        chordBot.position.set(
          bx,
          eaveH - 0.65 + riseY / 2,
          bldgCenterZ + (side * halfSpanZ) / 2
        );
        chordBot.rotation.x = side * rafterPitch;
        roofOverheadGroup.add(chordBot);
        trussMeshes.push(chordBot);

        // Vertical web struts inside truss
        for (let s = 1; s <= 4; s++) {
          const frac = s / 5;
          const strutZ = bldgCenterZ + side * halfSpanZ * frac;
          const strutY = eaveH + riseY * (1 - frac) - 0.32;
          const vStrut = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.68, 0.14),
            matTrussSteel
          );
          vStrut.position.set(bx, strutY, strutZ);
          roofOverheadGroup.add(vStrut);
        }
      });

      // Horizontal tie-rod & high-bay LED light fixtures along the truss
      const tieBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.14, bldgHalfD * 1.96),
        matTrussSteel
      );
      tieBeam.position.set(bx, eaveH - 0.65, bldgCenterZ);
      roofOverheadGroup.add(tieBeam);

      if (i % 2 === 1) {
        [-10, 0, 10].forEach((lz) => {
          const fixture = new THREE.Mesh(
            new THREE.BoxGeometry(1.1, 0.12, 0.42),
            new THREE.MeshStandardMaterial({
              color: "#f8fafc",
              emissive: "#e0f2fe",
              emissiveIntensity: 0.85,
            })
          );
          fixture.position.set(bx, eaveH - 0.75, bldgCenterZ + lz);
          roofOverheadGroup.add(fixture);
        });
      }
    }

    // Longitudinal Steel Roof Purlins & Eave Beams running along X (-32 to +32)
    const totalLenX = bldgHalfW * 2;
    const riseY = ridgeH - eaveH;
    const rafterLen = Math.hypot(bldgHalfD, riseY);
    const rafterPitch = Math.atan2(riseY, bldgHalfD);

    [-1, 1].forEach((side) => {
      for (let p = 0; p <= 4; p++) {
        const frac = p / 4;
        const pz = bldgCenterZ + side * bldgHalfD * frac;
        const py = eaveH + riseY * (1 - frac) + 0.12;
        const purlin = new THREE.Mesh(
          new THREE.BoxGeometry(totalLenX + 0.4, 0.16, 0.16),
          matStructuralSteel
        );
        purlin.position.set(0, py, pz);
        roofOverheadGroup.add(purlin);
        trussMeshes.push(purlin);
      }
    });

    // Transparent Architectural Glass Skylight Roof Slopes (North & South pitched glass planes)
    const matRoofGlass = new THREE.MeshPhysicalMaterial({
      map: glassRoofTex,
      color: "#e0f2fe",
      transparent: true,
      opacity: 0.34,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.45,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    [-1, 1].forEach((side) => {
      const glassSlope = new THREE.Mesh(
        new THREE.PlaneGeometry(totalLenX, rafterLen),
        matRoofGlass
      );
      glassSlope.position.set(
        0,
        eaveH + riseY / 2 + 0.18,
        bldgCenterZ + (side * bldgHalfD) / 2
      );
      glassSlope.rotation.x = Math.PI / 2 + side * rafterPitch;
      roofOverheadGroup.add(glassSlope);
      glassMeshes.push(glassSlope);
    });

    // Transparent Upper Clerestory Wall Glazing Panels along North, South, East, West eaves
    const clerestoryH = 3.2;
    [-bldgHalfD, bldgHalfD].forEach((dz) => {
      const wallGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(totalLenX, clerestoryH),
        matRoofGlass
      );
      wallGlass.position.set(0, eaveH - clerestoryH / 2, bldgCenterZ + dz);
      roofOverheadGroup.add(wallGlass);
      glassMeshes.push(wallGlass);
    });

    roofGlassMeshesRef.current = glassMeshes;
    roofTrussMeshesRef.current = trussMeshes;

    // ─────────────────────────────────────────────────────────────
    // 9. REUSABLE BUILDERS: ROLLER CONVEYORS, PALLETS, BOX STACKS
    // ─────────────────────────────────────────────────────────────
    interface RollerSet {
      machineId: string;
      rollers: THREE.Mesh[];
    }
    const allRollerSets: RollerSet[] = [];

    function buildRollerConveyorSegment(opts: {
      machineId: string;
      parent: THREE.Group;
      start: [number, number, number];
      end: [number, number, number];
      width: number;
      height: number;
      yellowSides?: boolean;
      whiteLegs?: boolean;
      hasUnderCabinet?: boolean;
      hasGreenArrow?: boolean;
    }) {
      const {
        machineId,
        parent,
        start,
        end,
        width,
        height,
        yellowSides = true,
        whiteLegs = true,
        hasUnderCabinet = false,
        hasGreenArrow = false,
      } = opts;

      const vStart = new THREE.Vector3(...start);
      const vEnd = new THREE.Vector3(...end);
      const delta = new THREE.Vector3().subVectors(vEnd, vStart);
      const length = delta.length();
      const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
      const angle = Math.atan2(delta.z, delta.x);

      const segGroup = new THREE.Group();
      segGroup.position.copy(mid);
      segGroup.rotation.y = -angle;

      const railMat = yellowSides ? matYellowRail : matDarkSteel;
      const railGeo = new THREE.BoxGeometry(length, 0.16, 0.09);
      const leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(0, height, -width / 2 - 0.045);
      leftRail.castShadow = true;
      leftRail.receiveShadow = true;
      segGroup.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(0, height, width / 2 + 0.045);
      rightRail.castShadow = true;
      rightRail.receiveShadow = true;
      segGroup.add(rightRail);

      const subBeamGeo = new THREE.BoxGeometry(length, 0.08, 0.06);
      const subL = new THREE.Mesh(subBeamGeo, matWhiteFrame);
      subL.position.set(0, height - 0.12, -width / 2 + 0.04);
      segGroup.add(subL);
      const subR = new THREE.Mesh(subBeamGeo, matWhiteFrame);
      subR.position.set(0, height - 0.12, width / 2 - 0.04);
      segGroup.add(subR);

      const rollerSpacing = 0.25;
      const numRollers = Math.max(3, Math.floor(length / rollerSpacing));
      const rollerGeo = new THREE.CylinderGeometry(0.055, 0.055, width - 0.02, 8);
      rollerGeo.rotateX(Math.PI / 2);
      const rollers: THREE.Mesh[] = [];

      for (let i = 0; i < numRollers; i++) {
        const rx =
          -length / 2 + 0.14 + i * ((length - 0.28) / Math.max(1, numRollers - 1));
        const rMesh = new THREE.Mesh(rollerGeo, matRollerMetal);
        rMesh.position.set(rx, height + 0.01, 0);
        rMesh.receiveShadow = true;
        segGroup.add(rMesh);
        rollers.push(rMesh);
      }
      allRollerSets.push({ machineId, rollers });

      const legMat = whiteLegs ? matWhiteFrame : matDarkSteel;
      const numLegs = Math.max(2, Math.ceil(length / 2.4) + 1);
      const legGeo = new THREE.BoxGeometry(0.09, height - 0.08, 0.09);
      const footGeo = new THREE.BoxGeometry(0.18, 0.03, 0.18);
      const crossBraceGeo = new THREE.BoxGeometry(0.06, 0.06, width);

      for (let i = 0; i < numLegs; i++) {
        const lx =
          numLegs === 1
            ? 0
            : -length / 2 + 0.18 + i * ((length - 0.36) / (numLegs - 1));
        [-width / 2 + 0.05, width / 2 - 0.05].forEach((lz) => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(lx, (height - 0.08) / 2, lz);
          leg.castShadow = true;
          segGroup.add(leg);

          const foot = new THREE.Mesh(footGeo, matDarkSteel);
          foot.position.set(lx, 0.015, lz);
          segGroup.add(foot);
        });

        const brace = new THREE.Mesh(crossBraceGeo, legMat);
        brace.position.set(lx, height * 0.35, 0);
        segGroup.add(brace);
      }

      if (hasUnderCabinet) {
        const cab = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.34, width * 0.75),
          matWhiteFrame
        );
        cab.position.set(0, height * 0.45, 0);
        segGroup.add(cab);

        const yellowBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.24, 0.16),
          matYellowRail
        );
        yellowBox.position.set(0.15, height * 0.42, width / 2 - 0.02);
        segGroup.add(yellowBox);
      }

      if (hasGreenArrow) {
        const arrowMat = new THREE.MeshBasicMaterial({ color: "#22c55e" });
        const arrowShaft = new THREE.Mesh(
          new THREE.BoxGeometry(0.36, 0.02, 0.08),
          arrowMat
        );
        arrowShaft.position.set(-0.2, height + 0.075, 0);
        segGroup.add(arrowShaft);
      }

      parent.add(segGroup);
    }

    function createWoodenPallet(): THREE.Group {
      const pGrp = new THREE.Group();
      [-0.55, 0, 0.55].forEach((z) => {
        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(1.45, 0.1, 0.12),
          matWoodPallet
        );
        beam.position.set(0, 0.05, z);
        beam.castShadow = true;
        beam.receiveShadow = true;
        pGrp.add(beam);
      });
      for (let i = -2.5; i <= 2.5; i += 1) {
        const slat = new THREE.Mesh(
          new THREE.BoxGeometry(0.21, 0.035, 1.32),
          matWoodPallet
        );
        slat.position.set(i * 0.24, 0.115, 0);
        slat.castShadow = true;
        slat.receiveShadow = true;
        pGrp.add(slat);
      }
      return pGrp;
    }

    function createPalletizedLoad(layers = 4, wrapped = false): THREE.Group {
      const grp = new THREE.Group();
      const pallet = createWoodenPallet();
      grp.add(pallet);

      const boxW = 0.42;
      const boxH = 0.26;
      const boxD = 0.36;

      for (let l = 0; l < layers; l++) {
        const y = 0.13 + l * boxH + boxH / 2;
        for (let r = -1; r <= 1; r++) {
          for (let c = -1; c <= 1; c++) {
            const carton = new THREE.Mesh(
              new THREE.BoxGeometry(boxW, boxH - 0.01, boxD),
              matPrintedCarton
            );
            carton.position.set(r * (boxW + 0.02), y, c * (boxD + 0.02));
            carton.castShadow = true;
            carton.receiveShadow = true;
            grp.add(carton);
          }
        }
      }

      if (wrapped) {
        const wrapH = layers * boxH;
        const wrapMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.36, wrapH + 0.02, 1.18),
          new THREE.MeshPhysicalMaterial({
            color: "#e2e8f0",
            transparent: true,
            opacity: 0.28,
            roughness: 0.15,
            metalness: 0.1,
          })
        );
        wrapMesh.position.y = 0.13 + wrapH / 2;
        grp.add(wrapMesh);
      }

      return grp;
    }

    // ─────────────────────────────────────────────────────────────
    // 10. ZONE A: ORIGINAL CENTRAL PRODUCTION CORE (PRESERVED)
    // ─────────────────────────────────────────────────────────────

    // A1) Upper Infeed & Accumulator Conveyor (`CONV-UPPER`)
    const grpConvUpper = registerMachineGroup("CONV-UPPER");
    buildRollerConveyorSegment({
      machineId: "CONV-UPPER",
      parent: grpConvUpper,
      start: [13.5, 0, -7.2],
      end: [0.2, 0, -7.2],
      width: 0.78,
      height: 0.92,
      yellowSides: false,
      whiteLegs: true,
    });
    buildRollerConveyorSegment({
      machineId: "CONV-UPPER",
      parent: grpConvUpper,
      start: [0.2, 0, -7.2],
      end: [-1.4, 0, -5.0],
      width: 0.95,
      height: 0.92,
      yellowSides: true,
      whiteLegs: true,
    });
    buildRollerConveyorSegment({
      machineId: "CONV-UPPER",
      parent: grpConvUpper,
      start: [4.8, 0, -6.8],
      end: [3.4, 0, -4.4],
      width: 0.95,
      height: 0.92,
      yellowSides: true,
      whiteLegs: true,
    });
    tagMeshForMachine(grpConvUpper, "CONV-UPPER");

    // A2) Optical Sorter & Pneumatic Diverter Gate (`SORT-01`)
    const grpSorter = registerMachineGroup("SORT-01");
    const sorterBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.65, 1.15),
      matDarkSteel
    );
    sorterBridge.position.set(4.8, 1.25, -7.2);
    sorterBridge.castShadow = true;
    grpSorter.add(sorterBridge);

    const sorterBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.16, 12),
      new THREE.MeshStandardMaterial({
        color: "#22c55e",
        emissive: "#16a34a",
        emissiveIntensity: 0.9,
      })
    );
    sorterBeacon.position.set(4.8, 1.65, -7.2);
    grpSorter.add(sorterBeacon);

    const diverterPaddle = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.14, 0.06),
      matYellowRail
    );
    diverterPaddle.position.set(4.5, 1.02, -6.95);
    grpSorter.add(diverterPaddle);
    tagMeshForMachine(grpSorter, "SORT-01");

    // A3) Left Infeed Conveyor & White Gantry Case Erector (`SCAN-01`)
    const grpScanner = registerMachineGroup("SCAN-01");
    buildRollerConveyorSegment({
      machineId: "SCAN-01",
      parent: grpScanner,
      start: [-12.5, 0, -1.8],
      end: [-3.6, 0, -1.8],
      width: 1.55,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
      hasUnderCabinet: true,
    });

    [-8.6, -7.1].forEach((gx) => {
      const leftPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 2.35, 0.18),
        matWhiteFrame
      );
      leftPost.position.set(gx, 1.175, -2.85);
      leftPost.castShadow = true;
      grpScanner.add(leftPost);

      const rightPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 2.35, 0.18),
        matWhiteFrame
      );
      rightPost.position.set(gx, 1.175, -0.75);
      rightPost.castShadow = true;
      grpScanner.add(rightPost);

      const topBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.2, 2.3),
        matWhiteFrame
      );
      topBeam.position.set(gx, 2.32, -1.8);
      topBeam.castShadow = true;
      grpScanner.add(topBeam);
    });
    [-2.85, -0.75].forEach((gz) => {
      const tie = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.16, 0.16),
        matWhiteFrame
      );
      tie.position.set(-7.85, 2.15, gz);
      grpScanner.add(tie);
    });

    const verticalCaseStack = new THREE.Group();
    verticalCaseStack.position.set(-8.2, 0.92, -1.8);
    verticalCaseStack.add(createWoodenPallet());
    [
      [-0.35, -0.3],
      [0.35, -0.3],
      [-0.35, 0.3],
      [0.35, 0.3],
    ].forEach(([cx, cz], idx) => {
      const h = idx % 2 === 0 ? 1.45 : 1.15;
      const colBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, h, 0.42),
        matBrownCarton
      );
      colBox.position.set(cx, 0.12 + h / 2, cz);
      colBox.castShadow = true;
      verticalCaseStack.add(colBox);
    });
    grpScanner.add(verticalCaseStack);

    const scanLaser = new THREE.Mesh(
      new THREE.PlaneGeometry(0.04, 1.95),
      new THREE.MeshBasicMaterial({
        color: "#ef4444",
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      })
    );
    scanLaser.rotation.y = Math.PI / 2;
    scanLaser.position.set(-7.1, 1.45, -1.8);
    grpScanner.add(scanLaser);
    tagMeshForMachine(grpScanner, "SCAN-01");

    // A4) Central Heavy-Duty Pallet Roller Spine & Cross-Transfers (`CONV-MAIN`)
    const grpConvMain = registerMachineGroup("CONV-MAIN");
    buildRollerConveyorSegment({
      machineId: "CONV-MAIN",
      parent: grpConvMain,
      start: [-3.6, 0, -1.8],
      end: [3.2, 0, -1.8],
      width: 1.55,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
      hasUnderCabinet: true,
    });
    buildRollerConveyorSegment({
      machineId: "CONV-MAIN",
      parent: grpConvMain,
      start: [-1.8, 0, -4.5],
      end: [-1.8, 0, -2.6],
      width: 1.55,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
    });
    const backBufferPallet = createWoodenPallet();
    backBufferPallet.position.set(-1.8, 0.88, -4.1);
    const backBufferBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.28, 0.62, 1.12),
      matSheetCarton
    );
    backBufferBlock.position.y = 0.43;
    backBufferBlock.castShadow = true;
    backBufferPallet.add(backBufferBlock);
    grpConvMain.add(backBufferPallet);

    buildRollerConveyorSegment({
      machineId: "CONV-MAIN",
      parent: grpConvMain,
      start: [1.4, 0, -3.5],
      end: [1.4, 0, -1.8],
      width: 1.55,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
    });
    const robot2TargetLoad = createPalletizedLoad(4, false);
    robot2TargetLoad.position.set(1.4, 0.88, -2.85);
    grpConvMain.add(robot2TargetLoad);

    buildRollerConveyorSegment({
      machineId: "CONV-MAIN",
      parent: grpConvMain,
      start: [-0.5, 0, -1.0],
      end: [-0.5, 0, 2.1],
      width: 1.55,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
      hasUnderCabinet: true,
    });
    const centerSpurPallet = createWoodenPallet();
    centerSpurPallet.position.set(-0.5, 0.88, 1.05);
    const flatSheetStack = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, 0.45, 1.15),
      matSheetCarton
    );
    flatSheetStack.position.y = 0.35;
    flatSheetStack.castShadow = true;
    centerSpurPallet.add(flatSheetStack);
    const topMiniStack = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.24, 0.52),
      matPrintedCarton
    );
    topMiniStack.position.set(0.22, 0.7, -0.15);
    topMiniStack.castShadow = true;
    centerSpurPallet.add(topMiniStack);
    grpConvMain.add(centerSpurPallet);

    buildRollerConveyorSegment({
      machineId: "CONV-MAIN",
      parent: grpConvMain,
      start: [-3.6, 0, -1.0],
      end: [-3.6, 0, 1.6],
      width: 1.55,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
    });
    const robot1SourcePallet = createWoodenPallet();
    robot1SourcePallet.position.set(-3.8, 0.88, 0.55);
    for (let lx = -1; lx <= 1; lx++) {
      for (let lz = -1; lz <= 0; lz++) {
        const cBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.52, 0.38),
          matBrownCarton
        );
        cBox.position.set(lx * 0.42, 0.38, lz * 0.42);
        cBox.castShadow = true;
        robot1SourcePallet.add(cBox);
      }
    }
    grpConvMain.add(robot1SourcePallet);

    const dollyPallet = createWoodenPallet();
    dollyPallet.position.set(-2.9, 0.22, 4.1);
    const bigBrownCube = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.82, 1.18),
      matSheetCarton
    );
    bigBrownCube.position.y = 0.53;
    bigBrownCube.castShadow = true;
    dollyPallet.add(bigBrownCube);
    grpConvMain.add(dollyPallet);

    tagMeshForMachine(grpConvMain, "CONV-MAIN");

    // A5) KAUFMAN Stretch-Wrapper Line (`WRAP-01`)
    const grpWrapper = registerMachineGroup("WRAP-01");
    buildRollerConveyorSegment({
      machineId: "WRAP-01",
      parent: grpWrapper,
      start: [3.2, 0, -1.8],
      end: [14.5, 0, -1.8],
      width: 1.55,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
      hasUnderCabinet: true,
      hasGreenArrow: true,
    });

    const wrapCenterX = 6.4;
    const wrapCenterZ = -1.8;
    const portalW = 3.6;
    const portalD = 2.65;
    const portalH = 4.35;

    const postPositions: [number, number, boolean][] = [
      [wrapCenterX - portalW / 2, wrapCenterZ + portalD / 2, true],
      [wrapCenterX + portalW / 2, wrapCenterZ + portalD / 2, false],
      [wrapCenterX - portalW / 2, wrapCenterZ - portalD / 2, false],
      [wrapCenterX + portalW / 2, wrapCenterZ - portalD / 2, false],
    ];

    const kaufmanMatArray = [
      matBlackGantry,
      matBlackGantry,
      matBlackGantry,
      matBlackGantry,
      new THREE.MeshStandardMaterial({ map: kaufmanTex, roughness: 0.4, metalness: 0.4 }),
      matBlackGantry,
    ];

    postPositions.forEach(([px, pz, isLogoPost]) => {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, portalH, 0.28),
        isLogoPost ? kaufmanMatArray : matBlackGantry
      );
      post.position.set(px, portalH / 2, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      grpWrapper.add(post);

      const footPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.06, 0.46),
        matBlackGantry
      );
      footPlate.position.set(px, 0.03, pz);
      grpWrapper.add(footPlate);
    });

    [-portalD / 2, portalD / 2].forEach((dz) => {
      const longBeam = new THREE.Mesh(
        new THREE.BoxGeometry(portalW + 0.3, 0.32, 0.26),
        matBlackGantry
      );
      longBeam.position.set(wrapCenterX, portalH - 0.16, wrapCenterZ + dz);
      longBeam.castShadow = true;
      grpWrapper.add(longBeam);
    });
    [-portalW / 2, 0, portalW / 2].forEach((dx) => {
      const crossBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.3, portalD + 0.28),
        matBlackGantry
      );
      crossBeam.position.set(wrapCenterX + dx, portalH - 0.15, wrapCenterZ);
      crossBeam.castShadow = true;
      grpWrapper.add(crossBeam);
    });

    const wrapperRotorGroup = new THREE.Group();
    wrapperRotorGroup.position.set(wrapCenterX, portalH - 0.45, wrapCenterZ);

    const rotaryHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.12, 24),
      matWhiteFrame
    );
    wrapperRotorGroup.add(rotaryHub);

    const redDriveMotor = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.34, 0.42),
      matRedCap
    );
    redDriveMotor.position.set(0.1, 0.22, 0.15);
    redDriveMotor.castShadow = true;
    wrapperRotorGroup.add(redDriveMotor);

    const orbitMast = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 2.4, 0.14),
      matWhiteFrame
    );
    orbitMast.position.set(-0.92, -1.25, 0);
    orbitMast.castShadow = true;
    wrapperRotorGroup.add(orbitMast);

    const filmCarriageGroup = new THREE.Group();
    filmCarriageGroup.position.set(-0.92, -1.4, 0.16);
    const carriageBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.55, 0.26),
      matDarkSteel
    );
    filmCarriageGroup.add(carriageBox);
    const filmRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.46, 16),
      matWhiteFrame
    );
    filmRoll.position.set(0.18, 0, 0.08);
    filmCarriageGroup.add(filmRoll);
    wrapperRotorGroup.add(filmCarriageGroup);

    const platenPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.22, 0.48),
      matDarkSteel
    );
    platenPad.position.set(-0.65, -0.55, 0.45);
    wrapperRotorGroup.add(platenPad);

    grpWrapper.add(wrapperRotorGroup);
    tagMeshForMachine(grpWrapper, "WRAP-01");

    // A6) Lower-Left Dual-Lane Package Sorting Loop (`CONV-LOWER`)
    const grpConvLower = registerMachineGroup("CONV-LOWER");
    buildRollerConveyorSegment({
      machineId: "CONV-LOWER",
      parent: grpConvLower,
      start: [-8.6, 0, 2.2],
      end: [-6.4, 0, 2.2],
      width: 0.92,
      height: 0.88,
      yellowSides: false,
      whiteLegs: true,
    });
    buildRollerConveyorSegment({
      machineId: "CONV-LOWER",
      parent: grpConvLower,
      start: [-8.4, 0, 2.8],
      end: [-10.8, 0, 5.2],
      width: 0.78,
      height: 0.86,
      yellowSides: false,
      whiteLegs: true,
    });
    buildRollerConveyorSegment({
      machineId: "CONV-LOWER",
      parent: grpConvLower,
      start: [-10.8, 0, 5.4],
      end: [-6.8, 0, 7.6],
      width: 0.78,
      height: 0.86,
      yellowSides: false,
      whiteLegs: true,
    });
    buildRollerConveyorSegment({
      machineId: "CONV-LOWER",
      parent: grpConvLower,
      start: [-6.6, 0, 7.5],
      end: [-4.2, 0, 4.4],
      width: 0.82,
      height: 0.86,
      yellowSides: false,
      whiteLegs: true,
    });
    tagMeshForMachine(grpConvLower, "CONV-LOWER");

    // ─────────────────────────────────────────────────────────────
    // 11. ZONE B: WEST AUTOMATED PACKAGING, BOX SEALING & VISION INSPECTION
    // ─────────────────────────────────────────────────────────────

    // B1) Automatic Box Flap Folder & Tape Sealer (`SEAL-01`)
    const grpSealer = registerMachineGroup("SEAL-01");
    buildRollerConveyorSegment({
      machineId: "SEAL-01",
      parent: grpSealer,
      start: [-22.5, 0, -6.8],
      end: [-12.5, 0, -6.8],
      width: 0.92,
      height: 0.88,
      yellowSides: true,
      whiteLegs: true,
      hasUnderCabinet: true,
    });

    // Box Sealer Arch Housing at x=-16.5, z=-6.8
    const sealerBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.35, 1.35),
      matYellowRail
    );
    sealerBody.position.set(-16.5, 0.85, -6.8);
    grpSealer.add(sealerBody);

    const sealerHood = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 1.15, 1.25),
      new THREE.MeshPhysicalMaterial({
        color: "#facc15",
        transparent: true,
        opacity: 0.45,
        roughness: 0.2,
      })
    );
    sealerHood.position.set(-16.5, 1.6, -6.8);
    grpSealer.add(sealerHood);

    // Top tape dispenser head & compression rollers
    const tapeHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.45, 0.42),
      matRedCap
    );
    tapeHead.position.set(-16.5, 1.55, -6.8);
    grpSealer.add(tapeHead);
    tagMeshForMachine(grpSealer, "SEAL-01");

    // B2) Vision X-Ray Inspection & Checkweigher (`INSP-01`)
    const grpInspector = registerMachineGroup("INSP-01");
    buildRollerConveyorSegment({
      machineId: "INSP-01",
      parent: grpInspector,
      start: [-22.5, 0, -1.8],
      end: [-12.5, 0, -1.8],
      width: 1.25,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
      hasUnderCabinet: true,
    });

    const xrayCabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 1.65, 1.65),
      matMachineTeal
    );
    xrayCabin.position.set(-16.5, 1.65, -1.8);
    xrayCabin.castShadow = true;
    grpInspector.add(xrayCabin);

    const xrayWindow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.55),
      new THREE.MeshBasicMaterial({ color: "#38bdf8" })
    );
    xrayWindow.position.set(-16.5, 1.85, -0.96);
    grpInspector.add(xrayWindow);
    tagMeshForMachine(grpInspector, "INSP-01");

    // ─────────────────────────────────────────────────────────────
    // 12. ZONE C: EAST BARCODE SCANNING HUB & MULTI-LANE SORTER
    // ─────────────────────────────────────────────────────────────
    const grpScan2 = registerMachineGroup("SCAN-02");
    buildRollerConveyorSegment({
      machineId: "SCAN-02",
      parent: grpScan2,
      start: [22.5, 0, -7.2],
      end: [13.5, 0, -7.2],
      width: 0.92,
      height: 0.92,
      yellowSides: true,
      whiteLegs: true,
      hasUnderCabinet: true,
    });
    // Parallel sorting spur chute
    buildRollerConveyorSegment({
      machineId: "SCAN-02",
      parent: grpScan2,
      start: [15.5, 0, -6.6],
      end: [15.5, 0, -3.5],
      width: 0.85,
      height: 0.9,
      yellowSides: true,
      whiteLegs: true,
    });

    // Multi-angle barcode scanner tunnel arch at x=16.5, z=-7.2
    const tunnelArch = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 1.35, 1.32),
      matDarkSteel
    );
    tunnelArch.position.set(16.5, 1.55, -7.2);
    tunnelArch.castShadow = true;
    grpScan2.add(tunnelArch);

    const laserWeb = new THREE.Mesh(
      new THREE.PlaneGeometry(0.05, 1.15),
      new THREE.MeshBasicMaterial({
        color: "#ef4444",
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      })
    );
    laserWeb.rotation.y = Math.PI / 2;
    laserWeb.position.set(15.6, 1.45, -7.2);
    grpScan2.add(laserWeb);
    tagMeshForMachine(grpScan2, "SCAN-02");

    // ─────────────────────────────────────────────────────────────
    // 13. ZONE D: OUTBOUND PALLET LOADING DOCKS (EASTERN END)
    // ─────────────────────────────────────────────────────────────
    const grpDock = new THREE.Group();
    scene.add(grpDock);

    // Outbound dock transfer roller tables fed by Robot #5
    buildRollerConveyorSegment({
      machineId: "ROBOT-05",
      parent: grpDock,
      start: [13.5, 0, 4.2],
      end: [21.5, 0, 4.2],
      width: 1.55,
      height: 0.86,
      yellowSides: true,
      whiteLegs: true,
    });

    // 3 Outbound Shipping Dock Staging Lanes with Yellow Bollards & Loaded Pallets
    [-1.8, 1.2, 4.2].forEach((dz, idx) => {
      const dockPad = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 2.1),
        new THREE.MeshBasicMaterial({ color: "#475569" })
      );
      dockPad.rotation.x = -Math.PI / 2;
      dockPad.position.set(24.5, 0.02, dz);
      grpDock.add(dockPad);

      // Dock bollards
      [-0.95, 0.95].forEach((bz) => {
        const bollard = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 1.1, 10),
          matYellowRail
        );
        bollard.position.set(22.4, 0.55, dz + bz);
        grpDock.add(bollard);
      });

      const stagedLoad = createPalletizedLoad(idx === 1 ? 3 : 4, true);
      stagedLoad.position.set(24.2, 0.02, dz);
      grpDock.add(stagedLoad);
    });

    // ─────────────────────────────────────────────────────────────
    // 14. ZONE E: HIGH-BAY AS/RS WAREHOUSE STORAGE RACKS & STACKER CRANE (`RACK-01`)
    // ─────────────────────────────────────────────────────────────
    const grpRacks = registerMachineGroup("RACK-01");
    const rackRowsZ = [-15.8, -12.6];
    const rackBays = 6;
    const bayWidth = 2.6;
    const rackLevels = 3;
    const levelHeight = 1.65;
    const rackStartX = -((rackBays * bayWidth) / 2);

    rackRowsZ.forEach((rz) => {
      for (let b = 0; b <= rackBays; b++) {
        const rx = rackStartX + b * bayWidth;
        [-0.58, 0.58].forEach((dz) => {
          const upright = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, rackLevels * levelHeight + 0.4, 0.12),
            matRackBlue
          );
          upright.position.set(rx, (rackLevels * levelHeight + 0.4) / 2, rz + dz);
          upright.castShadow = true;
          grpRacks.add(upright);
        });
      }

      for (let lv = 1; lv <= rackLevels; lv++) {
        const ly = lv * levelHeight;
        [-0.54, 0.54].forEach((dz) => {
          const beam = new THREE.Mesh(
            new THREE.BoxGeometry(rackBays * bayWidth + 0.14, 0.12, 0.08),
            matRackOrange
          );
          beam.position.set(0, ly, rz + dz);
          grpRacks.add(beam);
        });

        // Populate rack bays with pallets and cartons
        for (let b = 0; b < rackBays; b++) {
          if ((b + lv) % 5 === 0) continue; // Leave a few slots open for realism
          const slotX = rackStartX + b * bayWidth + bayWidth / 2;
          const pal = createWoodenPallet();
          pal.position.set(slotX, ly + 0.06, rz);
          const loadBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.18, 0.92, 1.05),
            (b + lv) % 2 === 0 ? matBrownCarton : matPrintedCarton
          );
          loadBox.position.y = 0.58;
          loadBox.castShadow = true;
          pal.add(loadBox);
          grpRacks.add(pal);
        }
      }
    });

    // Automated AS/RS Stacker Crane running in the aisle between z=-15.8 and z=-12.6 (at z=-14.2)
    const asrsRailBottom = new THREE.Mesh(
      new THREE.BoxGeometry(rackBays * bayWidth + 2.0, 0.08, 0.24),
      matDarkSteel
    );
    asrsRailBottom.position.set(0, 0.04, -14.2);
    grpRacks.add(asrsRailBottom);

    const asrsCraneGroup = new THREE.Group();
    asrsCraneGroup.position.set(0, 0, -14.2);
    const craneMast = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, rackLevels * levelHeight + 0.8, 0.28),
      matRobotYellow
    );
    craneMast.position.y = (rackLevels * levelHeight + 0.8) / 2;
    craneMast.castShadow = true;
    asrsCraneGroup.add(craneMast);

    const asrsShuttleCarriage = new THREE.Group();
    asrsShuttleCarriage.position.y = 2.0;
    const shuttlePlatform = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.16, 1.25),
      matDarkSteel
    );
    asrsShuttleCarriage.add(shuttlePlatform);
    const shuttleLoad = createPalletizedLoad(2, false);
    shuttleLoad.position.y = 0.08;
    asrsShuttleCarriage.add(shuttleLoad);
    asrsCraneGroup.add(asrsShuttleCarriage);

    grpRacks.add(asrsCraneGroup);
    tagMeshForMachine(grpRacks, "RACK-01");

    // ─────────────────────────────────────────────────────────────
    // 15. ALL 5 YELLOW 6-AXIS INDUSTRIAL ROBOTS (`ROBOT-01` .. `ROBOT-05`)
    // ─────────────────────────────────────────────────────────────
    interface ArticulatedRobotRig {
      machineId: string;
      turretJ1: THREE.Group;
      shoulderJ2: THREE.Group;
      elbowJ3: THREE.Group;
      wristJ5: THREE.Group;
      heldCargo: THREE.Group;
      phaseOffset: number;
      baseAngleA: number;
      baseAngleB: number;
    }
    const robotRigs: ArticulatedRobotRig[] = [];

    function buildYellowIndustrialRobot(opts: {
      machineId: string;
      parent: THREE.Group;
      position: [number, number, number];
      baseAngleA: number;
      baseAngleB: number;
      phaseOffset: number;
    }) {
      const { machineId, parent, position, baseAngleA, baseAngleB, phaseOffset } = opts;

      const root = new THREE.Group();
      root.position.set(...position);

      const floorPlate = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 0.08, 1.75),
        matPedestalGrey
      );
      floorPlate.position.y = 0.04;
      floorPlate.receiveShadow = true;
      root.add(floorPlate);

      const standH = 0.88;
      [
        [-0.48, -0.48],
        [0.48, -0.48],
        [-0.48, 0.48],
        [0.48, 0.48],
      ].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, standH, 0.14),
          matPedestalGrey
        );
        leg.position.set(px, 0.08 + standH / 2, pz);
        leg.castShadow = true;
        root.add(leg);
      });
      const topStandPlate = new THREE.Mesh(
        new THREE.BoxGeometry(1.18, 0.1, 1.18),
        matPedestalGrey
      );
      topStandPlate.position.y = 0.08 + standH + 0.05;
      topStandPlate.castShadow = true;
      root.add(topStandPlate);

      const baseCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.48, 0.22, 18),
        matDarkSteel
      );
      baseCylinder.position.y = 1.12;
      baseCylinder.castShadow = true;
      root.add(baseCylinder);

      const turretJ1 = new THREE.Group();
      turretJ1.position.y = 1.24;
      root.add(turretJ1);

      const turretBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.42, 0.48, 18),
        matRobotYellow
      );
      turretBody.position.y = 0.24;
      turretBody.castShadow = true;
      turretJ1.add(turretBody);

      [-0.26, 0.26].forEach((cz) => {
        const cheek = new THREE.Mesh(
          new THREE.BoxGeometry(0.44, 0.52, 0.12),
          matRobotYellow
        );
        cheek.position.set(0.06, 0.48, cz);
        cheek.castShadow = true;
        turretJ1.add(cheek);
      });

      const shoulderMotorCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.72, 14),
        matRedCap
      );
      shoulderMotorCap.rotation.x = Math.PI / 2;
      shoulderMotorCap.position.set(0.06, 0.52, 0);
      turretJ1.add(shoulderMotorCap);

      const balancer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.58, 10),
        matDarkSteel
      );
      balancer.rotation.z = 0.35;
      balancer.position.set(-0.26, 0.46, 0);
      turretJ1.add(balancer);

      const shoulderJ2 = new THREE.Group();
      shoulderJ2.position.set(0.06, 0.52, 0);
      turretJ1.add(shoulderJ2);

      const lowerArmLen = 1.55;
      const lowerArmMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, lowerArmLen, 0.32),
        matRobotYellow
      );
      lowerArmMesh.position.set(0, lowerArmLen / 2, 0);
      lowerArmMesh.castShadow = true;
      shoulderJ2.add(lowerArmMesh);

      const cableTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, lowerArmLen * 0.9, 8),
        matDarkSteel
      );
      cableTube.position.set(-0.2, lowerArmLen / 2, 0.12);
      shoulderJ2.add(cableTube);

      const elbowJ3 = new THREE.Group();
      elbowJ3.position.set(0, lowerArmLen, 0);
      shoulderJ2.add(elbowJ3);

      const elbowHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.38, 0.38),
        matRobotYellow
      );
      elbowHousing.position.set(-0.08, 0.05, 0);
      elbowHousing.castShadow = true;
      elbowJ3.add(elbowHousing);

      const elbowRedCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.48, 12),
        matRedCap
      );
      elbowRedCap.rotation.x = Math.PI / 2;
      elbowRedCap.position.set(0, 0.06, 0);
      elbowJ3.add(elbowRedCap);

      const forearmLen = 1.65;
      const forearmGeo = new THREE.CylinderGeometry(0.11, 0.17, forearmLen, 12);
      forearmGeo.rotateZ(-Math.PI / 2);
      const forearmMesh = new THREE.Mesh(forearmGeo, matRobotYellow);
      forearmMesh.position.set(forearmLen / 2, 0.08, 0);
      forearmMesh.castShadow = true;
      elbowJ3.add(forearmMesh);

      const wristJ5 = new THREE.Group();
      wristJ5.position.set(forearmLen, 0.08, 0);
      elbowJ3.add(wristJ5);

      const wristJoint = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.26, 10),
        matDarkSteel
      );
      wristJoint.position.y = -0.12;
      wristJ5.add(wristJoint);

      const gripperFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.12, 0.68),
        matWhiteFrame
      );
      gripperFrame.position.y = -0.26;
      gripperFrame.castShadow = true;
      wristJ5.add(gripperFrame);

      for (let gx = -1; gx <= 1; gx++) {
        for (let gz = -1; gz <= 1; gz++) {
          const cup = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.065, 0.08, 8),
            matDarkSteel
          );
          cup.position.set(gx * 0.22, -0.34, gz * 0.19);
          wristJ5.add(cup);
        }
      }

      const heldCargo = new THREE.Group();
      heldCargo.position.y = -0.52;
      const cargoBox1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.26, 0.54),
        matPrintedCarton
      );
      cargoBox1.position.x = -0.19;
      cargoBox1.castShadow = true;
      heldCargo.add(cargoBox1);

      const cargoBox2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.26, 0.54),
        matPrintedCarton
      );
      cargoBox2.position.x = 0.19;
      cargoBox2.castShadow = true;
      heldCargo.add(cargoBox2);

      wristJ5.add(heldCargo);
      parent.add(root);

      robotRigs.push({
        machineId,
        turretJ1,
        shoulderJ2,
        elbowJ3,
        wristJ5,
        heldCargo,
        phaseOffset,
        baseAngleA,
        baseAngleB,
      });
    }

    // Robot #1 (Zone A Lower-Left)
    const grpRobot1 = registerMachineGroup("ROBOT-01");
    buildYellowIndustrialRobot({
      machineId: "ROBOT-01",
      parent: grpRobot1,
      position: [-5.8, 0, 1.8],
      baseAngleA: 2.65,
      baseAngleB: 0.45,
      phaseOffset: 0.0,
    });
    tagMeshForMachine(grpRobot1, "ROBOT-01");

    // Robot #2 (Zone A Upper-Center)
    const grpRobot2 = registerMachineGroup("ROBOT-02");
    buildYellowIndustrialRobot({
      machineId: "ROBOT-02",
      parent: grpRobot2,
      position: [0.35, 0, -5.1],
      baseAngleA: 2.35,
      baseAngleB: -1.15,
      phaseOffset: Math.PI * 0.85,
    });
    tagMeshForMachine(grpRobot2, "ROBOT-02");

    // Robot #3 (Zone B West Packaging Transfer)
    const grpRobot3 = registerMachineGroup("ROBOT-03");
    buildYellowIndustrialRobot({
      machineId: "ROBOT-03",
      parent: grpRobot3,
      position: [-13.5, 0, -4.4],
      baseAngleA: 1.55,
      baseAngleB: -1.55,
      phaseOffset: Math.PI * 0.4,
    });
    tagMeshForMachine(grpRobot3, "ROBOT-03");

    // Robot #4 (Zone C East Induction Cell)
    const grpRobot4 = registerMachineGroup("ROBOT-04");
    buildYellowIndustrialRobot({
      machineId: "ROBOT-04",
      parent: grpRobot4,
      position: [18.2, 0, -4.2],
      baseAngleA: 1.85,
      baseAngleB: -0.65,
      phaseOffset: Math.PI * 1.25,
    });
    tagMeshForMachine(grpRobot4, "ROBOT-04");

    // Robot #5 (Zone D Outbound Dock Palletizer)
    const grpRobot5 = registerMachineGroup("ROBOT-05");
    buildYellowIndustrialRobot({
      machineId: "ROBOT-05",
      parent: grpRobot5,
      position: [13.5, 0, 1.5],
      baseAngleA: 1.65,
      baseAngleB: -1.45,
      phaseOffset: Math.PI * 0.65,
    });
    tagMeshForMachine(grpRobot5, "ROBOT-05");

    // ─────────────────────────────────────────────────────────────
    // 16. ZONE F: AUTONOMOUS MOBILE ROBOTS / AGV FLEET (`AGV-FLEET`)
    // ─────────────────────────────────────────────────────────────
    const grpAgvFleet = registerMachineGroup("AGV-FLEET");

    function createIndustrialAgv(): THREE.Group {
      const agv = new THREE.Group();
      const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.32, 1.38),
        matYellowRail
      );
      chassis.position.y = 0.22;
      chassis.castShadow = true;
      agv.add(chassis);

      const bumperF = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.22, 1.42),
        matDarkSteel
      );
      bumperF.position.set(0.94, 0.18, 0);
      agv.add(bumperF);

      const bumperB = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.22, 1.42),
        matDarkSteel
      );
      bumperB.position.set(-0.94, 0.18, 0);
      agv.add(bumperB);

      // Amber safety beacon on corner
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.18, 10),
        new THREE.MeshStandardMaterial({
          color: "#f59e0b",
          emissive: "#d97706",
          emissiveIntensity: 1.0,
        })
      );
      beacon.position.set(0.75, 0.46, 0.55);
      agv.add(beacon);

      // Pallet + cargo on AGV deck
      const load = createPalletizedLoad(2, true);
      load.position.y = 0.38;
      agv.add(load);

      return agv;
    }

    // ─────────────────────────────────────────────────────────────
    // 17. ANIMATED PACKAGES, PALLETS & AGVS ALONG PATHS
    // ─────────────────────────────────────────────────────────────
    interface PathPackage {
      mesh: THREE.Object3D;
      machineId: string;
      progress: number;
      speed: number;
      waypoints: THREE.Vector3[];
      alignRotation?: boolean;
    }
    const movingPackages: PathPackage[] = [];

    function spawnPackagesOnPath(opts: {
      machineId: string;
      count: number;
      speed: number;
      waypoints: [number, number, number][];
      createMesh: (index: number) => THREE.Object3D;
      alignRotation?: boolean;
      parentGroup?: THREE.Group;
    }) {
      const vecPoints = opts.waypoints.map((p) => new THREE.Vector3(...p));
      for (let i = 0; i < opts.count; i++) {
        const mesh = opts.createMesh(i);
        if (opts.parentGroup) {
          opts.parentGroup.add(mesh);
        } else {
          scene.add(mesh);
        }
        movingPackages.push({
          mesh,
          machineId: opts.machineId,
          progress: i / opts.count,
          speed: opts.speed,
          waypoints: vecPoints,
          alignRotation: opts.alignRotation ?? true,
        });
      }
    }

    // Path 1: Upper Infeed Line (`CONV-UPPER`)
    spawnPackagesOnPath({
      machineId: "CONV-UPPER",
      count: 10,
      speed: 0.068,
      waypoints: [
        [13.4, 1.16, -7.2],
        [4.8, 1.16, -7.2],
        [0.2, 1.16, -7.2],
        [-1.25, 1.16, -5.15],
      ],
      createMesh: (i) => {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.32, 0.36),
          i % 3 === 0 ? matPrintedCarton : matBrownCarton
        );
        b.castShadow = true;
        return b;
      },
    });

    // Path 2: Upper Accumulator Spur (`CONV-UPPER`)
    spawnPackagesOnPath({
      machineId: "CONV-UPPER",
      count: 3,
      speed: 0.11,
      waypoints: [
        [4.8, 1.16, -6.9],
        [3.5, 1.16, -4.55],
      ],
      createMesh: () => {
        const pairGrp = new THREE.Group();
        const b1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.3, 0.34),
          matBrownCarton
        );
        b1.position.z = -0.2;
        b1.castShadow = true;
        const b2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.3, 0.34),
          matPrintedCarton
        );
        b2.position.z = 0.2;
        b2.castShadow = true;
        pairGrp.add(b1, b2);
        return pairGrp;
      },
    });

    // Path 3: East Barcode Tunnel Feed (`SCAN-02`)
    spawnPackagesOnPath({
      machineId: "SCAN-02",
      count: 7,
      speed: 0.085,
      waypoints: [
        [22.2, 1.16, -7.2],
        [13.5, 1.16, -7.2],
      ],
      createMesh: (i) => {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.44, 0.34, 0.38),
          i % 2 === 0 ? matPrintedCarton : matBrownCarton
        );
        b.castShadow = true;
        return b;
      },
    });

    // Path 4: West Box Sealer Line (`SEAL-01`)
    spawnPackagesOnPath({
      machineId: "SEAL-01",
      count: 7,
      speed: 0.075,
      waypoints: [
        [-22.2, 1.12, -6.8],
        [-12.8, 1.12, -6.8],
      ],
      createMesh: () => {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.36, 0.4),
          matBrownCarton
        );
        b.castShadow = true;
        return b;
      },
    });

    // Path 5: West Vision Inspection Line (`INSP-01`)
    spawnPackagesOnPath({
      machineId: "INSP-01",
      count: 6,
      speed: 0.07,
      waypoints: [
        [-22.2, 1.1, -1.8],
        [-12.8, 1.1, -1.8],
      ],
      createMesh: (i) => {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.52, 0.38, 0.44),
          i % 2 === 0 ? matPrintedCarton : matBrownCarton
        );
        b.castShadow = true;
        return b;
      },
    });

    // Path 6: Left Pallet Infeed (`SCAN-01` -> `CONV-MAIN`)
    spawnPackagesOnPath({
      machineId: "CONV-MAIN",
      count: 2,
      speed: 0.042,
      alignRotation: false,
      waypoints: [
        [-11.6, 0.88, -1.8],
        [-5.2, 0.88, -1.8],
        [-0.4, 0.88, -1.8],
      ],
      createMesh: (i) => (i === 0 ? createWoodenPallet() : createPalletizedLoad(4, false)),
    });

    // Path 7: KAUFMAN Stretch-Wrapper Heavy Pallet Line (`WRAP-01`)
    spawnPackagesOnPath({
      machineId: "WRAP-01",
      count: 3,
      speed: 0.042,
      alignRotation: false,
      waypoints: [
        [2.6, 0.88, -1.8],
        [6.4, 0.88, -1.8],
        [14.2, 0.88, -1.8],
      ],
      createMesh: (i) => createPalletizedLoad(4, i > 0),
    });

    // Path 8: Outbound Dock Conveyor (`ROBOT-05`)
    spawnPackagesOnPath({
      machineId: "ROBOT-05",
      count: 2,
      speed: 0.05,
      alignRotation: false,
      waypoints: [
        [13.8, 0.88, 4.2],
        [21.2, 0.88, 4.2],
      ],
      createMesh: () => createPalletizedLoad(3, true),
    });

    // Path 9: Lower-Left U-Loop Package Line (`CONV-LOWER`)
    spawnPackagesOnPath({
      machineId: "CONV-LOWER",
      count: 11,
      speed: 0.068,
      waypoints: [
        [-6.6, 1.1, 2.2],
        [-8.4, 1.1, 2.2],
        [-8.4, 1.08, 2.8],
        [-10.75, 1.08, 5.25],
        [-6.75, 1.08, 7.55],
        [-4.3, 1.08, 4.45],
      ],
      createMesh: (i) => {
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.44, 0.28, 0.36),
          i % 2 === 0 ? matBrownCarton : matPrintedCarton
        );
        b.castShadow = true;
        return b;
      },
    });

    // Path 10: Perimeter AGV Fleet Loop (`AGV-FLEET`)
    spawnPackagesOnPath({
      machineId: "AGV-FLEET",
      count: 4,
      speed: 0.018,
      alignRotation: true,
      parentGroup: grpAgvFleet,
      waypoints: [
        [-23.0, 0.02, 9.2],
        [23.0, 0.02, 9.2],
        [23.0, 0.02, -10.5],
        [-23.0, 0.02, -10.5],
        [-23.0, 0.02, 9.2],
      ],
      createMesh: () => createIndustrialAgv(),
    });
    tagMeshForMachine(grpAgvFleet, "AGV-FLEET");

    // ─────────────────────────────────────────────────────────────
    // 18. RAYCASTING FOR HOVER & CLICK SELECTION
    // ─────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes, false);
      if (intersects.length > 0) {
        const mId = intersects[0].object.userData.machineId as string | undefined;
        setHoveredMachineId(mId || null);
        renderer.domElement.style.cursor = mId ? "pointer" : "grab";
      } else {
        setHoveredMachineId(null);
        renderer.domElement.style.cursor = "grab";
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes, false);
      if (intersects.length > 0) {
        const mId = intersects[0].object.userData.machineId as string | undefined;
        if (mId) {
          setSelectedMachineId(mId);
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", handlePointerMove);
    renderer.domElement.addEventListener("mousedown", handlePointerDown);
    renderer.domElement.addEventListener("mouseup", handlePointerUp);

    // ─────────────────────────────────────────────────────────────
    // 19. MAIN ANIMATION LOOP
    // ─────────────────────────────────────────────────────────────
    let animFrameId = 0;
    const clock = new THREE.Clock();
    const robotClocks: Record<string, number> = {
      "ROBOT-01": 0,
      "ROBOT-02": Math.PI * 0.85,
      "ROBOT-03": Math.PI * 0.4,
      "ROBOT-04": Math.PI * 1.25,
      "ROBOT-05": Math.PI * 0.65,
    };
    let wrapperAngle = 0;
    let sorterClock = 0;
    let asrsClock = 0;
    let badgeFrameSkip = 0;

    const getMachineState = (id: string) => {
      const found = machinesRef.current.find((m) => m.id === id);
      const gSpeed = globalSpeedRef.current;
      return {
        active: Boolean(found?.running && gSpeed > 0),
        rate: (found?.speed ?? 1) * gSpeed,
      };
    };

    const samplePolyline = (pts: THREE.Vector3[], t: number) => {
      if (pts.length < 2)
        return { pos: pts[0].clone(), dir: new THREE.Vector3(1, 0, 0) };
      const segLengths: number[] = [];
      let totalLen = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const l = pts[i].distanceTo(pts[i + 1]);
        segLengths.push(l);
        totalLen += l;
      }
      let targetDist = THREE.MathUtils.clamp(t, 0, 1) * totalLen;
      for (let i = 0; i < segLengths.length; i++) {
        if (targetDist <= segLengths[i] || i === segLengths.length - 1) {
          const localT = segLengths[i] > 0 ? targetDist / segLengths[i] : 0;
          const pos = new THREE.Vector3().lerpVectors(
            pts[i],
            pts[i + 1],
            localT
          );
          const dir = new THREE.Vector3()
            .subVectors(pts[i + 1], pts[i])
            .normalize();
          return { pos, dir };
        }
        targetDist -= segLengths[i];
      }
      return {
        pos: pts[pts.length - 1].clone(),
        dir: new THREE.Vector3(1, 0, 0),
      };
    };

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      controls.update();

      // 1. Rotate conveyor rollers
      for (const rSet of allRollerSets) {
        const st = getMachineState(rSet.machineId);
        if (st.active) {
          const rotDelta = dt * 6.5 * st.rate;
          for (let i = 0; i < rSet.rollers.length; i++) {
            rSet.rollers[i].rotation.z -= rotDelta;
          }
        }
      }

      // 2. Move boxes, pallets, and AGVs along paths
      for (const pkg of movingPackages) {
        const st = getMachineState(pkg.machineId);
        if (st.active) {
          pkg.progress = (pkg.progress + dt * pkg.speed * st.rate) % 1;
        }
        const { pos, dir } = samplePolyline(pkg.waypoints, pkg.progress);
        pkg.mesh.position.copy(pos);
        if (pkg.alignRotation) {
          pkg.mesh.rotation.y = Math.atan2(-dir.z, dir.x);
        }
      }

      // 3. Animate all 5 Yellow 6-Axis Industrial Robots
      for (const rig of robotRigs) {
        const st = getMachineState(rig.machineId);
        if (st.active) {
          robotClocks[rig.machineId] =
            (robotClocks[rig.machineId] || 0) + dt * 1.45 * st.rate;
        }
        const phase = (robotClocks[rig.machineId] || 0) % (Math.PI * 2);
        const norm = phase / (Math.PI * 2);

        const rawSwing = 0.5 - 0.5 * Math.cos(phase);
        const smoothSwing = THREE.MathUtils.smoothstep(rawSwing, 0.08, 0.92);
        rig.turretJ1.rotation.y = THREE.MathUtils.lerp(
          rig.baseAngleA,
          rig.baseAngleB,
          smoothSwing
        );

        const dipFactor = Math.pow(Math.cos(phase * 2), 2);
        const shoulderAngle = THREE.MathUtils.lerp(-0.18, -0.58, dipFactor);
        const elbowAngle = THREE.MathUtils.lerp(-0.12, 0.42, dipFactor);

        rig.shoulderJ2.rotation.z = shoulderAngle;
        rig.elbowJ3.rotation.z = elbowAngle;
        rig.wristJ5.rotation.z = -(shoulderAngle + elbowAngle);

        rig.heldCargo.visible = norm > 0.04 && norm < 0.5;
      }

      // 4. Animate KAUFMAN Rotary Ring Stretch Wrapper (`WRAP-01`)
      const wrapSt = getMachineState("WRAP-01");
      if (wrapSt.active) {
        wrapperAngle += dt * 2.4 * wrapSt.rate;
        wrapperRotorGroup.rotation.y = wrapperAngle;
        filmCarriageGroup.position.y =
          -1.25 + Math.sin(wrapperAngle * 1.5) * 0.65;
      }

      // 5. Animate Sorter Diverter Arm (`SORT-01`) & Scanner Lasers (`SCAN-01`, `SCAN-02`)
      const sortSt = getMachineState("SORT-01");
      if (sortSt.active) {
        sorterClock += dt * 2.8 * sortSt.rate;
        diverterPaddle.rotation.y = 0.35 + Math.sin(sorterClock) * 0.38;
      }

      const scanSt = getMachineState("SCAN-01");
      scanLaser.visible = scanSt.active;
      if (scanSt.active) {
        scanLaser.position.x = -7.85 + Math.sin(clock.elapsedTime * 3.5) * 0.65;
      }

      const scan2St = getMachineState("SCAN-02");
      laserWeb.visible = scan2St.active;
      if (scan2St.active) {
        laserWeb.position.x = 16.5 + Math.cos(clock.elapsedTime * 4.2) * 0.55;
      }

      // 6. Animate AS/RS High-Bay Warehouse Stacker Crane (`RACK-01`)
      const rackSt = getMachineState("RACK-01");
      if (rackSt.active) {
        asrsClock += dt * 0.55 * rackSt.rate;
        asrsCraneGroup.position.x = Math.sin(asrsClock) * 6.5;
        asrsShuttleCarriage.position.y =
          2.2 + Math.sin(asrsClock * 2.3) * 1.35;
      }

      // 7. Project 3D badge coordinates to 2D overlay every 2 frames
      badgeFrameSkip = (badgeFrameSkip + 1) % 2;
      if (badgeFrameSkip === 0) {
        const w = renderer.domElement.clientWidth;
        const h = renderer.domElement.clientHeight;
        const nextCoords: Record<
          string,
          { x: number; y: number; visible: boolean }
        > = {};

        for (const m of machinesRef.current) {
          const v = new THREE.Vector3(...m.position);
          v.project(camera);
          const isVisible =
            v.z < 1 &&
            v.x >= -1.05 &&
            v.x <= 1.05 &&
            v.y >= -1.05 &&
            v.y <= 1.05;
          nextCoords[m.id] = {
            x: (v.x * 0.5 + 0.5) * w,
            y: (-(v.y * 0.5) + 0.5) * h,
            visible: isVisible,
          };
        }
        setBadgeCoords(nextCoords);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", handlePointerMove);
      renderer.domElement.removeEventListener("mousedown", handlePointerDown);
      renderer.domElement.removeEventListener("mouseup", handlePointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  const selectedMachine =
    machines.find((m) => m.id === selectedMachineId) || null;
  const activeCount = machines.filter((m) => m.running).length;
  const totalThroughput = machines.reduce((acc, m) => acc + m.throughput, 0);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={
        embeddedHero
          ? "relative w-full h-full bg-zinc-950 overflow-hidden select-none flex flex-col"
          : "relative w-full h-[calc(100vh-2rem)] min-h-[700px] bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl select-none flex flex-col"
      }
    >
      {/* ── Top Industrial SCADA Command Bar ── */}
      <div className="z-20 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Telemetry Counters & Collapsed Camera Views Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Telemetry Counters */}
          <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <div>
              <span className="text-zinc-400 mr-1">Active:</span>
              <span className="font-mono font-bold text-emerald-400">
                {activeCount}/{machines.length}
              </span>
            </div>
            <div className="h-3.5 w-px bg-zinc-800" />
            <div>
              <span className="text-zinc-400 mr-1">Throughput:</span>
              <span className="font-mono font-bold text-amber-400">
                {totalThroughput.toLocaleString()} pcs
              </span>
            </div>
          </div>

          {/* Collapsible Camera Views Dropdown Button (Hidden until clicked) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCameraMenu((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                showCameraMenu
                  ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-zinc-900/90 text-zinc-200 border-zinc-800 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Camera Views</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showCameraMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu - Only appears when clicked */}
            {showCameraMenu && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl p-2.5 shadow-2xl space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-zinc-800">
                  <span className="text-xs font-bold text-zinc-400">
                    Camera Perspectives
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      flyToCamera(
                        CAMERA_PRESETS[0].pos,
                        CAMERA_PRESETS[0].target,
                        "isometric"
                      );
                      setShowCameraMenu(false);
                    }}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    title="Reset Camera to Reference View"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {CAMERA_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        flyToCamera(preset.pos, preset.target, preset.id);
                        setShowCameraMenu(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between ${
                        activePreset === preset.id
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-transparent"
                      }`}
                    >
                      <span>{preset.label}</span>
                      <Eye className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Roof Mode Switcher & Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* 3-State Roof Visibility Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <Home className="w-3.5 h-3.5 text-sky-400 ml-1.5" />
            {(
              [
                { id: "VISIBLE", label: "Roof Visible" },
                { id: "TRANSPARENT", label: "Transparent Roof" },
                { id: "HIDDEN", label: "Roof Hidden" },
              ] as { id: RoofMode; label: string }[]
            ).map((rm) => (
              <button
                key={rm.id}
                type="button"
                onClick={() => setRoofMode(rm.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  roofMode === rm.id
                    ? "bg-sky-500 text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {rm.label}
              </button>
            ))}
          </div>

          {/* Global Speed Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <Gauge className="w-3.5 h-3.5 text-zinc-400 ml-1.5" />
            {[0.5, 1.0, 1.5, 2.0].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setGlobalSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  globalSpeed === spd
                    ? "bg-amber-500 text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Play / Pause All */}
          <button
            type="button"
            onClick={handleToggleAll}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isAllRunning
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
            }`}
          >
            {isAllRunning ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isAllRunning ? "Pause All" : "Resume All"}</span>
          </button>

          {/* Toggle 3D Floating Tags */}
          <button
            type="button"
            onClick={() => setShowLabels((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              showLabels
                ? "bg-blue-500/15 text-blue-300 border-blue-500/40"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tags</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Main 3D WebGL Canvas Viewport ── */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div ref={mountRef} className="w-full h-full" />

        {/* ── 3D Floating Machine Status Badges (Projected from 3D Space) ── */}
        {showLabels && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
            {machines.map((m) => {
              const coord = badgeCoords[m.id];
              if (!coord || !coord.visible) return null;
              const isSelected = selectedMachineId === m.id;
              const isHovered = hoveredMachineId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMachineId(m.id);
                    flyToCamera(m.cameraView.pos, m.cameraView.target, "");
                  }}
                  style={{
                    transform: `translate3d(${Math.round(coord.x)}px, ${Math.round(coord.y)}px, 0) translate(-50%, -100%)`,
                  }}
                  className={`pointer-events-auto absolute top-0 left-0 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md border transition-colors flex items-center gap-1.5 shadow-lg ${
                    isSelected
                      ? "bg-amber-500 text-zinc-950 border-amber-300 ring-2 ring-amber-400/50 z-20"
                      : isHovered
                      ? "bg-zinc-900/95 text-white border-amber-400 z-20"
                      : "bg-zinc-950/80 text-zinc-200 border-zinc-700/80 hover:border-zinc-500"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      m.running
                        ? isSelected
                          ? "bg-zinc-950"
                          : "bg-emerald-400"
                        : "bg-rose-500"
                    }`}
                  />
                  <span>{m.code}</span>
                </button>
              );
            })}
          </div>
        )}



        {/* ── Right Selected Machine Inspector & Control Panel ── */}
        {selectedMachine && (
          <div className="z-20 absolute top-3 right-3 w-80 sm:w-88 bg-zinc-950/92 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3 text-zinc-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold">
                    {selectedMachine.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-xs font-semibold">
                    {selectedMachine.zone}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      selectedMachine.running
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {selectedMachine.running ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        RUNNING
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        STOPPED
                      </>
                    )}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mt-1.5 leading-snug">
                  {selectedMachine.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMachineId(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {selectedMachine.description}
            </p>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-2.5 text-xs">
              <div>
                <span className="text-zinc-400 block">Throughput</span>
                <span className="font-mono font-bold text-white">
                  {selectedMachine.throughput.toLocaleString()} pcs
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Cycle Time</span>
                <span className="font-mono font-bold text-emerald-400">
                  {(
                    selectedMachine.cycleTimeSec /
                    Math.max(0.25, selectedMachine.speed * globalSpeed)
                  ).toFixed(1)}{" "}
                  sec
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Power Draw</span>
                <span className="font-mono font-bold text-amber-400">
                  {selectedMachine.running
                    ? selectedMachine.powerKw.toFixed(1)
                    : "0.2"}{" "}
                  kW
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Core Temp</span>
                <span className="font-mono font-bold text-sky-400">
                  {selectedMachine.temperatureC.toFixed(1)} °C
                </span>
              </div>
            </div>

            {/* Individual Speed Multiplier Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Machine Speed Override
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {selectedMachine.speed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.25}
                max={2.5}
                step={0.25}
                value={selectedMachine.speed}
                onChange={(e) =>
                  updateMachineSpeed(
                    selectedMachine.id,
                    parseFloat(e.target.value)
                  )
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Action Buttons: Start/Stop & Focus Camera */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => toggleMachineRunning(selectedMachine.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  selectedMachine.running
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {selectedMachine.running
                    ? selectedMachine.category === "ROBOT"
                      ? "Pause Robot Arm"
                      : "Stop Equipment"
                    : selectedMachine.category === "ROBOT"
                    ? "Resume Robot Arm"
                    : "Start Equipment"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  flyToCamera(
                    selectedMachine.cameraView.pos,
                    selectedMachine.cameraView.target,
                    ""
                  )
                }
                className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Focus</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom Quick Equipment Control Dock (Kept ONLY in Admin for configuration) & Custom Actions ── */}
        <div className="z-20 absolute bottom-3 left-3 right-3 flex flex-col gap-2 pointer-events-none">
          {bottomActions && (
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
              {bottomActions}
            </div>
          )}
          {!embeddedHero && (
            <div className="pointer-events-auto bg-zinc-950/92 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-2.5 shadow-2xl">
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                <span className="text-xs font-bold text-zinc-400 px-2 shrink-0 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  All 16 Stations:
                </span>
                {machines.map((m) => {
                  const isSelected = selectedMachineId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs shrink-0 transition-all ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-500/50 text-white"
                          : "bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMachineId(m.id);
                          flyToCamera(m.cameraView.pos, m.cameraView.target, "");
                        }}
                        className="font-bold flex items-center gap-1.5 text-left"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            m.running ? "bg-emerald-400" : "bg-rose-500"
                          }`}
                        />
                        <span>{m.code}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMachineRunning(m.id)}
                        className={`ml-1 px-2 py-0.5 rounded-md font-bold transition-colors ${
                          m.running
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-rose-500/30 hover:text-rose-200"
                            : "bg-rose-500/20 text-rose-300 hover:bg-emerald-500/30 hover:text-emerald-200"
                        }`}
                      >
                        {m.running ? "ON" : "OFF"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
