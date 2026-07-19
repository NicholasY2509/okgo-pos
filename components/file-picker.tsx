"use client"

import * as React from "react"
import { UploadCloud, Image as ImageIcon, X, File as FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import Image from "next/image"

interface FilePickerProps {
  value?: string | null
  onChange: (url: string, file?: File) => void
  accept?: string
  className?: string
}

export function FilePicker({ value, onChange, accept = "image/*", className = "" }: FilePickerProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  
  const inputRef = React.useRef<HTMLInputElement>(null)

  const uploadFile = (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload", true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        setUploadProgress(percentComplete)
      }
    }

    xhr.onload = () => {
      setIsUploading(false)
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText)
          if (data.success) {
            onChange(data.url, file)
            toast.success("File uploaded successfully")
          } else {
            toast.error(data.error || "Upload failed")
          }
        } catch (e) {
          toast.error("Failed to parse server response")
        }
      } else {
        toast.error(`Upload failed with status: ${xhr.status}`)
      }
      if (inputRef.current) inputRef.current.value = ""
    }

    xhr.onerror = () => {
      setIsUploading(false)
      toast.error("An error occurred during upload")
      if (inputRef.current) inputRef.current.value = ""
    }

    xhr.send(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isUploading) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (isUploading) return
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-border w-full aspect-video bg-muted/20 flex items-center justify-center">
          {accept.includes("image") ? (
            <Image src={value} alt="Preview" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate max-w-[200px] px-4">{value.split('/').pop()}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer w-full aspect-video flex flex-col items-center justify-center gap-3 text-muted-foreground overflow-hidden
            ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 bg-muted/5 hover:bg-muted/10"}
          `}
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="w-full max-w-[200px] flex flex-col gap-2 items-center px-4">
              <span className="text-sm font-medium">Uploading... {uploadProgress}%</span>
              <Progress value={uploadProgress} className="h-2 w-full" />
            </div>
          ) : (
            <>
              <UploadCloud className={`h-8 w-8 ${isDragging ? "text-primary" : ""}`} />
              <span className={`text-sm font-medium ${isDragging ? "text-primary" : ""}`}>
                {isDragging ? "Drop file to upload" : "Click or drag file to upload"}
              </span>
            </>
          )}
        </div>
      )}
      
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
    </div>
  )
}
