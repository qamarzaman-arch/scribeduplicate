import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'

interface AnnotationCanvasProps {
  imageSrc: string;
  onChange?: (hasChanges: boolean) => void;
}

export interface AnnotationCanvasHandle {
  exportImage: () => string | null;
  reset: () => void;
}

const AnnotationCanvas = forwardRef<AnnotationCanvasHandle, AnnotationCanvasProps>(({ imageSrc, onChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sourceImageRef = useRef<HTMLImageElement | null>(null)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tool, setTool] = useState<'highlight' | 'redact'>('highlight')
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const renderCanvas = useCallback((preview?: { x: number; y: number } | null) => {
    const canvas = canvasRef.current
    const baseCanvas = baseCanvasRef.current
    if (!canvas || !baseCanvas) return

    if (canvas.width !== baseCanvas.width || canvas.height !== baseCanvas.height) {
      canvas.width = baseCanvas.width
      canvas.height = baseCanvas.height
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(baseCanvas, 0, 0)

    if (!isDrawing || !preview) return

    const x = Math.min(startPos.x, preview.x)
    const y = Math.min(startPos.y, preview.y)
    const width = Math.abs(preview.x - startPos.x)
    const height = Math.abs(preview.y - startPos.y)

    ctx.save()
    ctx.setLineDash([12, 8])
    ctx.lineWidth = 4
    if (tool === 'highlight') {
      ctx.fillStyle = 'rgba(109, 76, 130, 0.18)'
      ctx.strokeStyle = '#6D4C82'
    } else {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.35)'
      ctx.strokeStyle = '#111827'
    }
    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)
    ctx.restore()
  }, [isDrawing, startPos.x, startPos.y, tool])

  const getCanvasPoint = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    }
  }, [])

  useEffect(() => {
    if (!imageSrc) {
      setIsLoading(true)
      setLoadError(null)
      setHasChanges(false)
      onChange?.(false)
      sourceImageRef.current = null
      baseCanvasRef.current = null
      return
    }

    setIsLoading(true)
    setLoadError(null)
    setHasChanges(false)
    setIsDrawing(false)
    setPreviewPos(null)
    onChange?.(false)

    const image = new Image()
    image.onload = () => {
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height
      if (!width || !height) {
        setLoadError('Screenshot loaded with invalid dimensions.')
        setIsLoading(false)
        return
      }

      sourceImageRef.current = image

      const baseCanvas = document.createElement('canvas')
      baseCanvas.width = width
      baseCanvas.height = height
      const baseCtx = baseCanvas.getContext('2d')
      baseCtx?.drawImage(image, 0, 0, width, height)
      baseCanvasRef.current = baseCanvas

      setIsLoading(false)
    }

    image.onerror = () => {
      sourceImageRef.current = null
      baseCanvasRef.current = null
      setLoadError('Screenshot could not be loaded.')
      setIsLoading(false)
    }

    image.src = imageSrc
  }, [imageSrc, onChange])

  useEffect(() => {
    if (isLoading || loadError) return
    renderCanvas(previewPos)
  }, [isLoading, loadError, previewPos, renderCanvas])

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLoading || loadError) return

    const point = getCanvasPoint(event)
    if (!point) return

    setStartPos(point)
    setPreviewPos(point)
    setIsDrawing(true)
  }

  const continueDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const point = getCanvasPoint(event)
    if (!point) return

    setPreviewPos(point)
  }

  const finishDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const point = getCanvasPoint(event) ?? previewPos
    setIsDrawing(false)

    if (!point) {
      setPreviewPos(null)
      renderCanvas(null)
      return
    }

    const x = Math.min(startPos.x, point.x)
    const y = Math.min(startPos.y, point.y)
    const width = Math.abs(point.x - startPos.x)
    const height = Math.abs(point.y - startPos.y)

    if (width < 4 || height < 4) {
      setPreviewPos(null)
      renderCanvas(null)
      return
    }

    const baseCanvas = baseCanvasRef.current
    const baseCtx = baseCanvas?.getContext('2d')
    if (!baseCanvas || !baseCtx) return

    baseCtx.save()
    if (tool === 'highlight') {
      baseCtx.fillStyle = 'rgba(109, 76, 130, 0.18)'
      baseCtx.strokeStyle = '#6D4C82'
      baseCtx.lineWidth = 6
      baseCtx.fillRect(x, y, width, height)
      baseCtx.strokeRect(x, y, width, height)
    } else {
      baseCtx.fillStyle = '#111827'
      baseCtx.fillRect(x, y, width, height)
    }
    baseCtx.restore()

    setPreviewPos(null)
    setHasChanges(true)
    onChange?.(true)
    renderCanvas(null)
  }

  const handleReset = useCallback(() => {
    const image = sourceImageRef.current
    if (!image) return

    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    const baseCanvas = document.createElement('canvas')
    baseCanvas.width = width
    baseCanvas.height = height
    const baseCtx = baseCanvas.getContext('2d')
    baseCtx?.drawImage(image, 0, 0, width, height)
    baseCanvasRef.current = baseCanvas
    setHasChanges(false)
    setPreviewPos(null)
    onChange?.(false)
    renderCanvas(null)
  }, [onChange, renderCanvas])

  useImperativeHandle(ref, () => ({
    exportImage: () => {
      const canvas = canvasRef.current
      if (!canvas) return null
      return canvas.toDataURL('image/jpeg', 0.92)
    },
    reset: handleReset
  }), [handleReset])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setTool('highlight')}
          className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${tool === 'highlight' ? 'bg-[#6D4C82] text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-400 hover:text-gray-600'}`}
        >
          Highlight
        </button>
        <button
          onClick={() => setTool('redact')}
          className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${tool === 'redact' ? 'bg-[#6D4C82] text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-400 hover:text-gray-600'}`}
        >
          Redact
        </button>
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-white text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>
      <div className="rounded-[2rem] border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <span>Drag to place {tool === 'highlight' ? 'a highlight box' : 'a redaction block'}</span>
          {hasChanges && <span className="text-[#6D4C82]">Unsaved edits</span>}
        </div>
        <div className="overflow-auto rounded-[1.5rem] border border-gray-200 bg-gray-50 max-h-[70vh] min-h-[320px] p-4 flex items-center justify-center">
          {isLoading ? (
            <div className="min-h-[280px] flex items-center justify-center text-sm font-semibold text-gray-400">Loading screenshot...</div>
          ) : loadError ? (
            <div className="min-h-[280px] flex items-center justify-center text-sm font-semibold text-red-500">{loadError}</div>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={continueDrawing}
              onMouseUp={finishDrawing}
              onMouseLeave={finishDrawing}
              className="block max-w-full max-h-[calc(70vh-2rem)] w-auto h-auto cursor-crosshair"
            />
          )}
        </div>
      </div>
    </div>
  )
})

export default AnnotationCanvas
