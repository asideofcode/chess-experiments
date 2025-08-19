# Chess Experiments

A React-based chess application for experimenting with chess engines and voice control features.

## Features

- **Interactive Chess Board** - Visual chess board using `react-chessboard`
- **Stockfish Integration** - Powerful chess engine analysis and AI opponent
- **Game Analysis** - Position evaluation and move suggestions
- **Modern UI** - Built with React 19 and Tailwind CSS

## Tech Stack

- **React 19** - Latest React with modern hooks
- **Vite** - Fast development and build tooling
- **Stockfish.js** - WebAssembly chess engine
- **Chess.js** - Chess game logic and validation
- **Tailwind CSS** - Utility-first CSS framework
- **React Chessboard** - Interactive chess board component

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

- `src/components/` - React components
- `src/hooks/` - Custom React hooks for chess logic
- `src/lib/` - Utility functions and chess engine integration
- `public/stockfish/` - Stockfish engine files (auto-generated)

## Chess Engine

The app uses Stockfish 17, one of the strongest chess engines available. Engine files are automatically copied from `node_modules` during development and build processes.

## Development

This project uses:
- **ESLint** for code linting
- **Vite** for fast HMR and building
- **PostCSS** with Tailwind for styling

The Stockfish engine files are ignored in git as they're large binaries that get auto-generated during the build process.
