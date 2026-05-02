with open("src/app/dashboard/results/page.tsx", "r") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* Contextual Workflow Guide */}" in line:
        start_idx = i
    if "                            </div>" in line and lines[i+1].strip() == "</div>" and lines[i+2].strip() == "</div>":
        # Let's find where the modal footer ends
        pass

for i in range(start_idx, len(lines)):
    if "                        </div>" in lines[i] and "                    </div>" in lines[i+1] and "                </div>" in lines[i+2]:
        end_idx = i
        break

print(f"Start: {start_idx+1}, End: {end_idx+1}")
