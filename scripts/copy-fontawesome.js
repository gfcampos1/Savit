const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
    ensureDir(destDir);
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else if (entry.isFile()) {
            copyFile(srcPath, destPath);
        }
    }
}

function main() {
    const root = path.join(__dirname, '..');
    const srcBase = path.join(root, 'node_modules', '@fortawesome', 'fontawesome-free');

    const srcCss = path.join(srcBase, 'css', 'all.min.css');
    const srcWebfonts = path.join(srcBase, 'webfonts');

    const destBase = path.join(root, 'public', 'vendor', 'fontawesome');
    const destCss = path.join(destBase, 'css', 'all.min.css');
    const destWebfonts = path.join(destBase, 'webfonts');

    if (!fs.existsSync(srcCss) || !fs.existsSync(srcWebfonts)) {
        console.error('FontAwesome source not found. Did you run npm install?');
        process.exit(1);
    }

    copyFile(srcCss, destCss);
    copyDir(srcWebfonts, destWebfonts);

    console.log('✅ FontAwesome copied to public/vendor/fontawesome');
}

main();
