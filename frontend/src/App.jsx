import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export default function App() {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugData, setDebugData] = useState(null);

  const initCytoscape = (elements) => {
    if (!containerRef.current || !elements || elements.length === 0) return;

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
            'background-color': '#3B82F6',
            'label': 'data(label)',
            'color': '#ffffff',
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '60px',
            'height': '60px',
            'text-wrap': 'wrap',
            'text-max-width': '55px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#9CA3AF',
            'target-arrow-color': '#9CA3AF',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#000000',
            'text-background-opacity': 0.8,
            'text-background-color': '#ffffff',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle'
          }
        }
      ],
      layout: {
        name: 'random', // Tata letak acak kilat, dijamin 100% muncul dan anti-blank
        padding: 50
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
        const API_URL = import.meta.env.VITE_API_URL 
         ? `${import.meta.env.VITE_API_URL}/api/graph` 
         : 'http://127.0.0.1:8000/api/graph';

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Gagal terhubung dengan API Server");
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setDebugData({
          nodes: data.elements.filter(e => !e.data.source).length,
          edges: data.elements.filter(e => e.data.source).length
        });

        if (data.elements && data.elements.length > 0) {
          initCytoscape(data.elements);
        } else {
          throw new Error("Graf tidak muncul karena array elemen kosong");
        }
      } catch (err) {
        console.error("Detail Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden m-0 p-0">
      
      {/* Sidebar Kontrol */}
      <div className="w-1/4 bg-gray-800 p-6 flex flex-col gap-4 shadow-xl border-r border-gray-700 overflow-y-auto">
        <div>
          <h1 className="text-lg font-bold tracking-wider text-blue-400">🕵️‍♂️ TAX RELATION MAP</h1>
          <p className="text-xs text-gray-400 mt-1">Status Server & Informasi Relasi</p>
        </div>

        <hr className="border-gray-700" />

        <div className="flex-1 space-y-4">
          {loading && <p className="text-yellow-400 text-sm animate-pulse">🔄 Sedang menarik data CSV...</p>}
          {error && <p className="text-red-400 text-sm font-mono bg-red-950/40 p-2 rounded border border-red-900">⚠️ Error: {error}</p>}
          
          {debugData && (
            <div className="bg-gray-900 p-3 rounded text-xs font-mono text-gray-400">
              <p class="text-emerald-400 font-bold mb-1">✓ Berhasil Memuat:</p>
              <p>Jumlah Nodes: {debugData.nodes}</p>
              <p>Jumlah Edges: {debugData.edges}</p>
            </div>
          )}

          {selectedNode && (
            <div className="bg-gray-700 p-4 rounded-lg border border-blue-500 shadow-md">
              <h2 className="text-xs font-bold text-blue-400 uppercase">Detail Wajib Pajak</h2>
              <p className="text-sm mt-2 text-white font-bold">{selectedNode.label}</p>
              <p className="text-xs text-gray-400 mt-1">ID: {selectedNode.id}</p>
            </div>
          )}

          {selectedEdge && (
            <div className="bg-gray-700 p-4 rounded-lg border border-emerald-500 shadow-md">
              <h2 className="text-xs font-bold text-emerald-400 uppercase">Detail Saham</h2>
              <p className="text-sm mt-1 text-white">Porsi: {selectedEdge.persentase}</p>
              <p className="text-xs text-emerald-300 font-mono">Nilai: {selectedEdge.nilai}</p>
              <p className="text-xs text-yellow-300 font-mono">Dividen: {selectedEdge.dividen}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-gray-950 p-4 flex flex-col justify-center items-center relative">
        {/* 🌟 PERBAIKAN UTAMA: Memberikan ukuran tinggi statis minimal agar elemen terlihat */}
        <div 
          ref={containerRef} 
          className="w-full h-[90vh] bg-gray-900 rounded-lg border border-gray-800" 
          style={{ minHeight: '500px' }}
        />
      </div>

    </div>
  );
}
