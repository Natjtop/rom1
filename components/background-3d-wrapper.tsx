"use client"

import dynamic from "next/dynamic"

const Background3D = dynamic(() => import("./background-3d"), { ssr: false })

export default function Background3DWrapper() {
  return <Background3D />
}
