# AI Guardian Frontend

Next.js 13 dashboard for AI Guardian evaluations.

## Setup

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Server will run on http://localhost:3000; API proxy to backend at /api.

### Build

```bash
npm run build
npm start
```

## Features

- Evaluation form with prompt / output / context
- API key input stored in localStorage
- Results display
- Dashboard placeholder
- Tailwind CSS for styling

## Notes

Backend must be running at http://localhost:8000 or configure rewrites in `next.config.js`.
