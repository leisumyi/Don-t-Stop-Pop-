# Don’t Stop Pop!

## V1 Hybrid Product Brief + Agentic Development Plan

**Target Platform:** Mobile-first web game  
**Tech:** ThreeJS, JavaScript/TypeScript recommended  
**Deployment:** GitHub Pages  
**Format:** Portrait mobile gameplay inside a phone-shaped frame on desktop  
**Core Pitch:**  
**Don’t Stop Pop!** is a cozy-but-chaotic portrait clicker where players pop escaping birthday balloons, earn **Party Bucks**, buy silly upgrades, collect stamp card badges, and eventually **Buy a New Party!** to reset for stronger future runs.

---

# 1. Development Goal

Build a polished, content-rich first release of **Don’t Stop Pop!**.

The game should feel like a cute mobile birthday-party clicker at first, then gradually become chaotic as more balloons, hazards, upgrades, and visual effects fill the screen.

The V1 goal is not just a tech prototype.  
It should feel like a real playable mobile web game with:

- A complete run loop
- A fail state
- A shop
- Idle helper tools
- Hazards
- Permanent progression
- Prestige
- Badge collection
- Cosmetic progression
- Polished UI and feedback

---

# 2. Core Experience

The player sees a cozy birthday sky scene. Balloons rise from the bottom of the screen toward the top.

The player taps/clicks balloons to pop them before they escape.

Popping balloons earns **Party Bucks**.

If too many balloons escape, the **Balloon Escape Meter** fills.  
When the meter is full, the run ends.

The player can spend Party Bucks during the run on upgrades, emergency tools, and idle helpers.

The longer the run continues, the more chaotic the game becomes.

The player can choose to **Buy a New Party!** before losing. This safely resets the run and grants a permanent Party Multiplier based on their current Party Bucks.

The core tension should be:

> “Do I cash out now, or push this party a little longer?”

---

# 3. Design Pillars

## 3.1 Cozy First Impression

The game should immediately feel soft, charming, readable, and friendly.

Early run feeling:

- Calm blue sky
- Soft clouds
- Gentle balloons
- Relaxed music
- Cute UI
- Soft pop sounds
- Low pressure

---

## 3.2 Escalating Balloon Chaos

The game should slowly become intense.

Late run feeling:

- More balloons
- Faster balloons
- Wind gusts
- Cloud cover
- Combo pressure
- Idle tools firing
- Emergency item decisions
- Balloon Escape Meter nearly full

The emotional curve should be:

> “Aww, this is cute.”  
> “Okay, this is getting busy.”  
> “Wait, wait, wait, stop floating away!”  
> “I need one more upgrade.”

---

## 3.3 Satisfying Manual Popping

Manual popping is the main emotional interaction.

Every pop should feel good through:

- Immediate visual feedback
- Tiny screen/UI pulse
- Pop particles
- Soft sound effect
- Party Bucks floating text
- Combo feedback
- Balloon squash/stretch or burst animation

The game is a hybrid clicker/idle game, but it should lean toward manual play.

Idle tools help, but the player should still feel responsible for survival.

---

## 3.4 Meaningful Idle Growth

Idle tools should visibly help the player survive longer.

They should become chaotic visual helpers, but they should not fully replace manual popping.

The screen should eventually feel like a silly little party machine.

---

## 3.5 Gentle Failure

Losing should be funny, not punishing emotionally.

The fail screen should rotate between cute “official notice” style messages.

Failure should feel like:

> “Oh no, I messed up — but that was funny. One more run.”

---

## 3.6 Long-Term Collection

The player should keep coming back for:

- Badges
- Stamp Card progress
- Cosmetic themes
- Sticker Shine
- Balloon skins
- Background themes
- Permanent boosts
- Prestige multiplier

---

# 4. Target Game Loop

## 4.1 Moment-to-Moment Loop

1. Balloon rises.
2. Player taps balloon.
3. Balloon pops with particles and sound.
4. Player earns Party Bucks.
5. Combo increases if popping quickly.
6. More balloons appear.
7. Player reacts to hazards and escape pressure.

---

## 4.2 Run Loop

1. Start run from 0 Party Bucks.
2. Pop balloons and earn Party Bucks.
3. Buy shop items.
4. Survive difficulty phases.
5. Earn badges and milestone progress.
6. Decide whether to keep pushing or prestige.
7. Lose if Balloon Escape Meter fills.
8. Restart or cash out through **Buy a New Party!** if eligible.

---

## 4.3 Meta Loop

1. Earn badges.
2. Earn Sticker Shine.
3. Unlock cosmetics.
4. Polish badges.
5. Gain permanent boosts.
6. Prestige for Party Multiplier.
7. Start stronger next run.

---

# 5. Platform and Layout Requirements

## 5.1 Mobile-First Portrait Design

The game must be built around portrait mobile play.

Recommended logical canvas ratio:

- **9:16**
- Example: `390 x 844`, `414 x 896`, or scalable equivalent

On desktop:

- Show a centered phone-shaped game frame.
- Keep portrait proportions.
- Do not stretch gameplay into landscape.
- Background outside the phone frame may be soft blurred party-themed art or a simple darkened page backdrop.

On mobile:

- Fill available screen.
- Avoid browser scroll.
- Use large tap targets.
- Keep important UI away from device edges.

---

## 5.2 Input

Support:

- Mouse click
- Touch tap
- Pointer events preferred

