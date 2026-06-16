"use client"

import * as React from "react"
import { UploadCloud, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"

interface FilePickerProps {
  value?: string | null
  onChange: (url: string) => void
  accept?: string
  className?: string
}

export function FilePicker({ value, onChange, accept = "image/*", className = "" }: FilePickerProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        onChange(data.url)
        toast.success("File uploaded successfully")
      } else {
        toast.error(data.error || "Upload failed")
      }
    } catch (error) {
      toast.error("An error occurred during upload")
      console.error(error)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = "" // Reset input
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
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
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
          className="rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer w-full aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-8 w-8" />
          <span className="text-sm font-medium">
            {isUploading ? "Uploading..." : "Click to upload file"}
          </span>
        </div>
      )}
      
      <input
        type="file"
        ref={inputRef}
        onChange={handleUpload}
        accept={accept}
        className="hidden"
      />
    </div>
  )
}
