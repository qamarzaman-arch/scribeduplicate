import React from 'react'
import { FlowDiagram } from '../../common/types'
import { createFlowDiagramSvg } from '../../common/flow-svg'

interface FlowDiagramEditorProps {
  diagram?: FlowDiagram;
  onUpdate: (diagram: FlowDiagram) => void;
}

const toDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const FlowDiagramEditor: React.FC<FlowDiagramEditorProps> = ({ diagram }) => {
  const svgMarkup = React.useMemo(() => createFlowDiagramSvg(diagram, { width: 1160 }), [diagram])

  if (!diagram) {
    return (
      <div className="rounded-[2.5rem] border border-dashed border-purple-200 bg-white/70 p-10 text-center text-sm font-semibold text-gray-400">
        Save the guide to generate the flow diagram.
      </div>
    )
  }

  return (
    <div className="rounded-[2.5rem] border border-purple-100 bg-white p-6 shadow-xl shadow-purple-900/5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6D4C82]">Flow Diagram</span>
          <h3 className="mt-2 text-2xl font-black text-[#404040]">Live process map</h3>
          <p className="mt-2 text-sm text-gray-400">This view updates automatically when you edit step titles, branch labels, or flow conditions.</p>
        </div>
        <span className="rounded-full bg-purple-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#6D4C82]">
          {diagram.nodes.length} Nodes
        </span>
      </div>
      <div className="overflow-auto rounded-[2rem] bg-[#FDFCFE] p-4 border border-purple-50">
        {svgMarkup ? (
          <img src={toDataUri(svgMarkup)} alt="Flow diagram preview" className="w-full min-w-[980px] rounded-[1.75rem]" />
        ) : (
          <div className="py-16 text-center text-sm font-semibold text-gray-400">No flow diagram available yet.</div>
        )}
      </div>
    </div>
  )
}

export default FlowDiagramEditor
