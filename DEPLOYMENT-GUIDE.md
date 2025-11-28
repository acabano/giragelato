# Guida Deployment su Aruba Linux Hosting

## 📋 Checklist Pre-Deployment

- [ ] Accesso FTP ad Aruba
- [ ] Nome cartella: `/giragelato`
- [ ] Credenziali EmailJS configurate
- [ ] Node.js e npm installati localmente

## 🔧 Passo 1: Build del Progetto

1. **Apri il terminale** nella cartella del progetto

2. **Esegui il build per il cliente specifico** (es. giragelato):
   ```bash
   node create-release.js giragelato
   ```
   Questo creerà una cartella `release/giragelato` pronta per l'upload.

---

## 📤 Passo 2: Upload su Aruba via FTP

### Struttura File da Caricare:

```
tuodominio.it/
└── giragelato/
    ├── index.html           (da dist/)
    ├── assets/              (da dist/assets/)
    ├── Image/               (cartella locale Image/)
    ├── data/                (cartella locale data/)
    │   ├── config.json
    │   ├── users.json
    │   ├── giocate.json
    │   └── richieste.json
    ├── api/                 (cartella locale api/)
    │   ├── save-config.php
    │   ├── save-users.php
    │   ├── save-plays.php
    │   └── save-requests.php
    └── .htaccess            (file locale .htaccess)
```

### Istruzioni Upload FTP:

1. **Connettiti** al server Aruba via FTP (es. FileZilla)
   - Host: `ftp.tuodominio.it` o IP fornito da Aruba
   - Username: il tuo username Aruba
   - Password: la tua password FTP
   - Porta: 21 (o 22 per SFTP se disponibile)

2. **Naviga** nella cartella pubblica (solitamente `public_html` o `www`)

3. **Crea** la cartella `giragelato`

4. **Carica**:
   - Contenuto di `dist/` → dentro `/giragelato/`
   - Cartella `Image/` → dentro `/giragelato/Image/`
   - Cartella `data/` → dentro `/giragelato/data/`
   - Cartella `api/` → dentro `/giragelato/api/`
   - File `.htaccess` → dentro `/giragelato/.htaccess`

---

## 🔐 Passo 3: Impostare i Permessi

**IMPORTANTE**: I permessi devono essere corretti affinché PHP possa scrivere i file JSON.

### Via FTP (FileZilla o simili):

1. **Cartella `data/`**:
   - Click destro → Permessi file → `755` o `775`
   - ☑️ Applica ricorsivamente ai file

2. **File JSON dentro `data/`**:
   - `config.json` → `664` o `666`
   - `users.json` → `664` o `666`
   - `giocate.json` → `664` o `666`
   - `richieste.json` → `664` o `666`

3. **Script PHP in `api/`**:
   - Tutti i file `.php` → `644`

### Via Pannello Aruba (alternativa):

1. Accedi al **Pannello di Controllo Aruba**
2. Vai su **File Manager**
3. Seleziona la cartella `data`
4. Click su **Permessi** e imposta `775`
5. Ripeti per i file JSON impostando `664`

### Comandi via SSH (se disponibile):

```bash
cd /path/to/giragelato
chmod 775 data
chmod 664 data/*.json
chmod 644 api/*.php
```

---

## ✅ Passo 4: Verifica Funzionamento

### Test Base:

1. **Apri il browser** e vai a:
   ```
   https://tuodominio.it/giragelato/
   ```

2. **Verifica** che l'app si carichi correttamente

### Test Login:

1. Prova a fare login con un utente esistente
2. Username: `admin`
3. Password: `admin123`

### Test Giocate:

1. Login come user normale
2. Fai girare la ruota
3. Verifica che la giocata venga salvata

### Test Backend:

1. Login come admin
2. Vai nella tab **Play Logs**
3. Verifica che le giocate siano visibili

### Test Registrazione:

1. Logout
2. Click su **"Registrati"**
3. Compila il form e invia
4. Login come admin
5. Vai nella tab **"Richieste"**
6. Verifica che la richiesta sia presente
7. Click su **"Create User"**
8. Controlla che l'email arrivi

---

## 🐛 Risoluzione Problemi

### Problema: "500 Internal Server Error"

**Causa**: Errore nel file `.htaccess` o permessi PHP

**Soluzione**:
1. Verifica che `.htaccess` sia stato caricato correttamente
2. Prova a rinominare temporaneamente `.htaccess` in `htaccess.txt`
3. Se il sito funziona, c'è un problema nell'`.htaccess`

### Problema: "Failed to write file"

**Causa**: Permessi cartella `data/` insufficienti

**Soluzione**:
1. Imposta permessi `775` sulla cartella `data/`
2. Imposta permessi `664` o `666` sui file JSON
3. Verifica proprietà file (deve essere il tuo utente Aruba)

### Problema: I JSON non si salvano

**Causa**: PHP non ha permessi di scrittura

**Soluzione**:
1. Via FTP, imposta permessi `666` sui file JSON
2. Se non funziona, contatta supporto Aruba per verificare configurazione PHP

### Problema: "CORS Error" nella console

**Causa**: Configurazione CORS nel PHP

**Soluzione**:
- Gli script PHP già hanno i correct header CORS
- Verifica che gli script siano nella cartella `api/`
- Controlla che i path nei `fetch()` siano corretti

### Problema: L'app non si carica

**Causa**: Path base errato in Vite

**Soluzione**:
1. Verifica che in `vite.config.ts` ci sia: `base: '/giragelato/'`
2. Rifai il build: `npm run build`
3. Ricarica i file su Aruba

---

## 📞 Supporto Aruba

Se hai problemi tecnici con il server:
- **Telefono**: 0575 0505
- **Email**: hosting@aruba.it
- **Documentazione**: https://guide.aruba.it/

---

## 🔄 Aggiornamenti Futuri

Per aggiornare l'applicazione:

1. Modifica il codice localmente
2. Testa con `npm run dev`
3. Fai il build: `npm run build`
4. Carica solo i file modificati via FTP
5. **NON** sovrascrivere la cartella `data/` (contiene i dati live!)

---

## 🎉 Deployment Completato!

Se tutti i test funzionano, il tuo **Wheel of Fortune** è online!

URL Finale: `https://tuodominio.it/giragelato/`
