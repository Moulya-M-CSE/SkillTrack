# SkillTrack – Student Skill & Career Insights Platform

SkillTrack is a full-stack web application designed to help students manage their technical skills, identify career-related skill gaps, receive personalized learning recommendations, and track their learning progress.

## Features

- **Student Authentication:** Register and log in to a personal account.
- **Skill Management:** Add, edit, and delete technical skills.
- **Career Skill Gap Analysis:** Compare current skills with career-specific requirements.
- **Analytics Dashboard:** View an overview of skills and learning progress.
- **Personalized Recommendations:** Get learning suggestions based on identified skill gaps.
- **Progress Tracking:** Add learning goals and track their completion.

## Technologies Used

**Frontend**
- React.js
- CSS
- JavaScript
- Vite

**Backend**
- Python
- Flask
- Flask-CORS
- Flask-SQLAlchemy

**Database and Data Analysis**
- SQLite
- Pandas

## Project Structure

```text
SkillTrack/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app.py
│   └── requirements.txt
└── .gitignore
```

## Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Moulya-M-CSE/SkillTrack.git
cd SkillTrack
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start Flask:

```bash
python app.py
```

Backend runs at `http://127.0.0.1:5000`.

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## Project Purpose

SkillTrack aims to support students in understanding their current technical abilities, identifying the skills required for their desired careers, and planning their learning journey.

## Author

**Moulya M**

GitHub: [Moulya-M-CSE](https://github.com/Moulya-M-CSE)

LinkedIn: [Moulya M](https://www.linkedin.com/in/moulya-m-513030385/)

---

Developed as a full-stack student project.