Use unified pointer input so desktop and mobile behave consistently.

---

# 6. Visual Direction

## 6.1 Style

Use a **2.5D layered look**.

The game should feel like a polished modern mobile game, not a plain web demo.

Visual ingredients:

- Soft sky gradient
- Layered clouds
- Garden/backyard party elements
- Balloons with soft highlights
- Simple shadows
- Cute rounded UI panels
- Sticker-book visual language
- Confetti and sparkle particles
- Subtle parallax background movement

---

## 6.2 World Layers

Suggested layers from back to front:

1. Sky gradient
2. Distant soft clouds
3. Background party decorations
4. Mid-layer floating clouds/hazards
5. Balloons
6. Pop effects and particles
7. Gameplay HUD
8. Bottom navigation/shop overlays
9. Modal screens

---

## 6.3 UI Style

UI should feel like a birthday invitation/sticker book.

Use:

- Rounded panels
- Soft shadows
- Pastel colors
- Paper texture suggestion
- Sticker-style badges
- Soft button bounce
- Clear iconography
- Minimal text

Avoid:

- Generic grey panels
- Harsh neon arcade styling
- Meme-heavy UI
- Cluttered mobile layout
- Tiny text

---

# 7. Core Systems

---

# 7.1 Balloons

## Required V1 Balloon Types

Implement at least 5 balloon types.

### 1. Normal Balloon

Basic balloon.

- Reward: low Party Bucks
- Escape value: low
- Speed: medium
- Purpose: core target

Example:

- Pop reward: `1 Party Buck`
- Escape penalty: `+1 Balloon Escape Meter`

---

### 2. Fast Balloon

Moves faster than normal.

- Reward: slightly higher
- Escape value: medium
- Purpose: creates reaction pressure

Example:

- Pop reward: `2 Party Bucks`
- Escape penalty: `+2 Balloon Escape Meter`

---

### 3. Golden Balloon

Temptation balloon.

- Reward: high
- Escape value: still dangerous
- Purpose: risk/reward target

Example:

- Pop reward: `10 Party Bucks`
- Escape penalty: `+2 Balloon Escape Meter`

Important: Golden balloons are not risk-free. If they escape, they still punish the player.

---

### 4. Tiny Balloon

Small hit target.

- Reward: medium
- Escape value: low/medium
- Purpose: skill test

Example:

- Pop reward: `3 Party Bucks`
- Escape penalty: `+1 Balloon Escape Meter`

---

### 5. Fine Risk Balloon

High-danger balloon.

- Reward: high
- Escape value: very high
- Purpose: priority panic target

Example:

- Pop reward: `8 Party Bucks`
- Escape penalty: `+5 Balloon Escape Meter`

Visual idea: Slightly official-looking balloon with a tiny warning tag/ribbon.

---

# 7.2 Balloon Escape Meter

This is the main lose condition.

## Rules

- Balloons rise from the bottom to the top.
- If a balloon reaches the top without being popped, it escapes.
- Escaped balloons add to the **Balloon Escape Meter**.
- Different balloon types add different escape values.
- When the meter reaches max, the player loses.

## Recommended Starting Values

```

```

```
balloonEscapeMeter = 0
balloonEscapeMeterMax = 20
```

Example escape values:

```

```

```
normal: +1
fast: +2
golden: +2
tiny: +1
fineRisk: +5
```

Emergency items can reduce the meter.

Manual popping should not reduce the meter by default.

---

# 7.3 Party Bucks

Party Bucks are the main in-run currency.

## Earned From

-   
Popping balloons  

-   
Combo bonuses  

-   
Event bonuses  

-   
Idle helper pops  

-   
Special balloons  


## Spent On

-   
Run-based upgrades  

-   
Idle tools  

-   
Emergency items  

-   
Temporary boosts  

-   
Early shop unlocks  


## Lost On Failure

When the player loses, they lose:

-   
Current Party Bucks  

-   
Temporary powerups  

-   
Run-based idle upgrades  

-   
Active event bonuses  


They keep:

-   
Badges  

-   
Stamp Card progress  

-   
Cosmetics  

-   
Sticker Shine  

-   
Permanent boosts  

-   
Prestige multiplier  


---

# 7.4 Party Multiplier

The Party Multiplier is a permanent prestige bonus.

It increases future Party Bucks earnings.

Example:

```

```

```
finalPartyBucksEarned = basePartyBucks * (1 + partyMultiplier)
```

Where:

```

```

```
partyMultiplier = 0.5 // +50%
```

A balloon worth `1 Party Buck` becomes worth `1.5 Party Bucks`.

---

# 8. Shop System

The starter shop should include all 5 items below.

Shop purchases are run-based unless explicitly marked permanent.

---

## 8.1 Dart Thrower

Idle helper.

Automatically pops balloons at intervals.

### Behavior

-   
Targets a random balloon or highest-risk balloon.  

-   
Fires a dart visually.  

-   
Pops the balloon on hit.  

-   
Earns Party Bucks for the player.  

-   
Can be upgraded during the run.  


### Upgrade Examples

Level 1:

-   
Fires every 5 seconds  


Level 2:

-   
Fires every 4 seconds  


Level 3:

-   
Fires every 3 seconds  


Level 4:

-   
Fires every 2.25 seconds  


Level 5:

-   
Fires every 1.5 seconds  


Design note: Dart Thrower should help but not carry the entire run.

