import os, zipfile

BASE = r"C:\Users\LC\Desktop\SAMSUNG\AppDescription_template\pptx_extracted"
SLIDES = os.path.join(BASE, "ppt", "slides")

def fix_slide(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Slide 3 - Revision History
fix_slide(os.path.join(SLIDES, 'slide3.xml'), [
    ('2012.01.01', '2025.06.27'),
    ('Description for Document', 'Initial release - App Description document'),
    ('Reason for changes', 'First version for Samsung certification'),
    ('Author_name', 'Fusion Streaming'),
])

# Slide 8 - Usage Scenario: fix concatenated text
fix_slide(os.path.join(SLIDES, 'slide8.xml'), [
    ('Step 2: Enter a valid stream URL (HLS, DASH or MP4) using the TV remote. Step 3: Press OK/Play on the remote to start playback.Step 4: Video plays in full-screen. Use remote to pause/seek/volume. Press BACK to return.',
     'Step 2: Enter a valid stream URL (HLS, DASH or MP4) using the TV remote.'),
    ('Testers will refer the scenario and it will be very helpful to test.', 
     'Step 3: Press OK/Play to start. Video plays full-screen. Press BACK to return to URL input.'),
])

# Slide 10 - Menu & function: replace sample subtitle
fix_slide(os.path.join(SLIDES, 'slide10.xml'), [
    ('Menu&amp; function description with screen shot(sample)',
     'Main Screen: URL input field + Play button | Player Screen: full-screen video + remote controls'),
    ('- Home', '- Main Screen'),
])

print("Slides fixed. Repacking...")

out = r"C:\Users\LC\Desktop\SAMSUNG\AppDescription_template\FusionStreamPlayer_AppDescription.pptx"
if os.path.exists(out):
    os.remove(out)

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root_dir, dirs, files in os.walk(BASE):
        for file in files:
            full = os.path.join(root_dir, file)
            arc = os.path.relpath(full, BASE)
            zf.write(full, arc)

kb = round(os.path.getsize(out)/1024, 1)
print(f"Arquivo gerado: {out} ({kb} KB)")
print()
print("ACAO MANUAL NECESSARIA no PowerPoint:")
print("- Deletar slide 1 (Guide)")
print("- Deletar slide 6 (UI sample flow graph)")
print("- Deletar slide 7 (UI sample depth navi)")
print("- Deletar slide 9 (Usage Scenario sample com diagrama de login)")
print("- Slide 10: substituir [IMAGE] por print do seu app (opcional)")
