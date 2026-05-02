with open("src/app/dashboard/results/page.tsx", "r") as f:
    content = f.read()

print("Searching for mismatched divs...")
# We will just print the context around line 1668.
lines = content.split('\n')
for i in range(max(0, 1668-20), min(len(lines), 1668+20)):
    print(f"{i+1}: {lines[i]}")