---

## 8.2 Cloud Blower

Emergency/hazard tool.

Clears or reduces cloud cover.

### Behavior

-   
If Cloud Cover is active, temporarily clears visibility.  

-   
If Cloud Cover is not active, can create a short “clear sky” protection window.  


Suggested V1 behavior:

-   
Clears Cloud Cover for 8 seconds.  

-   
Prevents new Cloud Cover for 5 seconds.  


---

## 8.3 Cake Freeze

Emergency slow-motion tool.

### Behavior

-   
Temporarily slows all balloons.  

-   
Good for panic moments.  


Suggested V1 behavior:

-   
Slows balloons by 50%.  

-   
Duration: 5 seconds.  

-   
Visual: frosty cake sparkle overlay.  


---

## 8.4 Party Net

Escape recovery tool.

### Behavior

-   
Reduces Balloon Escape Meter.  

-   
Gives player a second chance.  


Suggested V1 behavior:

-   
Reduces meter by 5.  

-   
Cannot reduce below 0.  


---

## 8.5 Combo Ribbon

Temporary combo support item.

### Behavior

-   
Extends combo timer.  

-   
Helps skilled manual popping.  

-   
Encourages active play.  


Suggested V1 behavior:

-   
Combo duration increased by 30% for 20 seconds.  


---

# 9. Combo System

The combo system rewards fast manual popping.

## Basic Rules

-   
Each successful pop increases combo.  

-   
Combo resets if the player waits too long between pops.  

-   
Higher combo increases Party Bucks earned.  

-   
Combo should feel exciting but readable.  


## Recommended Prototype Values

```

```

```
comboCount = 0
comboTimer = 2.0 seconds
```

Example multiplier bands:

```

```

```
x1 combo: normal rewards
x5 combo: +10% Party Bucks
x10 combo: +25% Party Bucks
x25 combo: +50% Party Bucks
```

Combo text should appear near the HUD but not block balloons.

---

# 10. Difficulty Phases

The game is endless until overwhelmed.

Difficulty should ramp through phases, not through random chaos immediately.

## Recommended Phase Structure

### Phase 1: Cozy Start

Time: `0:00–1:00`

-   
Normal balloons only  

-   
Slow spawn rate  

-   
Calm music  

-   
No hazards  

-   
Tutorial can occur here  


Goal: teach player the core interaction.

---

### Phase 2: Getting Busy

Time: `1:00–2:30`

-   
Introduce fast balloons  

-   
Slightly higher spawn rate  

-   
Shop becomes more relevant  


Goal: player starts buying upgrades.

---

### Phase 3: First Trouble

Time: `2:30–4:00`

-   
Introduce Wind hazard  

-   
Introduce Tiny balloons  

-   
Balloon Escape Meter pressure rises  


Goal: player needs attention and tools.

---

### Phase 4: Cloudy Chaos

Time: `4:00–6:00`

-   
Introduce Cloud Cover  

-   
Introduce Golden balloons  

-   
More balloons on screen  


Goal: player starts making emergency item decisions.

---

### Phase 5: Party Panic

Time: `6:00+`

-   
Introduce Fine Risk Balloons  

-   
Faster spawn rate  

-   
More overlapping hazards  

-   
Idle tools firing often  

-   
Player must choose whether to cash out or risk failure  


Goal: create “one more run” tension.

---

# 11. Hazards and Events

Implement at least 3 V1 hazards/events.

---

## 11.1 Windstorm

Wind pushes balloons sideways or changes their path.

### Behavior

-   
Balloons drift left/right.  

-   
Makes tapping harder.  

-   
Lasts for a short duration.  


Suggested values:

```

```

```
duration: 15 seconds
windStrength: mild to medium
```

Visuals:

-   
Curved wind streaks  

-   
Swaying balloons  

-   
UI warning: “Windstorm!”  


---

## 11.2 Cloud Cover

Clouds obscure parts of the playfield.

### Behavior

-   
Semi-transparent clouds drift across screen.  

-   
Balloons behind clouds are harder to see.  

-   
Cloud Blower can clear it.  


Suggested values:

```

```

```
duration: 15 seconds
visibilityReduction: partial, not unfair
```

Important: The player should still be able to play. Do not make it fully blind.

---

## 11.3 Birthday Rush

Temporary balloon surge.

### Behavior

-   
Spawn rate increases heavily for a short duration.  

-   
More reward potential.  

-   
More escape risk.  


Suggested values:

```

```

```
duration: 20 seconds
spawnRateMultiplier: 1.75
rewardMultiplier: 1.25 optional
```

This should feel exciting, not purely punishing.

---

# 12. Tutorial

Use a tiny 3-step tutorial with very little reading.

Only show to first-time players.

## Step 1

Text:

> Tap balloons before they float away!

Action required:

-   
Player pops 1 balloon.  


---

## Step 2

Text:

> Pops earn Party Bucks.

Action required:

-   
Show Party Bucks increasing.  


---

## Step 3

Text:

> Buy helpers when the party gets busy.

Action required:

-   
Highlight shop button.  


Then tutorial ends.

Do not force a long tutorial.

Do not block gameplay more than necessary.

---

# 13. Fail Screen

When the Balloon Escape Meter fills, show a fail screen.

The fail screen should be clean and funny.

## Required Fail Screen Elements

-   
Rotating fail title  

-   
Rotating fail text  

-   
Run summary  

