from PIL import Image
import sys

in_path = sys.argv[1]
out_path = sys.argv[2]

img = Image.open(in_path).convert('RGBA')
w, h = img.size
side = max(w, h)
new_img = Image.new('RGBA', (side, side), (0, 0, 0, 0))
offset_x = (side - w) // 2
offset_y = (side - h) // 2
new_img.paste(img, (offset_x, offset_y), img)
new_img.save(out_path)
print('Done')
