import os
from rembg import remove

images = [
    "/Users/shier/mizuki/public/images/projects/yantzeSSC.png"
]

for img_path in images:
    if os.path.exists(img_path):
        print(f"Processing {img_path}...")
        try:
            with open(img_path, 'rb') as i:
                input_data = i.read()
            output_data = remove(input_data)
            with open(img_path, 'wb') as o:
                o.write(output_data)
            print(f"Successfully removed background for {os.path.basename(img_path)}")
        except Exception as e:
            print(f"Failed to process {img_path}: {e}")
    else:
        print(f"File not found: {img_path}")