-   
Try Again button  

-   
Shop/Upgrades button  

-   
Stamp Card button  

-   
Buy a New Party! button if unlocked  

-   
Party Bucks lost reminder  

-   
Badges earned this run, if any  


---

## Fail Screen Message Rotation

Use these 10 fail messages for V1.

### 1. Environmental Impact Fine

Too many balloons escaped into the sky.  
  
The local ducks have filed a complaint.

### 2. Sky Litter Warning

A suspicious number of balloons have drifted beyond party limits.  
  
Please pop responsibly.

### 3. Party Permit Violation

Your party exceeded the recommended balloon escape allowance.  
  
The council is pretending to be disappointed.

### 4. Balloon Recovery Notice

Several balloons were last seen heading toward the clouds.  
  
Recovery costs have been deducted from your Party Bucks.

### 5. Neighbourhood Balloon Alert

Mrs. Wobbleton from next door reported “colourful sky nonsense.”  
  
Your Party Bucks have been confiscated.

### 6. Official Cleanup Notice

The cleanup team found ribbon trails in three gardens and one birdbath.  
  
That means paperwork.

### 7. Floating Object Complaint

Local pigeons have requested a safer working environment.  
  
Your party has been temporarily shut down.

### 8. Party Over Notice

The balloons got away.  
  
The cake survived, but your wallet did not.

### 9. Cloud Patrol Warning

Escaped balloons have entered cloud territory.  
  
The clouds are not amused.

### 10. Backyard Safety Report

Too many balloons left the birthday zone.  
  
The tree saw everything.

---

# 14. Prestige System

## Feature Name

**Buy a New Party!**

This should be visible from early in the game but locked until the player reaches the required Party Bucks threshold.

## Recommended Unlock Requirement

```

```

```
currentRunPartyBucks >= 1000
```

The button can show:

> Buy a New Party!  
>
> Unlocks at 1,000 Party Bucks

Once unlocked:

> Buy a New Party!  
>
> Cash out for a permanent Party Multiplier.

---

## Prestige Behavior

When the player uses **Buy a New Party!**:

Reset:

-   
Current Party Bucks to 0  

-   
Run upgrades  

-   
Temporary powerups  

-   
Active event bonuses  

-   
Current run state  


Keep:

-   
Cosmetics  

-   
Badges  

-   
Stamp Card progress  

-   
Sticker Shine  

-   
Permanent boosts  

-   
Existing Party Multiplier  


Grant:

-   
Additional permanent Party Multiplier based on current Party Bucks  


---

## Prestige Reward Curve

Use this as a starting curve:

```

```

```
1000 Party Bucks = +5% permanent earnings
5000 Party Bucks = +15% permanent earnings
25000 Party Bucks = +40% permanent earnings
100000 Party Bucks = +100% permanent earnings
```

Implementation can use either thresholds or a formula.

Recommended simple formula for V1:

```

```

```
prestigeGain = Math.floor(Math.sqrt(currentPartyBucks / 1000)) * 0.05
```

Example:

-   
1,000 Party Bucks = +5%  

-   
4,000 Party Bucks = +10%  

-   
9,000 Party Bucks = +15%  

-   
25,000 Party Bucks = +25%  


Alternative threshold method is also acceptable if easier to balance.

Important: Prestige must be a safe manual cash-out.  
  
If the player loses normally, they do not gain the prestige multiplier.

---

# 15. Party Stamp Card

The **Party Stamp Card** is the achievement and cosmetic collection hub.

It should feel like a cozy sticker book.

## Stamp Card Tab Requirements

The tab should show:

-   
Earned badges  

-   
Locked badge slots  

-   
Badge progress  

-   
Sticker Shine amount  

-   
Cosmetic unlocks  

-   
Badge polish options  

-   
Rewards unlocked from badge collection  


---

## Visual Direction

Use:

-   
Soft paper texture  

-   
Rounded badge stickers  

-   
Cute icons  

-   
Light glitter  

-   
Sticker-book layout  

-   
Gentle open/close sounds  

-   
Sparkles when polishing badges  


---

# 16. Badges

V1 should include **25–40 badges**.

For the first implementation, build the badge system data-driven so new badges can be added through a config array.

## Badge Data Structure Example

```

```

```
{
  id: "pop_100",
  name: "Balloon Beginner",
  description: "Pop 100 balloons.",
  category: "Popping",
  requirementType: "total_balloons_popped",
  requirementValue: 100,
  rewardStickerShine: 5,
  isUnlocked: false,
  isPolished: false,
  polishCost: 10,
  polishBonus: {
    type: "party_bucks_bonus",
    value: 0.01
  }
}
```

---

## Required Badge Categories

### Popping Badges

Examples:

-   
Pop 100 balloons  

-   
Pop 1,000 balloons  

-   
Pop 10,000 balloons  

-   
Pop 100 golden balloons  

-   
Pop 500 tiny balloons  

-   
Pop 50 Fine Risk Balloons  


---

### Survival Badges

Examples:

-   
Survive 2 minutes  

-   
Survive 5 minutes  

-   
Survive 10 minutes  

-   
Survive a Windstorm  

-   
Survive Cloud Cover  

-   
Survive Birthday Rush  


---

### Upgrade Badges

Examples:

-   
Buy your first Dart Thrower  

-   
Max out Dart Thrower  

-   
Buy 10 shop upgrades in one run  

