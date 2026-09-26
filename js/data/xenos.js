// Xenomorph XX121 und Verwandte (ALIEN RPG Evolved Edition, Kapitel Alien Species).
// Stats, Signature-Attack-Tabellen und eine Zusammenfassung in eigenen Worten.

// Angriffstabellen (D6). dice/damage: für den Angriffswurf, falls es einen gibt.
export const ATTACKS = {
  facehugger: {
    title: 'Facehugger Attacks',
    rows: [
      { min: 1, max: 2, name: 'Skittering Menace', text: 'Der Facehugger hat seinen Wirt gewählt und huscht auf ihn zu. Das Opfer bekommt Stress Level +1 und muss sofort einen Panic Roll machen. Der nächste Angriff gegen dasselbe Ziel bekommt +1 auf den D6.' },
      {
        min: 3, max: 4, name: 'Tail Grapple', text: 'Der Facehugger springt und fängt das Opfer mit dem Schwanz. Nach jedem Tail Grapple bekommt der nächste Angriff gegen dasselbe Ziel +2 auf den D6 (wenn in Reichweite). Würfle einen weiteren D6:',
        sub: [
          { min: 1, max: 2, text: 'Beine gefangen: Das Opfer stürzt, macht sofort einen Panic Roll und kann sich nicht bewegen, bis der Facehugger eine weitere Aktion macht oder getötet wird.' },
          { min: 3, max: 4, text: 'Arm verheddert: Das Opfer lässt eine Waffe (oder einen anderen Gegenstand nach Wahl der GM) fallen und macht sofort einen Panic Roll.' },
          { min: 5, max: 6, text: 'Schwanz um den Hals: Sofort Panic Roll und Stamina-Wurf, sonst 1 Schaden (Armor wirkt nicht).' },
        ],
      },
      { min: 5, max: 5, name: 'Face Grapple', dice: 6, text: 'Der Facehugger springt ins Gesicht. Angriff mit 6 Base Dice, kann abgewehrt werden. Bei Treffer: sofort Panic Roll, und im nächsten Zug folgt The Final Embrace (#6) gegen dasselbe Ziel.' },
      { min: 6, max: 99, name: 'The Final Embrace', dice: 8, text: 'Säure frisst sich durch Helm oder Atemmaske (Armor wirkt nicht, außer beim APEsuit). Angriff mit 8 Base Dice, kann abgewehrt werden. Bei Treffer ist das Opfer gefacehuggt und sofort Broken.' },
    ],
  },
  chestburster: {
    title: 'Chestburster Attacks',
    rows: [
      { min: 1, max: 3, name: 'Escape', text: 'Der Chestburster flieht zwei Zonen weit in den nächsten Schacht, Kanal oder Lüftungsschacht. Sobald die PCs ihn aus den Augen verlieren, ist er entkommen und der Stealth Mode beginnt: Er versucht sich zu verstecken und zu wachsen.' },
      { min: 4, max: 4, name: 'Terrorizing Hiss', text: 'Er springt auf ein Ziel zu, zeigt die Zähne und faucht. Das Ziel macht sofort einen Panic Roll. Ein Imp imitiert stattdessen verstörend die Bewegungen des Ziels, mit derselben Wirkung.' },
      { min: 5, max: 5, name: 'Leg Slash', dice: 6, damage: '2, armor piercing', text: 'Schlitzt das Bein auf. Angriff mit 6 Base Dice, Base Damage 2, armor piercing. Nimmt ein Mensch Schaden, erleidet er sofort die Critical Injury Impaled Thigh, auch wenn er nicht Broken ist.' },
      { min: 6, max: 99, name: 'Throat Bite', dice: 8, damage: '1, armor piercing', text: 'Schrilles Kreischen, Biss in die Kehle. Angriff mit 8 Base Dice, Base Damage 1, armor piercing. Verursacht der Angriff Schaden, löst er sofort einen Panic Roll aus.' },
    ],
  },
  stage4: {
    title: 'Drone, Scout & Stalker Attacks',
    rows: [
      { min: 1, max: 1, name: 'Hypnotizing Gaze', text: 'Der Xeno starrt ein Opfer auf Short Range an. Das Opfer ist gebannt, bekommt Stress Level +1 und muss sofort einen Panic Roll machen.' },
      { min: 2, max: 2, name: 'Playing With Its Prey', text: 'Angriff, aber nicht um zu töten: Das Opfer wird umgeworfen und lässt eine Waffe oder einen Gegenstand (Wahl der GM) fallen, nimmt aber keinen Schaden. Der Xeno steht über ihm und reizt es zur Flucht. Sofort Panic Roll.' },
      { min: 3, max: 3, name: 'Deadly Grab', dice: 8, damage: '1', text: 'Packt das Opfer mit den Klauen: 8 Base Dice, Base Damage 1. Bei Treffer zerrt er es sofort in eine angrenzende Zone (freie Bewegung) und lässt es fallen. Das Opfer lässt eine Waffe/einen Gegenstand fallen und macht sofort einen Panic Roll.' },
      { min: 4, max: 4, name: 'Ready To Kill', dice: 10, damage: '1', text: 'Packt das Opfer, die innere Kiefer bereit: 10 Base Dice. Bei Treffer 1 Schaden und das Opfer ist gegrappled; zum Losreißen vergleichender Close-Combat-Wurf gegen die Mobility des Xenos. Alle Verbündeten in der Zone machen einen Panic Roll. Reißt sich das Opfer nicht los, folgt im nächsten Zug Headbite (#6).' },
      { min: 5, max: 5, name: 'Tail Spike', dice: 10, damage: '2, armor piercing', text: 'Spießt das Opfer mit dem Schwanz auf: 10 Base Dice, Base Damage 2, armor piercing.' },
      { min: 6, max: 99, name: 'Headbite', dice: 9, damage: '2, armor piercing', text: 'Die innere Kiefer schnellt vor: 9 Base Dice, Base Damage 2, armor piercing. Jeder Schaden an einem Menschen tötet sofort. Wenn die GM will, bleibt das Opfer gerade so am Leben für das Ovomorphing.' },
    ],
  },
  stage5: {
    title: 'Soldier & Sentry Attacks',
    rows: [
      { min: 1, max: 1, name: 'Call For Reinforcements', text: 'Der Xeno hält zischend inne. Ein weiterer Xenomorph erscheint in einer angrenzenden Zone und handelt ab der nächsten Round. Alle PCs, die ihn sehen, bekommen Stress Level +1.' },
      { min: 2, max: 2, name: 'Frenzy', text: 'Wirbelt Arme, Beine und Schwanz durch die Gruppe: Alle Ziele in der Zone gehen zu Boden, nehmen 1 Schaden und machen sofort einen Panic Roll. Automatisch, aber per Mobility-Wurf ausweichbar (vermeidet alle Effekte).' },
      { min: 3, max: 3, name: 'Talon Attack', dice: 12, damage: '1, armor piercing', text: 'Wilder Klauenangriff: 12 Base Dice, Base Damage 1, armor piercing.' },
      { min: 4, max: 4, name: 'Capture For The Hive', dice: 12, damage: '1, armor piercing', text: 'Giftstachel am Schwanz: 12 Base Dice, Base Damage 1, armor piercing. Bei Schaden: nur 1 Schaden, aber lähmendes Gift. Das Opfer würfelt Stamina: Anzahl Successes = Rounds, die es noch steht, dann für einen Shift bewusstlos. Ein anderer kann es mit Medical Aid (Full Action) wecken, sonst schleppt der Xeno es zum Hive und legt es neben ein Ovomorph.' },
      { min: 5, max: 5, name: 'Tail Spike', dice: 11, damage: '2, armor piercing', text: 'Spießt das Opfer mit dem Schwanz auf: 11 Base Dice, Base Damage 2, armor piercing.' },
      { min: 6, max: 99, name: 'Headbite', dice: 10, damage: '2, armor piercing', text: 'Die innere Kiefer schnellt vor: 10 Base Dice, Base Damage 2, armor piercing. Jeder Schaden an einem Menschen tötet sofort.' },
    ],
  },
  stage6: {
    title: 'Praetorian, Charger & Queen Attacks',
    rows: [
      { min: 1, max: 1, name: 'Call The Guard', text: 'Schriller Hilferuf: D3 Sentries (Queen) bzw. Soldiers (Praetorian, Charger) kommen zur Verteidigung. Sie treffen in der folgenden Round ein, ziehen Initiative und können handeln.' },
      { min: 2, max: 2, name: 'Frenzy', text: 'Alle Ziele in der Zone gehen zu Boden, nehmen 1 Schaden und machen sofort einen Panic Roll. Automatisch, aber per Mobility-Wurf ausweichbar (vermeidet alle Effekte).' },
      { min: 3, max: 3, name: 'Beastly Bite', dice: 10, damage: '1, armor piercing', text: 'Riesiger Biss: 10 Base Dice, Damage 1, armor piercing. Jeder Schaden an einem Menschen macht das Opfer sofort Broken.' },
      { min: 4, max: 4, name: 'Charge', dice: 8, damage: '4 (Queen: 2), armor piercing', onlyFor: ['charger', 'queen'], text: 'Nur Charger und Queen (Praetorian würfelt neu). 8 Base Dice, Base Damage 4 (Queen: 2), armor piercing. Man kann ausweichen, aber nicht abwehren.' },
      { min: 5, max: 5, name: 'Tail Spike', dice: 12, damage: '2, armor piercing', text: 'Spießt das Opfer mit dem Schwanz auf: 12 Base Dice, Base Damage 2, armor piercing.' },
      { min: 6, max: 99, name: 'Headbite', dice: 11, damage: '2, armor piercing', text: 'Die innere Kiefer schnellt vor: 11 Base Dice, Base Damage 2, armor piercing. Jeder Schaden an einem Menschen tötet sofort.' },
    ],
  },
};

