import os
import shutil

# Read the first 1189 lines
with open('C:/institut-gabriel-rita-project/frontend/src/lib/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Backup original
shutil.copy('C:/institut-gabriel-rita-project/frontend/src/lib/translations.ts', 
            'C:/institut-gabriel-rita-project/frontend/src/lib/translations.ts.backup')

# Write truncated version
with open('C:/institut-gabriel-rita-project/frontend/src/lib/translations.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines[:1189])

print("File successfully truncated to 1189 lines")
print(f"Original had {len(lines)} lines")
print(f"New file has 1189 lines")