-   
Own 3 idle/help tools at once  

-   
Use 5 instant powerups in one run  


---

### Skill Badges

Examples:

-   
Reach a x10 combo  

-   
Reach a x25 combo  

-   
Lose with only 1 balloon away from failure  

-   
Pop 20 balloons during Cloud Cover  

-   
Pop 50 balloons during Windstorm  


---

### Prestige Badges

Examples:

-   
Buy a New Party once  

-   
Buy a New Party 5 times  

-   
Reach a 100% Party Multiplier  

-   
Reach a 500% Party Multiplier  


---

# 17. Sticker Shine

Sticker Shine is the long-term collection currency.

## Earned From

-   
Badge milestones  

-   
Prestige resets  

-   
Special achievements  


Do not include daily challenges in V1.

## Spent On

-   
Badge polishing  

-   
Stamp Card themes  

-   
Balloon skins  

-   
Background themes  

-   
Pop effects  

-   
UI themes  


Party Bucks should stay focused on run-based purchases.  
  
Sticker Shine should stay focused on long-term collection.

---

# 18. Badge Polishing

Players can polish earned badges using Sticker Shine.

Polished badges should give:

-   
Shiny visual effect  

-   
Sparkle animation  

-   
Upgraded stamp card look  

-   
Optional tiny permanent passive bonus  


## Example Polish Bonuses

Keep bonuses small.

Examples:

-   
+1% Party Bucks from normal balloons  

-   
+2% golden balloon spawn chance  

-   
+1% idle pop speed  

-   
+1% combo duration  

-   
+1% chance for bonus Party Bucks on pop  


The main value should be cosmetic satisfaction.

---

# 19. Cosmetics

V1 target:

-   
5 stamp card themes  

-   
5 background themes  

-   
5 balloon skins  

-   
5 pop effects  

-   
5 UI themes  


Cosmetics should be unlocked or bought with Sticker Shine.

---

## 19.1 Stamp Card Themes

Examples:

1.   
Classic Birthday Card  

2.   
Glitter Party Card  

3.   
Dinosaur Party Card  

4.   
Space Party Card  

5.   
Pastel Picnic Card  


---

## 19.2 Background Themes

Examples:

1.   
Sunny Suburban Garden  

2.   
Sunset Birthday Party  

3.   
Cloudy Afternoon  

4.   
Treehouse Party  

5.   
Space-Themed Party Sky  


---

## 19.3 Balloon Skins

Examples:

1.   
Classic Balloons  

2.   
Pastel Balloons  

3.   
Star Balloons  

4.   
Confetti Balloons  

5.   
Polka Dot Balloons  


---

## 19.4 Pop Effects

Examples:

1.   
Confetti Burst  

2.   
Glitter Puff  

3.   
Bubble Pop  

4.   
Star Sparkle  

5.   
Paper Streamer Burst  


---

## 19.5 UI Themes

Examples:

1.   
Paper Party UI  

2.   
Sticker Book UI  

3.   
Pastel Toy UI  

4.   
Birthday Invitation UI  

5.   
Glitter Card UI  


---

# 20. Permanent Boosts

V1 should include 8–12 permanent boosts.

These should be harder to earn than cosmetics.

Examples:

-   
+5% Party Bucks earned  

-   
+5% idle pop speed  

-   
+1 starting Balloon Escape Meter safety  

-   
+5% golden balloon chance  

-   
+5% combo duration  

-   
+5% slower first-minute difficulty scaling  

-   
+1 free Cloud Blower per run  

-   
+1 free Cake Freeze per run  


Permanent boosts should not remove the challenge.

---

# 21. Data Persistence

Use browser local storage for V1.

Persist:

-   
Total balloons popped  

-   
Total Party Bucks earned lifetime  

-   
Badges unlocked  

-   
Badges polished  

-   
Sticker Shine  

-   
Cosmetics owned  

-   
Equipped cosmetics  

-   
Party Multiplier  

-   
Permanent boosts  

-   
Prestige count  

-   
Tutorial completed  


Do not persist current run unless desired.  
  
It is acceptable for each page refresh to start a new run for V1.

---

# 22. Recommended Technical Structure

Use a modular structure.

Example:

```

```

```
/src
  /core
    GameLoop.ts
    StateMachine.ts
    SaveSystem.ts
    Economy.ts
  /three
    Renderer.ts
    SceneSetup.ts
    Camera.ts
    ParallaxBackground.ts
  /gameplay
    BalloonManager.ts
    Balloon.ts
    HazardManager.ts
    ComboSystem.ts
    DifficultyManager.ts
    EscapeMeter.ts
  /systems
    ShopSystem.ts
    UpgradeSystem.ts
    PrestigeSystem.ts
    BadgeSystem.ts
    CosmeticSystem.ts
    StampCardSystem.ts
  /ui
    HUD.ts
    ShopPanel.ts
    StampCardPanel.ts
    FailScreen.ts
    TutorialOverlay.ts
    PrestigePanel.ts
  /data
    balloons.ts
    upgrades.ts
    badges.ts
    cosmetics.ts
    failMessages.ts
    difficultyPhases.ts
```

If using plain JavaScript instead of TypeScript, keep the same modular idea.

---

# 23. Game State Model

Recommended states:

```

```

```
BOOT
MAIN_MENU
TUTORIAL
RUNNING
PAUSED
SHOP_OPEN
STAMP_CARD_OPEN
PRESTIGE_CONFIRM
FAILED
```

