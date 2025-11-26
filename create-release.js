const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Directories
const releaseDir = './release';
const distDir = './dist';
const apiDir = './api';
const dataDir = './data';
const imageDir = './Image';

console.log('🚀 Starting release build...');

// Step 1: Clean release directory
console.log('🧹 Cleaning release directory...');
if (fs.existsSync(releaseDir)) {
    fs.removeSync(releaseDir);
}
fs.ensureDirSync(releaseDir);

// Step 2: Build the frontend (Vite)
console.log('🔨 Building frontend with Vite...');
execSync('npm run build', { stdio: 'inherit' });

// Step 3: Copy frontend build files
console.log('📦 Copying frontend build files...');
fs.copySync(distDir, releaseDir, { overwrite: true });

// Step 4: Copy API backend files
console.log('📡 Copying API backend files...');
const apiReleaseDir = path.join(releaseDir, 'api');
fs.ensureDirSync(apiReleaseDir);
fs.copySync(apiDir, apiReleaseDir, { overwrite: true });

// Step 5: Copy Image folder (only PNG files)
console.log('🖼️ Copying Image folder (PNG files only)...');
const imageReleaseDir = path.join(releaseDir, 'Image');
fs.ensureDirSync(imageReleaseDir);
const imageFiles = fs.readdirSync(imageDir).filter(file => file.endsWith('.png'));
imageFiles.forEach(file => {
    fs.copySync(path.join(imageDir, file), path.join(imageReleaseDir, file), { overwrite: true });
});

// Step 6: Copy .htaccess
console.log('📄 Copying .htaccess...');
fs.copySync('./.htaccess', path.join(releaseDir, '.htaccess'), { overwrite: true });

// Step 7: Setup data directory
console.log('📂 Setting up data directory...');
const dataReleaseDir = path.join(releaseDir, 'data');
fs.ensureDirSync(dataReleaseDir);

// Copy all JSON files from source data directory, except the ones we'll create defaults for
const sourceDataFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
const excludeFiles = ['config.json', 'giocate.json', 'richieste.json'];

sourceDataFiles.forEach(file => {
    if (file.endsWith('.json') && !excludeFiles.includes(file)) {
        console.log(`  Copying ${file}...`);
        fs.copySync(
            path.join(dataDir, file),
            path.join(dataReleaseDir, file),
            { overwrite: true }
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
