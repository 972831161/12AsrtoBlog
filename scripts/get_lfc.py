import urllib.request
import urllib.parse
import re
import os
import io
from PIL import Image

def get_lfc_image():
    os.makedirs("/Users/shier/mizuki/public/images/device/liverpool", exist_ok=True)
    query = "Liverpool FC 24/25 Nike home shirt -arsenal -adidas png transparent"
    url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
    matches = re.findall(r'murl&quot;:&quot;(.*?)&quot;', html)
    for img_url in matches:
        if 'arsenal' in img_url.lower() or 'adidas' in img_url.lower():
            continue
        try:
            r = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(r, timeout=8).read()
            out = "/Users/shier/mizuki/public/images/device/liverpool/lfc_home.png"
            img = Image.open(io.BytesIO(img_data)).convert("RGBA")
            img.thumbnail((800, 800))
            img.save(out, "PNG")
            print(f"Saved {img_url} to {out}")
            return
        except Exception as e:
            pass

if __name__ == "__main__":
    get_lfc_image()