Important:

-   
Shop and Stamp Card can be overlays.  

-   
Gameplay may pause when shop is open, depending on desired feel.  

-   
For V1, pausing during shop is acceptable and more mobile-friendly.  


---

# 24. Prototype Milestone

## Goal

Create a playable core loop.

This is not full V1 yet.  
  
It should prove the game is fun.

## Prototype Must Include

-   
Portrait phone-shaped layout  

-   
Balloons rising from bottom to top  

-   
Tap/click to pop  

-   
Party Bucks  

-   
Balloon Escape Meter  

-   
Lose state  

-   
Rotating fail messages  

-   
Basic shop tab  

-   
Dart Thrower  

-   
Windstorm  

-   
Cloud Cover  

-   
Difficulty phases  

-   
Simple combo system  

-   
Party Stamp Card tab  

-   
5 starter badges  

-   
Buy a New Party! button  

-   
Simple Party Multiplier  

-   
Local save for permanent data  


## Prototype Acceptance Criteria

The prototype is complete when:

-   
Player can start a run.  

-   
Balloons spawn and rise.  

-   
Player can pop balloons.  

-   
Party Bucks increase.  

-   
Balloons escaping fill Balloon Escape Meter.  

-   
Player loses when the meter fills.  

-   
Fail screen appears with rotating text.  

-   
Player can restart.  

-   
Player can buy Dart Thrower.  

-   
Dart Thrower visibly auto-pops balloons.  

-   
Windstorm and Cloud Cover can occur.  

-   
At least 5 badges can unlock.  

-   
Stamp Card tab displays badges.  

-   
Buy a New Party! works after unlock requirement.  

-   
Party Multiplier affects future earnings.  

-   
Progress saves after refresh.  


---

# 25. V1 Milestone Roadmap

---

## Milestone 1: Project Foundation

### Goal

Set up the technical base.

### Tasks

-   
Create ThreeJS project.  

-   
Configure GitHub Pages deployment.  

-   
Build portrait canvas scaling.  

-   
Add phone-shaped desktop frame.  

-   
Add basic game loop.  

-   
Add state management.  

-   
Add local storage save system.  

-   
Add placeholder UI layer.  


### Acceptance Criteria

-   
Game runs locally.  

-   
Game can be deployed to GitHub Pages.  

-   
Canvas stays portrait on desktop and mobile.  

-   
Basic UI can be clicked/tapped.  

-   
Save system can write/read test values.  


---

## Milestone 2: Core Balloon Gameplay

### Goal

Make popping balloons fun.

### Tasks

-   
Implement balloon spawning.  

-   
Implement balloon movement.  

-   
Implement pointer/touch popping.  

-   
Add balloon pop animation.  

-   
Add Party Bucks reward.  

-   
Add floating reward text.  

-   
Add basic particles.  

-   
Add Balloon Escape Meter.  

-   
Add lose condition.  


### Acceptance Criteria

-   
Balloons rise from bottom to top.  

-   
Player can pop balloons reliably.  

-   
Popping gives Party Bucks.  

-   
Escaped balloons fill meter.  

-   
Meter reaching max ends run.  

-   
Pop feedback feels responsive.  


---

## Milestone 3: Game Feel Pass

### Goal

Make the core interaction juicy.

### Tasks

-   
Add squash/stretch on balloons.  

-   
Add pop particles.  

-   
Add sound placeholders.  

-   
Add combo feedback.  

-   
Add tiny HUD bounce on currency gain.  

-   
Add screen shake/pulse for danger moments.  

-   
Add better balloon visuals.  


### Acceptance Criteria

-   
Popping feels satisfying.  

-   
Player can clearly see rewards.  

-   
Combo feedback is readable.  

-   
Escape danger is noticeable but not annoying.  


---

## Milestone 4: Shop and Run Upgrades

### Goal

Add meaningful in-run decisions.

### Tasks

Implement starter shop:

-   
Dart Thrower  

-   
Cloud Blower  

-   
Cake Freeze  

-   
Party Net  

-   
Combo Ribbon  


Add upgrade pricing and purchase logic.

### Acceptance Criteria

-   
Player can open shop.  

-   
Player can buy all 5 starter items.  

-   
Items affect gameplay.  

-   
Shop is readable on mobile.  

-   
Purchases reset on failed run.  

-   
Shop does not feel cluttered.  


---

## Milestone 5: Difficulty Phases and Hazards

### Goal

Create cozy-to-chaotic pacing.

### Tasks

-   
Implement DifficultyManager.  

-   
Add phase-based spawn scaling.  

-   
Add Windstorm.  

-   
Add Cloud Cover.  

-   
Add Birthday Rush.  

-   
Add hazard warnings.  

-   
Add hazard timers.  


### Acceptance Criteria

-   
First minute is calm.  

-   
Hazards appear later.  

-   
Windstorm changes balloon movement.  

-   
Cloud Cover affects visibility.  

-   
Birthday Rush increases spawn pressure.  

-   
Hazards are understandable and fair.  


---

## Milestone 6: Fail Screen and Replay Loop

### Goal

Make losing feel polished and replayable.

### Tasks

-   
Implement fail screen.  

-   
Add 10 rotating fail messages.  

-   
Add run summary.  

-   
Add Try Again button.  

-   
Add Shop button.  

-   
Add Stamp Card button.  

