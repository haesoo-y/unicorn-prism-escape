# How the Game Fits in 13KB

[🇺🇸 English](TECHNIQUES.md) | [🇰🇷 한국어](documents/ko/TECHNIQUES.md) | [🇯🇵 日本語](documents/ja/TECHNIQUES.md) | [🇨🇳 简体中文](documents/zh/TECHNIQUES.md)

Unicorn Prism Escape fits in a **13,309-byte ZIP**. This guide explains the current implementation in plain language, starting with what the game actually stores.

## 1. Are the characters image files?

**Yes. The unicorn, demons, and gate are ordinary image files.** The game loads them as WebP images. WebP is an image format, like PNG, that can store the same picture in fewer bytes.

Other things are drawn directly with code:

| What you see | How it is made |
|---|---|
| Unicorn, demons, gate | Small WebP images |
| Sky | A color gradient |
| Clouds | Overlapping oval shapes |
| Prisms | Colored geometric shapes |
| Lightning and enemy fire | Lines and curves |
| Aura and wave | Transparent circles |

The large promotional cover is separate. It is not inside the game ZIP.

### Making a small image look good

The asset preparation process is: reduce larger artwork to the intended game size, simplify its colors, and inspect it at that small size.

The unicorn uses a **56×56** version of larger artwork. The reduction uses *area averaging*: one output pixel combines the source pixels in the area it represents.

Important features—the plump face, small dark eyes, rainbow mane, and clear outline—remain readable with a small set of colors. Some edge pixels are half-transparent, which softens the outline without adding a large range of colors. The character images use three transparency levels: invisible, half-visible, and fully visible.

After that, the renderer avoids blurring them again. It draws the sprites at their intended sizes, rounds their positions, and turns off automatic image smoothing. The unicorn is 56×56; normal/ranged demons are 48×48; the large demon is 96×96.

### Why WebP saves space

The current WebP files and their PNG counterparts produce **identical decoded pixels**. Here, WebP stores the same picture in a smaller file.

| Images | PNG total | WebP total |
|---|---:|---:|
| Unicorn, demons, gate | 7,086 bytes | 4,052 bytes |

That is about 43% less image-file data. It is not an exact measurement of savings inside the final ZIP, which compresses everything again.

Several poses are stored together in one image called an **atlas**—think of a small sheet of stickers. The unicorn sheet contains five poses. Reusing and horizontally flipping them covers eight movement directions.

The images are in `src/assets/`. The repository contains the finished PNG and WebP files, rather than a complete tool for recreating them from concept art.

## 2. How can a still image have moving legs?

**The image file never changes. The positions where we draw parts of it change.** Think of a paper puppet: keep its body still and move its leg pieces.

### Step 1: Read different rectangles from the same image

The simplest example is a 48×48 demon. The renderer treats it as three rectangular pieces:

```text
ONE STILL IMAGE, 48×48
┌────────────────────────┐
│                        │
│     BODY + HEAD        │  Top 36 pixels
│                        │
├────────────┬───────────┤
│ LEFT FOOT  │ RIGHT FOOT│  Bottom 12 pixels
└────────────┴───────────┘
```

We do not create three new files. Canvas can copy just a rectangle from an existing image onto the screen.

### Step 2: Draw those pieces at slightly different positions

Here is the walking idea. The numbers are how far each foot is lifted from its normal position:

| Moment | Body | Left foot | Right foot |
|---|---|---|---|
| A | Normal position | 0px | 0px |
| B | Normal position | 2px up | 0px |
| C | Normal position | 0px | 0px |
| D | Normal position | 0px | 2px up |
| Repeat | Normal position | 0px | 0px |

The real animation also passes through intermediate offsets. The character's overall movement carries all the pieces across the map; these tiny offsets are added on top.

### Step 3: Redraw the scene each frame

The game redraws its background and characters for each frame. The previous foot position disappears with the previous frame, and the new foot position is drawn. Rapid repetition makes the feet appear to move.

Canvas's `drawImage()` has a form that specifies both a **source rectangle** and a **destination rectangle**. This simplified example shows a standalone demon image, not its offset inside the actual atlas:

```js
// Arguments: image, source x/y/width/height,
//                   screen x/y/width/height

// Copy the body to its normal position.
ctx.drawImage(image, 0, 0, 48, 36,
                    x, y, 48, 36);

// Copy the left foot 2px ABOVE its normal position.
ctx.drawImage(image, 0, 36, 24, 12,
                    x, y + 36 - 2, 24, 12);

// Copy the right foot to its normal position.
ctx.drawImage(image, 24, 36, 24, 12,
                    x + 24, y + 36, 24, 12);
```

Only the destination changes. The foot pixels themselves are the same. No new walking picture is loaded, and no joint inside the image is actually bending.

### Step 4: Let a small formula choose the offsets

A sine wave gives us a value that smoothly moves back and forth. We round it to whole pixels so the feet stay crisp. One sign lifts the left group; the other lifts the right group.

