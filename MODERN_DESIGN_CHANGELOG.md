# Modern Design System Update

## Overview
The 4Ms application has been completely redesigned with a modern, clean, and sleek aesthetic. The new design prioritizes clarity, usability, and a sophisticated visual presentation.

## Design System Changes

### Color Palette
- **Replaced** warm earthy tones with cool, neutral grays
- **Updated** to modern color schemes:
  - Night: Deep blacks (#0A0A0A) with bright accents
  - Day: Clean whites (#FFFFFF) with subtle grays
  - Dawn: Light grays (#FAFAFA) for soft transitions
  - Dusk: Dark grays (#1C1C1E) with iOS-inspired colors

### Typography
- **Font**: Switched to system fonts (Inter, SF Pro) for better readability
- **Removed**: Custom 'obvia' font
- **Font size**: Base size set to 15px for optimal legibility
- **Line height**: 1.5 for comfortable reading

### Component Updates

#### 1. Header
- Reduced height from 73px to 57px for more screen space
- Simplified logo to 8x8 rounded square with "4M" text
- Added backdrop blur effect for modern depth
- Updated menu icon size to 20x20
- Replaced emoji icons with clean SVG icons
- Modern shadow effect: `0 1px 3px var(--shadow)`

#### 2. Sidebar
- **Width reduced**: From 320px to 224px (56 * 4)
- **Removed**: Scientific Domains section entirely
- **Icons**: Replaced all emoji icons with professional line icons
- **Navigation**:
  - Dashboard (Layout icon)
  - My Projects (Folder icon)
  - Gallery (Image icon)
- **Admin section**: Settings and Users icons
- **Hover effects**: Smooth transitions using surface-hover color
- **Active state**: Full button highlight with accent colors

#### 3. Theme Toggle
- Replaced emoji icons with SVG line icons
- Sunrise, Sun, Sunset, Moon icons for each theme
- Compact design with 1px gaps
- Active theme highlighted with accent-1 color
- White text on active, gray on inactive

#### 4. Empty Canvas
- New component replacing WelcomeScreen domain cards
- Centered layout with minimal design
- Dashed border icon placeholder
- Simple message: "No visualization yet"
- Instruction text for user guidance

#### 5. AI Chat Panel
- **Width**: 440px fixed panel on the right side
- **Position**: Fixed, overlaying content when open
- **Slide animation**: Smooth 300ms ease-in-out
- **Features**:
  - Retractable with chevron button
  - Floating tab button when closed (bottom right)
  - File upload support (PDF, LaTeX, Word, Markdown, CSV, JSON, images)
  - Modern chat bubbles with proper spacing
  - User messages: Accent-1 color background
  - AI messages: Surface-hover background
  - Typing indicator with animated dots
  - Suggested prompts for new conversations
  - Input field with file attachment button
  - Send button with paper plane icon

### Visual Enhancements

#### Shadows
- Subtle shadows using CSS variable `var(--shadow)`
- Opacity varies by theme (0.1-0.3)
- Applied to header, floating panels, and elevated elements

#### Borders
- Reduced from 2px to 1px for subtlety
- Border-radius: md (6px) instead of xl (12px)
- More refined appearance

#### Hover States
- All interactive elements have hover effects
- Background color changes to `var(--surface-hover)`
- Smooth transitions (300ms)
- Slight opacity changes for buttons

#### Spacing
- Tighter, more efficient spacing throughout
- Reduced padding in header, sidebar, and components
- Better use of vertical space

## Layout Changes

### Main Canvas Area
- Previously: Welcome screen with 4 domain cards
- Now: Empty canvas with centered placeholder
- Space reserved for visualization display
- Dynamic right margin when AI panel is open (440px)

### Responsive Behavior
- AI panel slides in from right side
- Main content adjusts margin automatically
- Sidebar toggle maintains independent state
- Fixed positioning for AI panel ensures it stays on screen

## Accessibility
- All SVG icons have proper viewBox and stroke attributes
- Hover states include pointer cursor
- Focus states maintained with outline
- ARIA labels on icon-only buttons
- Keyboard navigation supported (Ctrl+Shift+T for themes)

## Performance
- Reduced bundle size by removing emoji dependencies
- Optimized SVG icons (inline, not external files)
- Smooth animations using CSS transforms
- GPU-accelerated transitions

## Next Steps

### Phase 2: CopilotKit Integration
1. Install CopilotKit packages:
   ```bash
   npm install @copilotkit/react-core @copilotkit/react-ui
   ```

2. Set up CopilotKit provider in App.tsx

3. Configure backend runtime endpoints in FastAPI

4. Implement file upload handlers

5. Connect to existing Gemini API backend

### Phase 3: File Processing
1. PDF text extraction (PyPDF2, pdfplumber)
2. LaTeX parsing (pylatexenc)
3. Word document processing (python-docx)
4. Markdown rendering (markdown library)
5. CSV/JSON data parsing (pandas, json)
6. Image processing for figure extraction

### Phase 4: Paper Banana Integration
1. Install Paper Banana library
2. Create visualization generation endpoints
3. Implement figure style templates
4. Add export functionality (PNG, SVG, PDF)
5. Store generated figures in Supabase storage

### Phase 5: Database Schema
1. Create documents table (uploaded files)
2. Create conversations table (chat history)
3. Create figures table (generated visualizations)
4. Add relationships between entities
5. Implement RLS policies

## Color Reference

### Night Theme
- Background: #0A0A0A
- Surface: #18181B
- Surface Hover: #27272A
- Border: #27272A
- Text Primary: #FAFAFA
- Text Secondary: #A1A1AA
- Text Tertiary: #71717A
- Accent 1: #3B82F6 (Blue)
- Accent 2: #10B981 (Green)
- Accent 3: #F59E0B (Amber)

### Day Theme
- Background: #FFFFFF
- Surface: #F9FAFB
- Surface Hover: #F3F4F6
- Border: #E5E7EB
- Text Primary: #111827
- Text Secondary: #6B7280
- Text Tertiary: #9CA3AF
- Accent 1: #2563EB (Blue)
- Accent 2: #059669 (Green)
- Accent 3: #D97706 (Amber)

## File Structure
```
src/
├── components/
│   ├── auth/
│   ├── canvas/
│   │   └── EmptyCanvas.tsx         (New)
│   ├── chat/
│   │   └── AIChatPanel.tsx         (New)
│   ├── layout/
│   │   ├── AppLayout.tsx           (Updated)
│   │   ├── Header.tsx              (Updated)
│   │   └── Sidebar.tsx             (Updated)
│   ├── theme/
│   │   └── ThemeToggle.tsx         (Updated)
│   └── welcome/
│       └── WelcomeScreen.tsx       (Deprecated)
├── index.css                        (Updated)
└── providers/
    └── ThemeProvider.tsx           (Unchanged)
```

## Breaking Changes
- WelcomeScreen component no longer used by default
- Changed default page from 'welcome' to 'canvas'
- Sidebar width reduced (may affect mobile breakpoints)
- Header height changed (affects fixed positioning)

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern browsers with CSS Grid, Flexbox, and CSS Custom Properties support.
