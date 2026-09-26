// Regel-Nachschlagewerk nach Kategorien (Quelle: eigenes Regel-Cheatsheet zur
// ALIEN RPG Evolved Edition, in eigenen Worten). Im Zweifel gilt das Regelbuch.

const table = (rows) => `<table class="rt">${rows.map(([n, t, cls = '']) => `<tr class="${cls}"><td class="n">${n}</td><td>${t}</td></tr>`).join('')}</table>`;

export const RULES = [
  {
    key: 'wuerfeln',
    title: 'Skill Rolls',
    topics: [
      { title: 'The Skill Roll', html: `
        <p><b>Base Dice</b> = Attribut + Skill, angepasst um Schwierigkeit, Ausrüstung und Hilfe. Dazu <b>Stress Dice</b> in Höhe des Stress Levels.</p>
        <ul>
          <li>Jede <b>6</b> ist ein Success, auch auf Stress Dice.</li>
          <li>Modifikatoren ändern nur Base Dice, nie Stress Dice. Minimum: 1 Base Dice.</li>
          <li>Eine <b>1 auf einem Stress Die</b> löst eine Stress Response aus.</li>
          <li>Ohne Skill: nur das Attribut würfeln (plus Stress Dice).</li>
          <li>Das Attribut darf getauscht werden, wenn es passt (z. B. Strength + Manipulation zum Einschüchtern).</li>
        </ul>` },
      { title: 'Help', html: `
        <p>Bis zu 3 Helfer, je <b>+1 Dice</b> (max. +3). Sie müssen die Aktion konkret unterstützen können. Im Kampf kostet Helfen die volle Aktion.</p>` },
      { title: 'Pushing Your Roll', html: `
        <p>Einmal pro Wurf: <b>Stress Level +1</b> (Jumpy: +2), dann alle Würfel ohne 6 neu werfen. Der neue Stress Die kommt dazu, die bisherigen 6er bleiben.</p>
        <ul>
          <li><b>Kein Push</b>, wenn im ersten Wurf schon eine 1 auf einem Stress Die lag.</li>
          <li>Kein Push, wenn Deflated.</li>
          <li>NPCs, Synthetics und Xenomorphs pushen nie.</li>
        </ul>` },
      { title: 'Extra Successes', html: `
        <p>Pro zusätzlicher 6 eine passende Wirkung wählen:</p>
        <ul><li>+1 Schaden (mehrfach wählbar)</li><li>du beeindruckst jemanden</li><li>es geht schneller</li><li>es geht leiser</li><li>ein unerwarteter Zusatzeffekt</li></ul>` },
      { title: 'Difficulty', html: `
        <p>Es gibt <b>keine benannten Schwierigkeitsstufen</b> mehr. Regelbuch und Abenteuer geben situative Modifikatoren vor (z. B. Fernkampf-Tabelle), sonst legt der GM +/− Dice fest.</p>` },
      { title: 'Passive Rolls', html: `
        <p>Die GM kann Würfe verlangen, von denen du nichts weißt (meist Observation im Stealth). Sie können nicht gepusht werden und lösen keine Stress Response aus. Stress Dice kommen trotzdem dazu.</p>` },
    ],
  },
  {
    key: 'charakter',
    title: 'Characters',
    topics: [
      { title: 'Derived Values', html: `
        <p><b>Health</b> = (Strength + Agility) ÷ 2, aufgerundet.</p>
        <p><b>Resolve</b> = (Wits + Empathy) ÷ 2, aufgerundet. Senkt Stress- und Panikwürfe.</p>
        <p><b>Max. Encumbrance</b> = Strength × 2.</p>
        <p class="hint">Das Talent Hardened kann die Werte erhöhen.</p>` },
      { title: 'The 12 Skills', html: `
        ${table([
          ['STR', 'Close Combat, Heavy Machinery, Stamina'],
          ['AGI', 'Mobility, Piloting, Ranged Combat'],
          ['WIT', 'Comtech, Observation, Survival'],
          ['EMP', 'Command, Manipulation, Medical Aid'],
        ])}
        <p>Skill-Stufen gehen von 0 bis 5.</p>` },
    ],
  },
  {
    key: 'stress',
    title: 'Stress',
    topics: [
      { title: 'Gaining Stress', html: `
        <ul>
          <li>+1 beim Pushen (+2, wenn Jumpy)</li>
          <li>+1 bei Mess Up oder Spooked</li>
          <li>+1 bei doppelter Stress Response</li>
          <li>+1 für den 2. und 3. Wurf einer Vollauto-Salve</li>
          <li>+1 wenn du durch Fatigue Schaden nimmst, bei Gnadenstoß oder Angriff durch die eigene Crew, wenn ein getarnter Synthetic entdeckt wird, sowie laut Szenario/GM</li>
        </ul>` },
      { title: 'Stress Response: D6 + Stress Level − Resolve', html: `
        <p>Ausgelöst durch <b>eine 1 auf einem Stress Die</b>. Responses bleiben, bis Stress abgebaut wird. Hast du sie schon: stattdessen Stress +1.</p>
        ${table([
          ['≤0', '<b>Keeping Cool</b>: keine Wirkung.'],
          ['1', '<b>Jumpy</b>: Pushen kostet +2 Stress statt +1.', 'r1'],
          ['2', '<b>Tunnel Vision</b>: −2 Dice auf alle Wits-Würfe.', 'r1'],
          ['3', '<b>Aggravated</b>: −2 Dice auf alle Empathy-Würfe.', 'r1'],
          ['4', '<b>Shakes</b>: −2 Dice auf alle Agility-Würfe.', 'r1'],
          ['5', '<b>Frantic</b>: −2 Dice auf alle Strength-Würfe.', 'r2'],
          ['6', '<b>Deflated</b>: kein Pushen mehr; hebt Jumpy auf und blockiert es.', 'r2'],
          ['7+', '<b>Mess Up</b>: die Handlung scheitert trotz Erfolgen, Stress +1.', 'r3'],
        ])}` },
      { title: 'Relieving Stress', html: `
        <p>Pro Stretch Ruhe an einem sicheren Ort sinkt das Stress Level um <b>1</b> (Talent Banter: 2, für dich und alle in Short Range). Eine Unterbrechung setzt den Fortschritt nicht zurück, verlängert aber ggf. die Zeit.</p>
        <p>Mit dem Stress verschwinden auch die Stress Responses.</p>` },
    ],
  },
  {
    key: 'panik',
    title: 'Panic',
    topics: [
      { title: 'When to Roll for Panic', html: `
        <ul>
          <li>Du siehst, wie ein anderer PC Broken wird.</li>
          <li>Du siehst einen furchteinflößenden Xenomorph zum ersten Mal.</li>
          <li>Ein solcher kommt dir auf Adjacent nahe (auch wenn schon bekannt).</li>
          <li>Du wirst Zeuge bestimmter Panic Responses anderer (Scream, Frenzy).</li>
          <li>Laut Abenteuer/GM bei einem wirklich schlimmen Moment.</li>
        </ul>
        <p>Eine 1 auf dem Stress Die löst <b>keine</b> Panik aus. Broken-Charaktere würfeln nicht auf Panik.</p>` },
      { title: 'Panic Response: D6 + Stress Level − Resolve', html: table([
        ['≤0', '<b>Keeping Cool</b>: keine Wirkung.'],
        ['1', '<b>Spooked</b>: Stress +1.', 'r1'],
        ['2', '<b>Noisy</b>: Gegner in der Nähe bemerken dich automatisch.', 'r1'],
        ['3', '<b>Twitchy</b>: sofort Supply Roll für Luft, Munition oder Energie (GM wählt).', 'r1'],
        ['4', '<b>Lose Item</b>: Waffe oder wichtiger Gegenstand weg. Im Kampf per Quick Action aufheben, sonst Observation-Wurf und Zeit.', 'r1'],
        ['5', '<b>Paranoid</b>: weder helfen noch Hilfe annehmen, bis die Panik endet.', 'r1'],
        ['6', '<b>Hesitant</b>: automatisch Initiative 10, bis die Panik endet.', 'r2'],
        ['7', '<b>Freeze</b>: nächster Zug verloren, bis dahin keine Interrupts.', 'r2'],
        ['8', '<b>Seek Cover</b>: sofort volle Deckung (Interrupt), Stress −1, nächster Zug verloren. In offener Zone: Scream.', 'r2'],
        ['9', '<b>Scream</b>: nächster Zug verloren, Stress −1; befreundete PCs in der Zone würfeln auf Panik.', 'r2'],
        ['10', '<b>Flee</b>: sofort in Nachbarzone (Interrupt), Stress −1, Verbündete in der Startzone Stress +1. Weiter fliehen bis an einen sicheren Ort. Kein Ausweg: Catatonic.', 'r3'],
        ['11', '<b>Frenzy</b>: greift sofort die nächste Person/Kreatur an, egal ob Freund. Befreundete PCs in der Zone würfeln auf Panik. Bis einer Broken ist oder die Panik endet.', 'r3'],
        ['12+', '<b>Catatonic</b>: bricht zusammen, kann sich nicht bewegen, bis die Panik endet.', 'r3'],
      ]) },
      { title: 'Ending Panic & Multiple Panic', html: `
        <p><b>Panik endet</b> (falls nicht schon „bis nächster Zug“), wenn jemand in Hör-/Funkreichweite einen <b>Command</b>-Wurf schafft (im Kampf volle Aktion), du Broken wirst, oder ein Stretch vergeht.</p>
        <p><b>Mehrfach-Panik:</b> Kommt eine weitere Panic Response dazu, gelten beide, wenn möglich; sonst zählt die stärkere. Würfelst du dieselbe Response erneut, nimm die nächsthöhere.</p>` },
      { title: 'Mental Trauma', html: `
        <p>Nach einer Sitzung mit einem Panikwurf von <b>9 oder mehr</b>: reiner Empathy-Wurf (kein Push). Bei Fehlschlag D66 auf die Trauma-Tabelle. Nur in Shore-Leave-Phasen heilbar.</p>` },
    ],
  },
  {
    key: 'zeit',
    title: 'Time, Zones & Stealth',
    topics: [
      { title: 'Time', html: table([
        ['Round', '5–10 Sekunden · Kampf'],
        ['Stretch', '5–10 Minuten · Stealth, Luftvorrat'],
        ['Shift', '5–10 Stunden · Reparatur, Erholung'],
      ]) },
      { title: 'Range', html: table([
        ['Adjacent', 'direkt dran'],
        ['Short', 'gleiche Zone'],
        ['Medium', 'Nachbarzone'],
        ['Long', 'bis vier Zonen'],
        ['Extreme', 'weiter weg'],
      ]) },
      { title: 'Zones', html: `
        <p><b>Cluttered</b>: Deckung vorhanden. <b>Open</b>: keine Deckung (Gänge, Schächte, leere Räume).</p>
        <p>Grenzen sind <b>offen</b> oder <b>blockiert</b> (Wand, Schott). Blockierte nur per Tür/Luke passierbar; sie blockieren die Sicht, außer man steht direkt an der Öffnung.</p>` },
      { title: 'Stealth Mode', html: `
        <ol>
          <li>PCs bewegen sich <b>eine Zone</b>. Sichtlinie zu einem NPC: offener, vergleichender Observation-Wurf (passiv). Bei Gruppen zählt der beste Wurf.</li>
          <li>NPCs ziehen eine Zone auf der verdeckten GM-Karte, Xenomorphs eine Zone pro Punkt Speed. Sichtlinie: Wurf wie oben.</li>
          <li>Neuer Stretch, wieder erst PCs, dann NPCs.</li>
        </ol>
        <p><b>Gewinner</b> darf aus dem Hinterhalt angreifen, sich verstecken, sich zeigen oder sich zurückziehen. Gleichstand: Initiative, Kampf.</p>
        <p class="hint">Der Observation-Wurf ist keine Aktion und wird nicht gepusht.</p>` },
      { title: 'Ambush', html: `
        <p>Wer aus dem Hinterhalt angreift, handelt in der ersten Runde zuerst und bekommt <b>+2 Dice</b> auf den ersten Angriff. Nahkampf gegen ahnungslose Ziele: +2 Dice.</p>` },
    ],
  },
  {
    key: 'kampf',
    title: 'Combat',
    topics: [
      { title: 'Rounds & Initiative', html: `
        <p>Initiativekarten 1–10, niedrigste zuerst; jede Runde neu gezogen (optional nur in Runde 1). NPC-Gruppen können eine gemeinsame Karte ziehen.</p>
        <p>Pro Zug: <b>1 Full + 1 Quick</b> oder <b>2 Quick</b>.</p>
        <p><b>Interrupt-Aktionen</b> (Abwehren, Ausweichen) laufen außerhalb der Reihenfolge und verbrauchen eine Quick Action.</p>` },
      { title: 'Full Actions', html: table([
        ['Nahkampfangriff', 'Close Combat'],
        ['Fernkampfangriff', 'Ranged Combat'],
        ['Springen, klettern', 'Mobility'],
        ['Volle Deckung nehmen', '–'],
        ['Terminal bedienen', 'Comtech'],
        ['Maschinen, Ladehemmung', 'Heavy Machinery'],
        ['Erste Hilfe', 'Medical Aid'],
        ['Überreden', 'Manipulation'],
        ['Befehle geben', 'Command'],
        ['Fahrzeug steuern', 'Piloting'],
      ]) },
      { title: 'Quick Actions', html: `
        <ul>
          <li>in Nachbarzone bewegen</li><li>zwischen Short und Adjacent wechseln</li>
          <li>an Tür/Luke gehen und durchspähen</li><li>Tür/Luke verriegeln</li>
          <li>teilweise Deckung nehmen</li><li>Nahkampfangriff abwehren (Interrupt)</li>
          <li>zielen</li><li>Fernkampfangriff ausweichen (Interrupt)</li>
          <li>nachladen</li><li>Gegenstand vom Boden aufheben</li>
          <li>Broken-Charakter wieder aufrichten (Rally)</li>
        </ul>` },
      { title: 'Close Combat', html: `
        <p>Angriff auf Adjacent, Full Action, Close Combat. Treffer: Grundschaden der Waffe <b>+1 pro weiterer 6</b>. Unbewaffnet: Schaden 1.</p>
        <p><b>Abwehren</b>: Quick Action (Interrupt), vorher ansagen; wird zum vergleichenden Close-Combat-Wurf.</p>
        <p><b>Sonderangriffe</b> statt Schaden: entwaffnen, vorbeikommen, wegstoßen, packen. Auch Xenomorphs lassen sich packen.</p>
        <p>Schusswaffe im Nahkampf: Close Combat, meist −2 Dice.</p>` },
      { title: 'Ranged Combat', html: `${table([
        ['+2', 'Zielen (Quick Action)'],
        ['−2', 'je Stufe unter Mindestreichweite'],
        ['−2', 'Ziel in teilweiser Deckung'],
        ['−2', 'auf Schwachstelle zielen'],
        ['−2', 'kleines Ziel (Facehugger etc.)'],
        ['+2', 'gefesseltes/ahnungsloses Ziel'],
      ])}
        <p>Über die Maximalreichweite kein Schuss. <b>Ausweichen</b>: Quick Action (Interrupt), nur wenn du den Angreifer bemerkt hast. <b>Dunkelheit</b>: −2 Dice auf Observation (nicht auf den Angriff); eine Taschenlampe hebt das auf.</p>` },
      { title: 'Cover', html: `
        <p><b>Teilweise</b> (Quick Action): Angriffe gegen dich −2 Dice, du kannst weiter ausweichen.</p>
        <p><b>Volle</b> (Full Action): bricht die Sichtlinie, Angriffe gegen dich −3 Dice, kein Ausweichen. Trifft der Schuss, sinkt der Schaden zusätzlich um den Armor-Wert der Barriere. <b>Breach Limit</b>: ist die Barriere stärker als der Basisschaden, kommt nichts durch.</p>
        <p><b>Friendly Fire</b>: Ein verfehlter Schuss kann jemanden treffen, der Adjacent zum Ziel steht.</p>` },
      { title: 'Full Auto', html: `
        <p>Trifft die Salve (ohne Push), darfst du sofort erneut würfeln, gleiches oder neues Ziel. Bis zu 3 Angriffswürfe, Schluss bei Fehlschuss oder Push. Jeder Wurf nach dem ersten: <b>Stress +1</b>. Zielen zählt nur für den ersten Wurf.</p>` },
      { title: 'Ammo', html: `
        <p>Munition läuft als <b>Supply-Rating</b>. Nach jedem Angriffswurf ein Ammo-Supply-Roll, außer du nutzt einen Extra Success zum Munitionsparen.</p>
        <p>Nachladen: Quick Action. <b>Single-Shot</b>-Waffen: nach jedem Schuss nachladen, dafür nie Supply-Roll. Ladehemmung: Full Action, Heavy Machinery.</p>` },
      { title: 'Armor', html: `
        <p>Schaden minus Armor Level. Rüstung gleich hoch oder höher: nichts kommt durch.</p>
        <ul>
          <li><b>Armor Piercing</b>: Rüstung zählt 1 Stufe niedriger.</li>
          <li><b>Schwachstelle</b> (−2 Dice): bei Treffer Rüstung zusätzlich −1.</li>
          <li>Nur eine Rüstung gleichzeitig.</li>
        </ul>` },
    ],
  },
  {
    key: 'verletzung',
    title: 'Damage & Death',
    topics: [
      { title: 'Health 0: Broken', html: `
        <p>Bei 0 Health bist du <b>Broken</b>: sofort auf <b>Critical Injuries</b> würfeln (D66). Nur noch eine Bewegung pro Runde, keine anderen Aktionen; kein weiterer Stress, keine Panikwürfe. Weiterer Schaden: zusätzliche kritische Verletzung.</p>
        <p><b>Wieder hoch:</b></p>
        <ul>
          <li><b>Erste Hilfe</b>: jemand auf Adjacent, Medical Aid (Full Action). Erfolg: +1 Health je 6; stabilisiert auch eine tödliche Verletzung.</li>
          <li><b>Rally</b>: jemand in derselben Zone, Command (Quick Action). Erfolg: +1 Health je 6. Wirkt nicht auf kritische Verletzungen.</li>
          <li><b>Allein</b>: nach einem Stretch automatisch wieder auf (+1 Health).</li>
        </ul>
        <p><b>Erholung:</b> 1 Health pro Stretch Ruhe an sicherem Ort, sofern nicht Fatigued.</p>` },
      { title: 'Critical Injuries & Death Roll', html: `
        <ul>
          <li>Tödliche Verletzungen haben ein <b>Zeitlimit</b> (Round, Stretch, Shift …). Läuft es ab: <b>Death Roll</b>.</li>
          <li>Death Roll = Stamina-Wurf, keine Aktion, kein Push, keine Stress Dice. Misslungen: tot. Gelungen: Zeitlimit beginnt neu.</li>
          <li>Limit „Round“: Death Roll jede Runde direkt nach deinem Zug.</li>
          <li><b>Erste Hilfe</b> an tödlicher Verletzung: Erfolg stabilisiert. Misserfolg: Limit sinkt eine Stufe (Shift → Stretch → Round); war es schon Round, stirbst du. Selbstbehandlung mit −2 Dice.</li>
          <li><b>Allein</b>: 3 erfolgreiche Death Rolls ohne Hilfe → gerettet.</li>
          <li><b>Instant Kill</b>: Ergebnisse 64–66 töten sofort.</li>
        </ul>
        <p class="hint">Vollständige D66-Tabelle: Regelbuch S. 68–71.</p>` },
    ],
  },
  {
    key: 'gefahren',
    title: 'Hazards',
    topics: [
      { title: 'Acid Splash', html: `
        <p>Nimmt ein Xenomorph Schaden (außer Feuer), spritzt Säure auf alle <b>Adjacent</b>. Base Dice = Acid-Splash-Wert + erlittener Schaden (max. seine Health). Schaden 1, +1 pro weiterer 6. Jeder erlittene Schadenspunkt frisst die Rüstung um 1 Stufe an.</p>
        <p>Wer Schaden nahm, bekommt jede folgende Runde einen neuen Splash mit <b>halbierten</b> Würfeln, bis ein Wurf keinen Schaden macht.</p>` },
      { title: 'Explosions', html: `
        <p><b>Explosive Waffen</b>: normaler Fernkampfangriff; bei Treffer nehmen alle anderen in der Zone denselben Schaden. Jeder darf einzeln ausweichen. Geschlossener Raum: +2 Dice.</p>
        <p><b>Sprengladungen</b> haben eine <b>Blast Power</b>: Basisschaden = Blast Power ÷ 3 (aufgerundet). Ein Wurf mit Base Dice = Blast Power gegen alle in der Zone; +1 Schaden je weiterer 6.</p>` },
      { title: 'Fire', html: `
        <p>Brennende Zone mit <b>Intensität</b> (typisch 6–9): wer sie betritt oder die Runde darin beginnt, würfelt Intensität, je 6 = 1 Schaden. Durch Feuer Broken: statt kritischer Verletzung Death Roll jede Runde.</p>
        <p><b>Feuer gefangen:</b> jede Runde erneut Schaden, bis ein Wurf 0 Schaden macht. Löschen: Mobility, Full Action.</p>
        <p><b>Ausbreitung</b> (D6 zu Rundenbeginn): 1–2 erlischt · 3–4 brennt weiter · 5–6 springt auf eine Nachbarzone über.</p>` },
      { title: 'Falling', html: `
        <p>Schaden = Fallhöhe in Metern ÷ 2, abgerundet. Rüstung schützt nicht. Kontrollierter Sprung: Mobility, jede 6 reduziert den Schaden um 1.</p>` },
      { title: 'Vacuum & Air', html: `
        <p>Luftvorrat: <b>Supply Roll</b> nach jedem Stretch im Anzug und nach Anstrengung. Dice = aktueller Vorrat (max. 6), <b>jede 6 senkt ihn um eins</b>.</p>
        <p>Ungeschützt im Vakuum: Stress +1 pro Runde; vor jeder Handlung ein Survival-Wurf (−1 Dice pro weiterem Wurf). Fehlschlag: sofort Broken, Death Roll jede Runde bis zur Flucht.</p>` },
      { title: 'Fatigue', html: `
        <ul>
          <li><b>Ersticken</b>: Survival jede Runde.</li>
          <li><b>Hunger & Durst</b>: nach 24 h Survival 1×/Shift.</li>
          <li><b>Schlafentzug</b>: nach 24 h Survival 1×/Shift.</li>
          <li><b>Hitze/Kälte</b>: Intervall legt der GM fest.</li>
        </ul>
        <p>Erster Fehlschlag → <b>Fatigued</b>: keine Health-Erholung; jeder weitere Fehlschlag = 1 Schaden + Stress +1. Endet sofort, wenn die Ursache behoben ist.</p>` },
      { title: 'Radiation', html: `
        <p>Rad-Punkte je nach Stufe: <b>Weak</b> 1/Shift, <b>Strong</b> 1/Stretch, <b>Extreme</b> 1/Runde. Jeder neue Rad-Punkt: Dice = alle Rads, jede 6 = 1 Schaden. Im Hotspot keine Health-Erholung; danach 1 Rad/Shift Heilung.</p>` },
    ],
  },
  {
    key: 'wesen',
    title: 'NPCs, Synthetics & Xenomorphs',
    topics: [
      { title: 'NPCs', html: `
        <p>Kein Stress Level, pushen nie, würfeln nie Panik. Meist ohne Talente. Verbrauchsgüter werden nicht mitgezählt. Gruppen können gemeinsam handeln (wie Helfen).</p>` },
      { title: 'Synthetics', html: `
        <ul>
          <li>Kein Stress, keine Panik, kein Pushen, keine Fatigue.</li>
          <li>Brauchen weder Luft, Nahrung, Wasser noch Schlaf; immun gegen Vakuum, Kälte, Krankheit.</li>
          <li>Bei 0 Health: D6 auf <b>Android Critical System Damage</b>.</li>
        </ul>
        ${table([
          ['1', 'Pumpenriss: nächster Zug verloren'],
          ['2', 'Beinservos zerstört: Bewegung wird Full Action'],
          ['3', 'Armservos zerstört: nur einhändige Ausrüstung'],
          ['4', 'Kopf verdreht: Quick Actions werden Full Actions'],
          ['5', 'Rumpfbruch: bewegungsunfähig'],
          ['6', 'System Shutdown: nur noch per Comtech kontaktierbar'],
        ])}
        <p class="hint">Reparatur: 1 Shift + Comtech heilt alles (außer Shutdown).</p>` },
      { title: 'Xenomorphs', html: `
        <ul>
          <li>Kein Stress, keine Panik, pushen nie.</li>
          <li><b>Speed</b> = Initiativekarten und volle Züge pro Runde.</li>
          <li><b>Signature Attack</b>: D6 auf der Tabelle der Kreatur.</li>
          <li>Natürliche Rüstung, oft schwächer gegen Feuer. Immun gegen Stun, Kälte, Vakuum.</li>
          <li>Treffer lösen Acid Splash aus. 1 Stretch Ruhe = volle Health.</li>
        </ul>` },
      { title: 'Broken Xenomorph (D6)', html: `${table([
        ['1', '<b>Rise Again</b>: scheinbar tot, im nächsten Zug +1 Health und steht wieder auf.', 'r1'],
        ['2', '<b>Wounded</b>: Speed −1, +1 Health; bei 1–3 auf D6 zu Zugbeginn flieht es.', 'r1'],
        ['3', '<b>Desperate Escape</b>: +1 Health, flieht sofort zwei Zonen weit.', 'r2'],
        ['4', '<b>Last Breath</b>: im nächsten Zug ein letzter Signature Attack, dann tot.', 'r2'],
        ['5–6', '<b>Torn Apart</b>: sofort tot.', 'r3'],
      ])}
        <p class="hint">Facehugger und Chestburster sterben bei 0 Health immer direkt.</p>` },
    ],
  },
];
