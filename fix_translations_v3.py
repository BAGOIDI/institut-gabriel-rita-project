# Read the file
with open('C:/institut-gabriel-rita-project/frontend/src/lib/translations.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find where to cut - right after "errorLoadingData" and before the duplicate content
cut_index = None
for i, line in enumerate(lines):
    if "errorLoadingData: 'Error loading data'" in line and i > 1100:
        # Find the closing brace of this section
        for j in range(i+1, min(i+5, len(lines))):
            if '},' in lines[j] or '}' in lines[j]:
                cut_index = j + 1  # Include the closing brace
                break
        break

if cut_index:
    print(f"Found cut point at line {cut_index}")
    # Keep only up to the first complete section
    with open('C:/institut-gabriel-rita-project/frontend/src/lib/translations.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines[:cut_index])
    print(f"File truncated to {cut_index} lines")
else:
    print("Could not find cut point")
