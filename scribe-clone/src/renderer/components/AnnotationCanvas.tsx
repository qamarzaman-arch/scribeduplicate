import React, { useRef, useEffect, useState } from 'react'

interface AnnotationCanvasProps {
  imageSrc: string;
  onSave: (dataUrl: string) => void;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ imageSrc, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<'highlight' | 'blur'>('highlight')
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageSrc
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
    }
  }, [imageSrc])

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    setStartPos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    })
    setIsDrawing(true)
  }

  const endDrawing = (e: React.MouseEvent) => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const currentX = (e.clientX - rect.left) * scaleX
    const currentY = (e.clientY - rect.top) * scaleY

    const width = currentX - startPos.x
    const height = currentY - startPos.y

    if (tool === 'highlight') {
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 5
      ctx.strokeRect(startPos.x, startPos.y, width, height)
    } else if (tool === 'blur') {
      // Simple blur: draw a semi-transparent gray box (real blur is more complex on canvas)
      ctx.fillStyle = 'rgba(100, 100, 100, 0.8)'
      ctx.fillRect(startPos.x, startPos.y, width, height)
    }

    onSave(canvas.toDataURL('image/jpeg'))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 p-2 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setTool('highlight')}
          className={`px-3 py-1 rounded ${tool === 'highlight' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
        >
          Highlight
        </button>
        <button
          onClick={() => setTool('blur')}
          className={`px-3 py-1 rounded ${tool === 'blur' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
        >
          Blur
        </button>
      </div>
      <div className="overflow-auto border border-gray-300 rounded-lg max-h-[600px]">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          className="cursor-crosshair"
        />
      </div>
    </div>
  )
}

export default AnnotationCanvas
