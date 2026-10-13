# design.md: UI / UX Direction

> Companion to `req.md`. Follow this for every screen.

---

## 1. Design Goal

The interface must feel **calm, trustworthy and human**, and it must be **fast to use when someone is scared or in a hurry**.

It should look like a real product built by a thoughtful team (think a well-run public-service app), **not** like a generic AI-generated template.

**Three words to design by: Clear. Warm. Reliable.**

---

## 2. Make It Feel Human, Not AI-Generated

Avoid these common giveaways:

- ❌ Purple-to-blue gradients on everything, glowing blobs, glassmorphism overload
- ❌ Every section being a row of identical rounded cards with an icon on top
- ❌ Emoji used as the main icons in the UI (use a proper icon set; emoji only inside user-generated text)
- ❌ Buzzword copy: "Empower", "Seamless", "Revolutionize", "Next-gen", "Unlock the power of"
- ❌ Centered hero with a vague tagline and two buttons, then three feature cards
- ❌ Perfectly symmetrical layouts with no hierarchy
- ❌ Lorem ipsum, fake logos, stock-looking placeholders, "John Doe"
- ❌ Heavy drop shadows, neon glows, over-animated entrances

Do this instead:

- ✅ Plain, direct language written like a person talking to a neighbour
- ✅ Clear visual hierarchy: one main action per screen, strong headings, generous spacing
- ✅ Real-looking sample data (Indian names, real localities, believable quantities)
- ✅ Uneven, purposeful layouts: a big primary area and smaller supporting areas
- ✅ Subtle, consistent details: thin borders, soft shadows, small and meaningful motion
- ✅ Real photography or simple flat illustrations on the landing page (disaster relief, volunteers, shelters); no 3D blobs
- ✅ Empty states, loading skeletons and error messages that sound kind and useful

### Copy tone examples

| Instead of | Write |
|---|---|
| "Leverage our platform to seamlessly request assistance" | "Need help? Tell us what you need." |
| "An error occurred" | "We couldn't send that. Check your connection, we'll keep your details saved." |
| "No data available" | "No requests yet. When you ask for help, it will show up here." |
| "Submit" | "Send request" |

---

## 3. Colour System

Warm, grounded, and high-contrast. Red is **reserved for real urgency** so it keeps its meaning.

| Token | Hex | Use |
|---|---|---|
| `primary` | `#0F5C5C` (deep teal) | Brand, buttons, links, nav |
| `primary-dark` | `#0A4242` | Hover / pressed |
| `accent` | `#E8A33D` (amber) | Highlights, secondary actions |
| `danger` | `#C8352B` | SOS, critical, destructive only |
| `warning` | `#E27D26` | High priority, expiring soon |
| `success` | `#2F8F5B` | Available, verified, resolved |
| `info` | `#2B6CB0` | NGO markers, info notes |
| `shelter` | `#6B4FA0` | Shelter markers |
| `bg` | `#FAF7F2` (warm off-white) | Page background |
| `surface` | `#FFFFFF` | Cards, panels |
| `border` | `#E6E0D6` | Dividers, outlines |
| `text` | `#1F2933` | Main text |
| `text-muted` | `#5B6770` | Secondary text |

Dark mode is optional. If built, use soft charcoal (`#14191C`), never pure black.

**Map marker colours** (match `req.md`): Critical = red, High = orange, Volunteers = green, NGOs = blue, Shelters = purple, Resources = yellow. Marker shapes should also differ slightly (not colour alone) for accessibility.

**Status colours:** Submitted (grey), Verified (blue), Assigned (teal), In Progress (amber), Delivered (green outline), Resolved (green solid), Cancelled (muted red).

---

## 4. Typography

- **Headings:** `Plus Jakarta Sans` or `DM Sans` (friendly, modern, readable)
- **Body / UI:** `Inter` or `Source Sans 3`
- **Numbers / KPIs:** same family, `tabular-nums`
- Fallback stack: `system-ui, -apple-system, "Segoe UI", sans-serif`

