with open("src/app/dashboard/results/page.tsx", "r") as f:
    text = f.read()

def check_balance(t):
    stack = []
    # simplified just to find the extra closing tag or missing tag
    # actually, next build failed at 1668
    return "Check complete."

# Let's just find the closing tags at the end of the modal
lines = text.split('\n')
for i, line in enumerate(lines):
    if "Contextual Workflow Guide" in line:
        print("Lines before Contextual Workflow Guide:")
        for j in range(max(0, i-10), i):
            print(f"{j+1}: {lines[j]}")
        break
