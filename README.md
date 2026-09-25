# Alien RPG Crew

Private Web-App (PWA) für ALIEN RPG (Evolved Edition): Charakterbögen für PCs und NPCs, Würfeln mit Basis- und Stresswürfeln, Pushen, Stress Response und eine Übersicht über Stress und Health aller Figuren.

Alle Daten bleiben lokal im Browser des Geräts. Backups gehen über **Daten → Backup exportieren**.

## Auf dem Android-Handy installieren

1. GitHub Pages aktivieren: *Settings → Pages → Build and deployment → Source: Deploy from a branch*, Branch auswählen, Ordner `/ (root)`.
2. Die angezeigte Adresse (`https://<user>.github.io/Alien-RPG/`) in Chrome öffnen.
3. Menü ⋮ → **Zum Startbildschirm hinzufügen** bzw. **App installieren**.

## Lokal starten

```sh
npx http-server -c-1 .
```

## Tests

```sh
npm test
```

## Umgesetzte Regeln

- Basiswürfel = Attribut + Skill (+ Modifikatoren), mindestens 1. Stresswürfel = Stress Level.
- 6 = Erfolg. 1 auf einem Stresswürfel löst eine Stress Response aus.
- Pushen: einmal, nicht nach einer 1 auf Stresswürfeln, nicht wenn Deflated, nie bei NPCs. Stress +1 (Jumpy: +2), entsprechend mehr Stresswürfel, alle Würfel ohne 6 werden neu gewürfelt.
- Stress Response: D6 + Stress Level − Resolve. Eine bereits aktive Response gibt stattdessen +1 Stress. Mess Up (7+): Aktion scheitert, +1 Stress. Deflated entfernt Jumpy.
- Tunnel Vision / Aggravated / Shakes / Frantic ziehen automatisch 2 Würfel bei Würfen auf Wits / Empathy / Agility / Strength ab.
