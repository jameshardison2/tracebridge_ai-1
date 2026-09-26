const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function extractDocx(filePath, outputName) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        fs.writeFileSync(path.join(__dirname, outputName), result.value);
        console.log(`Saved ${outputName}`);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
    }
}

async function main() {
    await extractDocx('/Users/176693/Documents/TraceBridge AI/Design Docs/TraceBridge_Design_Document.docx', 'design.md');
    await extractDocx('/Users/176693/Documents/TraceBridge AI/Design Docs/TraceBridge_RD_Log.docx', 'rd_log.md');
    await extractDocx('/Users/176693/Documents/TraceBridge AI/Design Docs/TraceBridge_Requirements_Document.docx', 'requirements.md');
}

main();
