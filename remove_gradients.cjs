const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFiles() {
    const srcDir = path.join(__dirname, 'src');
    let count = 0;

    walkDir(srcDir, (filePath) => {
        if (filePath.endsWith('.css') || filePath.endsWith('.jsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;

            // Ensure we remove var(--neon-secondary) from gradients
            content = content.replace(/linear-gradient\([^)]*var\(--neon-secondary\)[^)]*\)/g, 'linear-gradient(135deg, var(--accent), var(--accent-hover))');
            content = content.replace(/linear-gradient\([^)]*#f472b6[^)]*\)/g, 'linear-gradient(135deg, var(--accent), var(--accent-hover))');
            content = content.replace(/linear-gradient\([^)]*#22D3EE[^)]*\)/g, 'linear-gradient(135deg, var(--accent), var(--accent-hover))');
            content = content.replace(/linear-gradient\([^)]*#fbbf24[^)]*\)/g, 'linear-gradient(135deg, var(--accent), var(--accent-hover))');

            // Also catch cases where they might just use var(--neon-secondary) directly as a color
            content = content.replace(/var\(--neon-secondary\)/g, 'var(--accent)');
            content = content.replace(/var\(--neon-primary\)/g, 'var(--accent)');

            // Specific gradient replacements
            content = content.replace(/linear-gradient\(90deg, transparent, rgba\(168, 85, 247, 0\.5\), transparent\)/g, 'linear-gradient(90deg, transparent, var(--accent), transparent)');
            content = content.replace(/linear-gradient\(135deg, var\(--accent\) 0%, #fbbf24 100%\)/g, 'var(--accent)');
            content = content.replace(/linear-gradient\(135deg, #fb923c, #f97316\)/g, 'var(--accent)');
            content = content.replace(/linear-gradient\(135deg, #ef4444 0%, #f97316 100%\)/g, 'var(--accent)');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                count++;
                console.log(`Updated gradients in: ${filePath}`);
            }
        }
    });

    console.log(`Finished processing. Updated ${count} files.`);
}

processFiles();
