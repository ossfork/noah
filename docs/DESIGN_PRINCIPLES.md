# Noah Design Principles

These are the rules we apply to every visual decision in the desktop app. Specific color values, font sizes, and spacing units live in `index.css`. This document is about the **why**, so future contributors (and a future designer) can extend the system without breaking it.

---

## 1. The user is reaching for a tool, not opening a chat app

Noah is a **command-and-control surface**. The user has a broken Mac and is aiming a capable agent at it. Every interaction should reinforce that emotion: confidence, intent, slight excitement.

Practical implications:
- The composer is the gateway. It should feel like a **launch button**, not a form-submit field.
- The send action gets the most prominent treatment in the entire UI. Bigger than any other button.
- Placeholder copy uses **directive verbs**: "Tell Noah what to fix," "What's broken? Hit go." Not "How can I help you today?"
- The agent is something you *direct*, not something you *converse with*. Copy and visuals should never lapse into chat-app passivity.

What this rules out:
- Submit buttons that look like email-field submits.
- "How may I assist you?" conversational openers.
- Generic chat-bubble layouts where the input is just another input.

---

## 2. One color family, two emotional registers

Every accent color in the app comes from a single hue family. Within that family there are exactly **two registers** — distinct enough to communicate different intent, related enough to feel unified.

**Register A — "Launch":**
The act of aiming Noah at a problem. Sending a message. Clicking "Please fix it." Hovering "New chat." Focus rings. Thinking-state animations. Any moment where the user is *issuing a command*.

**Register B — "Commit":**
A different kind of click — committing money, completing a payment, marking a fix successful. Subscribe buttons. Trial extension. Result cards. Status indicators. The semantic green that means "done / paid / works."

Both registers must:
- Live within the same hue family. No warm grass-greens against cool indigos. No off-family hues.
- Be visually distinct enough that a user can tell them apart at a glance. Different saturation, different position on the gradient, different shape of glow.

What this rules out:
- A different brand color for every kind of click.
- Bootstrap-y "primary blue, success green, danger red" with no relationship between them.
- Using the launch color for commit moments (it cheapens both — every click feels equally important when nothing is).

---

## 3. Saturation is reserved. Restraint is the default

The most saturated, glowing, gradient-laden moment in the UI should be **the one thing the user is supposed to do next**. Everything else recedes — neutral surfaces, weight-only labels, quiet borders.

Practical rules:
- Body text uses neutral text colors. Never accent.
- Section labels use **bold weight, not color**, except where color carries meaning ("Situation" / "Plan" / "Result" use color because they label *kinds of content*).
- Card backgrounds are neutral elevation tones, never accent-tinted (except on hover, briefly).
- Button gradients are reserved for **launch** moments. Everyday actions use solid color and pick up an aurora hint on hover only.
- Disabled states are gray. Never a desaturated version of the active color — that breaks the "active = saturated, inactive = neutral" rule.

What this rules out:
- Colored body text for emphasis (use weight).
- Colored card backgrounds to signal "this is the important card" (use shadow/elevation).
- Six different button colors on screen at once.

---

## 4. Soft elevation over hard borders

Containment is communicated by **shadow and slight background lift**, not by hard 1px borders that frame every card.

Why: hard borders read as "form box" — a 2017 Bootstrap aesthetic. Soft drop-shadow + a barely-there background-lift reads as "modern conversation surface." Anthropic Claude does the former (no card framing at all); ChatGPT does the latter (subtle elevation). Noah is in the latter camp because our cards contain interactive content (action buttons, options, forms) that benefits from light containment.

Practical rules:
- Cards: 1px border at very low opacity (~6%) + small drop shadow + slightly lighter background than the page. Three subtle cues stacked, never one heavy cue.
- Card border-radius: substantial (~16px). Squared-off corners read as utility/SaaS; rounded corners read as friendly/Mac-native.
- The **page** is darker than the cards (in dark mode), so cards float toward the user. In light mode, cards are pure white on a soft gray-blue page.

What this rules out:
- Heavy 1px solid borders.
- Cards with the same background as the page (loses the affordance of "this is a thing").
- Sharp 4–8px border-radius.

