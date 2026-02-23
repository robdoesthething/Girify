from PIL import Image
import numpy as np
import cv2
import sys
import os

def remove_checkerboard(img_path):
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None or img.shape[2] != 4:
        return

    # We want to find the checkerboard pixels.
    # Color 1: ~ rgb(77, 79, 76) -> BGR ~ (76, 79, 77)
    # Color 2: ~ rgb(154, 156, 153) -> BGR ~ (153, 156, 154)
    # Also some are solid grey ~ rgb(30, 30, 30) or rgb(220, 220, 220) depending on image.

    # We will use floodfill from all transparent pixels to eat away the checkerboard.
    # A pixel is considered "background" if it's very close to those specific grey colors.

    h, w = img.shape[:2]
    # mask needs to be h+2, w+2 for floodFill
    mask = np.zeros((h+2, w+2), np.uint8)

    # Identify background colors (within tolerance)
    # Let's say any grey (R~G~B) or specifically the checkerboard colors.
    b = img[:,:,0].astype(int)
    g = img[:,:,1].astype(int)
    r = img[:,:,2].astype(int)
    a = img[:,:,3]

    # Condition for checkerboard color 1 (dark): ~70-90
    dark_cb = (np.abs(r - 77) < 15) & (np.abs(g - 79) < 15) & (np.abs(b - 76) < 15)
    # Condition for checkerboard color 2 (light): ~140-160
    light_cb = (np.abs(r - 155) < 15) & (np.abs(g - 157) < 15) & (np.abs(b - 154) < 15)

    # Also include the very dark grey from scooter: (14, 14, 14) or (28, 28, 28)
    v_dark = (r < 35) & (g < 35) & (b < 35) & (np.abs(r-g) < 10) & (np.abs(r-b) < 10)

    is_bg_color = dark_cb | light_cb | v_dark

    # Start flood filling from edges.
    # Instead of actual cv2.floodFill, we can just do a connected components or iterative expansion
    # from the transparent pixels into the `is_bg_color` pixels.

    # Initial transparent mask
    transparent = (a == 0)

    # We want to dilate the transparent mask, but ONLY into `is_bg_color` pixels.
    kernel = np.array([[0, 1, 0],
                       [1, 1, 1],
                       [0, 1, 0]], dtype=np.uint8)

    curr_mask = transparent.copy()
    while True:
        # Dilate current mask
        dilated = cv2.dilate(curr_mask.astype(np.uint8), kernel, iterations=1).astype(bool)
        # Only allow expansion into is_bg_color
        new_mask = curr_mask | (dilated & is_bg_color)

        if np.array_equal(curr_mask, new_mask):
            break
        curr_mask = new_mask

    # Now curr_mask contains all transparent pixels + all background pixels connected to the outside.
    # Make them fully transparent
    img[curr_mask, 3] = 0

    cv2.imwrite(img_path.replace('.png', '_clean.png'), img)
    print(f"Cleaned {img_path}")

if __name__ == '__main__':
    for f in sys.argv[1:]:
        remove_checkerboard(f)
