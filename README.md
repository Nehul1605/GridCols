# DataGrid Assignment

A feature-rich, high-performance Data Grid component built with React, TypeScript, and Vite. This project demonstrates complex grid functionalities including virtualization, sorting, filtering, column manipulation, and inline editing.

## Features

- **High Performance**: Optimized for handling large datasets.
- **Sorting**: Support for ascending and descending sort on columns.
- **Column Resizing**: Draggable column headers to adjust width.
- **Column Pinning**: Pin columns to the left or right for easy viewing of wide tables.
- **Inline Editing**: Edit cell values directly within the grid with validation support.
- **Column Visibility**: Toggle column visibility.
- **History Management**: Track changes like edits and column resizing.
- **Customizable Renderers**: Support for custom cell renderers and editors.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Component Development**: Storybook
- **Testing**: Vitest, Playwright

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Nehul1605/GridCols.git
   ```
2. Navigate to the project directory:
   ```bash
   cd GridCols
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

### Storybook

This project uses Storybook for component development and documentation.

To start Storybook:

```bash
npm run storybook
```

Storybook will launch at `http://localhost:6006`.

### Building for Production

To build the application for production:

```bash
npm run build
```

This will compile the TypeScript code and bundle the application using Vite.

## Project Structure

- `src/components/DataGrid`: Contains the core DataGrid component and related files.
- `src/stories`: Storybook stories for UI components.
- `src/App.tsx`: Main application entry point demonstrating the grid usage.
