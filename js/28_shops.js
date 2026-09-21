// ============================================================================
// MAIN STREET - the shops of Moose Hollow. Twelve businesses, each with its
// own sign, its own mark on the bracket board, its own window display, its own
// keeper, and a room you can actually walk into.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, art = CH.art, A = CH.audio, S = CH.state;
  const W = CH.W, H = CH.H;

  // little painter helpers, all relative so a logo can be dropped anywhere
  const R = (x, y, w, h, c) => gfx.rect(x, y, w, h, c);
  const E = (x, y, rx, ry, c) => gfx.ellipse(x, y, rx, ry, c);
  const T = (x0, y0, x1, y1, x2, y2, c) => gfx.tri(x0, y0, x1, y1, x2, y2, c);
  const heart = (x, y, r, c) => { E(x - r * 0.5, y - r * 0.3, r * 0.6, r * 0.55, c); E(x + r * 0.5, y - r * 0.3, r * 0.6, r * 0.55, c); T(x - r, y, x + r, y, x, y + r * 1.1, c); };
  const steam = (x, y, t, c) => { for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i * 0.33) % 1; E(x + Math.sin(t * 2 + i) * 2, y - k * 10, 1 + k * 2, 0.8 + k * 1.6, `rgba(${c},${(0.5 - k * 0.5).toFixed(2)})`); } };

  // ---- the catalogue --------------------------------------------------------
  // Twelve shops. `logo` paints a 20x20 mark centred on (x, y); `display` fills
  // a shop window; `inside` adds the fixtures to an interior room.
  const SHOPS = [
    {
      id: 'toys', name: 'PINECONE TOYS', sign: 'WIND-UPS', board: 'WIND-UP|SALE',
      color: '#b2452f', text: '#ffe9c4', awning: ['#e0674a', '#f6e7c0'], logoBg: '#fff3d8',
      keeper: { name: 'Winnie', species: 'rabbit', outfit: 'sweater' },
      wall: '#e6c68d', floor: '#965c30', accent: '#c8452f',
      logo: (x, y) => {
        E(x, y + 1, 5, 7, '#7a4a22'); E(x, y + 1, 4, 6, '#9a6330');
        for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) E(x + i * 2, y + j * 3, 1.4, 1.2, '#6b3d1c');
        R(x - 1, y - 9, 2, 3, '#8a8f9c'); E(x, y - 10, 2.4, 1.6, '#c8452f');
      },
      display: (x, y, t, right) => {
        if (right) { R(x + 4, y - 6, 10, 8, '#e8b44a'); R(x + 5, y - 5, 8, 2, '#c8352b'); E(x + 6, y + 2, 2, 2, '#3a3440'); E(x + 12, y + 2, 2, 2, '#3a3440'); }
        else { const b = Math.sin(t * 3) * 2; E(x + 8, y - 2 + b, 5, 5, '#e05a7a'); E(x + 6, y - 4 + b, 1.4, 1.4, '#fff'); E(x + 10, y - 4 + b, 1.4, 1.4, '#fff'); }
      },
      talk: ["Wind-up bears, wind-up geese, wind-up moose. {p}The moose sells best. Nobody knows why.",
             "That tin frog in the window? {p}I've had him since 1974. He's not for sale. He's furniture now.",
             "You used to press your face on that glass. {p}I never minded. Cleaned it every Sunday anyway."],
      favour: "If you ever find a little brass key, shaped like a leaf - bring it here. {p}Half my stock is asleep without it.",
    },
    {
      id: 'coffee', name: 'THE DRIPPING PINE', sign: 'OPEN', board: 'DRIP $2|REFILL $1',
      color: '#4a6b52', text: '#f2e7cf', awning: ['#2f5a44', '#e8dcbc'], logoBg: '#f4ecd8',
      keeper: { name: 'Marta', species: 'goose', outfit: 'cook' },
      wall: '#3f5c48', floor: '#7a5230', accent: '#2f5a44',
      logo: (x, y, t) => { R(x - 6, y - 3, 12, 8, '#f2ece0'); R(x - 6, y - 3, 12, 2, '#d8cfbd'); E(x + 7, y + 1, 2.4, 2.4, '#f2ece0'); E(x + 7, y + 1, 1.2, 1.2, '#f4ecd8'); R(x - 7, y + 5, 14, 2, '#3a3440'); steam(x - 2, y - 5, t || 0, '120,90,60'); },
      display: (x, y, t, right) => {
        if (right) { for (let i = 0; i < 3; i++) E(x + 4 + i * 5, y, 2.2, 2.6, ['#c98a3a', '#e0b060', '#a86a2a'][i]); R(x + 2, y + 3, 14, 1, '#6a4a2a'); }
        else { R(x + 5, y - 5, 8, 7, '#e8e2d2'); steam(x + 9, y - 7, t, '200,190,170'); }
      },
      talk: ["Drip, dark roast, or the one that tastes like a campfire. {p}That last one isn't on purpose.",
             "You look tired. {p}Sit. First one's free if you're job hunting. {p}Everybody's job hunting.",
             "The wifi password is the wifi password. {p}Literally. That's the password."],
      favour: "Tell your mother the thermos is still behind my counter. {p}Three winters now. I keep it warm out of habit.",
    },
    {
      id: 'books', name: 'DOG-EARED BOOKS', sign: '2 FOR $3', board: 'USED|BOOKS',
      color: '#6a4a7a', text: '#f0e2f6', awning: ['#54386a', '#e8d8f0'], logoBg: '#efe6f6',
      keeper: { name: 'Osgood', species: 'owl', outfit: 'cardigan' },
      wall: '#5a4266', floor: '#6b4630', accent: '#8a5aa8',
      logo: (x, y) => { R(x - 8, y - 6, 7, 12, '#c8452f'); R(x + 1, y - 6, 7, 12, '#3a6ba8'); R(x - 1, y - 7, 2, 14, '#6a4a3a'); R(x - 7, y - 5, 5, 1, '#f6f2e6'); R(x + 2, y - 5, 5, 1, '#f6f2e6'); R(x - 7, y - 2, 5, 1, '#f6f2e6'); R(x + 2, y + 1, 5, 1, '#f6f2e6'); },
      display: (x, y, t, right) => { for (let i = 0; i < 5; i++) R(x + 3 + i * 3, y - 7 + (i % 2), 2, 9, ['#c8452f', '#3a6ba8', '#4a8a5a', '#e0a83a', '#8a5aa8'][i]); if (!right) E(x + 14, y - 3, 3, 3, '#e8e2d2'); },
      talk: ["Everything's used. {p}Everything's been loved once. {p}Some of it twice.",
             "You want the careers section? {p}It's two shelves. Both of them are lying to you.",
             "I sorted by feeling, not by author. {p}Sad is at the back. It's the biggest shelf."],
      favour: "Somebody returned a book with your mother's name in the front. {p}Come back when you have a minute and I'll find it.",
    },
    {
      id: 'bakery', name: 'FROST & FLOUR', sign: 'FRESH', board: 'BREAD|AT SIX',
      color: '#d8a03a', text: '#4a3016', awning: ['#f0c05a', '#fff2d0'], logoBg: '#fff6e0',
      keeper: { name: 'Bernice', species: 'bear', outfit: 'cook' },
      wall: '#f0dcae', floor: '#b07a40', accent: '#d8a03a',
      logo: (x, y) => { E(x, y + 1, 8, 6, '#c98a3a'); E(x, y, 8, 6, '#e8b45a'); E(x - 3, y - 2, 3, 2, '#f6d89a'); for (let i = -1; i <= 1; i++) gfx.line(x + i * 4 - 2, y - 3, x + i * 4 + 1, y + 1, '#a86a2a'); },
      display: (x, y, t, right) => { if (right) { E(x + 8, y - 1, 6, 4, '#d8a35a'); E(x + 8, y - 2, 6, 4, '#eec27a'); } else { for (let i = 0; i < 3; i++) E(x + 4 + i * 5, y, 2.4, 2, '#e8c06a'); } },
      talk: ["Bread's out at six. {p}If you're here at five you can smell it. That's free.",
             "Day-old is half price. {p}Two-day-old is a gift. {p}Three-day-old is a weapon.",
             "I put a raisin in exactly one bun every morning. {p}Nobody has ever found it. I don't think I do it."],
      favour: "Take this butter tart. {p}No, don't pay. {p}Pay me when you've got a paycheque and a reason to celebrate.",
    },
    {
      id: 'hardware', name: 'BUCKSAW HARDWARE', sign: 'SALT $4', board: 'ROAD|SALT',
      color: '#8a5a2b', text: '#ffd98a', awning: ['#a8722f', '#e8d0a0'], logoBg: '#f2e8d0',
      keeper: { name: 'Gordie', species: 'beaver', outfit: 'flannel' },
      wall: '#7a6a52', floor: '#5a4a38', accent: '#c88a2a',
      logo: (x, y) => { R(x - 8, y - 1, 14, 3, '#b8bcc8'); for (let i = 0; i < 7; i++) T(x - 8 + i * 2, y + 2, x - 6 + i * 2, y + 2, x - 7 + i * 2, y + 4, '#d8dce8'); R(x + 4, y - 3, 5, 7, '#7a4a22'); },
      display: (x, y, t, right) => { if (right) { R(x + 4, y - 6, 9, 9, '#4a6a8a'); gfx.text('SALT', x + 8, y - 3, '#fff', { font: 'small', align: 'center' }); } else { R(x + 6, y - 7, 2, 10, '#8a6a3a'); E(x + 7, y - 8, 3, 2, '#b8bcc8'); } },
      talk: ["Salt, shovels, and the little propane bottles. {p}That's January. That's the whole business.",
             "Everything in aisle two fixes everything in aisle three. {p}That's not a joke, that's inventory.",
             "Your dad bought his last axe here. {p}Good handle. He argued about the price for an hour, then paid it."],
      favour: "Your porch step is loose - I can hear it from here. {p}Take these three screws. No charge. Just fix it.",
    },
    {
      id: 'thrift', name: 'SECOND WIND', sign: 'ALL $5', board: 'COATS|$5',
      color: '#3a7a8a', text: '#e6f6fa', awning: ['#2f6a7a', '#dceef2'], logoBg: '#e6f6fa',
      keeper: { name: 'Pearl', species: 'raccoon', outfit: 'dress' },
      wall: '#4a7280', floor: '#7a5a42', accent: '#3a7a8a',
      logo: (x, y) => { R(x - 1, y - 8, 2, 3, '#b8bcc8'); T(x - 7, y + 5, x + 7, y + 5, x, y - 5, '#c8452f'); T(x - 5, y + 5, x + 5, y + 5, x, y - 3, '#e0674a'); },
      display: (x, y, t, right) => { const cols = ['#c8452f', '#3a6ba8', '#4a8a5a']; for (let i = 0; i < 3; i++) { R(x + 3 + i * 5, y - 6, 3, 8, cols[(i + (right ? 1 : 0)) % 3]); R(x + 2 + i * 5, y - 7, 5, 1, '#8a8f9c'); } },
      talk: ["Everything here belonged to somebody who got taller, richer, or gone. {p}Mostly taller.",
             "A suit? {p}Back rail. Brown one fits you. {p}It fit Merle too, and Merle got the job.",
             "Try it on. Don't buy it because it's cheap, buy it because you stand up straighter in it."],
      favour: "If that interview comes off, you bring the suit back and I'll press it for the next one. {p}That's how it works here.",
    },
    {
      id: 'records', name: 'LOON & GROOVE', sign: 'VINYL', board: 'USED|VINYL',
      color: '#2f3a6a', text: '#f0e8ff', awning: ['#3a4a8a', '#e0d8f6'], logoBg: '#ece6fa',
      keeper: { name: 'Dex', species: 'fox', outfit: 'hoodie' },
      wall: '#38406a', floor: '#4a3a5a', accent: '#6a5ad8',
      logo: (x, y, t) => { const r = (t || 0) * 2; E(x, y, 8, 8, '#241f30'); E(x, y, 8, 8, '#2f2a3c'); for (let i = 0; i < 3; i++) E(x, y, 6 - i * 2, 6 - i * 2, '#3a3448'); E(x, y, 2.4, 2.4, '#e05a7a'); E(x + Math.cos(r) * 4, y + Math.sin(r) * 4, 0.8, 0.8, '#f6f2e6'); },
      display: (x, y, t, right) => { R(x + 3, y - 7, 9, 9, right ? '#c8452f' : '#3a6ba8'); E(x + 7.5, y - 2.5, 3, 3, '#241f30'); E(x + 7.5, y - 2.5, 1, 1, '#f6f2e6'); },
      talk: ["Everything's used, everything skips somewhere. {p}That's not a defect, that's a feature.",
             "You want the Canadian bin? {p}It's the big one. We're a country of sad guitars.",
             "Bring a record back scratched and I'll trade you. {p}Bring it back warped and we're going to have a conversation."],
      favour: "Your mum used to buy the same album every couple of years. {p}Kept giving it away. {p}I've got a copy behind the counter with her name on it.",
    },
    {
      id: 'pharmacy', name: 'ANTLER PHARMACY', sign: 'RX', board: 'FLU|SHOTS',
      color: '#3a8a6a', text: '#e8fff4', awning: ['#2f7a5a', '#dcf2e8'], logoBg: '#e8fff4',
      keeper: { name: 'Nadia', species: 'deer', outfit: 'labcoat' },
      wall: '#dfeae4', floor: '#9aa8a2', accent: '#3a8a6a',
      logo: (x, y) => { R(x - 2, y - 8, 4, 16, '#3a8a6a'); R(x - 8, y - 2, 16, 4, '#3a8a6a'); R(x - 1, y - 7, 2, 14, '#5aa88a'); },
      display: (x, y, t, right) => { if (right) { R(x + 5, y - 7, 7, 10, '#e8e2d2'); R(x + 6, y - 6, 5, 3, '#3a8a6a'); } else { E(x + 8, y - 2, 4, 5, '#c8dce8'); E(x + 8, y - 3, 3, 4, '#e8f4fa'); } },
      talk: ["Prescriptions at the back. Everything else is aspirin in different hats.",
             "Your mother's file is thick. {p}That's not bad news. Thick means somebody's been paying attention.",
             "Take the vitamins. I know. I know. {p}Take them anyway."],
      favour: "When the hospital sends her home, bring me the sheet. {p}I'll sort the pills into the days. Free. Don't argue.",
    },
    {
      id: 'bait', name: 'TACKLE & TWINE', sign: 'WORMS', board: 'LIVE|BAIT',
      color: '#2f6a8a', text: '#dff2ff', awning: ['#2a5a78', '#cfe6f4'], logoBg: '#dff2ff',
      keeper: { name: 'Bartleby', species: 'beaver', outfit: 'winter' },
      wall: '#3a5a6a', floor: '#5a4a3a', accent: '#2f6a8a',
      logo: (x, y) => { E(x - 1, y, 7, 4, '#4a9ac8'); T(x + 5, y - 3, x + 5, y + 3, x + 9, y, '#4a9ac8'); E(x - 4, y - 1, 1, 1, '#241f30'); gfx.line(x - 1, y - 4, x - 1, y - 8, '#8a8f9c'); },
      display: (x, y, t, right) => { if (right) { for (let i = 0; i < 3; i++) E(x + 5 + i * 4, y, 1.6, 1.2, '#c8452f'); } else { gfx.line(x + 4, y - 8, x + 12, y + 2, '#8a8f9c'); E(x + 12, y + 2, 1.6, 1.6, '#e0b060'); } },
      talk: ["Worms are in the cooler. {p}Don't put them in your pocket. {p}People do. Every year.",
             "Ice is eleven inches. {p}You can drive a truck on eleven. I wouldn't. But you can.",
             "I sold your dad his first rod. {p}Small one, red handle. He caught nothing for a year and came back happy every week."],
      favour: "Take a jig. {p}When all this is over you go sit on the ice for an afternoon. {p}Doctor's orders. I'm not a doctor.",
    },
    {
      id: 'garage', name: 'SPARKPLUG GARAGE', sign: 'TOWING', board: 'BOOST|$20',
      color: '#5a5f6a', text: '#ffd84a', awning: null, logoBg: '#f2e8d0',
      keeper: { name: 'Rick', species: 'moose', outfit: 'vest' },
      wall: '#4a4f5a', floor: '#3a3f48', accent: '#e8a030',
      logo: (x, y) => { R(x - 2, y - 8, 4, 10, '#b8bcc8'); R(x - 3, y - 2, 6, 3, '#8a8f9c'); R(x - 1, y + 1, 2, 6, '#d8dce8'); for (let i = 0; i < 3; i++) T(x + 3 + i, y - 6 + i * 2, x + 7 + i, y - 6 + i * 2, x + 4 + i, y - 2 + i * 2, '#ffd84a'); },
      display: (x, y, t, right) => { R(x + 3, y - 4, 12, 6, '#7a2f24'); E(x + 6, y + 2, 2, 2, '#241f30'); E(x + 12, y + 2, 2, 2, '#241f30'); },
      talk: ["Zamboni's still broken. {p}Don't ask. {p}Everybody asks.",
             "A boost is twenty. A tow is eighty. {p}Advice is free and worth exactly that.",
             "Your mum's car? {p}I saw it come in on the truck. {p}...The car's the least of it, son. You go see her."],
      favour: "When you've got a licence and a hundred bucks, I've got a rust-bucket out back with your name on it. {p}I'll hold it.",
    },
    {
      id: 'barber', name: 'THE CLIPPED WHISKER', sign: 'CUTS $12', board: 'WALK|INS',
      color: '#b03a4a', text: '#fff0f2', awning: ['#c8452f', '#f6f2e6'], logoBg: '#fff0f2',
      keeper: { name: 'Sal', species: 'cat', outfit: 'polo' },
      wall: '#e8dcd0', floor: '#8a5a4a', accent: '#b03a4a',
      logo: (x, y, t) => { const o = ((t || 0) * 8) % 6; R(x - 4, y - 9, 8, 18, '#f6f2e6'); for (let i = -2; i < 4; i++) { const yy = y - 9 + ((i * 6 + o) % 18); R(x - 4, yy, 8, 3, '#c8452f'); R(x - 4, yy + 3, 8, 3, '#3a6ba8'); } R(x - 5, y - 10, 10, 2, '#b8bcc8'); R(x - 5, y + 8, 10, 2, '#b8bcc8'); },
      display: (x, y, t, right) => { if (right) { E(x + 8, y - 3, 4, 4, '#c8a882'); E(x + 8, y - 5, 4, 2, '#5a4a3a'); } else { gfx.line(x + 4, y + 1, x + 10, y - 5, '#b8bcc8'); gfx.line(x + 4, y - 5, x + 10, y + 1, '#b8bcc8'); } },
      talk: ["Twelve dollars. {p}Same twelve dollars since 2009. {p}I'm not good at business.",
             "Quills are a nightmare and you know it. {p}Sit down anyway, I like a challenge.",
             "Interview tomorrow? {p}Then you're getting the tidy-up, and you're getting it free. Sit."],
      favour: "Before that interview you come here. {p}Doesn't matter what time. I'll open up. A man should walk in looking like he meant to.",
    },
    {
      id: 'arcade', name: 'PIXEL PALACE', sign: '25c PLAY', board: 'TOKENS|4/$1',
      color: '#4a2f7a', text: '#9fdcff', awning: null, logoBg: '#1a1424',
      keeper: { name: 'Ty', species: 'squirrel', outfit: 'track' },
      wall: '#2a1f40', floor: '#3a2f52', accent: '#9fdcff',
      logo: (x, y, t) => { const b = Math.sin((t || 0) * 4) > 0; R(x - 8, y - 6, 16, 12, '#241f30'); R(x - 7, y - 5, 14, 8, b ? '#3ad6a0' : '#2aa880'); for (let i = 0; i < 4; i++) R(x - 6 + i * 4, y - 4 + (i % 2) * 3, 2, 2, '#1a3a2a'); R(x - 4, y + 4, 8, 2, '#8a8f9c'); },
      display: (x, y, t, right) => { R(x + 4, y - 8, 10, 12, '#3a2f52'); R(x + 5, y - 7, 8, 6, Math.sin(t * 3) > 0 ? '#3ad6a0' : '#2f5a8a'); R(x + 6, y + 1, 6, 1, '#c8452f'); },
      talk: ["Four tokens a dollar. {p}Blue Hedgehog cabinet's in the back. The joystick's loose. {p}It's always been loose.",
             "High score on the hedgehog machine is CHB. {p}That's you, isn't it. {p}From when you were nine.",
             "Come back when you're paid and put a dollar in. {p}The machines don't care what you do for work."],
      favour: "Nobody's beaten your score in eleven years. {p}I dust that screen special. Don't tell anyone.",
    },
  ];
  CH.SHOPS = SHOPS;
  const byId = {};
  for (const s of SHOPS) byId[s.id] = s;
  CH.shopById = (id) => byId[id];

  // ---- what each shop looks like on the inside -------------------------------
  // One painter per shop, drawn against the back wall of its room. The room
  // itself (wall, floor, counter, window, door) is shared; this is the part
  // that makes walking into the bakery feel nothing like the garage.
  const INSIDE = {
    toys: (g, F, ac) => {
      for (let s = 0; s < 3; s++) {
        const sy = F - 46 - s * 26;
        R(40, sy, 150, 4, '#8a5a2b'); R(40, sy + 4, 150, 2, '#6a3f1c');
        for (let i = 0; i < 9; i++) {
          const x = 46 + i * 16, k = (i + s) % 4;
          if (k === 0) { E(x, sy - 5, 5, 5, '#e05a7a'); E(x - 2, sy - 7, 1.2, 1.2, '#fff'); E(x + 2, sy - 7, 1.2, 1.2, '#fff'); }
          else if (k === 1) { R(x - 4, sy - 9, 8, 9, '#e8b44a'); R(x - 3, sy - 8, 6, 3, '#c8352b'); }
          else if (k === 2) { E(x, sy - 4, 4, 4, '#4a9ac8'); R(x - 1, sy - 11, 2, 4, '#8a8f9c'); }
          else { T(x - 4, sy, x + 4, sy, x, sy - 9, '#4a8a5a'); E(x, sy - 9, 1.4, 1.4, '#ffd84a'); }
        }
      }
      R(210, F - 40, 60, 40, '#b2452f'); R(212, F - 38, 56, 36, '#d8613f');
      gfx.text('BIN OF', 240, F - 34, '#fff3d8', { align: 'center', font: 'small' });
      gfx.text('MYSTERY', 240, F - 26, '#fff3d8', { align: 'center', font: 'small' });
      for (let i = 0; i < 7; i++) E(218 + i * 8, F - 42, 4, 3, ['#e05a7a', '#4a9ac8', '#e8b44a', '#4a8a5a'][i % 4]);
    },
    coffee: (g, F, ac) => {
      R(40, F - 62, 120, 50, '#2a3a30'); R(42, F - 60, 116, 46, '#35473a');
      gfx.text('DRIP        $2', 100, F - 56, '#e8dcbc', { align: 'center', font: 'small' });
      gfx.text('DARK        $3', 100, F - 46, '#e8dcbc', { align: 'center', font: 'small' });
      gfx.text('CAMPFIRE    $3', 100, F - 36, '#e8dcbc', { align: 'center', font: 'small' });
      gfx.text('(NOT ON PURPOSE)', 100, F - 24, '#9aa88a', { align: 'center', font: 'small' });
      R(186, F - 48, 44, 34, '#8a8f9c'); R(188, F - 46, 40, 30, '#b8bcc8');
      R(196, F - 30, 8, 12, '#6a6f7c'); R(214, F - 30, 8, 12, '#6a6f7c');
      E(200, F - 16, 4, 2, '#3a2a1a'); E(218, F - 16, 4, 2, '#3a2a1a');
      R(190, F - 52, 36, 4, '#5a5f6a');
      for (let i = 0; i < 4; i++) E(196 + i * 10, F - 56, 3, 3, '#f2ece0');
      R(250, F - 30, 40, 30, '#7a5230'); R(252, F - 28, 36, 26, '#96683c');
      for (let i = 0; i < 3; i++) E(262 + i * 10, F - 34, 4, 4, '#c98a3a');
    },
    books: (g, F, ac) => {
      for (let s = 0; s < 4; s++) {
        const sy = F - 30 - s * 24;
        R(34, sy, 190, 3, '#5a3a24');
        for (let i = 0; i < 44; i++) {
          const h = 10 + ((i * 7 + s * 3) % 8), w = 2 + (i % 3);
          R(36 + i * 4.3, sy - h, w, h, ['#c8452f', '#3a6ba8', '#4a8a5a', '#e0a83a', '#8a5aa8', '#b06a3a'][(i + s) % 6]);
        }
      }
      R(238, F - 54, 46, 54, '#6b4630'); R(240, F - 52, 42, 50, '#82573a');
      for (let i = 0; i < 12; i++) R(242 + (i % 4) * 10, F - 50 + Math.floor(i / 4) * 16, 8, 14, ['#c8452f', '#3a6ba8', '#4a8a5a'][i % 3]);
      gfx.text('SAD', 261, F - 60, '#e8d8f0', { align: 'center', font: 'small' });
    },
    bakery: (g, F, ac) => {
      R(40, F - 70, 130, 58, '#a06a34'); R(42, F - 68, 126, 54, '#c08a4a');
      for (let s = 0; s < 3; s++) {
        const sy = F - 24 - s * 16;
        R(44, sy, 122, 3, '#8a5a2b');
        for (let i = 0; i < 6; i++) { E(54 + i * 20, sy - 4, 7, 4, '#c98a3a'); E(54 + i * 20, sy - 5, 7, 4, '#e8b45a'); E(51 + i * 20, sy - 7, 3, 2, '#f6d89a'); }
      }
      R(190, F - 40, 70, 40, '#e8e2d2'); R(192, F - 38, 66, 36, '#c8dce8');
      for (let i = 0; i < 8; i++) { E(200 + i * 8, F - 30, 3.4, 3, '#e8c06a'); E(200 + i * 8, F - 18, 3.4, 3, '#d8a35a'); }
      R(188, F - 44, 74, 5, '#f6f2e6');
      gfx.text('BUNS  TARTS  RYE', 225, F - 43, '#7a5230', { align: 'center', font: 'small' });
    },
    hardware: (g, F, ac) => {
      R(36, F - 84, 150, 72, '#4a4238'); R(38, F - 82, 146, 68, '#5c5244');
      for (let i = 0; i < 9; i++) { const x = 46 + i * 16; R(x - 1, F - 78, 2, 12, '#8a8f9c'); R(x - 3, F - 66, 6, 4, '#7a4a22'); }
      for (let i = 0; i < 7; i++) { const x = 50 + i * 20; R(x - 4, F - 56, 8, 3, '#b8bcc8'); R(x - 1, F - 53, 2, 10, '#7a4a22'); }
      for (let i = 0; i < 6; i++) { const x = 48 + i * 22; E(x, F - 34, 5, 3, '#8a8f9c'); R(x - 1, F - 40, 2, 7, '#c8a060'); }
      for (let i = 0; i < 4; i++) { R(200 + i * 22, F - 34, 18, 34, '#3a6a8a'); gfx.text('SALT', 209 + i * 22, F - 24, '#dff2ff', { align: 'center', font: 'small' }); }
    },
    thrift: (g, F, ac) => {
      for (let s = 0; s < 2; s++) {
        const ry = F - 84 + s * 44;
        R(36, ry, 210, 2, '#8a8f9c');
        for (let i = 0; i < 16; i++) {
          const x = 42 + i * 13, c = ['#c8452f', '#3a6ba8', '#4a8a5a', '#e0a83a', '#8a5aa8', '#3a7a8a'][(i + s * 2) % 6];
          T(x - 4, ry + 6, x + 4, ry + 6, x, ry + 2, '#b8bcc8');
          R(x - 5, ry + 6, 10, 26, c); R(x - 5, ry + 6, 3, 26, gfx.shade(c, 18));
        }
      }
      R(258, F - 60, 34, 60, '#6b4630'); R(260, F - 58, 30, 42, '#3a3440');
      R(262, F - 56, 26, 38, '#5a6a7a'); gfx.text('TRY', 275, F - 44, '#dceef2', { align: 'center', font: 'small' });
      gfx.text('ME', 275, F - 34, '#dceef2', { align: 'center', font: 'small' });
    },
    records: (g, F, ac) => {
      for (let b = 0; b < 4; b++) {
        const x = 40 + b * 58;
        R(x, F - 34, 50, 34, '#3a2f52'); R(x + 2, F - 32, 46, 30, '#4a3f62');
        for (let i = 0; i < 12; i++) R(x + 5 + i * 3.6, F - 44, 3, 14, ['#c8452f', '#3a6ba8', '#4a8a5a', '#e0a83a', '#8a5aa8'][(i + b) % 5]);
        R(x, F - 36, 50, 3, '#241f30');
      }
      for (let i = 0; i < 5; i++) { const x = 60 + i * 44, y = F - 78 - (i % 2) * 14; E(x, y, 9, 9, '#241f30'); E(x, y, 3, 3, ['#e05a7a', '#3ad6a0', '#ffd84a'][i % 3]); }
      R(272, F - 72, 30, 22, '#241f30'); R(274, F - 70, 26, 18, '#3a3448');
      gfx.text('NEW', 287, F - 64, '#9fdcff', { align: 'center', font: 'small' });
    },
    pharmacy: (g, F, ac) => {
      R(36, F - 86, 200, 74, '#c8d6d0'); R(38, F - 84, 196, 70, '#dfeae4');
      for (let s = 0; s < 4; s++) {
        const sy = F - 22 - s * 16;
        R(40, sy, 192, 2, '#9aa8a2');
        for (let i = 0; i < 18; i++) { const x = 46 + i * 10.6; R(x - 3, sy - 9, 6, 9, ['#e8e2d2', '#cfe4d8', '#e8dcc0'][(i + s) % 3]); R(x - 3, sy - 6, 6, 2, '#3a8a6a'); }
      }
      R(248, F - 52, 44, 52, '#dfeae4'); R(250, F - 50, 40, 48, '#3a8a6a');
      R(258, F - 40, 24, 6, '#e8fff4'); R(266, F - 48, 8, 22, '#e8fff4');
      gfx.text('RX', 270, F - 58, '#3a8a6a', { align: 'center', font: 'small' });
    },
    bait: (g, F, ac) => {
      R(40, F - 44, 70, 44, '#2f4a5a'); R(42, F - 42, 66, 40, '#3f5f72');
      R(46, F - 38, 58, 20, '#cfe6f4'); gfx.text('LIVE', 75, F - 34, '#2f6a8a', { align: 'center', font: 'small' });
      gfx.text('BAIT', 75, F - 26, '#2f6a8a', { align: 'center', font: 'small' });
      for (let i = 0; i < 8; i++) { const x = 130 + i * 18; gfx.line(x, F - 88, x, F - 30, '#8a6a3a'); E(x, F - 88, 2, 2, '#5a4a3a'); R(x - 2, F - 56, 4, 6, '#8a8f9c'); }
      for (let i = 0; i < 10; i++) { const x = 130 + (i % 5) * 18, y = F - 26 + Math.floor(i / 5) * 10; E(x, y, 4, 2.4, ['#c8452f', '#4a9ac8', '#e0a83a'][i % 3]); gfx.line(x + 3, y, x + 6, y - 3, '#8a8f9c'); }
      for (let i = 0; i < 3; i++) { E(258 + i * 14, F - 62, 8, 5, '#4a9ac8'); T(264 + i * 14, F - 65, 264 + i * 14, F - 59, 270 + i * 14, F - 62, '#4a9ac8'); }
    },
    garage: (g, F, ac) => {
      R(30, F - 96, 180, 84, '#3a3f48'); R(32, F - 94, 176, 80, '#454a56');
      for (let i = 0; i < 10; i++) R(38 + i * 17, F - 90, 2, 26, '#8a8f9c');
      for (let i = 0; i < 9; i++) { const x = 42 + i * 19; R(x - 5, F - 64, 10, 3, '#b8bcc8'); R(x - 1, F - 61, 2, 9, '#7a4a22'); }
      for (let i = 0; i < 5; i++) { E(52 + i * 34, F - 38, 13, 13, '#241f30'); E(52 + i * 34, F - 38, 6, 6, '#5a5f6a'); }
      R(226, F - 12, 60, 12, '#5a5f6a'); R(228, F - 10, 56, 8, '#6a6f7c');
      R(232, F - 44, 48, 32, '#7a2f24'); R(234, F - 42, 44, 22, '#9a3f30');
      R(240, F - 38, 14, 12, '#a8c8dc'); R(258, F - 38, 14, 12, '#a8c8dc');
      E(240, F - 12, 7, 7, '#241f30'); E(272, F - 12, 7, 7, '#241f30');
      R(226, F - 56, 60, 4, '#8a8f9c'); R(252, F - 56, 4, 12, '#8a8f9c');
    },
    barber: (g, F, ac) => {
      R(34, F - 96, 210, 60, '#6b4630'); R(36, F - 94, 206, 56, '#2f3a44');
      for (let i = 0; i < 3; i++) { R(44 + i * 70, F - 88, 54, 44, '#8ab0c4'); R(46 + i * 70, F - 86, 50, 40, '#b8d8e8'); R(46 + i * 70, F - 86, 50, 8, '#d8eef8'); }
      R(34, F - 34, 210, 6, '#8a5a4a'); R(34, F - 34, 210, 2, '#a87a64');
      for (let i = 0; i < 9; i++) { const x = 44 + i * 24; R(x - 3, F - 28, 6, 3, '#b8bcc8'); E(x, F - 30, 2, 2, '#c8452f'); }
      for (let i = 0; i < 2; i++) {
        const x = 268 + i * 0, y = F - 6;
        R(x - 16, y - 30, 32, 8, '#b03a4a'); R(x - 14, y - 28, 28, 4, '#c8556a');
        R(x - 4, y - 22, 8, 16, '#8a8f9c'); R(x - 18, y - 6, 36, 6, '#5a5f6a');
        E(x, y - 34, 12, 6, '#7a2a36');
      }
    },
    arcade: (g, F, ac) => {
      for (let i = 0; i < 5; i++) {
        const x = 40 + i * 52, lit = ['#3ad6a0', '#e05a7a', '#9fdcff', '#ffd84a', '#8a5aa8'][i];
        R(x, F - 74, 42, 74, '#241f30'); R(x + 2, F - 72, 38, 70, '#3a2f52');
        R(x + 4, F - 68, 34, 26, '#12101c'); R(x + 6, F - 66, 30, 22, lit);
        for (let j = 0; j < 5; j++) R(x + 8 + j * 6, F - 62 + (j % 2) * 8, 4, 4, '#12101c');
        R(x + 4, F - 38, 34, 10, '#2a2238');
        E(x + 12, F - 34, 2, 2, '#c8452f'); E(x + 20, F - 34, 2, 2, '#ffd84a'); E(x + 28, F - 34, 2, 2, '#3ad6a0');
        R(x + 4, F - 80, 34, 8, lit); gfx.text(['RUN', 'ZAP', 'HOP', 'PEW', 'DIG'][i], x + 21, F - 79, '#12101c', { align: 'center', font: 'small' });
      }
      R(280, F - 40, 26, 40, '#4a2f7a'); R(282, F - 38, 22, 36, '#6a4aa8');
      gfx.text('TOK', 293, F - 30, '#9fdcff', { align: 'center', font: 'small' });
      gfx.text('ENS', 293, F - 22, '#9fdcff', { align: 'center', font: 'small' });
    },
  };

  // ---- the room you walk into ------------------------------------------------
  class ShopScene extends CH.WorldScene {
    constructor(shop, onExit) {
      super({ width: 524, floorY: 214, playerX: 92 });
      this.name = 'shop:' + shop.id;
      this.shop = shop;
      this.onExit = onExit;
      this.line = 0;
      this.build();
    }
    drawRoom(g) {
      const sh = this.shop, F = this.floorY, w = this.width;
      // wall, wainscot and a warm pool of shop light
      gfx.vgrad(0, 0, w, F, [gfx.shade(sh.wall, 14), sh.wall, gfx.shade(sh.wall, -12)]);
      R(0, F - 22, w, 22, gfx.shade(sh.wall, -26));
      R(0, F - 24, w, 3, gfx.shade(sh.accent, -20));
      // floorboards
      R(0, F, w, H - F, sh.floor);
      for (let x = 0; x < w; x += 22) R(x, F, 1, H - F, gfx.shade(sh.floor, -18));
      for (let y = 0; y < H - F; y += 6) R(0, F + y, w, 1, gfx.shade(sh.floor, -8));
      R(0, F, w, 2, gfx.shade(sh.floor, 16));
      // the shop's own fixtures
      (INSIDE[sh.id] || (() => {}))(g, F, sh.accent);
      // street window by the door, with the weather going past outside
      R(22, F - 104, 62, 46, '#3a3440');
      gfx.vgrad(25, F - 101, 56, 40, ['#8fb4d8', '#c8dcec']);
      R(25, F - 78, 56, 18, '#e9f1f7');
      for (let i = 0; i < 3; i++) T(30 + i * 20, F - 78, 44 + i * 20, F - 78, 37 + i * 20, F - 92, '#2f6a24');
      R(52, F - 101, 2, 40, '#3a3440'); R(25, F - 82, 56, 2, '#3a3440');
      // wallpaper above the picture rail, so the top of the room is not dead
      for (let x = 0; x < w; x += 16) {
        R(x, 40, 1, F - 150, gfx.shade(sh.wall, 8));
        for (let y = 48; y < F - 112; y += 20) E(x + 8, y, 2.4, 2.4, gfx.shade(sh.wall, -8));
      }
      R(0, F - 112, w, 4, gfx.shade(sh.accent, -24));
      R(0, F - 112, w, 1, gfx.shade(sh.accent, 10));
      // a clock that is always five past, and a framed print of the lake
      R(322, F - 150, 26, 26, '#3a3440'); E(335, F - 137, 11, 11, '#f6f2e6');
      gfx.line(335, F - 137, 335, F - 144, '#3a3440'); gfx.line(335, F - 137, 340, F - 135, '#3a3440');
      R(112, F - 152, 44, 32, '#6b4630'); R(115, F - 149, 38, 26, '#a8c8dc');
      R(115, F - 132, 38, 9, '#e9f1f7'); T(120, F - 132, 136, F - 132, 128, F - 144, '#2f6a24');
      // ceiling lamps
      for (const lx of [180, 380]) { R(lx - 1, 0, 2, 16, '#3a3440'); E(lx, 18, 12, 6, '#3a3440'); E(lx, 17, 11, 5, '#ffe6a8'); }
      // the shop's own board over the counter
      const nw = gfx.textWidth(sh.name, 'small') + 16;
      R(400 - nw / 2, F - 152, nw, 18, art.INK);
      R(401 - nw / 2, F - 151, nw - 2, 16, gfx.shade(sh.accent, -30));
      R(401 - nw / 2, F - 151, nw - 2, 2, gfx.shade(sh.accent, 6));
      gfx.text(sh.name, 400, F - 147, '#fff6e0', { align: 'center', font: 'small' });
      R(400 - nw / 2 + 4, F - 158, 2, 6, '#3a3440'); R(400 + nw / 2 - 6, F - 158, 2, 6, '#3a3440');
    }
    build() {
      const sh = this.shop, F = this.floorY, self = this;
      // the counter, drawn in front so the keeper stands behind it
      this.addCustom((g, x, y) => {
        R(x, y - 30, 120, 30, '#4a3324');
        R(x + 2, y - 28, 116, 26, '#6b4630');
        R(x + 2, y - 28, 116, 3, '#82573a');
        R(x + 2, y - 14, 116, 2, gfx.shade(sh.accent, -20));
        R(x - 3, y - 34, 126, 5, '#6b4630'); R(x - 3, y - 34, 126, 2, '#8a5a3a');
        R(x + 84, y - 44, 26, 10, '#b8bcc8'); R(x + 86, y - 42, 22, 6, '#3a3440');
        gfx.text('$', x + 97, y - 41, '#3ad6a0', { align: 'center', font: 'small' });
        E(x + 18, y - 38, 6, 4, '#c8452f'); E(x + 18, y - 40, 5, 3, '#e0674a');
      }, 356, F, 120, 34, { id: 'counter', layer: 'front', anim: false });
      // the keeper
      this.keeper = new CH.NPC({ name: sh.keeper.name, species: sh.keeper.species, outfit: sh.keeper.outfit, x: 416, y: F - 12, speed: 10 });
      this.keeper.wanderRange = [382, 452];
      this.addNPC(this.keeper);
      this.addCustom(() => {}, 366, F, 100, 40, {
        id: 'keeperZone', anim: false, hint: sh.keeper.name, range: 60, promptY: F - 58,
        interact: () => this.talkToKeeper(),
      });
      // the fixtures are worth a poke too
      this.addCustom(() => {}, 60, F, 240, 40, {
        id: 'browse', anim: false, hint: 'Browse', range: 70, promptY: F - 70,
        interact: () => ui.say('Chubby', sh.browse || "Nice stuff. {p}Nice stuff I cannot afford.", { face: 'normal' }),
      });
      // the way out
      this.addCustom((g, x, y) => {
        R(x, y - 56, 30, 56, '#4a2e18'); R(x + 2, y - 54, 26, 52, '#8a5a2b');
        R(x + 3, y - 52, 10, 50, '#a97438');
        R(x + 5, y - 48, 20, 16, '#c8dcec'); gfx.frame(x + 5, y - 48, 20, 16, '#4a2e18');
        E(x + 24, y - 26, 1.6, 1.6, '#f5c33b');
        R(x - 4, y - 60, 38, 5, gfx.shade(sh.accent, -30));
        gfx.text('EXIT', x + 15, y - 59, '#f6f2e6', { align: 'center', font: 'small' });
      }, 14, F, 30, 56, { id: 'door', layer: 'back', anim: false, hint: 'Back to the street', range: 24, interact: () => this.leave() });
      this.minX = 34; this.maxX = 496;
      this.ambient = { color: '#6a5a8a', alpha: 0.12 };
      this.addLight({ x: 180, y: 26, rx: 110, ry: 92, color: '#ffd9a0', alpha: 0.08 });
      this.addLight({ x: 380, y: 30, rx: 104, ry: 88, color: '#ffd9a0', alpha: 0.07 });
      this.addLight({ x: 52, y: F - 80, rx: 80, ry: 70, color: '#cfe0ff', alpha: 0.1 });
    }
    *talkToKeeper() {
      const sh = this.shop;
      const seen = CH.flag('shopMet_' + sh.id);
      this.keeper.face = 'happy';
      if (!seen) {
        CH.flag('shopMet_' + sh.id, true);
        yield ui.say(sh.keeper.name, sh.talk[0], { voice: 'blip' });
        yield ui.say(sh.keeper.name, sh.favour, { voice: 'blip' });
      } else {
        yield ui.say(sh.keeper.name, sh.talk[this.line % sh.talk.length], { voice: 'blip' });
        this.line++;
      }
      this.keeper.face = 'normal';
    }
    leave() {
      if (this.leaving) return;
      this.leaving = true;
      A.sfx('door');
      const back = this.onExit;
      CH.game.runGlobal((function* () {
        yield CH.fx.fadeOut(0.3);
        // opened straight from a scene key there is no street underneath, so
        // step out onto one rather than popping the stack empty
        if (CH.game.stack.length > 1) CH.game.pop();
        else CH.game.set(CH.SCENES.travel ? CH.SCENES.travel() : new CH.CabinScene({ mode: 'home' }));
        if (back) back();
        yield CH.fx.fadeIn(0.35);
      })());
    }
    enter() { A.sfx('door'); CH.fx.setFade(0); ui.setObjective(''); }
  }
  CH.ShopScene = ShopScene;

  // Walk into a shop from the street. The town scene stays on the stack, so
  // stepping back out puts Chubby exactly where he was standing.
  CH.enterShop = (id, onExit) => {
    const sh = byId[id];
    if (!sh) return null;
    const scene = new ShopScene(sh, onExit);
    CH.game.push(scene);
    return scene;
  };

  // every shop is also a scene key, so `?scene=shop_coffee` opens it directly
  CH.SCENES = CH.SCENES || {};
  for (const sh of SHOPS) CH.SCENES['shop_' + sh.id] = () => new ShopScene(sh, null);
})(window.CH);