const X = (key, name, stage, attacks, speed, health, mobility, observation, armor, acid, summary, specials = []) =>
  ({ key, name, stage, attacks, stats: { speed, health, mobility, observation, armor, acid }, summary, specials });

const FACEHUGGER_TEXT = `<p>Manumala noxhydria: kleiner Körper, acht spinnenartige Finger, zwei Atemsäcke und ein langer, kräftiger Schwanz. Er umklammert den Kopf, schlingt den Schwanz um den Hals, betäubt das Opfer und schiebt einen Rüssel in den Rachen. Je nach Typ trägt er den Samen für Praetomorph, Drone oder Queen.</p>`;
const FACEHUGGER_SPECIALS = [
  '<b>Facehugging:</b> Befällt automatisch jeden bewegungsunfähigen möglichen Wirt auf Adjacent. Im Kampf reicht ein erfolgreicher Signature Attack #6.',
  '<b>Verlauf:</b> Wirt bewusstlos und nicht weckbar. Innerhalb eines Shifts stirbt der Facehugger und fällt ab; das Opfer erwacht, meist sehr hungrig. Nach einem weiteren Shift schlüpft der Chestburster und tötet den Wirt.',
  '<b>Entfernen</b> tötet den Wirt, außer er wurde vorher durch extreme Kälte ruhiggestellt. Dauert etwa einen Stretch mit passender Ausrüstung und einem Heavy-Machinery-Wurf. Für jeden Stretch seit dem Befall einen Stress Die würfeln: bei einer 1 ist der Wirt befruchtet und das Entfernen rettet ihn nicht mehr.',
  '<b>Blind:</b> Orientiert sich an Geräusch und Temperatur. Gewinnen die PCs im Stealth Mode den Observation-Wurf, können sie bis zu ihrem nächsten Zug in der Zone bleiben, ohne ihn aufzuschrecken. Liegt die Zonentemperatur nahe Körpertemperatur: −2 Dice auf seine Observation-Würfe gegen Menschen.',
  '<b>Verwundbar:</b> Die polarisierte Silikonhaut schützt vor den meisten Nahkampfangriffen, aber nicht vor Pulse Rounds und Laserwerkzeugen. Feuer wirkt Wunder.',
  '<b>Swarm:</b> Mehrere Facehugger in einer Zone können als Schwarm mit gemeinsamer Speed handeln: 1–2 → 2, 3–5 → 3, 6–10 → 4, 11–20 → 5, 21+ → 6. Jeder muss trotzdem einzeln getötet werden.',
];

