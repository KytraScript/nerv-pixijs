# Post-Mortem: The Toggle Animation Saga

**Component:** `NervToggle` (`src/components/forms/NervToggle.ts`)
**Duration:** ~8 iterations across multiple deploys
**Final solution:** Raw `requestAnimationFrame` with `performance.now()` timing

---

## What We Were Trying to Do

Animate a circle (thumb) sliding left-to-right inside a pill-shaped track when a toggle switch is clicked. A CSS `transition: transform 140ms ease-out` equivalent. Trivial in DOM. Surprisingly adversarial in PixiJS.

---

## Why It Was Hard

The NervBase component architecture has a **reactive redraw cycle**:

```
user interaction → setState/setProps → scheduleRedraw → redraw()
```

`redraw()` is the single method that rebuilds a component's entire visual state. It calls `Graphics.clear()` and redraws everything from scratch. This works well for static components but creates a fundamental conflict with animation:

**Animation needs to change a property gradually over time.**
**Redraw wants to set that property to a computed value instantly.**

Every time the toggle was clicked:
1. Click handler fires → `setProps({ on: true })` → schedules redraw
2. Redraw fires on the next frame → rebuilds everything
3. Any animation that was running gets its work undone

The redraw system and the animation system were fighting over the same property (`thumb.x`) on every single frame.

---

## The Attempts (In Order)

### Attempt 1: AnimationManager.tween()
```typescript
// In redraw():
AnimationManager.tween(this._thumb, { x: thumbX }, 150);
```
**Failed because:** `redraw()` called `_thumb.clear()` which reset the Graphics, and the tween was restarted every redraw (hover changes trigger redraw too). The tween ran for 1 frame, then redraw killed it and started a new tween from the current position.

### Attempt 2: Guard with `_lastOnState`
```typescript
if (this._lastOnState !== isOn) {
  this._lastOnState = isOn;
  AnimationManager.tween(this._thumb, { x: thumbX }, 150);
}
```
**Failed because:** The AnimationManager writes to `target['x']` via a `Record<string, number>` cast. PixiJS Container's `.x` is a getter/setter on the prototype chain. The cast worked at the JS level but the tween was still being killed by subsequent redraws triggered by `pointerout` → `setState({ hovered: false })`.

### Attempt 3: Separate Container architecture
Split the thumb into `_thumbContainer` (Container, holds position) and `_thumbGfx` (Graphics, holds visual). Redraw only touches `_thumbGfx`. Animation moves `_thumbContainer`.

```
NervToggle
├── _track (Graphics) ← redraw touches this
├── _thumbContainer (Container) ← animation touches this
│   └── _thumbGfx (Graphics) ← redraw touches this
└── _label
```

**Failed because:** Even though redraw didn't directly set position, the animation used `Ticker.shared.add()`. PixiJS's Ticker fires all callbacks on the same frame. `scheduleRedraw` also uses `Ticker.shared.addOnce`. Both fire on the same tick. The redraw function called `_slideThumbTo()` which killed the in-flight animation and restarted it.

### Attempt 4: Move animation start to click handler
Started the animation in the click handler BEFORE calling `setProps`, so the animation captures `startX` before any redraw can interfere. Redraw was modified to never touch position after first render.

**Failed because:** `setProps` still triggered `scheduleRedraw`. Even though redraw didn't call `_slideThumbTo` anymore, something was still interrupting. Debug logs revealed the real culprit: **PixiJS event bubbling**. The `pointerup` event fired on child Graphics (track, thumb), bubbled up to the NervToggle parent, and the click handler fired multiple times per click. Each fire toggled `on` back and forth.

### Attempt 5: Lock + prevent child events
Added `_animating` lock flag. Set `eventMode = 'none'` on children to prevent bubbling.

**Failed because:** The lock prevented re-clicking, but the initial animation still only ran 1 frame. The Ticker callback was being removed somehow. The `Ticker.shared.remove(tickFn)` call inside the completion check was using a reference that might not match due to closure scoping.

