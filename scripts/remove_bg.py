import imageio.v3 as iio
import numpy as np
import sys

input_file = sys.argv[1]
output_file = sys.argv[2]

print(f"Reading video: {input_file}")
frames = iio.imread(input_file, plugin='pyav')

out_frames = []
for i, frame in enumerate(frames):
    alpha = np.ones((frame.shape[0], frame.shape[1], 1), dtype=np.uint8) * 255
    
    # Tolerant thresholding for white and off-white artifacts from video compression
    mask = (frame[:, :, 0] > 200) & (frame[:, :, 1] > 200) & (frame[:, :, 2] > 200)
    
    rgba = np.concatenate([frame, alpha], axis=2)
    rgba[mask, 3] = 0
    
    out_frames.append(rgba)

print(f"Writing transparent animation to {output_file}")
iio.imwrite(output_file, out_frames, extension='.webp', loop=0, duration=33)

print("Done!")
