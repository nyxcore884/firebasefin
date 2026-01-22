
from flask import Flask

def create_app():
    app = Flask(__name__)

    # Import and register the blueprint
    from .api.v1.financials import financials_bp
    app.register_blueprint(financials_bp, url_prefix='/api/v1')

    return app
