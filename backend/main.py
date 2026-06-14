import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import pandas as pd
import igraph as ig

app = FastAPI(title="Tax Graph Analyzer API", docs_url="/api/docs", openapi_url="/api/openapi.json")

# Aktifkan CORS agar frontend React bisa mengakses backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data secara global
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
nodes_path = os.path.join(BASE_DIR, "data", "nodes_masked.csv")
edges_path = os.path.join(BASE_DIR, "data", "edges_masked.csv")

try:
    df_nodes = pd.read_csv(nodes_path)
    df_edges = pd.read_csv(edges_path)
    
    # Bersihkan whitespace jika ada
    df_nodes['id'] = df_nodes['id'].astype(str).str.strip()
    df_edges['sumber'] = df_edges['sumber'].astype(str).str.strip()
    df_edges['target'] = df_edges['target'].astype(str).str.strip()
    
    # Inisialisasi python-igraph
    g = ig.Graph(directed=True)
    
    # Tambah vertices (nodes)
    for _, row in df_nodes.iterrows():
        g.add_vertex(
            name=row['id'], 
            nama_wp=row['nama'], 
            jenis_node=row['jenis_node']
        )
        
    # Tambah edges
    for _, row in df_edges.iterrows():
        # Pastikan sumber dan target ada di dalam nodes
        if g.vs.find(name=row['sumber']) and g.vs.find(name=row['target']):
            g.add_edge(
                row['sumber'], 
                row['target'],
                rel_id=str(row['rel_id']),
                persentase=float(row['persentase']),
                nilai=float(row['nilai']),
                dividen=float(row['dividen']),
                jenis_relasi=row['jenis_relasi']
            )
except Exception as e:
    print(f"Error loading graph data: {e}")
    g = ig.Graph(directed=True)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "nodes_count": len(g.vs), "edges_count": len(g.es)}

@app.get("/api/graph")
def get_full_graph():
    """Mengembalikan seluruh struktur graf dalam format Cytoscape.js"""
    elements = []
    
    # Format Nodes
    for v in g.vs:
        elements.append({
            "data": {
                "id": v["name"],
                "label": v["nama_wp"],
                "jenis": v["jenis_node"]
            }
        })
        
    # Format Edges
    for e in g.es:
        source_vertex = g.vs[e.source]
        target_vertex = g.vs[e.target]
        elements.append({
            "data": {
                "id": e["rel_id"],
                "source": source_vertex["name"],
                "target": target_vertex["name"],
                "persentase": f"{e['persentase']}%",
                "nilai": f"Rp {e['nilai']:,.0f}",
                "dividen": f"Rp {e['dividen']:,.0f}",
                "label": f"{e['persentase']}%"
            }
        })
        
    return {"elements": elements}

@app.get("/api/taxpayer/{wp_id}")
def get_taxpayer_network(wp_id: str):
    """Mengambil ego-network (tetangga terdekat) dari sebuah Wajib Pajak"""
    try:
        center_vertex = g.vs.find(name=wp_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Wajib Pajak tidak ditemukan")
        
    # Ambil tetangga 1-step (in dan out)
    neighbors = g.neighbors(center_vertex, mode="all")
    subgraph_indices = set(neighbors + [center_vertex.index])
    subgraph = g.subgraph(subgraph_indices)
    
    elements = []
    for v in subgraph.vs:
        elements.append({
            "data": {"id": v["name"], "label": v["nama_wp"], "jenis": v["jenis_node"]}
        })
    for e in subgraph.es:
        elements.append({
            "data": {
                "id": e["rel_id"],
                "source": subgraph.vs[e.source]["name"],
                "target": subgraph.vs[e.target]["name"],
                "persentase": f"{e['persentase']}%",
                "nilai": f"Rp {e['nilai']:,.0f}",
                "dividen": f"Rp {e['dividen']:,.0f}",
                "label": f"{e['persentase']}%"
            }
        })
        
    return {"elements": elements}

# Handler untuk AWS Lambda / Vercel Serverless
handler = Mangum(app)
