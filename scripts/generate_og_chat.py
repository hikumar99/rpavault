import os
from PIL import Image, ImageDraw, ImageFont

def generate_og_chat():
    width = 1200
    height = 630
    
    # 1. Base image with gradient
    img = Image.new("RGBA", (width, height), (6, 15, 30, 255))
    draw = ImageDraw.Draw(img)

    # Vertical gradient
    for y in range(height):
        r = int(6 + (10 - 6) * (y / height))
        g = int(15 + (25 - 15) * (y / height))
        b = int(30 + (48 - 30) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # Glow spheres
    # Top-right blue/cyan glow
    glow_blue = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gb_draw = ImageDraw.Draw(glow_blue)
    gb_draw.ellipse([650, -180, 1350, 420], fill=(0, 88, 176, 55))
    gb_draw.ellipse([780, -60, 1260, 320], fill=(56, 189, 248, 45))
    img = Image.alpha_composite(img, glow_blue)

    # Bottom-left emerald & cyan glow (representing live online chat status)
    glow_green = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gg_draw = ImageDraw.Draw(glow_green)
    gg_draw.ellipse([-120, 360, 480, 820], fill=(16, 185, 129, 35))
    gg_draw.ellipse([-60, 420, 380, 760], fill=(56, 189, 248, 30))
    img = Image.alpha_composite(img, glow_green)

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
    f_title1 = ImageFont.truetype(font_arial_black, 52)
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
    else:
        draw.text((64, 48), "RPAVAULT", fill=(255, 255, 255), font=f_title1)

    # 3. Online 24/7 Live AI Badge at top right
    badge_w = 300
    badge_x = width - 64 - badge_w
    badge_y = 48
    badge_h = 46
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=23, fill=(13, 33, 60), outline=(56, 189, 248), width=2)
    # Emerald green live dot
    draw.ellipse([badge_x + 16, badge_y + 16, badge_x + 30, badge_y + 30], fill=(16, 185, 129))
    draw.text((badge_x + 40, badge_y + 13), "ONLINE • 24/7 AI COUNSELOR", fill=(125, 211, 252), font=f_badge)

    # 4. Kicker Pill / Accent Line (Centered)
    kicker_text = "ENTERPRISE AUTOMATION  •  IT CONSULTING  •  CAREER TRANSITION"
    bbox_k = f_sub.getbbox(kicker_text)
    k_w = bbox_k[2] - bbox_k[0]
    line_w = 36
    k_gap = 12
    total_k_w = line_w + k_gap + k_w
    start_k_x = (width - total_k_w) // 2
    draw.line([(start_k_x, 137), (start_k_x + line_w, 137)], fill=(56, 189, 248), width=4)
    draw.text((start_k_x + line_w + k_gap, 128), kicker_text, fill=(56, 189, 248), font=f_sub)

    # 5. Main Headline: "Chat with RPAVault AI"
    part1 = "Chat with "
    part2 = "RPAVault AI"
    bbox_p1 = f_title1.getbbox(part1)
    bbox_p2 = f_title1.getbbox(part2)
    p1_w = bbox_p1[2] - bbox_p1[0]
    p2_w = bbox_p2[2] - bbox_p2[0]
    head_w = p1_w + p2_w
    start_h_x = (width - head_w) // 2

    draw.text((start_h_x, 164), part1, fill=(255, 255, 255), font=f_title1)
    draw.text((start_h_x + p1_w, 164), part2, fill=(56, 189, 248), font=f_title1)

    # Subtitle: "Instant Guidance on UiPath, Power Automate, Course Fees & Roadmaps"
    sub_text = "Instant Guidance on UiPath, Power Automate, Course Fees & Roadmaps"
    bbox_sub = f_tagline.getbbox(sub_text)
    sub_w = bbox_sub[2] - bbox_sub[0]
    draw.text(((width - sub_w) // 2, 236), sub_text, fill=(226, 232, 240), font=f_tagline)

    # 6. Feature Value Pills (4 evenly-spaced boxes matching 1072px width)
    highlights = [
        ("ENTERPRISE RPA", "UiPath & Power Automate"),
        ("AGENTIC AI", "Multi-Agent Systems"),
        ("CAREER TRANSITION", "Non-IT & Career Gaps"),
        ("BATCH SCHEDULES", "Dates, Timings & Fees")
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
        # Pill background
        draw.rounded_rectangle([px, pill_y, px + p_w, pill_y + p_h], radius=12, fill=(15, 30, 52), outline=(56, 189, 248, 120), width=1)
        # Label
        draw.text((px + 16, pill_y + 10), tag, fill=(148, 163, 184), font=f_pill_lbl)
        # Value
        draw.text((px + 16, pill_y + 30), val, fill=(248, 250, 252), font=f_pill_val)

    # 7. Action Card at Bottom (width 1072)
    box_x = 64
    box_y = 412
    box_w = 1072
    box_h = 168
    draw.rounded_rectangle([box_x, box_y, box_x + box_w, box_y + box_h], radius=20, fill=(12, 25, 46), outline=(56, 189, 248, 140), width=2)

    # Left Icon Badge inside box (Robot / Chat badge)
    icon_box_x = box_x + 24
    icon_box_y = box_y + 24
    icon_box_w = 120
    icon_box_h = 120
    draw.rounded_rectangle([icon_box_x, icon_box_y, icon_box_x + icon_box_w, icon_box_y + icon_box_h], radius=16, fill=(16, 44, 82), outline=(56, 189, 248), width=2)
    
    f_chat_icon1 = ImageFont.truetype(font_arial_black, 26)
    f_chat_icon2 = ImageFont.truetype(font_arial_bold, 14)
    draw.text((icon_box_x + 20, icon_box_y + 28), "24/7", fill=(56, 189, 248), font=f_chat_icon1)
    draw.text((icon_box_x + 13, icon_box_y + 68), "AI ASSISTANT", fill=(255, 255, 255), font=f_chat_icon2)

    # Details Text inside box
    draw.text((icon_box_x + 142, box_y + 28), "Get 1-on-1 Guidance & Syllabus Roadmaps Instantly", fill=(255, 255, 255), font=f_box_title)
    draw.text((icon_box_x + 142, box_y + 64), "Trained on real course syllabus, placement records, fees & enterprise offerings.", fill=(148, 163, 184), font=f_box_sub)
    draw.text((icon_box_x + 142, box_y + 92), "Zero Waiting Time  •  Curriculum Document Handover  •  Direct WhatsApp Option", fill=(56, 189, 248), font=f_box_sub)
    draw.text((icon_box_x + 142, box_y + 118), "Live at: rpavault.com/chat", fill=(148, 163, 184), font=ImageFont.truetype(font_arial_bold, 14))

    # CTA Button on Right side
    btn_w = 230
    btn_h = 60
    btn_x = box_x + box_w - btn_w - 28
    btn_y = box_y + 54
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=16, fill=(0, 88, 176), outline=(56, 189, 248), width=2)
    
    bbox_btn = f_btn.getbbox("Chat with AI ->")
    btn_tw = bbox_btn[2] - bbox_btn[0]
    draw.text((btn_x + (btn_w - btn_tw) // 2, btn_y + 20), "Chat with AI ->", fill=(255, 255, 255), font=f_btn)

    # Convert and save
    final_img_rgba = img
    final_img_rgb = img.convert("RGB")

    out_png = "assets/images/og-chat.png"
    out_jpg = "assets/images/og-chat.jpg"

    final_img_rgba.save(out_png, "PNG")
    # Save optimized JPEG (< 150KB, universally loaded by WhatsApp)
    final_img_rgb.save(out_jpg, "JPEG", quality=90, optimize=True)

    print(f"Generated {out_png} ({os.path.getsize(out_png)} bytes)")
    print(f"Generated {out_jpg} ({os.path.getsize(out_jpg)} bytes)")

if __name__ == "__main__":
    generate_og_chat()
