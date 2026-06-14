import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export default function App() {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initCytoscape = (elements) => {
    if (!containerRef.current || elements.length === 0) return;

    // Hancurkan instance lama jika ada sebelum membuat yang baru
    if (cyRef.current) {
      cyRef.current.destroy();
    }

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
            'color': '#ffffff',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '50px',
            'height': '50px',
            'text-wrap': 'wrap',
            'text-max-width': '45px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#4B5563',
            'target-arrow-color': '#4B5563',
            'target-arrow-shape': 'triangle',
            'curve-style': 'g destiny', // Mengurangi beban render lengkungan melingkar
            'label': 'data(label)',
            'font-size': '8px',
            'color': '#ffffff',
            'text-background-opacity': 0.6,
            'text-background-color': '#111827',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle'
          }
        }
      ],
      layout: {
        name: 'circle', // Menggunakan lingkaran agar render instan tanpa delay kalkulasi fisika
        padding: 30
      }
    });

    cyRef.current.on('tap', 'node', (evt) => {
      setSelectedNode(evt.target.data());
      setSelectedEdge(null);
    });

    cyRef.current.on('tap', 'edge', (evt) => {
      setSelectedEdge(evt.target.data());
      setSelectedNode(null);
    });
  };

  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Otomatis deteksi endpoint lokal vs production vercel
        const API_URL = window.location.hostname === 'localhost' 
          ? 'http://localhost:8000/api/graph' 
          : '/api/graph';

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Gagal mengambil data dari server");
        
        const data = await response.json();
        
        if (data.elements && data.elements.length > 0) {
          initCytoscape(data.elements);
        } else {
          throw new Error("Data graf kosong atau gagal dimuat");
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      
      {/* Sidebar Panel */}
      <div className="w-1/4 bg-gray-800 p-6 flex flex-col gap-6 shadow-xl border-r border-gray-700 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-blue-400">🕵️‍♂️ TAX RELATION MAP</h1>
          <p className="text-xs text-gray-400 mt-1">Top 150 Relasi Investasi Terbesar</p>
        </div>

        <hr className="border-gray-700" />

        <div className="flex-1">
          {loading && (
            <div className="text-blue-400 text-sm animate-pulse">
              🔄 Mengunduh dan menyusun struktur graf dari CSV...
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm p-3 bg-red-950/50 rounded border border-red-800">
              ⚠️ Error: {error}
            </div>
          )}
          
          {selectedNode && (
            <div className="bg-gray-700 p-4 rounded-lg border border-blue-500 shadow-md">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Detail Wajib Pajak</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-gray-400">ID WP:</span> <code className="bg-gray-900 px-1 rounded">{selectedNode.id}</code></p>
                <p><span className="text-gray-400">Nama WP:</span> <strong className="text-white block mt-0.5">{selectedNode.label}</strong></p>
                <p><span className="text-gray-400">Kategori:</span> <span className="ml-1 px-2 py-0.5 rounded text-xs bg-gray-900 font-semibold text-blue-300">{selectedNode.jenis}</span></p>
              </div>
            </div>
          )}

          {selectedEdge && (
            <div className="bg-gray-700 p-4 rounded-lg border border-emerald-500 shadow-md">
              <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Detail Hubungan Saham</h2>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-gray-400">ID Relasi:</span> <code className="bg-gray-900 px-1 rounded">{selectedEdge.id}</code></p>
                <p className="text-gray-400">Investor ➔ Investee</p>
                <p className="text-xs font-mono bg-gray-900 p-1.5 rounded text-gray-300">{selectedEdge.source} ➔ {selectedEdge.target}</p>
                <hr className="border-gray-600 my-2" />
                <p><span className="text-gray-400">Porsi Kepemilikan:</span> <strong className="text-white text-base block">{selectedEdge.persentase}</strong></p>
                <p><span className="text-gray-400">Nilai Investasi:</span> <span className="text-emerald-400 font-mono block">{selectedEdge.nilai}</span></p>
                <p><span className="text-gray-400">Dividen Diperoleh:</span> <span className="text-yellow-400 font-mono block">{selectedEdge.dividen}</span></p>
              </div>
            </div>
          )}

          {!selectedNode && !selectedEdge && !loading && !error && (
            <div className="text-gray-400 text-sm border border-dashed border-gray-600 p-4 rounded text-center bg-gray-800/50">
              💡 <span className="italic">Klik pada lingkaran entitas atau garis panah di peta untuk membedah data perpajakannya secara instan.</span>
            </div>
          )}
        </div>
        
        {/* Indikator Legenda */}
        <div className="text-xs bg-gray-950 p-4 rounded-lg space-y-2.5 border border-gray-700 shadow-inner">
          <p className="font-bold text-gray-400 tracking-wider">LEGENDA ENTITAS:</p>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full bg-blue-500 block"></span> Badan Usaha</div>
            <div className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full bg-red-500 block"></span> Perusahaan LN</div>
            <div className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full bg-emerald-500 block"></span> Orang Pribadi</div>
            <div className="flex items-center gap-2.5"><span className="w-3 h-3 rounded-full bg-amber-500 block"></span> Tanpa NPWP</div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 h-full bg-gray-950 relative">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
