# Smart Internship Matcher - Frontend

React 18 + Vite + Tailwind CSS 3 + React Router + Axios + Recharts + Framer Motion + React Hot Toast + React Icons.

```bash
cd frontend
npm install
copy .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev                # http://localhost:5173  (start the backend first)
npm run build              # production build in dist/
```

Routes: public (`/`, `/login`, `/register`, `/about`, `/internships`, `/internships/:id`),
student (`/student/...`), company (`/company/...`), admin (`/admin/...`). Route guards are in
`src/components/ProtectedRoute.jsx`; every page loads its data from the API (no hard-coded statistics).
