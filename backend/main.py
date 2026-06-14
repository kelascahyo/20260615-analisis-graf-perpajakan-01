import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import pandas as pd
import igraph as ig

app = FastAPI(title="Tax Graph Analyzer API")

# Aktifkan CORS secara penuh agar tidak di-block browser
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

@app.get("/api/graph")
def get_full_graph():
    try:
        df_nodes = pd.read_csv(nodes_path)
        df_edges = pd.read_csv(edges_path)
        
        # Bersihkan data
        df_nodes['id'] = df_nodes['id'].astype(str).str.strip()
        df_nodes['nama'] = df_nodes['nama'].astype(str).str.strip()
        df_nodes['jenis_node'] = df_nodes['jenis_node'].astype(str).str.strip()
        
        df_edges['sumber'] = df_edges['sumber'].astype(str).str.strip()
        df_edges['target'] = df_edges['target'].astype(str).str.strip()
        df_edges['rel_id'] = df_edges['rel_id'].astype(str).str.strip()
        
        # 🌟 OPTIMASI: Ambil 150 relasi dengan nilai saham terbesar agar graf tidak hang/blank
        df_edges = df_edges.sort_values(by='nilai', ascending=False).head(150)
        
        # Ambil list ID node yang aktif di 150 relasi tersebut
        active_node_ids = set(df_edges['sumber'].tolist() + df_edges['target'].tolist())
        df_nodes = df_nodes[df_nodes['id'].isin(active_node_ids)]
        
        elements = []
        
        # Masukkan Nodes
        for _, row in df_nodes.iterrows():
            elements.append({
                "data": {
                    "id": row['id'], 
                    "label": row['nama'], 
                    "jenis": row['jenis_node']
                }
            })
            
        # Masukkan Edges
        for _, row in df_edges.iterrows():
            elements.append({
                "data": {
                    "id": str(row['rel_id']),
                    "source": str(row['sumber']),
                    "target": str(row['target']),
                    "persentase": f"{row['persentase']}%",
                    "nilai": f"Rp {row['nilai']:,.0f}",
                    "dividen": f"Rp {row['dividen']:,.0f}",
                    "label": f"{row['persentase']}%"
                }
            })
            
        return {"elements": elements}
        
    except Exception as e:
        return {"elements": [], "error": str(e)}

handler = Mangum(app)