-   
Add Buy a New Party! button if unlocked.  


### Acceptance Criteria

-   
Losing feels clear.  

-   
Fail message rotates.  

-   
Player sees what they achieved.  

-   
Player can quickly restart.  

-   
Player understands Party Bucks were lost.  

-   
Permanent rewards remain.  


---

## Milestone 7: Prestige System

### Goal

Add long-term reset strategy.

### Tasks

-   
Add visible locked Buy a New Party! button.  

-   
Unlock at Party Bucks threshold.  

-   
Add prestige confirmation modal.  

-   
Add Party Multiplier calculation.  

-   
Reset run on prestige.  

-   
Save permanent multiplier.  

-   
Show multiplier in UI.  


### Acceptance Criteria

-   
Button is visible before unlock.  

-   
Requirement is clear.  

-   
Player can prestige safely.  

-   
Party Bucks reset after prestige.  

-   
Party Multiplier persists.  

-   
Future runs earn more Party Bucks.  


---

## Milestone 8: Badge and Stamp Card System

### Goal

Add collection and milestone progression.

### Tasks

-   
Create data-driven badge system.  

-   
Track badge progress.  

-   
Add badge unlock popups.  

-   
Build Stamp Card tab.  

-   
Show earned/locked badges.  

-   
Add 25–40 badges.  

-   
Add Sticker Shine rewards.  

-   
Save badge progress.  


### Acceptance Criteria

-   
Badge progress updates correctly.  

-   
Badges unlock during play.  

-   
Stamp Card tab displays progress.  

-   
Sticker Shine is awarded.  

-   
Badges persist after refresh.  

-   
Stamp Card feels cozy and collectible.  


---

## Milestone 9: Badge Polishing and Cosmetics

### Goal

Add long-term cosmetic motivation.

### Tasks

-   
Add Sticker Shine spending.  

-   
Add badge polish system.  

-   
Add polished badge visuals.  

-   
Add cosmetic shop or cosmetic section.  

-   
Add cosmetic categories.  

-   
Add equip logic.  

-   
Save equipped cosmetics.  


### Acceptance Criteria

-   
Player can polish earned badges.  

-   
Polished badges visually change.  

-   
Sticker Shine decreases when spent.  

-   
Player can unlock/equip cosmetics.  

-   
Cosmetics persist.  

-   
Cosmetic changes are visible in game.  


---

## Milestone 10: V1 Content Fill

### Goal

Reach content-rich first release.

### Required Content

-   
5 balloon types  

-   
5 shop items  

-   
3 hazards/events  

-   
25–40 badges  

-   
5 stamp card themes  

-   
5 background themes  

-   
5 balloon skins  

-   
5 pop effects  

-   
5 UI themes  

-   
8–12 permanent boosts  

-   
10 fail messages  


### Acceptance Criteria

-   
Content is implemented through data/config where possible.  

-   
No major system is hardcoded in a way that blocks expansion.  

-   
Player has clear short-term and long-term goals.  


---

## Milestone 11: Polish and Mobile UX

### Goal

Make the game feel like a polished mobile release.

### Tasks

-   
Improve UI layout.  

-   
Add button animations.  

-   
Add panel transitions.  

-   
Improve readability.  

-   
Add sound pass.  

-   
Add particle pass.  

-   
Add onboarding refinement.  

-   
Add performance checks.  

-   
Add mobile tap target checks.  

-   
Add desktop phone-frame polish.  


### Acceptance Criteria

-   
Game looks good at mobile size.  

-   
UI is readable and not cluttered.  

-   
Taps feel responsive.  

-   
No important buttons are too small.  

-   
Game maintains stable performance.  

-   
The first 60 seconds feel charming.  

-   
The 5+ minute mark feels chaotic.  


---

## Milestone 12: Release Candidate

### Goal

Prepare V1 for sharing.

### Tasks

-   
Test full run loop.  

-   
Test save/load.  

-   
Test prestige.  

-   
Test badges.  

-   
Test cosmetics.  

-   
Test mobile layout.  

-   
Test desktop layout.  

-   
Deploy to GitHub Pages.  

-   
Fix blocking bugs.  

-   
Add simple credits/version label.  


### Acceptance Criteria

-   
Game is playable from a public GitHub Pages link.  

-   
New player can understand what to do.  

-   
Player can complete multiple runs.  

-   
Player can unlock badges.  

-   
Player can prestige.  

-   
Player can spend Sticker Shine.  

-   
No major progression blockers remain.  


---

# 26. LLM Development Instructions

Use these instructions for agentic coding.

## Build Principles

-   
Build in small, testable milestones.  

-   
Keep systems modular.  

-   
Prefer config-driven content.  

-   
Avoid hardcoding badge/cosmetic data inside UI logic.  

-   
Use readable names.  

-   
Prioritize game feel early.  

-   
Keep mobile portrait layout stable.  

-   
Make every major feature testable through simple values.  

-   
Avoid overengineering multiplayer, backend, accounts, or server logic.  


---

## Implementation Priorities

When uncertain, prioritize in this order:

1.   
Core popping feel  

2.   
Clear mobile UI  

3.   
Stable run/fail/restart loop  

4.   
Shop usefulness  

5.   
Difficulty pacing  

6.   
Prestige clarity  

7.   
Badge collection  

8.   
Cosmetic polish  

9.   
Extra visual flair  


---

## Out of Scope for V1

