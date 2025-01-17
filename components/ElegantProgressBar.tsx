import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'

interface ProgressItem {
  id: string
  progress: number
  label: string
  fileName: string
  filePath: string
}

interface ElegantProgressBarProps {
  items: ProgressItem[]
  onCancel: (id: string) => void
}

export const ElegantProgressBar: React.FC<ElegantProgressBarProps> = ({ items, onCancel }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 left-4 right-4 z-50"
    >
      <div className="max-w-md mx-auto space-y-2">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg shadow-lg border-2 border-blue-500 dark:border-blue-400"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {item.fileName}
                </span>
                <Button
                  onClick={() => onCancel(item.id)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <motion.div
                    className="w-full h-full bg-white/30"
                    animate={{ x: ["0%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                </motion.div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{Math.round(item.progress)}%</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

