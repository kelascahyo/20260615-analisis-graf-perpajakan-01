import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import pandas as pd
import igraph as ig

app = FastAPI(title="Tax Graph Analyzer API", docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
nodes_path = os.path.join(BASE_DIR, "data", "nodes_masked.csv")
edges_path = os.path.join(BASE_DIR, "data", "edges_masked.csv")

try:
    df_nodes = pd.read_csv(nodes_path)
    df_edges = pd.read_csv(edges_path)
    
    # Standardisasi & pembersihan tipe data teks
    df_nodes['id'] = df_nodes['id'].astype(str).str.strip()
    df_nodes['nama'] = df_nodes['nama'].astype(str).str.strip()
    df_nodes['jenis_node'] = df_nodes['jenis_node'].astype(str).str.strip()
    
    df_edges['sumber'] = df_edges['sumber'].astype(str).str.strip()
    df_edges['target'] = df_edges['target'].astype(str).str.strip()
    df_edges['rel_id'] = df_edges['rel_id'].astype(str).str.strip()
    
    g = ig.Graph(directed=True)
    
    # Registrasi nodes ke igraph
    for _, row in df_nodes.iterrows():
        g.add_vertex(
            name=row['id'], 
            nama_wp=row['nama'], 
            jenis_node=row['jenis_node']
        )
        
    # Registrasi edges ke igraph
    for _, row in df_edges.iterrows():
        try:
            source_vertex = g.vs.find(name=row['sumber'])
            target_vertex = g.vs.find(name=row['target'])
            
            g.add_edge(
                source_vertex.index, 
                target_vertex.index,
                rel_id=str(row['rel_id']),
                persentase=float(row['persentase']),
                nilai=float(row['nilai']),
                dividen=float(row['dividen']),
                jenis_relasi=row['jenis_relasi']
            )
        except ValueError:
            continue

except Exception as e:
    print(f"Error loading graph data: {e}")
    g = ig.Graph(directed=True)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "nodes_count": len(g.vs), "edges_count": len(g.es)}

@app.get("/api/graph")
def get_full_graph():
    """Mengembalikan visualisasi data menyeluruh untuk frontend"""
    elements = []
    
    # Siapkan data Node
    for v in g.vs:
        elements.append({
            "data": {
                "id": v["name"], 
                "label": v["nama_wp"], 
                "jenis": v["jenis_node"]
            }
        })
        
    # Siapkan data Edge (Garis relasi kepemilikan)
    for e in g.es:
        elements.append({
            "data": {
                "id": e["rel_id"],
                "source": g.vs[e.source]["name"],
                "target": g.vs[e.target]["name"],
                "persentase": f"{e['persentase']}%",
                "nilai": f"Rp {e['nilai']:,.0f}",
                "dividen": f"Rp {e['dividen']:,.0f}",
                "label": f"{e['persentase']}%"
            }
        })
    return {"elements": elements}

handler = Mangum(app)
