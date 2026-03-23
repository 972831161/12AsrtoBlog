import urllib.request, urllib.parse, re, os
from PIL import Image
import io

def get_bing_image(query, filename):
    try:
        print(f"Searching Bing for {query}...")
        url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36'})
        html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
        # find murl":"..."
        matches = re.findall(r'murl&quot;:&quot;(.*?)&quot;', html)
        for img_url in matches:
            if img_url:
                print(f"  Fetching {img_url}...")
                try:
                    r = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                    img_data = urllib.request.urlopen(r, timeout=8).read()
                    out = os.path.join("/Users/shier/mizuki/public/images/device", filename)
                    img = Image.open(io.BytesIO(img_data)).convert("RGBA")
                    img.thumbnail((800, 800))
                    img.save(out, "PNG")
                    print(f"  -> Saved {filename}")
                    return True
                except Exception as e:
                    print(f"  Attempt failed: {e}")
        print(f"  Could not download {filename}")
        return False
    except Exception as e:
        print(f"Error searching {filename}: {e}")

# Rate limited ones
get_bing_image("MCHOSE V9 Pro耳机", "mc_v9pro.png")
get_bing_image("雷柏 V30W 鼠标", "rapoo_v3ts.png")
get_bing_image("Logitech g304 png", "g304.png")
get_bing_image("Logitech m240 mouse png", "m240.png")

# Also let's check if hacker380 bike failed because the output previously said "Searching for xds hacker 380 bike png..." and then error.
get_bing_image("喜德盛 黑客380 自行车 白底", "hacker380.png")
get_bing_image("Liverpool 24-25 home kit shirt", "lfc_home.png")
get_bing_image("Liverpool 25-26 away kit shirt", "lfc_away.png")
get_bing_image("Liverpool F.C. scarf", "lfc_acc.png")
get_bing_image("Lenovo legion r7000p laptop", "r7000p.png")
