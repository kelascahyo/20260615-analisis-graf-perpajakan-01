import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export default function App() {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [loading, setLoading] = useState(false);

  const initCytoscape = (elements) => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => {
              const jenis = ele.data('jenis');
              if (jenis === 'Badan') return '#3B82F6'; 
              if (jenis === 'LN') return '#EF4444';    
              if (jenis === 'Orang Pribadi') return '#10B981'; 
              return '#F59E0B'; 
            },
            'label': 'data(label)',
            'color': '#fff',
            'font-size': '11px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '55px',
            'height': '55px',
            'text-wrap': 'wrap',
            'text-max-width': '50px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2.5,
            'line-color': '#9CA3AF',
            'target-arrow-color': '#9CA3AF',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#000',
            'text-background-opacity': 0.8,
            'text-background-color': '#ffffff',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        nodeRepulsion: () => 500000,
        idealEdgeLength: () => 120,
      }
    });

    // Event Klik Node
    cyRef.current.on('tap', 'node', (evt) => {
      setSelectedNode(evt.target.data());
      setSelectedEdge(null);
    });

    // Event Klik Edge
    cyRef.current.on('tap', 'edge', (evt) => {
      setSelectedEdge(evt.target.data());
      setSelectedNode(null);
    });
  };

  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      try {
        const baseUrl = window.location.hostname === 'localhost' ? '' : '/api';
        const response = await fetch(`${baseUrl}/api/graph`);
        const data = await response.json();
        initCytoscape(data.elements);
      } catch (err) {
        console.error("Gagal memuat peta jaringan wajib pajak:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  return (
    <div class="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      
      {/* Sidebar Panel */}
      <div class="w-1/4 bg-gray-800 p-6 flex flex-col gap-6 shadow-xl border-r border-gray-700 overflow-y-auto">
        <div>
          <h1 class="text-xl font-bold tracking-wider text-blue-400">🕵️‍♂️ TAX RELATION MAP</h1>
          <p class="text-xs text-gray-400 mt-1">Struktur Kepemilikan & Distribusi Dividen Global</p>
        </div>

        <hr class="border-gray-700" />

        {/* Panel Detail Informasi Interaktif */}
        <div class="flex-1">
          {loading && (
            <div class="flex items-center gap-2 text-blue-400 text-sm animate-pulse">
              <span>🔄</span> Mengunduh dan menyusun struktur graf dari CSV...
            </div>
          )}
          
          {selectedNode && (
            <div class="bg-gray-700 p-4 rounded-lg border border-blue-500 shadow-md">
              <h2 class="text-xs font-bold text-blue-400 uppercase tracking-widest">Detail Wajib Pajak</h2>
              <div class="mt-3 space-y-2 text-sm">
                <p><span class="text-gray-400">ID WP:</span> <code class="bg-gray-800 px-1 rounded">{selectedNode.id}</code></p>
                <p><span class="text-gray-400">Nama WP:</span> <strong class="text-white block mt-0.5">{selectedNode.label}</strong></p>
                <p><span class="text-gray-400">Kategori:</span> <span class="ml-1 px-2 py-0.5 rounded text-xs bg-gray-900 font-semibold text-blue-300">{selectedNode.jenis}</span></p>
              </div>
            </div>
          )}

          {selectedEdge && (
            <div class="bg-gray-700 p-4 rounded-lg border border-emerald-500 shadow-md">
              <h2 class="text-xs font-bold text-emerald-400 uppercase tracking-widest">Detail Hubungan Saham</h2>
              <div class="mt-3 space-y-2 text-sm">
                <p><span class="text-gray-400">ID Relasi:</span> <code class="bg-gray-800 px-1 rounded">{selectedEdge.id}</code></p>
                <p class="text-xs text-gray-400 mt-1">Sumber (Investor) ➔ Target (Investee)</p>
                <p class="text-xs font-mono bg-gray-900 p-1.5 rounded text-gray-300 overflow-x-auto">{selectedEdge.source} ➔ {selectedEdge.target}</p>
                <hr class="border-gray-600 my-2" />
                <p><span class="text-gray-400">Porsi Kepemilikan:</span> <strong class="text-white text-base block">{selectedEdge.persentase}</strong></p>
                <p><span class="text-gray-400">Nilai Investasi:</span> <span class="text-emerald-400 font-mono block">{selectedEdge.nilai}</span></p>
                <p><span class="text-gray-400">Dividen Diperoleh:</span> <span class="text-yellow-400 font-mono block">{selectedEdge.dividen}</span></p>
              </div>
            </div>
          )}

          {!selectedNode && !selectedEdge && !loading && (
            <div class="text-gray-400 text-sm border border-dashed border-gray-600 p-4 rounded text-center bg-gray-800/50">
              💡 <span class="italic">Klik pada lingkaran entitas atau garis panah di peta untuk membedah data perpajakannya secara instan.</span>
            </div>
          )}
        </div>
        
        {/* Indikator Legenda */}
        <div class="text-xs bg-gray-950 p-4 rounded-lg space-y-2.5 border border-gray-700 shadow-inner">
          <p class="font-bold text-gray-400 tracking-wider">LEGENDA ENTITAS:</p>
          <div class="grid grid-cols-1 gap-2">
            <div class="flex items-center gap-2.5"><span class="w-3 h-3 rounded-full bg-blue-500 block"></span> Badan Usaha</div>
            <div class="flex items-center gap-2.5"><span class="w-3 h-3 rounded-full bg-red-500 block"></span> Perusahaan LN</div>
            <div class="flex items-center gap-2.5"><span class="w-3 h-3 rounded-full bg-emerald-500 block"></span> Orang Pribadi</div>
            <div class="flex items-center gap-2.5"><span class="w-3 h-3 rounded-full bg-amber-500 block"></span> Tanpa NPWP</div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div class="flex-1 h-full bg-gray-950 relative">
        <div ref={containerRef} class="w-full h-full" />
      </div>
    </div>
  );
}
