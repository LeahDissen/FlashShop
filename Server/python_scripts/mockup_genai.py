import sys
import json
import base64
import io
import os
import requests
import re
from PIL import Image, ImageOps
API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    sys.stderr.write("Error: GEMINI_API_KEY is missing.\n")
    sys.exit(1)

def load_image(source, label="Image"):
    """טוען תמונה מ-URL או Base64 בצורה חכמה"""
    try:
        if not source:
            raise ValueError(f"Source for {label} is empty")
        source = str(source).strip().strip("[]\"'")

        if source.startswith('http'):
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(source, headers=headers, stream=True, timeout=10)
            response.raise_for_status()
            return Image.open(response.raw).convert("RGBA")
        else:
            if "," in source:
                source = source.split(",")[1]
            image_data = base64.b64decode(source)
            return Image.open(io.BytesIO(image_data)).convert("RGBA")

    except Exception as e:
        error_msg = f"Failed to load {label}: {str(e)}"
        if len(source) < 200:
            error_msg += f" (Source start: {source[:50]}...)"
        raise ValueError(error_msg)

def image_to_base64_str(img):
    buffered = io.BytesIO()
    img.convert("RGB").save(buffered, format="JPEG", quality=85)
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

def get_print_area_from_ai(product_img, product_name):
    """שולח את התמונה ל-Gemini ומבקש קואורדינטות"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={API_KEY}"
    
    prompt = f"""
    Analyze this product image (a {product_name}).
    I need to define a bounding box for printing a custom design on it.
    
    Return ONLY a JSON object with 4 integers (percentages 0-100):
    {{
        "top": <percent_from_top>,
        "left": <percent_from_left>,
        "width": <percent_width>,
        "height": <percent_height>
    }}
    Rules:
    1. Identify the main surface area suitable for printing.
    2. Ignore handles, lids, or background.
    3. Return ONLY valid JSON. No markdown, no text.
    """

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_to_base64_str(product_img)
                    }
                }
            ]
        }]
    }

    try:
        response = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload)
        
        if response.status_code != 200:
            sys.stderr.write(f"Gemini API Error {response.status_code}: {response.text}\n")
            return None

        response_json = response.json()
        
        if 'candidates' not in response_json or not response_json['candidates']:
             sys.stderr.write("AI returned no candidates.\n")
             return None

        text_response = response_json['candidates'][0]['content']['parts'][0]['text']
        json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
        json_str = json_match.group(0) if json_match else text_response
        
        return json.loads(json_str)
        
    except Exception as e:
        sys.stderr.write(f"AI Analysis Warning: {str(e)}. Using defaults.\n")
        return None

def generate_smart_mockup(data):
    product_url = data.get('productUrl')
    design_base64 = data.get('designImage')
    product_name = data.get('productName', 'Product')
    base_img = load_image(product_url, "Product Image")
    design_img = load_image(design_base64, "Design Image")
    area = get_print_area_from_ai(base_img, product_name)
    
    if not area:
        area = {"top": 30, "left": 30, "width": 40, "height": 40}
        print("Using DEFAULT coordinates (AI failed or returned bad data)")
    else:
        print(f"Using AI coordinates: {area}")

    img_w, img_h = base_img.size
    top_pct = max(0, min(100, area.get('top', 30)))
    left_pct = max(0, min(100, area.get('left', 30)))
    width_pct = max(5, min(100, area.get('width', 40)))
    height_pct = max(5, min(100, area.get('height', 40)))
    target_w = int(img_w * (width_pct / 100))
    target_h = int(img_h * (height_pct / 100))
    target_x = int(img_w * (left_pct / 100))
    target_y = int(img_h * (top_pct / 100))
    design_img_resized = ImageOps.contain(design_img, (target_w, target_h))
    paste_x = target_x + (target_w - design_img_resized.width) // 2
    paste_y = target_y + (target_h - design_img_resized.height) // 2
    composite = Image.new('RGBA', base_img.size, (0, 0, 0, 0))
    composite.paste(design_img_resized, (paste_x, paste_y))
    final_img = Image.alpha_composite(base_img, composite)
    buffered = io.BytesIO()
    final_img.convert("RGB").save(buffered, format="JPEG", quality=95)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return f"data:image/png;base64,{img_str}"

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            sys.exit(0)
        data = json.loads(input_data)
        result = generate_smart_mockup(data)
        print(result)
    except Exception as e:
        sys.stderr.write(f"Critical Error: {str(e)}")
        sys.exit(1)