That is what **procedural animation** means here: a small rule generates the movement, instead of storing a separate picture for every animation frame.

Normal and ranged demons lift their feet by up to 2px; the large demon uses up to 6px. Different enemies use different timing offsets, so they do not all step together. A shadow close to the feet helps them look grounded.

### The unicorn uses the same idea, with more careful cuts

The unicorn has different front, rear, side, and diagonal poses. Each pose needs its own cutting positions. Its lower section starts at row 43 or 45 of the 56px image. Some tail pixels are kept stationary instead of being included in a leg piece. Certain poses also move the feet a little sideways.

Each leg rectangle must exclude tail and body-outline pixels that should stay still. Otherwise, those pixels would move with the leg and appear detached. Pose-specific cut regions and draw order keep the correct parts together.

The unicorn's cycle follows **distance traveled**: walk farther, advance the leg cycle farther; stop, stop the legs. Its leg offset is up to 2px.

This method is inexpensive but limited. It can suggest walking convincingly at a small size. It cannot produce arbitrary knee bends or complex motion as well as individually drawn frames or a full joint-based character system.

**Where to read the implementation:** `drawEnemy()` and `drawUnicorn()` in `src/systems/render-system.ts`.

## 3. Other effects reuse simple ingredients

The sky is a gradual blend of four colors. Clouds are a few overlapping ovals in two layers. Their positions are spaced out, and they drift at the same speed, avoiding a constantly changing pile of overlapping clouds. The title uses the same background code with fewer clouds.

Lightning is a jagged line drawn with several stroke widths and colors. Enemy fire uses layered curves. A wave is a circle whose radius grows while its opacity falls.

For a charge, the renderer draws three faded copies of the unicorn ahead of it. This communicates the horn attack; it does not add a separate dash velocity to the player.

For Rainbow Wave, a collected prism becomes a short-lived wave object. It keeps the prism's color, expands for 0.6 seconds, and disappears. The actual enemy push and shot clearing happen immediately within 300px; the expanding ring is the visual explanation of that event.

The title/ending lettering uses a small encoded pixel alphabet, avoiding a font download.

## 4. How does sound fit without audio files?

**The game stores instructions for making sounds, not recordings of sounds.** The browser's Web Audio API generates the audio.

For example, the instructions can say:

> Make a sharp tone, rapidly lower its pitch, reduce its volume, then stop.

A short set of numbers describes that sound. It does not need thousands of recorded samples in an MP3 or WAV file.

### A shared sound-making function

`AudioSystem.tone()` accepts a starting pitch, ending pitch, duration, volume, start time, and waveform. A waveform is the repeating shape that gives a tone its basic character: sine is smoother, while square and sawtooth waves are harsher.

| Sound | Basic idea |
|---|---|
| Charge | A rising sharp tone followed by a falling low tone |
| Lightning | A very fast pitch drop plus a low impact |
| Enemy shot | Two short downward pitch sweeps |
| Wave | A longer falling tone plus the prism collection notes |
| Collection / upgrade | A short series of rising notes |

Volume ramps up and down instead of starting and stopping abruptly. The audio nodes are disconnected when finished. User input unlocks audio, and M mutes the shared output.

### Music is a tiny score

The background music stores a short melody, a scale, and a chord pattern as arrays of numbers. The same sound-making function plays the bass, melody, chords, and simple percussion.

Stage groups add musical activity and increase the tempo from 132 to 144, 156, then 168 BPM. The game gets a changing soundtrack by reusing a small score rather than storing four recordings.

Volume needs actual listening. Equal volume numbers can sound very different for a piercing square wave and a soft sine wave. Automated checks verify that sounds are scheduled and cleaned up; they cannot judge whether the mix sounds pleasant.

**Where to read:** `src/systems/audio-system.ts`, especially `tone()`, `music()`, and `update()`.

## 5. How do enemies chase the unicorn without becoming one big pile?

### First, find the direction to the player

An enemy does not need to recognize the unicorn in the picture. The game already knows both objects' coordinates in `World.positions`.

Subtract the enemy's position from the player's position:

```text
Enemy:   (100, 100)
Unicorn: (400, 500)
Difference: (300, 400)
```

This tells the enemy to move right and down. The distance is 500px. Dividing the difference by 500 gives `(0.6, 0.8)`: a direction with a length of one. This step is called **normalization**. It separates “which way?” from “how fast?” so a distant target does not automatically make the enemy faster.

Multiply that direction by the enemy's speed. At 220px/s, the movement is 132px/s horizontally and 176px/s vertically. Over a 0.1-second example interval, that would move it 13.2px right and 17.6px down. The actual game limits each frame's interval to 0.05 seconds.

```js
// Simplified direct-chase example, before curves and separation.
const dx = player.x - enemy.x;
const dy = player.y - enemy.y;
const distance = Math.hypot(dx, dy) || 1;

velocity.x = dx / distance * speed;
velocity.y = dy / distance * speed;
```

`AISystem` calculates the velocity. `MovementSystem` applies it to the position. Repeating this during play lets the enemy follow the player's changing location. It targets the current position, not a prediction of where the player will be later.

