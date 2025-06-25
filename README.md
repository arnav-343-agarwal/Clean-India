This is a full-stack civic reporting app called SwachhMap. The idea is to allow users to report unclean public locations (e.g., garbage dumps, waterlogging) by uploading photos and pinning them on a map.

🧱 Tech Stack:
- Frontend: Next.js (App Router , In javascript - No typescript)
- Backend: API Routes in Next.js
- DB: MongoDB (abstracted using a DAL layer for easy migration)
- Cloudinary: For image upload
- Mapbox: For map & location tagging
- Joi: For schema validation

🎯 Key Features:
- Report an issue (title, description, category, image, location)
- Browse reports on a map
- Filter by category or date
- Admin can mark issues as resolved
- Modular codebase (can swap DB later)
