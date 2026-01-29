# 🎨 Shashti Karz - Premium Animations Guide

Welcome to the animation system of Shashti Karz! This guide will help you use all the stunning animations we've implemented.

## 🌟 Available Animation Components

### 1. Floating Particles
Create mesmerizing floating particle effects for backgrounds.

```tsx
import { FloatingParticlesReact } from '@/components/animations';

<FloatingParticlesReact 
  count={40}                              // Number of particles
  colors={["#ff1744", "#d4af37", "#fff"]} // Particle colors
  className="z-10"                        // Custom styling
/>
```

**Use Cases:**
- Hero sections
- Background decorations
- Loading states
- Celebration effects

---

### 2. Liquid Button
Interactive buttons with liquid morphing effects.

```tsx
import { LiquidButton } from '@/components/animations';

<LiquidButton 
  variant="gradient"     // 'primary' | 'secondary' | 'gradient'
  onClick={handleClick}
>
  Click Me!
</LiquidButton>
```

**Features:**
- 3D tilt on hover
- Liquid blob following cursor
- Ripple effect on click
- Shimmer animation

---

### 3. Typewriter Text
Animated typing effect for text.

```tsx
import { TypewriterText, TypewriterWord } from '@/components/animations';

// Single text
<TypewriterText 
  text="Welcome to Shashti Karz"
  speed={50}
  cursor={true}
/>

// Rotating words
<TypewriterWord 
  words={["Premium", "Luxury", "Professional"]}
  speed={100}
/>
```

**Use Cases:**
- Hero headings
- Feature descriptions
- Loading messages
- Dynamic content

---

### 4. Shimmer Effects
Add shimmer and shine to your components.

```tsx
import { ShimmerCard, ShimmerText, ShimmerBorder } from '@/components/animations/AdvancedShimmer';

// Shimmer card
<ShimmerCard hoverOnly={true}>
  <div>Your content</div>
</ShimmerCard>

// Shimmer text
<ShimmerText gradient="from-[#ff1744] to-[#d4af37]">
  Premium Service
</ShimmerText>

// Shimmer border
<ShimmerBorder colors={["#ff1744", "#d4af37"]}>
  <div>Bordered content</div>
</ShimmerBorder>
```

---

### 5. Morphing Cards
3D interactive cards with tilt and morph effects.

```tsx
import { MorphingCard, FlipCard, ExpandCard } from '@/components/animations';

// 3D tilt card
<MorphingCard 
  hoverScale={1.05}
  tiltIntensity={10}
  glowColor="rgba(255, 23, 68, 0.3)"
>
  <div>Card content</div>
</MorphingCard>

// Flip card
<FlipCard
  front={<div>Front side</div>}
  back={<div>Back side</div>}
/>
```

---

### 6. Confetti Effect
Celebration animations for success states.

```tsx
import { SuccessConfetti, CelebrationConfetti } from '@/components/animations';

// Success confetti (green theme)
<SuccessConfetti trigger={isSuccess} />

// Celebration confetti (multi-color)
<CelebrationConfetti active={showConfetti} />
```

**Perfect for:**
- Booking confirmations
- Payment success
- Achievement unlocks
- Special offers

---

### 7. Wave & Blob Backgrounds
Animated backgrounds with organic movement.

```tsx
import { WaveBackground, BlobBackground, AnimatedGradient } from '@/components/animations/WaveBackground';

// Wave background
<WaveBackground 
  colors={["#ff1744", "#d4af37"]}
  opacity={0.1}
  speed={3}
/>

// Blob background
<BlobBackground 
  count={3}
  colors={["#ff1744", "#d4af37", "#4CAF50"]}
/>

// Animated gradient
<AnimatedGradient 
  colors={["#ff1744", "#d4af37", "#ff1744"]}
/>
```

---

## 🎯 Best Practices

### Performance
```tsx
// ✅ Good - Lazy load heavy animations
const HeavyAnimation = dynamic(() => import('@/components/animations/FloatingParticles'), {
  ssr: false
});

// ✅ Good - Reduce particle count on mobile
const isMobile = window.innerWidth < 768;
<FloatingParticlesReact count={isMobile ? 20 : 40} />

// ❌ Avoid - Too many particles
<FloatingParticlesReact count={500} /> // Too heavy!
```

