# 4Ms - Scientific Visualization Platform

**Generate diagrams and visualizations for mind, matter, motion, mathematics + science**

4Ms is a sophisticated academic figure generation platform designed to help researchers create publication-ready visualizations through natural language conversations. The platform serves four scientific domains: Mind (neuroscience, psychology), Matter (chemistry, materials science), Motion (physics, engineering), and Mathematics.

## Features

### 🎨 Four-Mode Theme System
- **Dawn** - Soft morning palette (5 AM - 8 AM)
- **Day** - Bright workspace mode (8 AM - 5 PM)
- **Dusk** - Evening warmth (5 PM - 8 PM)
- **Night** - Dark mode for late-night work (8 PM - 5 AM)

Themes automatically switch based on time of day, with manual control via theme toggle or keyboard shortcut (Ctrl/Cmd + Shift + T).

### 🔬 Scientific Domain Organization
- **Mind** 🧠 - Neuroscience and psychology visualizations
- **Matter** ⚗️ - Chemistry and materials science figures
- **Motion** ⚡ - Physics and engineering diagrams
- **Mathematics** 📐 - Pure and applied mathematics visualizations

### 🔐 Authentication & Security
- Email/password authentication via Supabase Auth
- Row Level Security (RLS) protecting all user data
- Secure file storage for uploaded data and generated figures

### 📊 Project Management
- Organize figures by scientific domain
- Tag and categorize visualizations
- Create collections for related figures
- Track iteration history and refinements

### 🎯 Figure Generation
- Natural language prompts for figure creation
- Support for multiple figure types: methodology diagrams, statistical plots, conceptual diagrams, data visualizations
- Iterative refinement with feedback
- Version history tracking

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling with custom 4Ms theme
- **Supabase Client** for database and authentication
- **Obvia Font** from Adobe Fonts

### Backend
- **Python 3.10+** with FastAPI
- **Google Gemini AI** for intelligent figure generation
- **PaperBanana** (ready for integration) for academic figure creation
- **Uvicorn** ASGI server

### Database & Storage
- **Supabase** PostgreSQL database
- **Supabase Storage** for file management
- Comprehensive RLS policies for data security

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Supabase account (configured automatically)
- Google Gemini API key (for AI features)

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. The Supabase credentials are already configured in `.env`

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```bash
cp .env.template .env
```

5. Add your Gemini API key to the `.env` file:
```
GEMINI_API_KEY=your_api_key_here
PORT=8000
```

6. Start the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## Project Structure

```
4ms-app/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── layout/        # App layout and navigation
│   │   ├── theme/         # Theme toggle component
│   │   └── welcome/       # Welcome screen
│   ├── pages/
│   │   ├── DashboardPage.tsx    # Main dashboard
│   │   ├── ProjectsPage.tsx     # Project management
│   │   └── FiguresPage.tsx      # Figure gallery
│   ├── providers/
│   │   ├── AuthProvider.tsx     # Authentication context
│   │   └── ThemeProvider.tsx    # Theme context
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   └── database.types.ts    # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── backend/
│   ├── main.py            # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── README.md          # Backend documentation
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Database Schema

The application uses Supabase PostgreSQL with the following tables:

- **profiles** - User profiles with theme preferences
- **projects** - User projects organized by domain
- **figures** - Generated visualizations with metadata
- **generations** - Iteration history for figures
- **collections** - Figure collections
- **tags** - Tags for organizing figures
- **conversations** - Chat history for figure generation

All tables have comprehensive RLS policies ensuring users can only access their own data.

## API Endpoints

### Backend API (`http://localhost:8000`)

- `GET /` - API information
- `GET /health` - Health check
- `POST /api/figures/generate` - Generate a new figure
- `POST /api/figures/refine` - Refine an existing figure
- `POST /api/data/upload` - Upload data files (CSV, JSON, XLSX)

API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Usage

### Creating Your First Figure

1. Sign up or log in to your account
2. Click "Create Your First Figure" on the welcome screen
3. Navigate to the Dashboard
4. Click "+ New Figure" in the sidebar
5. Enter a description of the figure you want to create
6. Select the appropriate scientific domain
7. Review and refine the generated figure

### Managing Projects

1. Navigate to "My Projects" from the sidebar
2. Click "+ New Project" to create a project
3. Assign a primary scientific domain
4. Add figures to your project
5. Use tags and collections to organize related work

### Theme Customization

- Click the theme toggle in the header to switch between dawn, day, dusk, and night modes
- Press `Ctrl + Shift + T` (or `Cmd + Shift + T` on Mac) to cycle through themes
- Your preference is saved automatically

## Development

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Linting

```bash
npm run lint
```

## Future Enhancements

- Full CopilotKit integration for conversational AI
- PaperBanana integration for actual figure generation
- Export figures in multiple formats (PNG, SVG, PDF, EPS)
- LaTeX code generation for papers
- Batch figure generation
- Public gallery with sharing
- OAuth providers (Google, GitHub)
- Real-time collaboration features

## License

This project is private and proprietary.

## Support

For issues or questions about the 4Ms platform, please contact the development team.

---

Built with ❤️ for the scientific community
