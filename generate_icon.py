import math
from PIL import Image, ImageDraw

def create_icon():
    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Outer Circular Ring (Gold border)
    margin = 8
    draw.ellipse([margin, margin, size - margin, size - margin], fill=(15, 23, 42, 255), outline=(234, 179, 8, 255), width=8)

    # 2. Globe latitude/longitude subtle grid lines
    cx, cy = size // 2, size // 2
    r = (size - 2 * margin) // 2

    # Draw equator and meridian
    draw.line([cx - r + 10, cy, cx + r - 10, cy], fill=(30, 58, 138, 200), width=3)
    draw.line([cx, cy - r + 10, cx, cy + r - 10], fill=(30, 58, 138, 200), width=3)

    # Elliptical lat lines
    draw.arc([cx - r + 15, cy - 45, cx + r - 15, cy + 45], 0, 360, fill=(30, 58, 138, 180), width=2)
    draw.arc([cx - 45, cy - r + 15, cx + 45, cy + r - 15], 0, 360, fill=(30, 58, 138, 180), width=2)

    # 3. Supersonic Flight Arc (Cyan glowing contrail)
    arc_points = []
    for i in range(50):
        t = i / 49.0
        # Curved path from bottom-left to top-right
        x = 40 + t * 160
        y = 200 - math.sin(t * math.pi * 0.7) * 140
        arc_points.append((x, y))

    for i in range(len(arc_points) - 1):
        alpha = int(50 + 205 * (i / len(arc_points)))
        width = int(2 + 4 * (i / len(arc_points)))
        draw.line([arc_points[i], arc_points[i+1]], fill=(56, 189, 248, alpha), width=width)

    # 4. Supersonic Jet Delta-Wing Silhouette
    # Heading roughly at 45 degrees towards top-right
    head_x, head_y = 205, 55
    plane_poly = [
        (head_x, head_y),                   # Nose
        (head_x - 30, head_y + 40),         # Left fuselage
        (head_x - 70, head_y + 60),         # Left wingtip
        (head_x - 45, head_y + 45),         # Left inner wing
        (head_x - 55, head_y + 65),         # Left tail
        (head_x - 40, head_y + 55),         # Exhaust center
        (head_x - 30, head_y + 75),         # Right tail
        (head_x - 20, head_y + 55),         # Right inner wing
        (head_x + 5,  head_y + 65),         # Right wingtip
        (head_x - 10, head_y + 35),         # Right fuselage
    ]
    draw.polygon(plane_poly, fill=(248, 250, 252, 255), outline=(56, 189, 248, 255))

    # Inner cockpit detail
    draw.polygon([(head_x - 5, head_y + 12), (head_x - 15, head_y + 25), (head_x - 10, head_y + 23)], fill=(14, 165, 233, 255))

    # 5. Save multi-resolution .ico
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save('public/game_icon.ico', format='ICO', sizes=sizes)
    print("Icon generated successfully: public/game_icon.ico")

if __name__ == '__main__':
    create_icon()