Do not build these yet:

-   
Daily challenges  

-   
Online accounts  

-   
Leaderboards  

-   
Real-money purchases  

-   
Ads  

-   
Multiplayer  

-   
Cloud saves  

-   
Complex narrative  

-   
Procedural cosmetic generation  

-   
Landscape layout  

-   
Backend services  


---

# 27. Suggested Balancing Defaults

Use these as first-pass values.  
  
They should be easy to tweak.

```

```

```
STARTING_ESCAPE_METER_MAX = 20
NORMAL_BALLOON_REWARD = 1
FAST_BALLOON_REWARD = 2
GOLDEN_BALLOON_REWARD = 10
TINY_BALLOON_REWARD = 3
FINE_RISK_BALLOON_REWARD = 8

NORMAL_ESCAPE_VALUE = 1
FAST_ESCAPE_VALUE = 2
GOLDEN_ESCAPE_VALUE = 2
TINY_ESCAPE_VALUE = 1
FINE_RISK_ESCAPE_VALUE = 5

PRESTIGE_UNLOCK_PARTY_BUCKS = 1000
BASE_COMBO_TIMER = 2.0
```

Starter shop pricing:

```

```

```
DART_THROWER_COST = 25
CLOUD_BLOWER_COST = 40
CAKE_FREEZE_COST = 50
PARTY_NET_COST = 60
COMBO_RIBBON_COST = 35
```

These values are placeholders.  
  
Tune them after the first playable build.

---

# 28. First Build Prompt for Agentic Development Team

Use this as the actual first development prompt.

---

## Agentic Build Prompt

Build the first playable version of **Don’t Stop Pop!**, a portrait mobile-first ThreeJS web game deployed through GitHub Pages.

The game is a cozy-but-chaotic balloon popping clicker. The player taps balloons before they escape off the top of the screen. Popping balloons earns **Party Bucks**. Escaped balloons fill the **Balloon Escape Meter**. When the meter fills, the run ends.

The game must run in a portrait phone-shaped play area. On desktop, center the phone-shaped game frame in the browser. On mobile, fill the screen in portrait.

Use ThreeJS for the gameplay scene and regular HTML/CSS or an appropriate UI overlay system for menus and HUD.

For the first playable build, implement:

1.   
Portrait 9:16 game layout.  

2.   
Soft 2.5D layered birthday sky background.  

3.   
Balloons rising from bottom to top.  

4.   
Pointer/touch input to pop balloons.  

5.   
Pop particles and floating Party Bucks text.  

6.   
Party Bucks currency.  

7.   
Balloon Escape Meter.  

8.   
Lose state when the meter fills.  

9.   
Rotating fail screen messages.  

10.   
Try Again button.  

11.   
Shop tab with:  


-   
Dart Thrower  

-   
Cloud Blower  

-   
Cake Freeze  

-   
Party Net  

-   
Combo Ribbon  


1.   
Dart Thrower auto-popping behavior.  

2.   
Windstorm hazard.  

3.   
Cloud Cover hazard.  

4.   
Birthday Rush event.  

5.   
Difficulty phases that ramp from cozy to chaotic.  

6.   
Combo system.  

7.   
Tiny 3-step tutorial.  

8.   
Party Stamp Card tab.  

9.   
At least 5 starter badges.  

10.   
Sticker Shine currency.  

11.   
Visible but locked **Buy a New Party!** prestige button.  

12.   
Prestige unlock at 1,000 Party Bucks.  

13.   
Prestige grants permanent Party Multiplier.  

14.   
Local storage persistence for permanent progress.  


Keep the architecture modular and data-driven.

Create separate systems for:

-   
Balloon spawning  

-   
Balloon types  

-   
Economy  

-   
Escape meter  

-   
Shop/upgrades  

-   
Hazards  

-   
Difficulty phases  

-   
Combo  

-   
Fail screen  

-   
Prestige  

-   
Badges  

-   
Stamp Card  

-   
Save/load  

-   
UI panels  


The game should feel cute, soft, and friendly at first. It should become increasingly chaotic over time. Manual popping should remain important even when idle tools are purchased.

Do not include daily challenges, accounts, backend services, multiplayer, ads, or leaderboards in V1.

The first milestone is complete when a player can start a run, pop balloons, earn Party Bucks, buy Dart Thrower, experience hazards, lose from escaped balloons, see a fail screen, unlock at least one badge, open the Stamp Card, and prestige after reaching the Party Bucks requirement.

---

# 29. Success Criteria for V1

V1 is successful if:

-   
The game is immediately understandable.  

-   
Popping balloons feels satisfying.  

-   
Runs naturally escalate from calm to chaotic.  

-   
The player understands why they lost.  

-   
The player wants to try again.  

-   
The shop gives useful survival tools.  

-   
Prestige creates a meaningful cash-out decision.  

-   
Badges and cosmetics give long-term goals.  

-   
The game feels good on mobile and desktop.  

-   
The project is stable enough to share via GitHub Pages.  


---

# 30. Final Product Direction

**Don’t Stop Pop!** should feel like a cute birthday party that slowly gets out of control.

It should not feel harsh, stressful, or overly sarcastic.

It should feel:

-   
Cozy  

-   
Tactile  

-   
Funny  

-   
Juicy  

-   
Collectible  

-   
Chaotic  

-   
Replayable  


The player should leave each run thinking:

> “I nearly had it. One more party.”

