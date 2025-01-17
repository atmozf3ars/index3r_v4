'use client'

import dynamic from 'next/dynamic'

const FileExplorer = dynamic(() => import('@/components/FileExplorer'), { ssr: false })

export default function ClientFileExplorer() {
  return <FileExplorer />
}