const BURSTER_SPECIALS = [
  '<b>Geburt:</b> Tötet den Wirt sofort. Wer die Geburt zum ersten Mal sieht, macht sofort einen Panic Roll.',
  '<b>Wachstum:</b> Innerhalb eines Shifts entwickelt er sich zu Stage IV. Er sucht ein Versteck, frisst Metall und organische Nahrung, häutet sich und kokoniert sich für die Metamorphose ein.',
  '<b>Verwundbar:</b> In diesem Stadium am leichtesten zu töten: Schüsse, Sprengstoff, Messer und Feuer, wenn man ihn erwischt. Eine chirurgische Entfernung vor der Geburt hat bisher immer den Patienten getötet.',
  '<b>Variable Gestation:</b> Krebs oder ein geschwächtes Immunsystem beschleunigen, Hypersleep verlangsamt, Stasis stoppt die Entwicklung. Die GM entscheidet über die Dauer.',
];

const STAGE4_TEXT = `<p>Junge Erwachsene, die aufrecht gehen können. Schwarze, voll polarisierte Haut, klingenbewehrter Greifschwanz, Hände mit sechs Fingern und eine innere Kiefer, die wie ein Kolben zuschlägt. Stage-IV-Xenos handeln außerhalb des Hive Mind und unabhängig; jeder Typ hat Schwächen, die man ausnutzen kann.</p>`;
const STAGE5_TEXT = `<p>Im Stadium V hat der Hive Mind sie erfasst; sie häuten sich zu spezialisierten Rollen innerhalb des Nests.</p>`;
const HIVE_MIND = '<b>Hive Mind:</b> Ab etwa einem halben Dutzend Stage-IV-Xenos handeln sie koordiniert. Kommt eine Queen dazu, häuten sie sich zu Stage V. Je mehr Xenos im Hive, desto intelligenter werden sie.';
const STAGE6_TEXT = `<p>Monströse Anführer des Hive, größer und klüger als die übrigen. Stage VI entsteht nur, wenn eine Queen Royal Jelly produziert und Soldiers oder Sentries damit füttert.</p>`;

