import sys
import os
import requests
from duckduckgo_search import DDGS
from PIL import Image
import io

queries = {
    "iphone16pro.png": "iPhone 16 pro black png transparent",
    "macbookair.png": "Macbook air m3 png transparent",
    "ipadair2024.png": "iPad Air 2024 blue png transparent",
    "applewatchs7.png": "Apple watch series 7 black nike png transparent",
    "airpodspro2.png": "AirPods pro 2 png transparent",
    "airpods2.png": "AirPods 2 png transparent",
    "hacker380.png": "xds hacker 380 bike png",
    "lfc_home.png": "Liverpool 24-25 home kit png transparent",
    "lfc_away.png": "Liverpool 25-26 away kit png transparent",
    "lfc_acc.png": "Liverpool scarf png transparent",
    "r7000p.png": "Lenovo legion r7000p laptop png transparent",
    "mc_v9pro.png": "MCHOSE V9 Pro headphone",
    "rapoo_v3ts.png": "Rapoo V30W mouse png",
    "g304.png": "Logitech g304 black png transparent",
    "m240.png": "Logitech m240 mouse png transparent"
}

out_dir = "/Users/shier/mizuki/public/images/device"
os.makedirs(out_dir, exist_ok=True)

with DDGS() as ddgs:
    for filename, query in queries.items():
        out_path = os.path.join(out_dir, filename)
        if os.path.exists(out_path) and os.path.getsize(out_path) > 1024:
            print(f"Skipping {filename}")
            continue
            
        print(f"Searching for {query}...")
        try:
            # We fetch up to 4 results to try in case the first is a 404 or webp blocking
            results = list(ddgs.images(query, max_results=4))
            downloaded = False
            for res in results:
                url = res.get('image')
                if not url: continue
                print(f"  Trying {url}...")
                try:
                    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
                    head_res = requests.get(url, timeout=5, headers=headers)
                    if head_res.status_code == 200:
                        # Convert to actual PNG
                        img = Image.open(io.BytesIO(head_res.content)).convert("RGBA")
                        # Resize if too huge
                        img.thumbnail((800, 800))
                        img.save(out_path, "PNG")
                        print(f"  Successfully saved {filename}!")
                        downloaded = True
                        break
                except Exception as e:
                    print(f"  Failed to fetch/convert image: {e}")
                    
            if not downloaded:
                print(f"  Could not download an image for {filename}")
        except Exception as e:
            print(f"Search API Error: {e}")
