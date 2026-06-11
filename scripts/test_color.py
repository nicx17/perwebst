from PIL import Image


def analyze_color(img: Image.Image) -> dict:
    if img.mode != "RGB":
        img = img.convert("RGB")

    avg_img = img.resize((1, 1), resample=Image.Resampling.BOX)
    avg_color = avg_img.getpixel((0, 0))
    avg_hex = f"#{avg_color[0]:02x}{avg_color[1]:02x}{avg_color[2]:02x}"

    small_img = img.copy()
    small_img.thumbnail((150, 150))
    colors = small_img.getcolors(maxcolors=25000)
    if colors:
        colors.sort(key=lambda x: x[0], reverse=True)
        dom_color = colors[0][1]
    else:
        dom_color = avg_color

    if isinstance(dom_color, int):
        dom_color = (dom_color, dom_color, dom_color)

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
print(analyze_color(img))
