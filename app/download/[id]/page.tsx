import { Metadata } from 'next'
import { getFileInfo } from '@/lib/getFileInfo'
import DownloadPageContent from '@/components/DownloadPageContent'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const fileInfo = await getFileInfo(params.id)
  return {
    title: fileInfo ? `IC: DOWNLOAD '${fileInfo.fileName}'` : 'IC: DOWNLOAD',
    description: fileInfo ? `Download ${fileInfo.fileName} from Inner Circle` : 'Download file from Inner Circle',
  }
}

export default async function DownloadPage({ params }: { params: { id: string } }) {
  const fileInfo = await getFileInfo(params.id)
  
  if (!fileInfo) {
    return <div>File not found</div>
  }

  return (
    <DownloadPageContent id={params.id} initialFileInfo={fileInfo} />
  )
}

