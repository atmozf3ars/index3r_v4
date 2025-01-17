import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, Upload, FolderPlus, Download, Trash2, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from "@/components/ui/progress"
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import path from 'path';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  .hyperlink-color a {
    color: var(--hyperlink-color, #0000FF);
  }
`

interface CustomContextMenuProps {
 x: number
 y: number
 onClose: () => void
 onCreatePublicLink: () => void
 isFile: boolean
 isDirectory: boolean
 setCustomThumbnail: () => void
 currentPath: string[]
 showFileOptions: boolean
 onCreateFolder: (folderName: string) => Promise<void>
 onRefresh: () => void
 handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
 handleDownloadAllFiles: () => void;
 isRootFolder: boolean;
 onDelete: (filePath: string, currentDirectory: string) => Promise<void>;
 filePath: string;
 style?: React.CSSProperties;
 onOpenThemeManager: () => void;
}

interface ThemeManagerProps {
  onClose: () => void
  className?: string
  isDarkMode: boolean
}

export function CustomContextMenu({
 x,
 y,
 onClose,
 onCreatePublicLink,
 isFile,
 isDirectory,
 setCustomThumbnail,
 currentPath,
 showFileOptions,
 onCreateFolder,
 onRefresh,
 handleUpload,
 handleDownloadAllFiles,
 isRootFolder,
 onDelete,
 filePath,
 style,
 onOpenThemeManager
}: CustomContextMenuProps) {
 const { toast } = useToast()
 const [isOpen, setIsOpen] = useState(false)
 const [newFolderName, setNewFolderName] = useState('')
 const fileInputRef = useRef<HTMLInputElement>(null)
 const contextMenuRef = useRef<HTMLDivElement>(null);
 const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
 

 const handleCreateFolder = async () => {
   if (!newFolderName) return

   try {
     await onCreateFolder(newFolderName)
     toast({
       title: 'Folder created successfully',
       description: `Folder "${newFolderName}" has been created.`,
     })
     setNewFolderName('')
     setIsOpen(false)
     onClose()
     onRefresh()
   } catch (error) {
     console.error('Error creating folder:', error)
     toast({
       title: 'Failed to create folder',
       description: 'An unexpected error occurred. Please try again.',
       variant: 'destructive'
     })
   }
 }

 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     if (
       contextMenuRef.current && 
       !contextMenuRef.current.contains(event.target as Node) &&
       !(event.target as Element).closest('.theme-manager-dialog') 
     ) {
       onClose();
     }
   };

   document.addEventListener('mousedown', handleClickOutside);
   return () => {
     document.removeEventListener('mousedown', handleClickOutside);
   };
 }, [onClose]);

 const isCurrentDirectory = filePath.toLowerCase().replace(/\\/g, '/') === currentPath.join('/').toLowerCase();

 return (
   <>
     <motion.div
       ref={contextMenuRef}
       className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 custom-context-menu hyperlink-color"
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       exit={{ opacity: 0, scale: 0.95 }}
       transition={{ duration: 0.1 }}
       style={{
         left: x,
         top: y,
         backgroundColor: 'var(--context-menu-color, rgba(243, 244, 246, 0.7))',
         ...style
       }}
     >
       {showFileOptions && (
         <>
           <Button
             variant="ghost"
             className="w-full justify-start"
             onClick={onCreatePublicLink}
           >
             <Link className="mr-2 h-4 w-4" />
             CREATE PUBLIC LINK {isFile ? "FOR THIS FILE" : isDirectory ? "FOR ENTIRE FOLDER" : ""}
           </Button>
           <Button
             variant="ghost"
             className="w-full justify-start"
             onClick={setCustomThumbnail}
           >
             <Upload className="mr-2 h-4 w-4" />
             SET THUMBNAIL
           </Button>
           {showFileOptions && !isRootFolder && !isCurrentDirectory && (
             <Button
               variant="ghost"
               className="w-full justify-start text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
               onClick={() => setIsDeleteDialogOpen(true)}
             >
               <Trash2 className="mr-2 h-4 w-4" />
               DELETE
             </Button>
           )}
         </>
       )}
       {currentPath.length > 0 && (
         <>
           <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(true)}>
             <FolderPlus className="mr-2 h-4 w-4" />
             NEW FOLDER
           </Button>
           <Button
             variant="ghost"
             className="w-full justify-start"
             onClick={() => fileInputRef.current && fileInputRef.current.click()}
           >
             <Upload className="mr-2 h-4 w-4" />
             UPLOAD FILE(S)
           </Button>
           <input
             type="file"
             ref={fileInputRef}
             onChange={handleUpload}
             className="hidden"
             multiple
           />
         </>
       )}
       {!isRootFolder && (
         <Button
           variant="ghost"
           className="w-full justify-start"
           onClick={handleDownloadAllFiles}
         >
           <Download className="mr-2 h-4 w-4" />
           DOWNLOAD ALL FILES
         </Button>
       )}
       <Button
  variant="ghost"
  className="justify-start"
  onClick={() => {
    onClose();
    onOpenThemeManager(); 
  }}
>
  <Settings className="mr-2 h-4 w-4" />
  THEME MANAGER
</Button>
     </motion.div>
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
       <DialogContent>
         <DialogTitle>Create New Folder</DialogTitle>
         <DialogDescription>
           <Input
             type="text"
             placeholder="Folder name"
             value={newFolderName}
             onChange={(e) => setNewFolderName(e.target.value)}
             className="w-full mb-4"
           />
           <div className="flex justify-end">
             <Button onClick={handleCreateFolder}>Create</Button>
           </div>
         </DialogDescription>
       </DialogContent>
     </Dialog>
     <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>Are you sure you want to delete this {isFile ? "file" : "folder"}?</AlertDialogTitle>
           <AlertDialogDescription>
             This action cannot be undone. This will permanently delete the {isFile ? "file" : "folder"} and all its contents.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel>Cancel</AlertDialogCancel>
           <AlertDialogAction onClick={() => {
             onDelete(filePath, currentPath.join('/'))
             setIsDeleteDialogOpen(false)
             onClose()
           }}>
             Delete
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
     <GlobalStyle />
   </>
 )
}

