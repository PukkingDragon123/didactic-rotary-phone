// ============================================================================
// Job listings, sites, responses
// ============================================================================
(function (CH) {
  CH.JOB_LISTINGS = [
    { id: 'quantum', site: 'indeedly', title: 'Senior Quantum Forestry Analyst', company: 'Timber Dynamics Inc.', loc: 'Thunder Bay, ON', pay: '$180,000/yr', type: 'Full-time', posted: '2 days ago',
      desc: 'Lead our quantum forestry division in modeling tree superposition. You will collapse wave functions and also budgets.',
      reqs: ['PhD in Quantum Forestry or related', '15+ years experience', 'Must own a lab coat', 'Comfortable with uncertainty (literally)'],
      qs: [{ q: 'Highest level of education?', a: ['PhD', "Master's", 'High school', 'YouTube University'], good: 0 }, { q: 'Years of forestry experience?', a: ['15+', '5-15', '1-5', 'I have seen a tree'], good: 0 }],
      delay: 14, response: { type: 'reject', from: 'hr@timberdynamics.ca', subject: 'Re: Your application', text: "Dear Chubby,\n\nThank you for applying. We were unable to verify your PhD in Quantum Forestry. We were also unable to verify your high school diploma, as the attached document was a coupon for pancake mix.\n\nWe wish you superposition in your future endeavours.\n\n- Timber Dynamics HR" } },
    { id: 'snow', site: 'indeedly', title: 'Snow Removal Technician', company: 'Municipality of Moose Hollow', loc: 'Moose Hollow, ON', pay: '$24/hr', type: 'Seasonal', posted: '1 day ago',
      desc: 'Remove snow. There is a lot of it. There will always be more. Must provide own truck with plow attachment.',
      reqs: ['Own truck with plow', 'Valid G license', 'Available 4 AM - noon', 'Tolerance for -40°C'],
      qs: [{ q: 'Do you own a truck with a plow?', a: ['Yes', 'No', 'I own a very large hoodie', 'Define truck'], good: 0 }, { q: 'Are you available at 4 AM?', a: ['Yes', 'No', 'Is that AM like morning?', 'I am asleep at 4 AM specifically'], good: 0 }],
      delay: 10, response: { type: 'reject', from: 'works@moosehollow.on.ca', subject: 'Snow Removal Technician', text: "Hello,\n\nUnfortunately a truck is a requirement for the truck-based position. Your note that you 'could push the snow with your body' has been forwarded to our safety officer, who laughed for a long time.\n\nRegards,\nPublic Works" } },
    { id: 'barista', site: 'indeedly', title: 'Barista', company: 'Bean There Café', loc: 'Moose Hollow, ON', pay: '$16.55/hr + tips', type: 'Part-time', posted: '3 hours ago',
      desc: 'Join our cozy team! Craft artisanal beverages with love. Must have 3 years latte art experience and a positive attitude.',
      reqs: ['3+ years latte art', 'Weekend availability', 'Positive attitude', 'Knowledge of oat milk'],
      qs: [{ q: 'Describe your latte art experience.', a: ['3+ years, competitions', 'Some', 'I drink lattes', 'I once drew a hedgehog in maple syrup'], good: 0 }, { q: 'Describe yourself in one word.', a: ['Passionate', 'Punctual', 'Round', 'Hungry'], good: 0 }],
      delay: 9, response: { type: 'reject', from: 'hello@beanthere.ca', subject: 'Barista position', text: "Hi Chubby!!\n\nThanks so much for applying!! We LOVED your energy!! Unfortunately we went with someone who has made a coffee before. Also your cover letter mentioned 'Blue Hedgehog' four times and 'coffee' zero times.\n\nStay cozy!!\n- Bean There ☕" } },
    { id: 'trucker', site: 'indeedly', title: 'Ice Road Trucker', company: 'Northern Haul Logistics', loc: 'Remote / Northern ON', pay: '$95,000/yr', type: 'Contract', posted: '5 days ago',
      desc: 'Drive heavy freight across frozen lakes. The ice is probably fine. Class 1 license and nerves of steel required.',
      reqs: ['Class 1 / AZ license', '5+ years hauling', 'Nerves of steel', 'Own thermos'],
      qs: [{ q: 'License class?', a: ['AZ / Class 1', 'G', 'G2', 'I have a library card'], good: 0 }, { q: 'How do you feel about thin ice?', a: ['Respectful', 'Nervous', 'Terrified', 'I am the thin ice'], good: 0 }],
      delay: 16, response: { type: 'reject', from: 'dispatch@northernhaul.ca', subject: 'Ice Road Trucker', text: "Chubby,\n\nNo license. No experience. Your application listed 'Blue Hedgehog Kart' under driving experience.\n\nWe respect the hustle. No.\n\n- Dispatch" } },
    { id: 'lumber', site: 'indeedly', title: 'Lumberjack (Entry Level)', company: 'Big Pine Logging', loc: 'Moose Hollow, ON', pay: '$22/hr', type: 'Full-time', posted: '1 week ago',
      desc: 'Entry level! We will train! Must be able to lift 80kg, swing an axe, and yell TIMBER convincingly. Attach a short video of yourself lifting something.',
      reqs: ['Lift 80 kg', 'Steel-toe boots', 'Outdoorsy', 'Loud voice'],
      qs: [{ q: 'How much can you lift?', a: ['80+ kg', '40 kg', '20 kg', 'A controller, for 14 hours straight'], good: 0 }, { q: 'Yell TIMBER:', a: ['TIMBER!!!', 'Timber!', 'timber', '(mumbles) timber'], good: 0 }],
      delay: 12, response: { type: 'reject', from: 'gus@bigpine.ca', subject: 'Re: Lumberjack (Entry Level)', text: "Kid,\n\nThe attached video was a 'speedrun' of a hedgehog game. It was 41 minutes long. I watched all of it. It was kind of impressive?\n\nStill no.\n\n- Gus" } },
    { id: 'dogwalker', site: 'kijujube', title: 'Dog Walker Needed', company: 'Paws & Reflect', loc: 'Moose Hollow, ON', pay: '$15/walk', type: 'Gig', posted: '2 days ago',
      desc: 'Walk our 6 huskies daily. They are very energetic. They will pull. You must be faster than 6 huskies.',
      reqs: ['Faster than 6 huskies', 'References', 'Own boots', 'Cardio'],
      qs: [{ q: 'How fast can you run?', a: ['Very fast', 'Fast', 'Average', 'I hop sometimes'], good: 0 }, { q: 'References?', a: ['3 professional', '1 professional', 'My mom', 'My cactus'], good: 0 }],
      delay: 11, response: { type: 'reject', from: 'pawsandreflect@gmail.com', subject: 'dog walker', text: "hey\n\nwe drove past your cabin to check you out (sorry) and saw you through the window. you were on the couch. you were on the couch for a long time.\n\nthe huskies would win. sorry.\n\n- Deb" } },
    { id: 'tester', site: 'linkedout', title: 'Game Tester', company: 'SEGO of Canada', loc: 'Toronto, ON', pay: '$52,000/yr', type: 'Full-time', posted: '4 hours ago',
      desc: 'Play games all day! Report bugs! Live the dream! Note: 4,000+ applicants. Please do not call. Please.',
      reqs: ['Passion for games', 'Attention to detail', 'Bug reporting experience', 'Toronto-based'],
      qs: [{ q: 'Favourite game?', a: ['Blue Hedgehog 2', 'Blue Hedgehog 3', 'Blue Hedgehog Kart', 'All of the above, tattooed'], good: 0 }, { q: 'Can you relocate to Toronto?', a: ['Yes', 'Maybe', 'No', 'Is Toronto near the couch'], good: 0 }],
      delay: 18, response: { type: 'reject', from: 'careers@sego.ca', subject: 'Application #4312 received', text: "Dear Applicant,\n\nThank you for your interest in SEGO of Canada. Your application is number 4,312 in our queue. Estimated response time: 6-8 years.\n\nDo not reply to this email. Do not call. We know it was you who called.\n\n- SEGO Careers (automated)" } },
    { id: 'security', site: 'indeedly', title: 'Night Security Guard', company: 'Moose Hollow Mall', loc: 'Moose Hollow, ON', pay: '$19/hr', type: 'Full-time (nights)', posted: '6 days ago',
      desc: 'Patrol the mall from 10 PM to 6 AM. Must stay awake. This is the whole job. Just stay awake.',
      reqs: ['Stay awake', 'Security license (we can help)', 'Flashlight', 'Stay awake'],
      qs: [{ q: 'Can you stay awake all night?', a: ['Yes, easily', 'Usually', 'If there is a game', 'I fall asleep at movies'], good: 0 }, { q: 'Special skills?', a: ['Observation', 'De-escalation', 'Sleep (expert level)', 'Snacks'], good: 0 }],
      delay: 13, response: { type: 'reject', from: 'security@moosehollowmall.ca', subject: 'Night Security', text: "Hi,\n\nUnder 'Skills' your resume literally says 'Sleep: expert level.' For a night guard position.\n\nWe admire the honesty.\n\n- Mall Security" } },
    { id: 'zamboni', site: 'kijujube', title: 'Zamboni Operator', company: 'Moose Hollow Arena', loc: 'Moose Hollow, ON', pay: '$21/hr', type: 'Part-time', posted: '3 days ago',
      desc: 'Resurface the ice between periods for the Mallards home games. Must be able to skate in case the Zamboni breaks down (it will).',
      reqs: ['Able to skate', 'Ice experience', 'Evenings/weekends', 'Enjoy hockey'],
      qs: [{ q: 'Can you skate?', a: ['Yes, competitively', 'Yes', 'A little', 'I fell once and have not recovered emotionally'], good: 0 }, { q: 'Favourite team?', a: ['Mallards', 'Leafs', 'Whoever is winning', 'Blue Hedgehog Kart team'], good: 0 }],
      delay: 12, response: { type: 'reject', from: 'arena@moosehollow.on.ca', subject: 'Zamboni Operator', text: "Chubby,\n\nYour dad was a Mallard. We remember him. Good man. Great slapshot.\n\nYou cannot skate. He told us that too. Sorry bud.\n\n- Rick at the Arena" } },
    { id: 'donalds', site: 'indeedly', title: 'Janitor / Crew Member', company: "Donald's Burgers", loc: 'Moose Hollow, ON', pay: '$15.50/hr', type: 'Full-time', posted: 'Just now', hot: true,
      // --- presentation only: this listing is a loud, desperate fast-food ad ---
      ad: true, adHeadline: 'NOW HIRING', adSub: 'NO EXPERIENCE NEEDED', adCta: 'APPLY TODAY', adKicker: 'KEVIN QUIT. THE FLOOR IS STICKY.',
      brand: { bg: '#c8352b', bg2: '#a82a22', fg: '#f5d76b', ink: '#8f2419', accent: '#ffffff' },
      desc: "Donald's Burgers is hiring IMMEDIATELY. No experience needed. Must have a pulse. Must like burgers (or tolerate them). Must be willing to touch a mop. Kevin quit.",
      reqs: ['A pulse', 'Willingness to mop', 'Can start tomorrow', 'Tolerance for Brenda'],
      qs: [{ q: 'Do you have a pulse?', a: ['Yes', 'Mostly', 'Let me check', 'I have a heart. It beats for burgers.'], good: 0 }, { q: 'Can you start tomorrow?', a: ['Yes', 'Yes!!', 'YES.', 'What is tomorrow'], good: 0 }, { q: 'Experience with mops?', a: ['Professional', 'Some', 'None, but I am willing', 'I once mopped up a spilled Blue Volt with a sock'], good: 2 }],
      delay: 7, response: { type: 'interview', from: 'brenda@donaldsburgers.ca', subject: "INTERVIEW - Donald's Burgers - TOMORROW 10 AM", text: "Chubby,\n\nGot your application. You wrote 'I have a heart. It beats for burgers.' I don't know if that's a joke. I don't care. Kevin quit and the floor is sticky.\n\nInterview tomorrow, 10 AM, Donald's Burgers on Main St. Wear something clean. Bring the pulse.\n\n- Brenda (Manager)\n\nP.S. It's the one with the big D. Not the M. People get confused." } },
    { id: 'santa', site: 'kijujube', title: 'Mall Santa (Seasonal)', company: 'Moose Hollow Mall', loc: 'Moose Hollow, ON', pay: '$18/hr', type: 'Seasonal', posted: '1 day ago',
      desc: 'Ho ho ho! Seeking a jolly individual with a natural belly. Beard provided. Must love children (or tolerate them). Must not be an actual bear.',
      reqs: ['Natural belly (we can tell)', 'Jolly', 'Patience', 'Not a bear'],
      qs: [{ q: 'Rate your belly.', a: ['Natural and magnificent', 'Adequate', 'Working on it', 'I have been told it jiggles'], good: 0 }, { q: 'Say ho ho ho:', a: ['HO HO HO!', 'Ho ho ho.', 'ho', '...ho?'], good: 0 }],
      delay: 9, response: { type: 'reject', from: 'events@moosehollowmall.ca', subject: 'Mall Santa', text: "Dear Chubby,\n\nYour belly is genuinely excellent and we discussed it at length in the meeting. However the position was filled by an actual bear who wandered in and sat in the chair and we are afraid to ask him to leave.\n\nPlease apply next year.\n\n- Mall Events" } },
    { id: 'dataentry', site: 'kijujube', title: 'WORK FROM HOME $$$ Data Entry $5000/wk', company: 'GlobalMoney Solutionz', loc: 'Remote', pay: '$5,000/wk', type: 'Definitely real', posted: '11 minutes ago',
      desc: 'EARN $$$ FROM YOUR COUCH!!! Type numbers into computer. NO EXPERIENCE. Just send $200 for the STARTER KIT and your bank details for DIRECT DEPOSIT!!!',
      reqs: ['$200 for starter kit', 'Bank details', 'A couch (you have this)', 'Trust'],
      qs: [{ q: 'Please enter your bank password:', a: ['No', 'Absolutely not', 'Nice try', 'hunter2'], good: 0 }, { q: 'Send $200 now?', a: ['No', 'No', 'No', "I don't have $200"], good: 0 }],
      delay: 5, response: { type: 'reject', from: 'winner@globalmoneyz.biz.ru', subject: 'CONGRATULATION YOU ARE HIRED!!!', text: "CONGRATULATION CHUBBY,\n\nYou are HIRE. Please send $200 starter kit fee to unlock $5000/wk. Also your mother's maiden name for VERIFY.\n\nYou did not send money. Position REVOKED. Also you are now on list.\n\n- GlobalMoney Solutionz" } },
  ];
  CH.jobById = (id) => CH.JOB_LISTINGS.find((j) => j.id === id);
  // Presentation-only defaults for the Donald's ad unit (colours, copy, timings).
  CH.DONALDS_AD = { headline: 'NOW HIRING', sub: 'NO EXPERIENCE NEEDED', cta: 'APPLY TODAY', kicker: 'KEVIN QUIT. THE FLOOR IS STICKY.', bg: '#c8352b', bg2: '#a82a22', fg: '#f5d76b', ink: '#8f2419', accent: '#ffffff' };

  CH.COVER_LETTERS = [
    { title: 'Professional', text: 'Dear Hiring Manager, I am writing to express my strong interest in this position. I am a hard-working, detail-oriented individual who is eager to contribute to your team.', score: 2 },
    { title: 'Honest', text: 'Hi. My mom is in the hospital and I need a job. I have never had one. I will try really hard. I am good at video games, which I understand is not relevant. Thank you.', score: 3 },
    { title: 'Blue Hedgehog', text: 'Like the Blue Hedgehog, I move fast (in games). Like the Blue Hedgehog, I collect rings (I have zero rings). Like the Blue Hedgehog, I will defeat Man Egg (your competition). Gotta go fast.', score: 1 },
  ];

  CH.RESUME = {
    name: 'CHUBBY QUILLSWORTH', title: 'Professional Porcupine', contact: 'chubby_gamer_420@hotmoose.ca  -  42 Tamarack Rd',
    sections: [
      ['EXPERIENCE', ['Couch Manager, Self-Employed (2014 - present)', '- Managed a couch', '- Achieved 100% completion in 34 games', '- Ate pancakes at a senior level']],
      ['EDUCATION', ['Moose Hollow Secondary School (diploma pending? unclear)', 'Blue Hedgehog Kart Online Academy (Gold)']],
      ['SKILLS', ['Sleep: expert level', 'Fast fingers', 'Snack identification', 'Being round']],
      ['REFERENCES', ['Mom (she is biased)', 'My cactus (does not talk)']],
    ],
  };
})(window.CH);
