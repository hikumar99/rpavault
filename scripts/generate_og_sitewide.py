import os
from PIL import Image, ImageDraw, ImageFont

def generate_og_sitewide():
    width = 1200
    height = 630
    
    # 1. Base image with gradient
    img = Image.new("RGBA", (width, height), (6, 15, 30, 255))
    draw = ImageDraw.Draw(img)

    for y in range(height):
        r = int(6 + (10 - 6) * (y / height))
        g = int(15 + (25 - 15) * (y / height))
        b = int(30 + (48 - 30) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # Glow spheres
    glow_blue = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gb_draw = ImageDraw.Draw(glow_blue)
    gb_draw.ellipse([650, -180, 1350, 420], fill=(0, 88, 176, 55))
    gb_draw.ellipse([780, -60, 1260, 320], fill=(56, 189, 248, 45))
    img = Image.alpha_composite(img, glow_blue)

    glow_orange = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    go_draw = ImageDraw.Draw(glow_orange)
    go_draw.ellipse([-120, 360, 480, 820], fill=(250, 70, 22, 45))
    go_draw.ellipse([-60, 420, 380, 760], fill=(255, 120, 50, 30))
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

    f_sub = ImageFont.truetype(font_arial_bold, 16)
    f_title1 = ImageFont.truetype(font_arial_black, 50)
    f_tagline = ImageFont.truetype(font_arial_bold, 24)
    f_box_title = ImageFont.truetype(font_arial_bold, 21)
    f_box_sub = ImageFont.truetype(font_arial_regular, 15)
    f_badge = ImageFont.truetype(font_arial_bold, 16)
    f_btn = ImageFont.truetype(font_arial_bold, 19)

    # 2. Add RPAVault Logo at Top Left
    logo_path = "assets/images/logo-rpavault-white.png"
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        w, h = logo.size
        new_h = 44
        new_w = int(w * (new_h / h))
        logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        img.paste(logo, (64, 48), logo)

    # 3. Badge at top right
    badge_w = 270
    badge_x = width - 64 - badge_w
    badge_y = 48
    badge_h = 46
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=23, fill=(13, 33, 60), outline=(56, 189, 248), width=2)
    draw.ellipse([badge_x + 16, badge_y + 16, badge_x + 30, badge_y + 30], fill=(56, 189, 248))
    draw.text((badge_x + 40, badge_y + 13), "ENTERPRISE & CAREERS", fill=(125, 211, 252), font=f_badge)

    # 4. Kicker
    kicker_text = "HYDERABAD, INDIA  •  GLOBAL AUTOMATION & STAFFING PARTNER"
    bbox_k = f_sub.getbbox(kicker_text)
    k_w = bbox_k[2] - bbox_k[0]
    line_w = 36
    k_gap = 12
    total_k_w = line_w + k_gap + k_w
    start_k_x = (width - total_k_w) // 2
    draw.line([(start_k_x, 137), (start_k_x + line_w, 137)], fill=(250, 70, 22), width=4)
    draw.text((start_k_x + line_w + k_gap, 128), kicker_text, fill=(255, 130, 70), font=f_sub)

    # 5. Main Headline: "Consultancy, Staffing & IT Training"
    part1 = "Consultancy, Staffing & "
    part2 = "IT Training"
    bbox_p1 = f_title1.getbbox(part1)
    bbox_p2 = f_title1.getbbox(part2)
    p1_w = bbox_p1[2] - bbox_p1[0]
    p2_w = bbox_p2[2] - bbox_p2[0]
    head_w = p1_w + p2_w
    start_h_x = (width - head_w) // 2

    draw.text((start_h_x, 164), part1, fill=(255, 255, 255), font=f_title1)
    draw.text((start_h_x + p1_w, 164), part2, fill=(56, 189, 248), font=f_title1)

    # Subtitle
    sub_text = "Empowering Enterprises with AI-Agents & Transforming Tech Careers"
    bbox_sub = f_tagline.getbbox(sub_text)
    sub_w = bbox_sub[2] - bbox_sub[0]
    draw.text(((width - sub_w) // 2, 236), sub_text, fill=(226, 232, 240), font=f_tagline)

    # 6. Feature Value Pills (4 evenly-spaced boxes matching 1072px width)
    highlights = [
        ("ENTERPRISE AUTOMATION", "UiPath & Power Automate"),
        ("IT RECRUITING", "Contract & Full-Time Staffing"),
        ("CAREER ACCELERATOR", "100% Practical Mentoring"),
        ("PROVEN OUTCOMES", "1500+ Professionals Placed")
    ]
    
    start_x = 64
    pill_y = 308
    p_w = 256
    p_h = 62
    gap = 16
    
    f_pill_lbl = ImageFont.truetype(font_arial_bold, 12)
    f_pill_val = ImageFont.truetype(font_arial_bold, 17)
    
    for i, (tag, val) in enumerate(highlights):
        px = start_x + i * (p_w + gap)
        draw.rounded_rectangle([px, pill_y, px + p_w, pill_y + p_h], radius=12, fill=(15, 30, 52), outline=(56, 189, 248, 120), width=1)
        draw.text((px + 16, pill_y + 10), tag, fill=(148, 163, 184), font=f_pill_lbl)
        draw.text((px + 16, pill_y + 30), val, fill=(248, 250, 252), font=f_pill_val)

    # 7. Bottom Card
    box_x = 64
    box_y = 412
    box_w = 1072
    box_h = 168
    draw.rounded_rectangle([box_x, box_y, box_x + box_w, box_y + box_h], radius=20, fill=(12, 25, 46), outline=(56, 189, 248, 140), width=2)

    icon_box_x = box_x + 24
    icon_box_y = box_y + 24
    icon_box_w = 120
    icon_box_h = 120
    draw.rounded_rectangle([icon_box_x, icon_box_y, icon_box_x + icon_box_w, icon_box_y + icon_box_h], radius=16, fill=(250, 70, 22), outline=(255, 120, 50), width=1)
    
    f_vault = ImageFont.truetype(font_arial_black, 22)
    f_hub = ImageFont.truetype(font_arial_bold, 14)
    draw.text((icon_box_x + 22, icon_box_y + 28), "RPA", fill=(255, 255, 255), font=f_vault)
    draw.text((icon_box_x + 16, icon_box_y + 68), "VAULT", fill=(255, 230, 200), font=f_vault)

    draw.text((icon_box_x + 142, box_y + 28), "Enterprise Consulting • Staffing Solutions • Industry Training", fill=(255, 255, 255), font=f_box_title)
    draw.text((icon_box_x + 142, box_y + 64), "UiPath, Power Automate, Agentic AI, Cloud DevOps, Full-Stack & Data Engineering.", fill=(148, 163, 184), font=f_box_sub)
    draw.text((icon_box_x + 142, box_y + 92), "Direct Candidate Placement  •  Corporate Training  •  Automation POC Development", fill=(56, 189, 248), font=f_box_sub)
    draw.text((icon_box_x + 142, box_y + 118), "Visit: rpavault.com  |  Phone & WhatsApp: +91 9160949996", fill=(148, 163, 184), font=ImageFont.truetype(font_arial_bold, 14))

    btn_w = 230
    btn_h = 60
    btn_x = box_x + box_w - btn_w - 28
    btn_y = box_y + 54
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=16, fill=(0, 88, 176), outline=(56, 189, 248), width=2)
    
    bbox_btn = f_btn.getbbox("Explore Vault ->")
    btn_tw = bbox_btn[2] - bbox_btn[0]
    draw.text((btn_x + (btn_w - btn_tw) // 2, btn_y + 20), "Explore Vault ->", fill=(255, 255, 255), font=f_btn)

    final_img_rgba = img
    final_img_rgb = img.convert("RGB")

    out_png = "assets/images/og-image.png"
    out_jpg = "assets/images/og-image.jpg"

    final_img_rgba.save(out_png, "PNG")
    final_img_rgb.save(out_jpg, "JPEG", quality=90, optimize=True)

    print(f"Generated site-wide {out_png} ({os.path.getsize(out_png)} bytes)")
    print(f"Generated site-wide {out_jpg} ({os.path.getsize(out_jpg)} bytes)")

if __name__ == "__main__":
    generate_og_sitewide()
