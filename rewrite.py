with open("src/app/dashboard/results/page.tsx", "r") as f:
    text = f.read()

text = text.replace('}, [selectedResult, pipelineData, selectedIndex]);', '}, [selectedResult]);')

with open("src/app/dashboard/results/page.tsx", "w") as f:
    f.write(text)
