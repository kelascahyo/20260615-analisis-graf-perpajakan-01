import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export default function App() {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);

  // Fungsi untuk inisialisasi / update Cytoscape Chart
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
              if (jenis === 'Badan') return '#3B82F6'; // Blue
              if (jenis === 'LN') return '#EF4444';    // Red
              if (jenis === 'Orang Pribadi') return '#10B981'; // Green
              return '#F59E0B'; // Orange untuk yang tidak ada NPWP
            },
            'label': 'data(label)',
            'color': '#fff',
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '60px',
            'height': '60px',
            'text-wrap': 'wrap',
            'text-max-width': '50px'
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
            'font-size': '10px',
            'color': '#000',
            'text-background-opacity': 0.7,
            'text-background-color': '#ffffff',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        nodeRepulsion: () => 450000,
        idealEdgeLength: () => 100,
      }
    });

    // Event Listener Klik Node
    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode({
        id: node.data('id'),
        nama: node.data('label'),
        jenis: node.data('jenis')
      });
      setSelectedEdge(null);
    });

    // Event Listener Klik Edge
    cyRef.current.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      setSelectedEdge({
        id: edge.data('id'),
        source: edge.data('source'),
        target: edge.data('target'),
        persentase: edge.data('persentase'),
        nilai: edge.data('nilai'),
        dividen: edge.data('dividen')
      });
      setSelectedNode(null);
    });
  };

  // Ambil data awal dari Backend (Semua Graf)
  const fetchFullGraph = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.hostname === 'localhost' ? '' : '/api';
      const response = await fetch(`${baseUrl}/api/graph`);
      const data = await response.json();
      initCytoscape(data.elements);
    } catch (err) {
      console.error("Gagal memuat graf:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cari Wajib Pajak tertentu (Ego-network)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    try {
      const baseUrl = window.location.hostname === 'localhost' ? '' : '/api';
      const response = await fetch(`${baseUrl}/api/taxpayer/${searchId.trim()}`);
      if (!response.ok) throw new Error("Wajib pajak tidak ditemukan");
      const data = await response.json();
      initCytoscape(data.elements);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullGraph();
  }, []);

  return (
    <div class="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Sidebar Kontrol & Info */}
      <div class="w-1/4 bg-gray-800 p-6 flex flex-col gap-6 shadow-xl border-r border-gray-700 overflow-y-auto">
        <div>
          <h1 class="text-xl font-bold tracking-wider text-blue-400">🕵️‍♂️ TAX RELATION ANALYZER</h1>
          <p class="text-xs text-gray-400 mt-1">Sistem Pemetaan Hubungan & Dividen Wajib Pajak</p>
        </div>

        {/* Input Pencarian */}
        <form onSubmit={handleSearch} class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-gray-300">Cari ID Wajib Pajak:</label>
          <div class="flex gap-2">
            <input 
              type="text" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Contoh: 39868583" 
              class="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded transition">
              Cari
            </button>
          </div>
          <button 
            type="button" 
            onClick={fetchFullGraph}
            class="mt-2 text-xs text-center border border-gray-600 hover:border-gray-400 rounded py-1 transition text-gray-300"
          >
            🔄 Reset Tampilkan Semua Graf
          </button>
        </form>

        <hr class="border-gray-700" />

        {/* Panel Informasi Detail */}
        <div class="flex-1">
          {loading && <p class="text-blue-400 text-sm animate-pulse">Memuat data hubungan graf...</p>}
          
          {selectedNode && (
            <div class="bg-gray-700 p-4 rounded-lg border border-blue-500">
              <h2 class="text-sm font-bold text-blue-400 uppercase tracking-wide">Detail Wajib Pajak</h2>
              <div class="mt-3 space-y-2 text-sm">
                <p><span class="text-gray-400">ID WP:</span> <code class="bg-gray-800 px-1 rounded">{selectedNode.id}</code></p>
                <p><span class="text-gray-400">Nama:</span> <strong class="text-white">{selectedNode.nama}</strong></p>
                <p><span class="text-gray-400">Jenis Entity:</span> <span class="px-2 py-0.5 rounded text-xs bg-gray-800 font-semibold">{selectedNode.jenis}</span></p>
              </div>
            </div>
          )}

          {selectedEdge && (
            <div class="bg-gray-700 p-4 rounded-lg border border-emerald-500">
              <h2 class="text-sm font-bold text-emerald-400 uppercase tracking-wide">Detail Transaksi / Relasi</h2>
              <div class="mt-3 space-y-2 text-sm">
                <p><span class="text-gray-400">Relasi ID:</span> <code class="bg-gray-800 px-1 rounded">{selectedEdge.id}</code></p>
                <p><span class="text-gray-400">Dari (Sumber):</span> <span class="text-xs">{selectedEdge.source}</span></p>
                <p><span class="text-gray-400">Ke (Target):</span> <span class="text-xs">{selectedEdge.target}</span></p>
                <hr class="border-gray-600 my-2" />
                <p><span class="text-gray-400">Porsi Saham:</span> <strong class="text-white text-base">{selectedEdge.persentase}</strong></p>
                <p><span class="text-gray-400">Nilai Saham:</span> <span class="text-emerald-300 font-mono">{selectedEdge.nilai}</span></p>
                <p><span class="text-gray-400">Dividen Diterima:</span> <span class="text-yellow-400 font-mono">{selectedEdge.dividen}</span></p>
              </div>
            </div>
          )}

          {!selectedNode && !selectedEdge && !loading && (
            <p class="text-gray-500 text-sm italic text-center mt-10">Klik salah satu node lingkaran (Wajib Pajak) atau garis panah untuk melihat breakdown kepemilikan modal & dividen.</p>
          )}
        </div>
        
        {/* Legenda Warna */}
        <div class="text-xs bg-gray-900 p-3 rounded space-y-2 border border-gray-700">
          <p class="font-bold text-gray-400 mb-1">LEGEND WARNA ENTITY:</p>
          <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Badan Usaha</div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Luar Negeri (LN)</div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Orang Pribadi</div>
          <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Tanpa NPWP</div>
        </div>
      </div>

      {/* Kontainer Graf Utama */}
      <div class="flex-1 h-full relative bg-gray-950">
        <div ref={containerRef} class="w-full h-full" />
      </div>
    </div>
  );
}