Scale (mobile → desktop): body 16px minimum (never smaller than 14px for helper text), H1 28 → 40px, H2 22 → 28px, H3 18 → 20px. Line-height 1.5 for body. Keep paragraphs under 70 characters wide.

---

## 5. Layout, Spacing & Shape

- 8px spacing grid. Cards use 16–24px padding.
- Max content width 1200px; dashboards use a left sidebar (collapsible) + top bar.
- Radius: 10px for cards and inputs, 999px for pills/badges. Avoid extremely round "bubble" everything.
- Shadows: one soft level for cards (`0 1px 3px rgba(0,0,0,.08)`), one for modals. Prefer thin borders over heavy shadows.
- Mobile first. Bottom navigation bar on mobile for survivors and volunteers (4–5 items max).
- Tap targets minimum **48×48px**. Spacing between actions large enough to avoid mis-taps.

---

## 6. Core Components

- **Buttons:** primary (teal filled), secondary (outlined), danger (red, used only for SOS/destructive), ghost. Always a clear label; loading state with spinner and disabled click.
- **SOS button:** large, red, fixed and obvious, with a short label like "I need help". Pulses subtly only on the survivor home screen, not everywhere.
- **Priority badge:** Critical / High / Medium / Low, with colour **and** text.
- **Status timeline:** vertical stepper with ✓ completed, ● current (accent), ○ upcoming. Show time and actor per step.
- **Cards:** request card, resource card, shelter card, volunteer task card, KPI card. Each shows the key fact first (what, how urgent, how far).
- **Match badge:** "Best match", with a one-line reason ("50 units available, 2 km away").
- **Progress bars:** shelter occupancy (green → amber → red as it fills), stock level.
- **Tables:** sortable, filterable, sticky header, row actions in a menu; collapse to cards on mobile.
- **Toasts / alerts:** short, human, auto-dismiss except errors.
- **Skeleton loaders** instead of blank screens. **Empty states** with a friendly line and a next step.
- **Form inputs:** visible labels (not placeholder-only), inline validation, helpful hints, auto-save drafts on the SOS form.

---

## 7. Page-by-Page Design Notes

### Public

**1. Landing / Home**
- Left-aligned hero with a real photo, a plain headline such as *"Help, when it's needed most."*, one big red "I need help" button, and a quieter "I want to help" button.
- Show the emergency helpline number at the top.
- Below: how it works in 3 short steps (told as a story, not icon cards), live counters (requests resolved, volunteers, shelters), a small preview of the map, and a role section ("Volunteer / NGO / Shelter: join the network").
- Footer: contact, privacy, helpline.

**2. Login**: Simple two-column on desktop (image + form), single column on mobile. Show/hide password, "Forgot password?", clear error text. Role-based redirect after login.

**3. Registration**: Step-by-step form. Step 1: choose your role (clear short descriptions). Step 2: basic details. Step 3: role-specific details and verification documents (only for responders). Progress indicator at the top. Explain *why* documents are needed in one friendly sentence.

### Survivor

**4. Survivor Dashboard**: Giant SOS action at the top, followed by quick actions (Create request, Find shelter, Find medical help, View map). Then "Your active requests" with live status chips. Minimal clutter. Speed over decoration.

**5. Create Request**: One-screen friendly form. Category picker as large tappable tiles, auto-detected location with an editable map pin, people affected stepper (+/−), priority selector with plain descriptions, optional description, optional photo/video with preview. Sticky "Send request" button at the bottom on mobile.

**6. My Requests**: List of cards with status chip, category, time, responder. Filter pills (Active / Resolved / Cancelled). Tap to open tracking.

**7. Request Tracking**: Vertical timeline as the hero. Assigned responder card (name, photo, contact button, distance). Mini map. Request history below. Live updates with a gentle highlight when something changes.