---

## 5. Friendliness through type size, not whimsy

The audience is a stressed Mac user whose computer is broken. They are not delighted by decorative illustrations or playful icons. They are calmed by:
- **Larger body text** than a typical SaaS dashboard. We use 17px root, which makes Tailwind's `text-base` 17px and `text-sm` ~15px. Not because it's prettier — because someone reading at low display brightness, possibly older, possibly stressed, can read it without squinting.
- **Generous line-height** (1.55–1.65).
- **Clear typographic hierarchy via weight, not size jumps.** Section headers are bold-600 at the same size as body. Headlines step up only slightly.
- **Plain language** in copy. "Trial ends Thu, May 8" beats "24h remaining."

What this rules out:
- Decorative micro-illustrations of robots, gears, sparkles.
- Tiny 11–13px UI text.
- Playful animations on critical paths.
- Cute sound effects.

---

## 6. Hover and focus are identity moments

The aurora identity isn't loud — it sits quietly until the user touches something. On hover and focus, the system *responds*, glowing or shifting in a way that says "this is a Noah surface."

Practical rules:
- Every interactive surface (sidebar items, cards, suggestion tiles, options) has some aurora-tinted hover response. The intensity scales with the importance of the action: subtle background-tint for navigation; full gradient + glow for the launch button.
- Focus rings on inputs are aurora-tinted, not the OS default blue. The composer's focus state in particular should feel like the surface is *waking up*.
- Selected states use aurora hue (background tint + glow on the radio fill), not flat brand-blue.

What this rules out:
- Identical hover state for every surface (everything dims into bg-tertiary).
- Default browser focus rings.
- Selected radios that look identical to "blue radio" components from any web framework.

---

## 7. Animations are functional, never decorative

When Noah is thinking, the loading state must communicate *the agent is reasoning*, not *the page is loading*. Short, organic movement. Aurora-colored. Never a spinner. Never a progress bar with no actual progress information.

What this rules out:
- Spinning circles that imply "the network is slow."
- Bouncing dots in monochrome gray.
- Skeleton loaders for content that arrives in <500ms.

---

## 8. The two semantic colors that escape the system

Two color uses are non-negotiable for usability and accessibility:
- **Red** for destructive / error states.
- **Amber/yellow** for warnings.

These are not "Noah colors." They're universal signals and we don't try to bend them into the aurora family. Use them sparingly, at low saturation, and only where the user genuinely needs to be alerted.

---

## 9. Light mode is a first-class citizen

Most casual Mac users — especially the non-technical ones in our target audience — run their system in light mode. Light mode is not "the dark-mode theme inverted." It's its own design with its own contrast logic, its own card-elevation values, and its own accent saturations.

Practical rules:
- Light mode cards are pure white on a soft gray-blue page.
- Light mode accents are slightly more saturated than dark mode (the white-card background washes out subtle hues).
- Light mode shadows are tighter and shorter (long shadows look fake in light mode).
- Test every screen in both modes before shipping.

---

## 10. The icon is symbolic, not just a letter

The app icon is the user's most-frequently-seen Noah surface — they see it in the dock far more than they see any other element. It deserves dedicated design work that thinks about **what Noah symbolizes**, not just "the letter N in our brand color."

This document does not prescribe an icon direction. The icon is owned by whoever the founder briefs to design it. What matters: it should still feel related to the in-app system (same color family, same emotional register), but it should carry *symbolism* — what Noah does for the user — not just brand.

---

## How to extend this

When adding a new surface or interaction, run through these questions:

1. **Which register is this — launch or commit?** Pick the register first, then the visual treatment follows.
2. **Is this the most important action on screen?** If yes, it gets the most saturation. If no, it shouldn't.
3. **Does this need color, or just weight?** Default to weight.
4. **What does it look like on hover/focus?** That's where the identity lives.
5. **Does it work in light mode?** Check both modes before merging.
6. **Could a stressed user find this in 2 seconds at low brightness?** If not, increase contrast or size.

When in doubt: **less saturation, more whitespace, larger type.**
