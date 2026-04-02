with open('C:/institut-gabriel-rita-project/frontend/src/lib/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('C:/institut-gabriel-rita-project/frontend/src/lib/translations_fixed.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines[:1189])

print("File truncated successfully to 1189 lines")
