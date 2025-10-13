# AI Interview Simulator - Design Style Guide

## Design Philosophy

### Visual Language
The AI Interview Simulator embodies a **sophisticated tech-forward aesthetic** that balances professionalism with approachability. The design language draws inspiration from modern SaaS platforms and enterprise software, creating an environment that feels both cutting-edge and trustworthy.

### Core Principles
- **Professional Confidence**: Clean, uncluttered interfaces that inspire trust in the AI technology
- **Human-Centered AI**: Warm, approachable elements that make AI interaction feel natural
- **Progressive Disclosure**: Information architecture that reveals complexity gradually
- **Accessibility First**: Inclusive design that works for all users and abilities

## Color Palette

### Primary Colors
- **Deep Slate**: `#1e293b` - Primary text and navigation elements
- **Soft Blue**: `#3b82f6` - Primary action buttons and interactive elements
- **Warm Gray**: `#64748b` - Secondary text and subtle UI elements
- **Pure White**: `#ffffff` - Background and content areas

### Accent Colors
- **Success Green**: `#10b981` - Positive feedback and achievements
- **Warning Amber**: `#f59e0b` - Caution and attention indicators
- **Error Red**: `#ef4444` - Error states and critical alerts
- **Neutral Gray**: `#f1f5f9` - Subtle backgrounds and dividers

### Data Visualization Palette
- **Primary Data**: `#3b82f6` (Soft Blue)
- **Secondary Data**: `#8b5cf6` (Purple)
- **Tertiary Data**: `#06b6d4` (Cyan)
- **Quaternary Data**: `#10b981` (Success Green)

## Typography

### Primary Typeface: Inter
- **Display/Headers**: Inter Bold (700) - Clean, modern sans-serif for headings
- **Body Text**: Inter Regular (400) - Highly readable for content
- **UI Elements**: Inter Medium (500) - Balanced weight for buttons and labels

### Secondary Typeface: JetBrains Mono
- **Code/Data**: JetBrains Mono - Monospace font for technical content and data displays

### Typography Scale
- **Hero Heading**: 3.5rem (56px) - Landing page main headlines
- **Page Heading**: 2.5rem (40px) - Primary page titles
- **Section Heading**: 1.875rem (30px) - Section headers
- **Subsection**: 1.25rem (20px) - Subsection titles
- **Body Large**: 1.125rem (18px) - Important body text
- **Body Regular**: 1rem (16px) - Standard body text
- **Body Small**: 0.875rem (14px) - Captions and secondary info

## Visual Effects & Animations

### Micro-Interactions
- **Button Hover**: Subtle scale (1.02x) with soft shadow elevation
- **Card Hover**: Gentle lift with 8px shadow and slight rotation (1deg)
- **Input Focus**: Blue border glow with smooth transition (200ms)
- **Loading States**: Elegant skeleton screens with shimmer effects

### Page Transitions
- **Fade Transitions**: Smooth opacity changes (300ms ease-out)
- **Slide Transitions**: Horizontal movement for navigation (250ms ease-in-out)
- **Scale Transitions**: Subtle zoom effects for modal dialogs (200ms ease-out)

### Avatar Animations
- **Idle Animation**: Subtle breathing movement and micro-expressions
- **Speaking Animation**: Lip-sync with natural mouth movements
- **Gesture System**: Hand movements and head nods synchronized with speech
- **Emotional States**: Facial expressions that respond to conversation context

## Layout & Spacing

### Grid System
- **Container Max Width**: 1200px for optimal readability
- **Grid Columns**: 12-column flexible grid system
- **Breakpoints**: 
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px
  - Desktop: 1024px+

### Spacing Scale (Tailwind-based)
- **xs**: 0.25rem (4px) - Tight spacing
- **sm**: 0.5rem (8px) - Small gaps
- **md**: 1rem (16px) - Standard spacing
- **lg**: 1.5rem (24px) - Section spacing
- **xl**: 2rem (32px) - Large sections
- **2xl**: 3rem (48px) - Major section breaks
- **3xl**: 4rem (64px) - Page-level spacing

## Component Design

### Buttons
- **Primary**: Soft blue background with white text, rounded corners (8px)
- **Secondary**: White background with blue border and blue text
- **Ghost**: Transparent background with colored text and hover states
- **Icon Buttons**: Circular with subtle hover effects and proper padding

### Cards
- **Standard Cards**: White background, subtle border, 12px border radius
- **Elevated Cards**: White background, soft shadow, hover elevation
- **Data Cards**: Structured layout with clear hierarchy and spacing

### Forms
- **Input Fields**: Clean borders, focused states with blue accent
- **Labels**: Positioned above inputs with clear typography
- **Validation**: Inline feedback with appropriate colors and icons

### Navigation
- **Top Navigation**: Fixed header with proper z-index and backdrop blur
- **Sidebar**: Collapsible navigation with smooth transitions
- **Breadcrumbs**: Clear hierarchy with proper spacing and separators

## Data Visualization

### Chart Styling
- **Background**: Subtle grid lines in light gray
- **Data Points**: Consistent with primary color palette
- **Tooltips**: Dark background with white text and subtle shadows
- **Legends**: Clear typography with proper spacing

### Progress Indicators
- **Progress Bars**: Rounded corners with smooth animations
- **Loading Spinners**: Subtle rotation with brand colors
- **Status Indicators**: Color-coded with appropriate iconography

## Responsive Design

### Mobile-First Approach
- **Touch Targets**: Minimum 44px for all interactive elements
- **Typography**: Responsive scaling based on viewport
- **Navigation**: Collapsible menu with smooth animations
- **Content**: Stacked layouts with proper spacing

### Tablet Optimization
- **Layout**: Hybrid approach between mobile and desktop
- **Navigation**: Persistent sidebar with collapsible sections
- **Content**: Flexible grid layouts with optimal spacing

### Desktop Enhancement
- **Layout**: Full-width utilization with sidebar navigation
- **Interactions**: Hover states and advanced animations
- **Content**: Multi-column layouts with rich interactions

## Accessibility Standards

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Indicators**: Clear visual focus states for keyboard navigation
- **Alt Text**: Descriptive alternative text for all images
- **Semantic HTML**: Proper heading hierarchy and landmark elements

### Keyboard Navigation
- **Tab Order**: Logical navigation flow through all interactive elements
- **Shortcuts**: Power-user shortcuts for common actions
- **Focus Management**: Proper focus trapping in modal dialogs

### Screen Reader Support
- **ARIA Labels**: Comprehensive labeling for complex UI elements
- **Live Regions**: Announcements for dynamic content updates
- **Role Attributes**: Proper semantic roles for custom components

## Brand Elements

### Logo Treatment
- **Primary Logo**: Clean, modern wordmark with subtle icon
- **Logo Spacing**: Proper clear space around logo (2x logo height)
- **Logo Colors**: Deep slate with blue accent for interactive states

### Iconography
- **Style**: Outlined icons with 2px stroke weight
- **Size**: Consistent 24px standard size with proper scaling
- **Color**: Matches text color with hover states

### Photography Style
- **Professional Headshots**: High-quality, consistent lighting and backgrounds
- **Office Environments**: Modern, clean workspaces with natural lighting
- **User Avatars**: Diverse, professional representation across all demographics