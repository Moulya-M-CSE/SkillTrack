
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
import os

app = Flask(__name__)

# Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///skilltrack.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)
db = SQLAlchemy(app)

# Career skill requirements
CAREERS = {
    "Data Scientist": [
        "Python", "SQL", "Statistics",
        "Machine Learning", "Data Analysis"
    ],
    "Data Analyst": [
        "SQL", "Excel", "Python",
        "Data Analysis", "Power BI"
    ],
    "ML Engineer": [
        "Python", "Machine Learning", "Deep Learning",
        "SQL", "Statistics"
    ],
    "Full-Stack Developer": [
        "HTML & CSS", "JavaScript", "React", "Python", "SQL"
    ]
}

LEVELS = {
    "Beginner": 25,
    "Intermediate": 60,
    "Advanced": 90
}

# Database models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)


class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(30), nullable=False)
    category = db.Column(db.String(50), default="Technical")


class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)


def get_user(user_id):
    return db.session.get(User, user_id)


def get_user_skills(user_id):
    return Skill.query.filter_by(user_id=user_id).all()


# Health check
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "SkillTrack backend is running!"
    })


# Registration
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"message": "All fields are required."}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must contain at least 6 characters."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered."}), 409

    user = User(
        name=name,
        email=email,
        password=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Registration successful!",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 201


# Login
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid email or password."}), 401

    return jsonify({
        "message": "Login successful!",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    })


# Get all skills
@app.route("/api/skills", methods=["GET"])
def get_skills():
    user_id = request.args.get("user_id", type=int)

    if not get_user(user_id):
        return jsonify({"message": "User not found."}), 404

    skills = get_user_skills(user_id)

    return jsonify([
        {
            "id": skill.id,
            "name": skill.name,
            "level": skill.level,
            "proficiency": LEVELS[skill.level],
            "category": skill.category
        }
        for skill in skills
    ])


# Add a skill
@app.route("/api/skills", methods=["POST"])
def add_skill():
    data = request.get_json() or {}

    user_id = data.get("user_id")
    name = data.get("name", "").strip()
    level = data.get("level", "Beginner")
    category = data.get("category", "Technical")

    if not get_user(user_id):
        return jsonify({"message": "User not found."}), 404

    if not name or level not in LEVELS:
        return jsonify({"message": "Provide a skill name and valid level."}), 400

    skill = Skill(
        user_id=user_id,
        name=name,
        level=level,
        category=category
    )

    db.session.add(skill)
    db.session.commit()

    return jsonify({
        "message": "Skill added successfully!",
        "skill": {
            "id": skill.id,
            "name": skill.name,
            "level": skill.level,
            "proficiency": LEVELS[skill.level],
            "category": skill.category
        }
    }), 201


# Edit a skill
@app.route("/api/skills/<int:skill_id>", methods=["PUT"])
def update_skill(skill_id):
    data = request.get_json() or {}
    user_id = data.get("user_id")

    skill = Skill.query.filter_by(
        id=skill_id,
        user_id=user_id
    ).first()

    if not skill:
        return jsonify({"message": "Skill not found."}), 404

    name = data.get("name", skill.name).strip()
    level = data.get("level", skill.level)
    category = data.get("category", skill.category)

    if not name or level not in LEVELS:
        return jsonify({"message": "Invalid skill details."}), 400

    skill.name = name
    skill.level = level
    skill.category = category

    db.session.commit()

    return jsonify({"message": "Skill updated successfully!"})


# Delete a skill
@app.route("/api/skills/<int:skill_id>", methods=["DELETE"])
def delete_skill(skill_id):
    user_id = request.args.get("user_id", type=int)

    skill = Skill.query.filter_by(
        id=skill_id,
        user_id=user_id
    ).first()

    if not skill:
        return jsonify({"message": "Skill not found."}), 404

    db.session.delete(skill)
    db.session.commit()

    return jsonify({"message": "Skill deleted successfully!"})


# Career skill gap analysis using Pandas
@app.route("/api/career-analysis", methods=["GET"])
def career_analysis():
    user_id = request.args.get("user_id", type=int)
    career = request.args.get("career", "")

    if not get_user(user_id):
        return jsonify({"message": "User not found."}), 404

    if career not in CAREERS:
        return jsonify({"message": "Invalid career selection."}), 400

    skills = get_user_skills(user_id)

    user_skill_data = {
        skill.name.lower(): LEVELS[skill.level]
        for skill in skills
    }

    rows = []

    for required_skill in CAREERS[career]:
        proficiency = user_skill_data.get(required_skill.lower(), 0)

        rows.append({
            "name": required_skill,
            "current": proficiency,
            "target": 80,
            "gap": max(0, 80 - proficiency)
        })

    df = pd.DataFrame(rows)

    return jsonify({
        "career": career,
        "match_percentage": round(
            (df["current"].clip(upper=80).sum() / (len(df) * 80)) * 100
        ),
        "skills": df.to_dict(orient="records")
    })


# Personalized recommendations
@app.route("/api/recommendations", methods=["GET"])
def recommendations():
    user_id = request.args.get("user_id", type=int)
    career = request.args.get("career", "")

    if not get_user(user_id):
        return jsonify({"message": "User not found."}), 404

    if career not in CAREERS:
        return jsonify({"message": "Invalid career selection."}), 400

    skills = get_user_skills(user_id)
    user_skill_data = {
        skill.name.lower(): LEVELS[skill.level]
        for skill in skills
    }

    result = []

    for skill_name in CAREERS[career]:
        proficiency = user_skill_data.get(skill_name.lower(), 0)

        if proficiency < 80:
            result.append({
                "skill": skill_name,
                "current_level": proficiency,
                "suggestion": (
                    f"Start learning {skill_name}."
                    if proficiency == 0
                    else f"Improve your {skill_name} skills through practical projects."
                ),
                "priority": "High" if proficiency == 0 else "Medium"
            })

    return jsonify(result)


# Dashboard information
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    user_id = request.args.get("user_id", type=int)

    if not get_user(user_id):
        return jsonify({"message": "User not found."}), 404

    skills = get_user_skills(user_id)

    values = [LEVELS[skill.level] for skill in skills]

    average = round(sum(values) / len(values)) if values else 0

    progress_items = Progress.query.filter_by(user_id=user_id).all()

    return jsonify({
        "total_skills": len(skills),
        "average_proficiency": average,
        "completed_goals": sum(1 for item in progress_items if item.completed),
        "total_goals": len(progress_items)
    })


# Add a progress goal
@app.route("/api/progress", methods=["POST"])
def add_progress():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    title = data.get("title", "").strip()

    if not get_user(user_id):
        return jsonify({"message": "User not found."}), 404

    if not title:
        return jsonify({"message": "Goal title is required."}), 400

    item = Progress(user_id=user_id, title=title)

    db.session.add(item)
    db.session.commit()

    return jsonify({
        "message": "Progress goal added!",
        "id": item.id
    }), 201


# View progress goals
@app.route("/api/progress", methods=["GET"])
def get_progress():
    user_id = request.args.get("user_id", type=int)

    if not get_user(user_id):
        return jsonify({"message": "User not found."}), 404

    items = Progress.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": item.id,
            "title": item.title,
            "completed": item.completed
        }
        for item in items
    ])


# Update progress goal
@app.route("/api/progress/<int:goal_id>", methods=["PUT"])
def update_progress(goal_id):
    data = request.get_json() or {}
    user_id = data.get("user_id")

    item = Progress.query.filter_by(
        id=goal_id,
        user_id=user_id
    ).first()

    if not item:
        return jsonify({"message": "Goal not found."}), 404

    item.completed = bool(data.get("completed", item.completed))
    db.session.commit()

    return jsonify({"message": "Progress updated!"})


# Create database tables and start server
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
