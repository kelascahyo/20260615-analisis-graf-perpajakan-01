import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import pandas as pd

app = FastAPI(title="Tax Graph Analyzer API")

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
        if not os.path.exists(nodes_path) or not os.path.exists(edges_path):
            return {"elements": [], "error": "File CSV tidak ditemukan di folder backend/data/"}

        df_nodes = pd.read_csv(nodes_path)
        df_edges = pd.read_csv(edges_path)
        
        # Standardisasi data dan buang spasi kosong
        df_nodes['id'] = df_nodes['id'].astype(str).str.strip()
        df_nodes['nama'] = df_nodes['nama'].astype(str).str.strip()
        df_nodes['jenis_node'] = df_nodes['jenis_node'].astype(str).str.strip()
        
        df_edges['sumber'] = df_edges['sumber'].astype(str).str.strip()
        df_edges['target'] = df_edges['target'].astype(str).str.strip()
        df_edges['rel_id'] = df_edges['rel_id'].astype(str).str.strip()
        
        # Batasi mengambil 100 relasi pertama saja untuk testing agar pasti muncul dulu
        df_edges_limited = df_edges.head(100)
        
        # Kumpulkan ID yang terlibat dalam relasi tersebut
        involved_ids = set(df_edges_limited['sumber'].tolist() + df_edges_limited['target'].tolist())
        df_nodes_limited = df_nodes[df_nodes['id'].isin(involved_ids)]
        
        elements = []
        
        # Bentuk data Node untuk Cytoscape
        for _, row in df_nodes_limited.iterrows():
            elements.append({
                "data": {
                    "id": str(row['id']), 
                    "label": str(row['nama']), 
                    "jenis": str(row['jenis_node'])
                }
            })
            
        # Bentuk data Edge untuk Cytoscape
        for _, row in df_edges_limited.iterrows():
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