### Give enemies slightly different targets

If every enemy always aims at exactly the same point, they tend to follow similar routes. The game instead gives each enemy a small moving target around the unicorn:

```text
Target X = unicorn X + cos(angle) × offset radius
Target Y = unicorn Y + sin(angle) × offset radius
```

Imagine a small invisible point circling the unicorn. The enemy aims toward that point. Its ID and the elapsed play time determine the angle, so enemies do not all aim at the same point. The point is only a target; the enemy is not forced to stay on a perfect circle. A small sideways adjustment also bends its route.

| Enemy | Movement behavior |
|---|---|
| Melee | A nearby moving target, with periodic direct-pursuit windows |
| Ranged | A wider moving target and a sideways curve; fires when close enough |
| Large | A moving target and periodic direct pursuit; turns gradually |

**Within 120px, every type switches its target directly to the unicorn.** The extra target offset and curve become zero, while a weaker neighbor-separation force remains. “Direct pursuit” changes the steering, not the enemy's speed setting.

The map has no blocking walls, so this uses direction calculations rather than a maze-solving algorithm such as A*. Ranged enemies also aim their shots at the unicorn's position when firing; the shots do not keep turning toward it afterward.

### Leave room between neighbors

Each enemy combines two basic wishes:

1. Move toward the player.
2. Move away from another enemy if it gets too close.

Imagine people walking toward the same doorway while leaving a little room for each other. The game adds these directions together to choose where each enemy should move.

When movement directions nearly cancel each other out, the code lets the remaining direction stay small instead of amplifying it to full speed. This helps prevent unstable movement. Separation strength is also lower during direct pursuit, so enemies can still approach the player.

This **reduces overlap; it does not forbid overlap**. There is no solid wall between enemies, and their collision circles are smaller than their artwork. The code compares enemy pairs directly, which is manageable with a maximum of 35 living enemies. A much bigger swarm would need a more efficient neighbor search.

**Where to read:** `AISystem.update()` in `src/systems/ai-system.ts`.

## 6. How do the ten stages work?

The ten stages reuse one large arena and vary small pieces of data:

- Seven prism positions.
- Starting enemy counts and available enemy types.
- Enemy/projectile speed bonuses.
- How often another enemy appears, and the maximum population.
- The sky palette and music group.

Early prisms are closer to the start; later routes spread across the arena. Ranged enemies arrive in stage 4 and large demons in stage 7. The gate is present from the beginning, gray until all seven colors are collected.

Reinforcements bring **one random eligible enemy** from a map edge. The intervals shorten from 10 seconds in stages 1–2, to 5 in stages 3–5, 4 in stages 6–8, and 3 in stages 9–10. New arrivals create pressure from fresh directions rather than joining only the group already behind the player.

### Why stronger enemies do not automatically mean harder stages

The player also gains map information, speed, automatic lightning, and other abilities. Those advantages work together, so faster enemies alone do not guarantee a harder stage.

Difficulty depends on travel distances, starting populations, reinforcements, speeds, and upgrade timing together. The three upgrade rows unlock in order. A full run eventually gains all nine upgrades, so the meaningful decision is **which ones to get first**.

The target is about **five minutes**. The local dashboard compares routes and upgrade orders, but its times are estimates based on distance, speed, and a detour allowance. They are not measured human playthroughs. Actual play is still necessary to judge difficulty.

Retries contribute to the final stage time; waiting on upgrade/failure screens does not.

**Where to read:** `STAGES` and `ENEMIES` in `src/game.ts`, plus `src/systems/rules-system.ts`. The local dashboard is generated by `tools/build-dashboard.mjs`.

## 7. How does everything fit in one small ZIP?

The source project is much larger than the submitted file. The build keeps only what the game needs:

1. Combine the TypeScript modules into JavaScript.
2. Remove development-only code and shorten internal names.
3. Pack the JavaScript more tightly with Roadroller.
4. Put the game code, styles, and WebP image data inside one `index.html`.
5. Compress that HTML into a ZIP using Zopfli.

So the ZIP has **one HTML file**, but that file still contains real image data. The images have not somehow turned into hand-drawn code.

The documentation, local dashboard, original PNG copies, and promotional artwork stay outside the submission.

The actual ZIP must be measured after changes. A shorter piece of code does not always produce a smaller compressed file. Near the limit, even a sound-volume adjustment can change the size enough to matter. Spare bytes make room for such changes.

## 8. The main ideas

- Keep recognizable artwork as tiny images; draw simple effects with code.
- A still image can move when you redraw its parts at different positions.
- Reuse a small sound generator and score instead of storing recordings.
- Enemy pressure depends on where and when enemies arrive, not just their count.
- Evaluate art at gameplay size, sound by listening, and difficulty by playing.
- Measure the ZIP rather than guessing the cost of a change.

Node tests can verify game data and timing. Visual quality, touch controls, sound balance, and difficulty also need real-browser checks and listening.

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the code is organized.
