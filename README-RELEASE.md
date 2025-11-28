# Guida al Rilascio Multi-Cliente

Questo progetto è configurato per generare build specifiche per ogni cliente/sottocartella.

## Come creare una release

Per creare una versione del sito da caricare in una specifica sottocartella (es. `stellamarina`), usa il comando:

```bash
node create-release.js <nome_cartella>
```

Esempio:
```bash
node create-release.js stellamarina
```

Oppure usando npm:
```bash
npm run release -- stellamarina
```

## Cosa succede?

1. Lo script imposta la `base` di Vite su `/<nome_cartella>/`.
2. Compila il progetto React ottimizzato per quel percorso.
3. Crea una cartella `release/<nome_cartella>`.
4. Copia tutti i file necessari (backend PHP, immagini, configurazioni di default).

## Deployment

1. Prendi il **contenuto** della cartella `release/<nome_cartella>`.
2. Caricalo sul server nella cartella corrispondente (es. `public_html/stellamarina`).
3. Assicurati che la cartella `data/` sul server abbia i permessi di scrittura (777 o 775).

## Note Importanti

- **Non modificare** manualmente i percorsi in `vite.config.ts`. Lo script lo fa automaticamente.
- Se devi aggiornare il sito per un altro cliente (es. `giragelato`), basta lanciare:
  `node create-release.js giragelato`
