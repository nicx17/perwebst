2from PIL import Image


def analyze_color2(img: Image.Image) -> dict:
    if img.mode != "RGB":
        img = img.convert("RGB")

    avg_img = img.resize((1, 1), resample=Image.Resampling.BOX)
    avg_color = avg_img.getpixel((0, 0))
    avg_hex = f"#{avg_color[0]:02x}{avg_color[1]:02x}{avg_color[2]:02x}"

    small_img = img.copy()
    small_img.thumbnail((150, 150))

    try:
        q_img = small_img.quantize(colors=1, method=Image.Quantize.MEDIANCUT)
        dom_color = q_img.convert("RGB").getpixel((0, 0))
    except Exception:
        dom_color = avg_color

    dom_hex = f"#{dom_color[0]:02x}{dom_color[1]:02x}{dom_color[2]:02x}"

    luminance = 0.299 * avg_color[0] + 0.587 * avg_color[1] + 0.114 * avg_color[2]
    is_dark = luminance < 128

    return {
        "dominant": dom_hex,
        "average": avg_hex,
        "luminance": luminance,
        "isDark": is_dark,
    }


img = Image.open("public/backgrounds/light/eve-jCBLFtjpXfw-unsplash.jpg")
print(analyze_color2(img))
