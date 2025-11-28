# PERMESSI FILE - ISTRUZIONI IMPORTANTI

## ⚠️ ATTENZIONE - PERMESSI RICHIESTI

Affinché l'applicazione funzioni correttamente su Aruba, i seguenti permessi DEVONO essere impostati:

### 📁 Cartella `data/`
```
Permessi: 775 (rwxrwxr-x)
```
- Consente a PHP di creare e modificare file

### 📄 File JSON in `data/`
```
config.json      → 664 (rw-rw-r--)
users.json       → 664 (rw-rw-r--)
giocate.json     → 664 (rw-rw-r--)
richieste.json   → 664 (rw-rw-r--)
```
- Consente a PHP di leggere e scrivere

### 🔧 Script PHP in `api/`
```
save-config.php    → 644 (rw-r--r--)
save-users.php     → 644 (rw-r--r--)
save-plays.php     → 644 (rw-r--r--)
save-requests.php  → 644 (rw-r--r--)
```
- Eseguibili dal server, non modificabili dall'esterno

## 🛠️ Come impostare i permessi via FTP

### FileZilla / Client FTP:
1. Click destro sul file/cartella
2. "Permessi file..." o "File attributes"
3. Inserisci il valore numerico (es. 775)
4. OK

### Pannello Aruba:
1. Accedi al Pannello di Controllo
2. File Manager
3. Seleziona file/cartella
4. Click su "Permessi"
5. Imposta i valori corretti

## ❌ ERRORI COMUNI

### "Failed to write file"
➡️ La cartella `data/` non ha permessi 775

### "Permission denied"
➡️ I file JSON non hanno permessi 664

### "500 Internal Server Error" 
➡️ Gli script PHP potrebbero avere permessi errati

## ✅ VERIFICA PERMESSI

Dopo aver caricato i file, verifica che:
- [ ] La cartella `data/` abbia permessi 775
- [ ] Tutti i `.json` abbiano permessi 664
- [ ] Tutti i `.php` abbiano permessi 644

## 🔐 SICUREZZA

Il file `.htaccess` protegge i JSON da accesso diretto via browser.
Solo gli script PHP possono leggerli e modificarli.

**NON** impostare permessi 777 - è un rischio di sicurezza!