### Attempt 6: Direct `requestAnimationFrame` ← THE ONE THAT WORKED
```typescript
private _toggle(): void {
  const startX = this._thumbContainer.position.x;
  const endX = this._computeThumbX(next);
  const startTime = performance.now();
  this._locked = true;

  const frame = () => {
    const t = Math.min((performance.now() - startTime) / duration, 1);
    const eased = 1 - (1 - t) ** 3;
    this._thumbContainer.position.x = startX + (endX - startX) * eased;
    if (t < 1) this._rafId = requestAnimationFrame(frame);
    else { this._locked = false; }
  };
  requestAnimationFrame(frame);
}
```
**Worked because:** `requestAnimationFrame` runs completely outside PixiJS's system. No Ticker callbacks, no interaction with the redraw scheduler, no chance of being removed or interrupted by any internal PixiJS mechanism. The animation owns `_thumbContainer.position.x` exclusively. Redraw never touches it (only updates colors via `_thumbGfx`).

---

## Root Cause Analysis

The fundamental issue was **shared ownership of mutable state between two systems**:

| System | Wants to control | When it runs |
|--------|-----------------|-------------|
| `redraw()` | Everything (position, color, size) | Every state/prop change (hover, click, focus) |
| Animation | Position only | Every frame for N milliseconds |

In a DOM/CSS world, these are naturally separated:
- CSS owns transitions (position animation)
- React/DOM owns rendering (content, colors)
- They don't interfere because the browser's layout engine mediates

In PixiJS, there is no such mediation. `Graphics.clear()` + `Graphics.circle()` is a destructive rebuild. If your redraw function touches the same object your animation is moving, they will fight. And because PixiJS's `Ticker` runs all callbacks on the same frame as `scheduleRedraw`, you can't even rely on ordering.

---

## The Architecture Lesson

**For any PixiJS component that needs animation, separate the animated element from the redrawn element:**

```
Component (NervBase)
├── static_visuals (Graphics) ← redraw() owns this completely
├── animated_container (Container) ← animation owns position/scale/rotation
│   └── animated_visual (Graphics) ← redraw() can update color/shape
└── labels, etc.
```

Rules:
1. `redraw()` NEVER sets `.position`, `.scale`, or `.rotation` on the animated container after first render
2. Animations use `requestAnimationFrame` directly, not PixiJS Ticker (to avoid scheduling conflicts)
3. Lock the component during animation to prevent state changes that would trigger conflicting redraws
4. Set `eventMode = 'none'` on child Graphics to prevent PixiJS event bubbling from causing duplicate handler invocations

---

## Applying This Pattern to Other Components

This same pattern should be used for:
- **NervSlider** thumb drag (already works because it uses `globalpointermove` which is continuous, not animation-based)
- **NervDrawer** slide in/out
- **NervAccordion** expand/collapse height
- **NervToast** slide in/fade out
- Any component with a transition between two visual states

The `requestAnimationFrame` approach is the correct one for PixiJS canvas animation when you need to guarantee the animation runs to completion without interference from the component lifecycle.

---

## Final Code

```typescript
// The working pattern:
private _toggle(): void {
  const next = !this._props.on;
  const startX = this._thumbContainer.position.x;
  const endX = this._computeThumbX(next);
  const duration = this._props.animationMs ?? 140;

  this._locked = true;

  // Update colors immediately
  this.setProps({ on: next });
  this._props.onChange?.(next);

  // Animate position outside PixiJS
  const startTime = performance.now();
  const frame = () => {
    const t = Math.min((performance.now() - startTime) / duration, 1);
    const eased = 1 - (1 - t) * (1 - t) * (1 - t);
    this._thumbContainer.position.x = startX + (endX - startX) * eased;
    if (t < 1) requestAnimationFrame(frame);
    else this._locked = false;
  };
  requestAnimationFrame(frame);
}
```

**8 attempts. 1 working toggle. The lesson: own your animation loop.**