### Accessibility
```tsx
// ✅ Good - Respect reduced motion preference
import { useReducedMotion } from '@/components/animations';

const prefersReducedMotion = useReducedMotion();

{!prefersReducedMotion && <FloatingParticlesReact />}
```

### Composition
```tsx
// ✅ Good - Combine animations thoughtfully
<section className="relative">
  <BlobBackground className="opacity-20" />
  <FloatingParticlesReact count={30} />
  
  <div className="relative z-10">
    <TypewriterText text="Welcome" />
    <LiquidButton>Get Started</LiquidButton>
  </div>
</section>
```

---

## 🎨 Color Palette

Use these brand colors for consistency:

```tsx
const brandColors = {
  primary: "#ff1744",    // Red
  secondary: "#d4af37",  // Gold
  success: "#4CAF50",    // Green
  info: "#2196F3",       // Blue
  warning: "#FF9800",    // Orange
  white: "#ffffff",
};
```

---

## 📱 Mobile Optimization

### Reduce Animation Complexity
```tsx
// Desktop: Full effects
// Mobile: Lighter effects

const particleCount = useBreakpoint({
  mobile: 20,
  tablet: 30,
  desktop: 40
});

<FloatingParticlesReact count={particleCount} />
```

### Touch-Friendly Interactions
```tsx
// All buttons are touch-optimized
<LiquidButton>
  Touch Me
</LiquidButton>

// Cards respond to touch
<MorphingCard>
  Tap to interact
</MorphingCard>
```

---

## 🚀 Quick Start Examples

### Hero Section
```tsx
<section className="relative min-h-screen">
  {/* Background layers */}
  <BlobBackground count={3} />
  <FloatingParticlesReact count={40} />
  
  {/* Content */}
  <div className="relative z-10">
    <TypewriterText 
      text="Transform Your Car"
      speed={50}
    />
    
    <LiquidButton variant="gradient">
      Book Now
    </LiquidButton>
  </div>
</section>
```

### Service Card
```tsx
<MorphingCard hoverScale={1.05}>
  <ShimmerCard hoverOnly>
    <div className="p-6">
      <h3>Premium Detailing</h3>
      <p>Professional car care</p>
    </div>
  </ShimmerCard>
</MorphingCard>
```

### Success State
```tsx
const [showSuccess, setShowSuccess] = useState(false);

<>
  <button onClick={() => setShowSuccess(true)}>
    Complete Booking
  </button>
  
  <SuccessConfetti trigger={showSuccess} />
</>
```

---

## 🎭 Animation Timing

Follow these guidelines for smooth animations:

```tsx
const timings = {
  instant: 0,           // Immediate
  fast: 150,            // Quick feedback
  normal: 300,          // Standard transitions
  slow: 500,            // Emphasis
  verySlow: 1000,       // Dramatic effect
};
```

---

## 💡 Tips & Tricks

### Layering Animations
```tsx
// Layer 1: Background (lowest z-index)
<BlobBackground className="z-0" />

// Layer 2: Particles
<FloatingParticlesReact className="z-10" />

// Layer 3: Content (highest z-index)
<div className="relative z-20">
  Content here
</div>
```

### Combining Effects
```tsx
// Shimmer + Morph = Premium card
<MorphingCard>
  <ShimmerCard>
    <div>Premium content</div>
  </ShimmerCard>
</MorphingCard>
```

### Conditional Animations
```tsx
// Show confetti only on success
{isSuccess && <SuccessConfetti trigger={true} />}

// Different animations per state
{isLoading && <ShimmerSkeleton />}
{isSuccess && <SuccessConfetti />}
{isError && <ErrorShake />}
```

---

## 🎬 Live Examples

Visit these pages to see animations in action:

- **Homepage** (`/`) - Floating particles, blob backgrounds, liquid buttons
- **Booking** (`/booking`) - Form animations, success confetti
- **Services** (`/services`) - Morphing cards, shimmer effects
- **Gallery** (`/gallery`) - Image animations, hover effects

---

## 📚 Further Reading

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Principles](https://www.interaction-design.org/literature/article/the-12-principles-of-animation)
- [Web Performance](https://web.dev/animations/)

---

## 🤝 Contributing

Want to add more animations? Follow these steps:

1. Create component in `src/components/animations/`
2. Export from `index.ts`
3. Add documentation here
4. Test on mobile and desktop
5. Ensure accessibility compliance

---

**Made with ❤️ for Shashti Karz**

*Transform your car with premium detailing and stunning animations!*
