import os

target = None
for p in ['frontend/src/App.jsx', 'src/App.jsx', 'App.jsx']:
    if os.path.exists(p):
        target = p
        break

if not target:
    print("Could not find App.jsx")
    exit(1)

with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

# Find the second 'import React' where the clean code starts
second_import = text.find('import React', 20)
if second_import != -1:
    cleaned = text[second_import:]
    with open(target, 'w', encoding='utf-8') as f:
        f.write(cleaned)
    print(f"SUCCESS: Removed top duplicate lines! {target} is now error-free!")
else:
    print("No duplicate import found.")