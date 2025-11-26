import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const releaseDir = path.join(__dirname, 'release');
const distDir = path.join(__dirname, 'dist');
const apiDir = path.join(__dirname, 'api');
const dataDir = path.join(__dirname, 'data');
const imageDir = path.join(__dirname, 'Image');

console.log('🚀 Starting release build...');

// Helper functions
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function removeSync(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function copySync(src, dest) {
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
        ensureDirSync(dest);
        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                copySync(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    } else {
        ensureDirSync(path.dirname(dest));
        fs.copyFileSync(src, dest);
    }
}

// Step 1: Clean release directory
console.log('🧹 Cleaning release directory...');
removeSync(releaseDir);
ensureDirSync(releaseDir);

// Step 2: Build the frontend (Vite)
console.log('🔨 Building frontend with Vite...');
execSync('npm run build', { stdio: 'inherit' });

// Step 3: Copy frontend build files
console.log('📦 Copying frontend build files...');
copySync(distDir, releaseDir);

// Step 4: Copy API backend files
console.log('📡 Copying API backend files...');
const apiReleaseDir = path.join(releaseDir, 'api');
ensureDirSync(apiReleaseDir);
copySync(apiDir, apiReleaseDir);

// Step 5: Copy Image folder (only PNG files)
console.log('🖼️ Copying Image folder (PNG files only)...');
const imageReleaseDir = path.join(releaseDir, 'Image');
ensureDirSync(imageReleaseDir);
const imageFiles = fs.readdirSync(imageDir).filter(file => file.endsWith('.png'));
imageFiles.forEach(file => {
    fs.copyFileSync(path.join(imageDir, file), path.join(imageReleaseDir, file));
});

// Step 6: Copy .htaccess
console.log('📄 Copying .htaccess...');
fs.copyFileSync(path.join(__dirname, '.htaccess'), path.join(releaseDir, '.htaccess'));

// Step 7: Setup data directory
console.log('📂 Setting up data directory...');
const dataReleaseDir = path.join(releaseDir, 'data');
ensureDirSync(dataReleaseDir);

// Copy all JSON files from source data directory, except the ones we'll create defaults for
const sourceDataFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
const excludeFiles = ['config.json', 'giocate.json', 'richieste.json'];

sourceDataFiles.forEach(file => {
    if (file.endsWith('.json') && !excludeFiles.includes(file)) {
        console.log(`  Copying ${file}...`);
        fs.copyFileSync(
            path.join(dataDir, file),
            path.join(dataReleaseDir, file)
        );
    }
});

// Create default config.json
const defaultConfig = {
    nomeDellaRuota: "Gira Gelato",
    numeroSpicchi: 8,
    tema: "Gelato",
    numeroVinciteGiornaliere: 1,
    numeroGiocate: 1,
    premi: [
        { premio: "Cono Gelato", vincita: true, valore: 100 },
        { premio: "Foglia Secca", vincita: false, valore: 0 },
        { premio: "Panna Montata", vincita: true, valore: 50 },
        { premio: "Cono Rotto", vincita: false, valore: 0 },
        { premio: "Pinguinatura", vincita: true, valore: 200 },
        { premio: "Sasso Comune", vincita: false, valore: 0 },
        { premio: "Bisquit", vincita: true, valore: 150 },
        { premio: "Pigna", vincita: false, valore: 0 }
    ],
    active: true,
    adminEmail: "",
    winningPercentage: 5,
    emailProvider: "emailjs"
};

fs.writeFileSync(
    path.join(dataReleaseDir, 'config.json'),
    JSON.stringify(defaultConfig, null, 4),
    'utf-8'
);
console.log('  Created default config.json');

// Create default giocate.json (empty array)
fs.writeFileSync(
    path.join(dataReleaseDir, 'giocate.json'),
    JSON.stringify([], null, 4),
    'utf-8'
);
console.log('  Created empty giocate.json');

// Create default richieste.json (empty array)
fs.writeFileSync(
    path.join(dataReleaseDir, 'richieste.json'),
    JSON.stringify([], null, 4),
    'utf-8'
);
console.log('  Created empty richieste.json');

// Create default users.json only if no users_*.json file exists in source
const hasUserFile = sourceDataFiles.some(file => file.match(/^users.*\.json$/));
if (!hasUserFile) {
    const defaultUsers = [
        {
            user: "admin",
            password: "admin",
            role: "admin",
            history: []
        },
        {
            user: "testuser",
            password: "password123",
            role: "user",
            history: []
        }
    ];

    fs.writeFileSync(
        path.join(dataReleaseDir, 'users.json'),
        JSON.stringify(defaultUsers, null, 4),
        'utf-8'
    );
    console.log('  Created default users.json');
} else {
    console.log('  User file already copied from source data directory');
}

console.log('✅ Release build complete!');
console.log(`📦 Release files are in: ${releaseDir}`);
console.log('\n📋 Deployment checklist:');
console.log('  1. Upload all files from ./release to your web server');
console.log('  2. Ensure the data/ directory is writable by the web server');
console.log('  3. Check that .htaccess rules are working (test JSON access)');
console.log('  4. Test the application and verify all features work');
console.log('  5. Change default admin password immediately!');