export const XENO_TYPES = [
  X('ovomorph', 'Ovomorph (Egg)', 'I', null, 0, 2, '–', '–', '0', 4,
    `<p>Große, ledrige Eier, 0,6 bis 1,2 m hoch, die meist mit vier Blütenblättern aufgehen. Sie sind selbst Lebewesen: Sie spüren Bewegung, wecken den Facehugger im Inneren und schützen ihn vor stumpfer Gewalt. Eier entstehen entweder durch Ovomorphing eines lebenden Wirts oder werden von einer Queen gelegt (diese sind robuster).</p>`,
    [
      '<b>Opening the Egg:</b> Ist ein möglicher Wirt (kein Android) auf Short Range, zu Beginn jeder Round einen Stress Die würfeln. Bei einer 1 springt ein Facehugger heraus und greift sofort an.',
      '<b>Adjacent:</b> Wer auf Adjacent herankommt, würfelt Mobility (keine Aktion), um das Ei nicht zu stören. Bei Fehlschlag springt der Facehugger heraus. In jedem Zug erneut würfeln.',
      '<b>Bekämpfen:</b> Feuer sterilisiert, Sprengstoff wirkt auch. Eier sind Säurebehälter und verursachen beim Explodieren Acid-Schaden. Extreme Kälte macht ein Ei inaktiv.',
      '<b>Ovomorphing:</b> Eine Drone ohne Hive sammelt Wirte, spinnt sie in Harz ein und verwandelt sie in 24–36 Stunden (4–6 Shifts) in Eier.',
    ]),
  X('queens-egg', "The Queen's Egg", 'I', null, 0, 3, '–', '–', '1 (0 vs fire)', 5,
    '<p>Von einer Queen gelegtes Ei: widerstandsfähiger und gesünder als Eier aus dem Ovomorphing.</p>',
    ['<b>Opening the Egg:</b> Gleiche Regeln wie beim Ovomorph: Stress Die zu Beginn jeder Round bei Wirt auf Short Range (1 = Facehugger), Mobility-Wurf auf Adjacent.',
      '<b>Bekämpfen:</b> Feuer, Sprengstoff (Achtung Säure), extreme Kälte macht das Ei inaktiv.']),
  X('facehugger', 'Facehugger', 'II', 'facehugger', 2, 2, 8, 7, '1 (0 vs fire)', 4, FACEHUGGER_TEXT, FACEHUGGER_SPECIALS),
  X('praeto-facehugger', 'Praeto-Facehugger', 'II', 'facehugger', 2, 2, 6, 7, '1 (0 vs fire)', 4,
    `${FACEHUGGER_TEXT}<p>Die Praeto-Variante ist etwas größer, funktioniert gleich, ist aber weniger geschickt.</p>`, FACEHUGGER_SPECIALS),
  X('royal-facehugger', 'Royal Facehugger', 'II', 'facehugger', 2, 3, 8, 8, '2 (1 vs fire)', 5,
    `${FACEHUGGER_TEXT}<p>Die königliche Variante hat acht Finger mit Schwimmhäuten, ist viel größer und gepanzert, hat zwei gezackte Fingerspitzen und einen Klingenschwanz. Sie trägt den Keim einer Queen (P. praepotens).</p>`, FACEHUGGER_SPECIALS),
  X('chestburster', 'Chestburster', 'III', 'chestburster', 2, 2, 8, 4, '0', 4,
    '<p>Wächst in der Brust des Wirts heran; mancher Wirt fühlt sich kurz davor sogar besser als je zuvor. Gelblich-beige, schlangenartig, mit metallischen Eckzähnen und je nach Tragzeit winzigen Ärmchen oder Stummeln.</p>', BURSTER_SPECIALS),
  X('bambi-burster', 'Bambi Burster', 'III', 'chestburster', 2, 2, 10, 4, '0', 4,
    '<p>Rehkitzartiger Chestburster aus einem vierbeinigen Wirt. Er wächst schneller heran und bewegt sich auf vier dünnen Beinen mit hoher Geschwindigkeit.</p>', BURSTER_SPECIALS),
  X('imp', 'Imp', 'III', 'chestburster', 2, 2, 8, 6, '0', 4,
    '<p>Unreife Form eines Praetomorph: durchscheinende Haut, Panzer und knochige Züge, wie eine Miniatur des Erwachsenen. Reift schneller als ein normaler Chestburster.</p>',
    ['<b>Mimikry:</b> Fühlt sich der Imp nach der Geburt nicht bedroht, imitiert er manchmal die Bewegungen des nächsten Lebewesens (auch bei Terrorizing Hiss).', ...BURSTER_SPECIALS]),
  X('queenburster', 'Queenburster', 'III', 'chestburster', 2, 3, 8, 8, '1 (0 vs fire)', 5,
    '<p>Embryonale Queen. Die Tragzeit dauert Tage statt Stunden. Bei der Geburt hat sie bereits einen Ansatz des Kopfkamms, beide Armpaare und voll entwickelte Beine.</p>', BURSTER_SPECIALS),
  X('drone', 'Drone', 'IV', 'stage4', 2, 7, 8, 8, '2 (1 vs fire)', 8,
    `${STAGE4_TEXT}<p>Die „Lurker“ sind 2,4 m große, heimliche Jäger aus dem Hinterhalt, mit Hakenklinge und Stachel am Schwanz für das Ovomorphing. Noch ohne Verbindung zum Hive Mind; der Xeno der USCSS Nostromo (2122) war eine Drone. Ohne Queen bleibt sie in Stage IV: frisst, sammelt Wirte für Eier und schläft.</p>`,
    ['<b>Silent Assassin:</b> Alle Observation-Würfe, um die Drone im Stealth Mode zu entdecken, bekommen −2 Dice.',
      '<b>Routine:</b> Klüger als Scout und Stalker, folgt aber festen Mustern und hält Winterschlaf an warmen Orten (z. B. nahe einem Reaktorkern). So lässt sie sich aufspüren.',
      '<b>Ovomorphing:</b> Ohne Hive verwandelt sie eingesponnene Wirte in 4–6 Shifts in Eier.']),
  X('scout', 'Scout', 'IV', 'stage4', 2, 5, 10, 10, '2 (1 vs fire)', 8,
    `${STAGE4_TEXT}<p>Der braunschwarze „Runner“ ist 2,1 m groß, meist auf allen vieren unterwegs und besonders schnell. Er sucht Wirte und alarmiert den Hive; gibt es noch keinen, spinnt er Wirte fürs Ovomorphing ein, bis ein Queenburster entsteht. Ohne Rückenröhren. Der Xeno auf Fiorina „Fury“ 161 (2179) war ein Scout.</p>`,
    ['<b>Leicht zu täuschen:</b> Scouts (und Stalker) lassen sich in gefährliche Situationen locken.']),
  X('stalker', 'Stalker', 'IV', 'stage4', 2, 9, 9, 6, '2', 8,
    `${STAGE4_TEXT}<p>Erwachsene Form des Praetomorph (Plagiarus linesteres), etwa 2,7 m groß, auf zwei oder vier Beinen. Größer, stärker, zäher und feuerresistenter als normale Xenos, aber weniger intelligent und animalischer. Durchscheinende Knochenzähne, kein Queen-Stadium.</p>`,
    ['<b>Feral Hunger:</b> Verursacht der Stalker mit einem Angriff Schaden, greift er dasselbe Ziel sofort als freie Aktion erneut an (8 Base Dice, Base Damage 1).',
      '<b>Leicht zu täuschen:</b> Stalker (und Scouts) lassen sich in gefährliche Situationen locken.']),
  X('soldier', 'Soldier', 'V', 'stage5', 2, 8, 8, 8, '2 (1 vs fire)', 10,
    `${STAGE5_TEXT}<p>Der „Warrior“ ist die erwachsene Form der Drone: gerippter, gepanzerter Kopfpanzer, Klingen an den Ellbogen, fünffingrige Klauen, blauschwarz. Soldiers sind wendig und greifen in Massen an (Hadley's Hope, 2179). Mit dem Giftstachel lähmen sie Beute und schleppen sie zum Hive.</p>`,
    ['<b>Panzerung:</b> Der Panzer hält normale Munition ab, Pulse Rifles machen kurzen Prozess.',
      '<b>Gruppen:</b> Soldiers kämpfen in Gruppen; Flächenwaffen sind besonders effektiv.', HIVE_MIND]),
  X('worker', 'Worker', 'V', null, 1, 4, 4, 4, '1 (0 vs fire)', 6,
    `${STAGE5_TEXT}<p>Die „Weavers“ bauen und pflegen den Hive, spinnen mit ihrer Rüsselzunge Harz, legen Eier neben eingesponnene Wirte und füttern die Queen. Sie schrumpfen auf 1,2 bis 1,8 m, sind gräulich-weiß mit rosa Zunge.</p>`,
    ['<b>Harmlos:</b> Workers ignorieren Bedrohungen im Hive und fliehen, wenn sie angegriffen werden; sie überlassen den Schutz Soldiers und Sentries. Leicht zu töten.',
      '<b>Keine Angriffstabelle:</b> Das Regelbuch gibt Workers keine Signature Attacks.', HIVE_MIND]),
  X('sentry', 'Sentry', 'V', 'stage5', 2, 8, 12, 10, '2 (1 vs fire)', 10,
    `${STAGE5_TEXT}<p>Die „Defenders“ entstehen, wenn Scouts einen Hive und Wirte gesichert haben. Gerippter Panzer, extrem schnell und geschickt, mit Greifhänden und -füßen klettern sie besser als alle anderen an Wänden und Decken. Sie ziehen sich zurück oder greifen an, wie die Queen es signalisiert, und opfern sich, um Eindringlinge fernzuhalten.</p>`,
    ['<b>Revier:</b> Sentries verlassen den inneren Hive nur, wenn die Queen es tut. Wer draußen bleibt, meidet sie.', HIVE_MIND]),
  X('praetorian', 'Praetorian', 'VI', 'stage6', 2, 12, 5, 8, '3 (1 vs fire)', 10,
    `${STAGE6_TEXT}<p>Mit Royal Jelly gefütterte Elite-Krieger der Queen, doppelt so groß wie Soldiers, mit Kopfkamm wie die Queen, aber zweiarmig und aufrecht. Leibgarde und Heerführer. Verliert der Hive die Queen, kann sich ein Praetorian zu einer neuen häuten.</p>`,
    ['<b>Schwachstelle:</b> Fällt ein Praetorian, sind die von ihm koordinierten Soldiers vorübergehend desorientiert.',
      '<b>Charge (#4)</b> in der Angriffstabelle gilt nicht für Praetorians: neu würfeln.']),
  X('charger', 'Charger / Crusher', 'VI', 'stage6', 1, 20, 4, 5, '5 (3 vs fire) front / 3 (1 vs fire)', 10,
    `${STAGE6_TEXT}<p>Der Panzer unter den Xenos: eine wochenlang mit Royal Jelly und Metall gemästete Sentry, die sich verpuppt und verwandelt. Vierbeinig, mit riesigem Panzerkamm, 1,8 bis 3 m Schulterhöhe. Er stürmt wie ein tollwütiges Nashorn, trampelt Personal nieder und pflügt durch leicht gepanzerte Fahrzeuge. Selten, nur in alten Hives.</p>`,
    ['<b>Armor:</b> Der höhere Wert (5) gilt für Angriffe von vorn, der niedrigere (3) für den Rest; die GM entscheidet.',
      '<b>Schwachstelle:</b> Beim Sturmangriff mit gesenktem Kopfschild fast unverwundbar, der Körper ist aber nur wie ein Soldier gepanzert. Gezielte Sprengladungen oder schwere Artillerie erledigen ihn.',
      '<b>Unbeweglich:</b> Kann schlecht klettern und springen.']),
  X('queen', 'Queen', 'VI', 'stage6', 2, 18, 6, 12, '4 (2 vs fire)', 10,
    `${STAGE6_TEXT}<p>Die Mutter des Hive, sechs Meter oder größer, die stärkste und intelligenteste Form. Nur sie legt Eier in Massen: Workers spinnen ihr eine Harzwiege, ein riesiger Eisack wächst, und die Eier werden über einen Legestachel abgelegt. Sie kommuniziert mit dem Hive über Pheromone und Infraschall, vielleicht sogar telepathisch; empfängliche Menschen träumen von ihrem Ruf. Erkennbar an Größe, großem Kopfkamm, sechs Rückenstacheln und einem zweiten Armpaar.</p>`,
    ['<b>Mobility 0</b>, solange sie am Eisack hängt.',
      '<b>Royal Jelly:</b> Ihr Sekret formt Praetorians und Chargers. Für Menschen extrem süchtig machend: mehr Kraft, Ausdauer und Aggression, bis hin zu übermenschlich und mordlustig.',
      '<b>Hive-Kriege:</b> Hives bekämpfen sich, um die fremde Queen zu töten; der Sieger übernimmt den führerlosen Hive.',
      '<b>Empfehlung des Regelbuchs:</b> Kämpft nicht gegen eine Queen.']),
];

export const typeByKey = (key) => XENO_TYPES.find((t) => t.key === key);

// Zufälliger Angriff; Zeilen mit onlyFor werden für andere Typen neu gewürfelt.
export function rollAttack(typeKey, rng = Math.random) {
  const type = typeByKey(typeKey);
  const table = type && ATTACKS[type.attacks];
  if (!table) return null;
  const d6 = () => Math.floor(rng() * 6) + 1;
  for (let tries = 0; tries < 20; tries++) {
    const roll = d6();
    const row = table.rows.find((r) => roll >= r.min && roll <= r.max);
    if (row.onlyFor && !row.onlyFor.includes(typeKey)) continue;
    let sub = null;
    let subRoll = null;
    if (row.sub) {
      subRoll = d6();
      sub = row.sub.find((s) => subRoll >= s.min && subRoll <= s.max);
    }
    return { roll, row, subRoll, sub };
  }
  return null;
}
