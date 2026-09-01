from pathlib import Path

path = Path(__file__).with_name("EditorSidebar.jsx")
text = path.read_text(encoding="utf-8")
start = text.find("const __REMOVE_FRAMES_LEFTOVER__")
end = text.find("const TextPanel")
if start == -1 or end == -1 or end <= start:
    raise SystemExit(f"markers not found start={start} end={end}")
path.write_text(text[:start] + text[end:], encoding="utf-8")
print(f"removed {end - start} chars")
