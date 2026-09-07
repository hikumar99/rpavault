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
        # subtle vertical gradient
        r = int(7 + (13 - 7) * (y / height))
        g = int(16 + (32 - 16) * (y / height))
        b = int(32 + (58 - 32) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # Glow spheres
    # Top-right blue glow
    glow_blue = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gb_draw = ImageDraw.Draw(glow_blue)
    gb_draw.ellipse([700, -150, 1350, 450], fill=(0, 88, 176, 55))
    gb_draw.ellipse([800, -50, 1250, 350], fill=(56, 189, 248, 45))
    img = Image.alpha_composite(img, glow_blue)

    # Bottom-left orange glow
    glow_orange = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    go_draw = ImageDraw.Draw(glow_orange)
    go_draw.ellipse([-100, 400, 500, 850], fill=(255, 107, 43, 40))
    img = Image.alpha_composite(img, glow_orange)

    draw = ImageDraw.Draw(img)

    # Grid lines pattern
    for x in range(0, width, 50):
        draw.line([(x, 0), (x, height)], fill=(255, 255, 255, 8))
    for y in range(0, height, 50):
        draw.line([(0, y), (width, y)], fill=(255, 255, 255, 8))

    # Fonts
    font_dir = "/System/Library/Fonts/Supplemental/"
    font_arial_bold = font_dir + "Arial Bold.ttf"
    font_arial_black = font_dir + "Arial Black.ttf"
    font_arial_regular = font_dir + "Arial.ttf"

    f_sub = ImageFont.truetype(font_arial_bold, 18)
    f_title = ImageFont.truetype(font_arial_black, 54)
    f_title2 = ImageFont.truetype(font_arial_black, 46)
    f_pills = ImageFont.truetype(font_arial_bold, 18)
    f_date_main = ImageFont.truetype(font_arial_bold, 24)
    f_date_sub = ImageFont.truetype(font_arial_regular, 17)
    f_badge = ImageFont.truetype(font_arial_bold, 18)

    # 2. Add RPAVault Logo
    logo_path = "assets/images/logo-rpavault-white.png"
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        # Resize logo keeping aspect ratio
        w, h = logo.size
        new_h = 42
        new_w = int(w * (new_h / h))
        logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        img.paste(logo, (64, 52), logo)
    else:
        draw.text((64, 50), "RPAVAULT", fill=(255, 255, 255), font=f_title2)

    # 3. Zoom Live Badge at top right
    badge_x = 900
    badge_y = 48
    badge_w = 236
    badge_h = 48
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=24, fill=(15, 38, 70), outline=(45, 140, 255), width=2)
    # Red dot
    draw.ellipse([badge_x + 18, badge_y + 17, badge_x + 32, badge_y + 31], fill=(239, 68, 68))
    draw.text((badge_x + 42, badge_y + 13), "LIVE ZOOM DEMO", fill=(125, 211, 252), font=f_badge)

    # 4. Orange Track Accent Line & Text
    draw.line([(64, 152), (104, 152)], fill=(255, 107, 43), width=4)
    draw.text((116, 142), "PRODUCTION TRACK • PYTHON + GENAI + AGENTIC AI", fill=(255, 138, 76), font=f_sub)

    # 5. Main Headlines
    draw.text((64, 176), "Python + GenAI + Agentic AI.", fill=(255, 255, 255), font=f_title)
    draw.text((64, 244), "Live Masterclass & Production Roadmap", fill=(56, 189, 248), font=f_title2)

    # 6. Tech Stack Pills
    skills = ["Python & PyTorch", "Transformers & LLMs", "Production RAG", "Agentic AI & Tools", "FastAPI & Docker"]
    pill_x = 64
    pill_y = 330
    for skill in skills:
        bbox = f_pills.getbbox(skill)
        text_w = bbox[2] - bbox[0]
        p_w = text_w + 28
        p_h = 38
        draw.rounded_rectangle([pill_x, pill_y, pill_x + p_w, pill_y + p_h], radius=8, fill=(18, 36, 62), outline=(56, 189, 248, 120), width=1)
        draw.text((pill_x + 14, pill_y + 9), skill, fill=(203, 213, 225), font=f_pills)
        pill_x += p_w + 12

    # 7. Date & Time Highlight Card at Bottom
    card_y = 415
    card_h = 160
    card_w = width - 128
    draw.rounded_rectangle([64, card_y, 64 + card_w, card_y + card_h], radius=18, fill=(12, 27, 52), outline=(45, 140, 255, 160), width=2)

    # Left calendar icon box
    cal_box_x = 94
    cal_box_y = card_y + 30
    draw.rounded_rectangle([cal_box_x, cal_box_x_y := cal_box_y, cal_box_x + 64, cal_box_y + 64], radius=14, fill=(255, 107, 43, 40), outline=(255, 107, 43), width=2)
    # Draw calendar symbol in box
    draw.text((cal_box_x + 16, cal_box_y + 16), "SEP", fill=(255, 138, 76), font=f_sub)
    draw.text((cal_box_x + 20, cal_box_y + 36), "08", fill=(255, 255, 255), font=ImageFont.truetype(font_arial_black, 18))

    # Date text
    draw.text((180, card_y + 24), "Tuesday, September 8 at 7:00 AM IST", fill=(255, 255, 255), font=f_date_main)
    draw.text((180, card_y + 60), "US/Canada: Sep 8, 9:30 PM EDT • Live Interactive Session with Q&A", fill=(148, 163, 184), font=f_date_sub)
    draw.text((180, card_y + 88), "Zoom Meeting ID: 826 6673 0613  |  Passcode: 059882", fill=(125, 211, 252), font=f_date_sub)

    # CTA Button on Right
    cta_w = 230
    cta_h = 56
    cta_x = 64 + card_w - cta_w - 30
    cta_y = card_y + 52
    draw.rounded_rectangle([cta_x, cta_y, cta_x + cta_w, cta_y + cta_h], radius=28, fill=(0, 88, 176), outline=(56, 189, 248), width=2)
    cta_font = ImageFont.truetype(font_arial_bold, 20)
    draw.text((cta_x + 28, cta_y + 16), "Free Registration ->", fill=(255, 255, 255), font=cta_font)

    # Save PNG
    out_path = "assets/images/og-genai-demo.png"
    img.save(out_path, format="PNG")
    print("Generated Open Graph Banner successfully:", out_path)

if __name__ == "__main__":
    generate_og()
