import os
from rembg import remove, new_session
from PIL import Image
import io

# Use a higher quality model: isnet-general-use
# This model is generally better at thin structures like bike spokes.
session = new_session("isnet-general-use")

image_dir = "/Users/shier/mizuki/public/ebike-analysis/images/"
images = [
    "Giant.png",
    "Merida.png",
    "Riese & Müller.png",
    "Specialized.png",
    "Super73.png",
    "Trek.png"
]

mapping = {
    "Giant.png": "giant.webp",
    "Merida.png": "merida.webp",
    "Riese & Müller.png": "rm.webp",
    "Specialized.png": "specialized.webp",
    "Super73.png": "super73.webp",
    "Trek.png": "trek.webp"
}

for img_name in images:
    input_path = os.path.join(image_dir, img_name)
    output_path = os.path.join(image_dir, mapping[img_name])

    if os.path.exists(input_path):
        print(f"Processing {img_name} with High Quality mode (isnet)...")
        try:
            with open(input_path, 'rb') as i:
                input_data = i.read()
            
            # Use alpha_matting for better edges on spokes/chains
            output_data = remove(
                input_data, 
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10
            )
            
            img = Image.open(io.BytesIO(output_data))
            img.save(output_path, "WEBP", quality=95)
            
            print(f"Successfully optimized {img_name} -> {os.path.basename(output_path)}")
        except Exception as e:
            print(f"Failed to optimize {img_name}: {e}")
    else:
        print(f"File not found: {input_path}")
