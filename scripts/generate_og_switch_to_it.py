import os
from PIL import Image, ImageDraw, ImageFont

def generate_og():
    width = 1200
    height = 630
    
    # 1. Base image with gradient
    img = Image.new("RGBA", (width, height), (7, 16, 32, 255))
    draw = ImageDraw.Draw(img)

    # Draw gradient overlay
    for y in range(height):
        # subtle vertical gradient from #071020 to #0b182d
        r = int(7 + (11 - 7) * (y / height))
        g = int(16 + (24 - 16) * (y / height))
        b = int(32 + (45 - 32) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # Glow spheres
    # Top-right blue glow
    glow_blue = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gb_draw = ImageDraw.Draw(glow_blue)
    gb_draw.ellipse([700, -150, 1350, 450], fill=(0, 88, 176, 50))
    gb_draw.ellipse([800, -50, 1250, 350], fill=(56, 189, 248, 40))
    img = Image.alpha_composite(img, glow_blue)

    # Bottom-left orange glow
    glow_orange = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    go_draw = ImageDraw.Draw(glow_orange)
    go_draw.ellipse([-100, 350, 500, 800], fill=(250, 70, 22, 50))
    go_draw.ellipse([-50, 400, 400, 750], fill=(255, 120, 50, 35))
    img = Image.alpha_composite(img, glow_orange)

    draw = ImageDraw.Draw(img)

    # Grid lines pattern
    for x in range(0, width, 50):
        draw.line([(x, 0), (x, height)], fill=(255, 255, 255, 7))
    for y in range(0, height, 50):
        draw.line([(0, y), (width, y)], fill=(255, 255, 255, 7))

    # Fonts
    font_dir = "/System/Library/Fonts/Supplemental/"
    font_arial_bold = font_dir + "Arial Bold.ttf"
    font_arial_black = font_dir + "Arial Black.ttf"
    font_arial_regular = font_dir + "Arial.ttf"

    f_sub = ImageFont.truetype(font_arial_bold, 17)
    f_title1 = ImageFont.truetype(font_arial_black, 50)
    f_title2 = ImageFont.truetype(font_arial_black, 50)
    f_tagline = ImageFont.truetype(font_arial_bold, 28)
    f_pills = ImageFont.truetype(font_arial_bold, 18)
    f_box_title = ImageFont.truetype(font_arial_bold, 22)
    f_box_sub = ImageFont.truetype(font_arial_regular, 16)
    f_badge = ImageFont.truetype(font_arial_bold, 17)
    f_btn = ImageFont.truetype(font_arial_bold, 19)

    # 2. Add RPAVault Logo
    logo_path = "assets/images/logo-rpavault-white.png"
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        w, h = logo.size
        new_h = 44
        new_w = int(w * (new_h / h))
        logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        img.paste(logo, (64, 50), logo)
    else:
        draw.text((64, 48), "RPAVAULT", fill=(255, 255, 255), font=f_title2)

    # 3. Live Zoom Badge at top right
    badge_w = 280
    badge_x = width - 64 - badge_w
    badge_y = 48
    badge_h = 46
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=23, fill=(15, 38, 70), outline=(45, 140, 255), width=2)
    # Red dot
    draw.ellipse([badge_x + 16, badge_y + 16, badge_x + 30, badge_y + 30], fill=(239, 68, 68))
    draw.text((badge_x + 40, badge_y + 13), "LIVE ZOOM MASTERCLASS", fill=(125, 211, 252), font=f_badge)

    # 4. Kicker Pill / Accent Line (Centered)
    kicker_text = "EXCLUSIVELY FOR COLLEGE STUDENTS & NON-IT GRADUATES"
    bbox_k = f_sub.getbbox(kicker_text)
    k_w = bbox_k[2] - bbox_k[0]
    line_w = 40
    k_gap = 10
    total_k_w = line_w + k_gap + k_w
    start_k_x = (width - total_k_w) // 2
    draw.line([(start_k_x, 140), (start_k_x + line_w, 140)], fill=(250, 70, 22), width=4)
    draw.text((start_k_x + line_w + k_gap, 131), kicker_text, fill=(255, 130, 70), font=f_sub)

    # 5. Main Headlines (Centered)
    # "Switch to a High-Paying IT Career"
    t1_text = "Switch to a High-Paying IT Career"
    bbox_t1 = f_title1.getbbox(t1_text)
    t1_w = bbox_t1[2] - bbox_t1[0]
    draw.text(((width - t1_w) // 2, 168), t1_text, fill=(255, 255, 255), font=f_title1)
    
    # "with UiPath RPA"
    full_t2 = "with UiPath RPA"
    bbox_t2 = f_title2.getbbox(full_t2)
    t2_w = bbox_t2[2] - bbox_t2[0]
    start_t2_x = (width - t2_w) // 2
    
    bbox_with = f_title2.getbbox("with ")
    with_w = bbox_with[2] - bbox_with[0]
    draw.text((start_t2_x, 234), "with ", fill=(255, 255, 255), font=f_title2)
    draw.text((start_t2_x + with_w, 234), "UiPath RPA", fill=(250, 70, 22), font=f_title2)

    # Subtitle: Zero Coding Required • Visual Drag & Drop Automation (Centered)
    sub_text = "Zero Coding Required  •  Visual Drag & Drop Automation"
    bbox_sub = f_tagline.getbbox(sub_text)
    sub_w = bbox_sub[2] - bbox_sub[0]
    draw.text(((width - sub_w) // 2, 308), sub_text, fill=(56, 189, 248), font=f_tagline)

    # 6. Feature Value Pills (4 evenly-spaced 256px boxes matching 1072px width)
    highlights = [
        ("ZERO CODING", "100% Drag & Drop"),
        ("GLOBAL DEMAND", "85%+ Fortune 500"),
        ("TARGET PACKAGE", "9L - 15L CTC"),
        ("ELIGIBILITY", "Any Degree Stream")
    ]
    
    start_x = 64
    pill_y = 372
    p_w = 256
    p_h = 58
    gap = 16
    
    f_pill_lbl = ImageFont.truetype(font_arial_bold, 12)
    f_pill_val = ImageFont.truetype(font_arial_bold, 18)
    
    for i, (tag, val) in enumerate(highlights):
        px = start_x + i * (p_w + gap)
        # Pill background
        draw.rounded_rectangle([px, pill_y, px + p_w, pill_y + p_h], radius=12, fill=(16, 32, 56), outline=(56, 189, 248, 110), width=1)
        # Label
        draw.text((px + 16, pill_y + 9), tag, fill=(148, 163, 184), font=f_pill_lbl)
        # Value
        draw.text((px + 16, pill_y + 27), val, fill=(248, 250, 252), font=f_pill_val)

    # 7. Date & Time Highlight Card at Bottom
    box_x = 64
    box_y = 464
    box_w = 1072
    box_h = 120
    draw.rounded_rectangle([box_x, box_y, box_x + box_w, box_y + box_h], radius=18, fill=(14, 27, 48), outline=(56, 189, 248, 140), width=2)

    # Left Icon Badge inside box (Gift / Ticket badge)
    icon_box_x = box_x + 20
    icon_box_y = box_y + 20
    icon_box_w = 80
    icon_box_h = 80
    draw.rounded_rectangle([icon_box_x, icon_box_y, icon_box_x + icon_box_w, icon_box_y + icon_box_h], radius=14, fill=(250, 70, 22), outline=(255, 120, 50), width=1)
    
    f_free = ImageFont.truetype(font_arial_black, 22)
    f_kit = ImageFont.truetype(font_arial_bold, 14)
    draw.text((icon_box_x + 10, icon_box_y + 16), "FREE", fill=(255, 255, 255), font=f_free)
    draw.text((icon_box_x + 23, icon_box_y + 44), "PASS", fill=(255, 230, 200), font=f_kit)

    # Details Text inside box
    draw.text((icon_box_x + 100, box_y + 26), "Free Live Demo + Beginner RPA Starter Kit Included", fill=(255, 255, 255), font=f_box_title)
    draw.text((icon_box_x + 100, box_y + 58), "Includes UiPath Cheat Sheet (PDF), 4 Ready Bot Projects & WhatsApp Group Access", fill=(148, 163, 184), font=f_box_sub)
    draw.text((icon_box_x + 100, box_y + 82), "Interactive Q&A with Senior UiPath Architect  •  Certificate of Attendance", fill=(56, 189, 248), font=f_box_sub)

    # CTA Button on Right side
    btn_w = 240
    btn_h = 58
    btn_x = box_x + box_w - btn_w - 24
    btn_y = box_y + 31
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=14, fill=(0, 88, 176), outline=(56, 189, 248), width=2)
    
    bbox_btn = f_btn.getbbox("Claim Free Seat ->")
    btn_tw = bbox_btn[2] - bbox_btn[0]
    draw.text((btn_x + (btn_w - btn_tw) // 2, btn_y + 18), "Claim Free Seat ->", fill=(255, 255, 255), font=f_btn)

    # Convert to RGB and save PNG + JPG
    final_img_rgba = img
    final_img_rgb = img.convert("RGB")

    out_png = "assets/images/og-switch-to-it-career.png"
    out_jpg = "assets/images/og-switch-to-it-career.jpg"

    final_img_rgba.save(out_png, "PNG")
    # Save JPEG with 90 quality (< 150KB for fast WhatsApp preview loading)
    final_img_rgb.save(out_jpg, "JPEG", quality=90, optimize=True)

    print(f"Generated PNG: {out_png} ({os.path.getsize(out_png)} bytes)")
    print(f"Generated JPG: {out_jpg} ({os.path.getsize(out_jpg)} bytes)")

if __name__ == "__main__":
    generate_og()
