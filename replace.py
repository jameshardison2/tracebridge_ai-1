import sys

with open("src/app/dashboard/results/page.tsx", "r") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "className=\"grid grid-cols-1 md:grid-cols-4 gap-6 p-6 min-h-[500px]\"" in line:
        start_idx = i
    if "</div>" in line and "Contextual Workflow Guide" in lines[i+2] if i+2 < len(lines) else False:
        end_idx = i

print(f"Start: {start_idx}, End: {end_idx}")