**8. Emergency Map**: Full-screen map, collapsible filter drawer, legend, search, "locate me" button. Marker click opens a bottom sheet (mobile) or side card (desktop).

**9. Notifications**: Grouped by Today / Earlier. Unread marked with a coloured dot. Each item has a short sentence and a time, and taps through to the relevant page.

### Volunteer

**10. Volunteer Dashboard**: Availability toggle at the top (big, obvious), active task card, stats (tasks done, people helped), nearby request preview.

**11. Nearby Requests**: List + map toggle. Each card shows category, priority, distance, people affected, and a match label (Great / Good / Possible). Accept and Decline buttons.

**12. Volunteer Task**: Task-focused screen: survivor location with "Navigate" button, "Call survivor", large status stepper button that advances (On the way → Arrived → Assistance provided → Completed), "Report an issue" link.

**13. Volunteer Profile**: Photo, verification badge, skills tags, service radius slider, availability schedule, task history.

### NGO / Resource

**14. NGO Dashboard**: KPI row (stock items, low stock, open requests, assigned), alerts panel, recent requests table.

**15. Resource Management**: Inventory table with search/filter, coloured stock-state badges, quick quantity edit, add/edit drawer, expiry highlights.

**16. Resource Assignment**: Request on the left, ranked match list on the right with "Best match" highlighted and reasons shown. One-click assign, plus manual override.

### Shelter

**17. Shelter Dashboard**: Large occupancy gauge (capacity / occupied / available), +/− quick update, facilities toggles, status indicator.

**18. Shelter Map**: Shelter location, nearby requests needing shelter, and nearby shelters and resources.

### Admin

**19. Admin Command Center**: Dense but orderly. Top KPI strip (8 metrics), live map in the centre, verification queue and critical-requests feed on the side, analytics tabs below. Tabs for Users, Requests, Verification, Resources, Reports. Use calm colours so red alerts clearly stand out.

---

## 8. Emergency-First UX Rules

1. SOS is reachable in **one tap** from anywhere for a survivor.
2. SOS submission needs **3 taps or fewer**; everything beyond location + need is optional.
3. Auto-detect location, with a manual fallback.
4. Save drafts locally; retry sending if the network drops, and say so clearly.
5. Never hide the helpline number.
6. Use high contrast and large text for survivor screens (they may be outdoors, stressed, on a cracked screen).
7. Confirm only for destructive actions, never for sending help requests.
8. Keep animations short (150–250ms) and respect `prefers-reduced-motion`.

---

## 9. Accessibility

- WCAG AA contrast for all text and controls.
- Never rely on colour alone: pair with text, icon or shape.
- Visible focus rings, full keyboard support, ARIA labels on icon buttons and map controls.
- Labels on all inputs, errors announced to screen readers.
- Support English first; structure text so translation (Hindi, Marathi, etc.) can be added later.

---

## 10. Icons, Imagery & Motion

- **Icons:** one consistent outline set (Lucide or Heroicons), 20–24px.
- **Imagery:** real or documentary-style photos on the landing page; simple flat illustrations for empty states. No AI-looking 3D art or random gradient blobs.
- **Motion:** subtle fades, slide-ins for drawers, a gentle pulse on live items, progress transitions on timelines. Nothing flashy.

---

## 11. Tailwind Setup Hints

Extend the Tailwind theme with the colour tokens above (`primary`, `accent`, `danger`, `warning`, `success`, `info`, `shelter`, `bg`, `surface`, `border`) and the font families. Build reusable component classes or small components for Button, Badge, Card, Input, Timeline and StatCard to keep the UI consistent.

---

## 12. Final Check Before Shipping Any Screen

- [ ] Is the main action obvious within 2 seconds?
- [ ] Is the copy plain and human?
- [ ] Does it work on a 360px phone screen?
- [ ] Is red used only for real urgency?
- [ ] Are loading, empty and error states designed?
- [ ] Does it still look good with real, messy data?
- [ ] Would a stressed person find what they need without reading much?
