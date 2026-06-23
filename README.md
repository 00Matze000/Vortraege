# Vorträge — Angewandte Modellierung und Systemsimulation

Das Abschlussprojekt und die Lightning-Talks (≈ 5 Minuten) aus dem Modul *Angewandte Modellierung und Systemsimulation* an der BTU Cottbus-Senftenberg, Sommersemester 2026.

**Live ansehen:** [00Matze000.github.io/Vortraege](https://00Matze000.github.io/Vortraege/)

## Abschlussprojekt

| Titel | Pfad |
|---|---|
| Den Wald von oben zählen — Eine Multi-Backend-Pipeline zur Baumerkennung aus Drohnenbildern | [`Endprojekt/`](Endprojekt/) |

## Vorträge

| # | Titel | Datum | Pfad |
|---|---|---|---|
| 01 | Keras 3 als Game-Changer | April 2026 | [`Vortrag1/`](Vortrag1/) |
| 02 | Zustandslos skalieren — Keras zu Flax | Mai 2026 | [`Vortrag2/`](Vortrag2/) |

## Struktur

```
.
├── index.html        Landing-Page mit Auswahl
├── Endprojekt/       Den Wald von oben zählen — Baumerkennung aus Drohnenbildern
├── Vortrag1/         Keras 3 — TensorFlow · PyTorch · JAX
└── Vortrag2/         Zustandslos skalieren — JAX · Flax · PRNGKey
```

Jeder Beitrag ist eine eigenständige scroll-basierte HTML-Seite mit eigenem CSS und JS. Keine Build-Schritte, einfach im Browser öffnen.

## Stack

- Vanilla HTML / CSS / JavaScript
- [Three.js](https://threejs.org/) für 3D-Visualisierungen (Hardware-Modelle in Vortrag 1, Loss-Landschaften in Vortrag 2, Pipeline-Szene im Endprojekt)
- DM Serif Display · DM Sans · JetBrains Mono via Google Fonts

## Deployment

GitHub Pages aus dem `main`-Branch. Änderungen gehen nach Push automatisch live.
