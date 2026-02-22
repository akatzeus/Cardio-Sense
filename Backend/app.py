from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database import db

# Blueprints
from auth.routes import auth_bp
from routes.user_routes import user_bp
from routes.doctor_routes import doctor_bp
from routes.health_routes import health_bp


def create_app():
    app = Flask(__name__)

    # Load config
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    CORS(
        app,
        supports_credentials=True,
        resources={r"/*": {"origins": "*"}}  # adjust in production
    )

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(health_bp)

    # Create DB tables
    with app.app_context():
        db.create_all()

    # Health check
    @app.route("/health", methods=["GET"])
    def health():
        return {"status": "Backend running"}, 200

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)