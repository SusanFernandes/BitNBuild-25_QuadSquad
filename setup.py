# setup.py
"""
Setup script for TaxWise AI Tax Assistant
Run this script to set up the project structure and initialize the application
"""

import os
import sys
from pathlib import Path
import subprocess


def create_directory_structure():
    """Create the required directory structure"""
    directories = [
        "database",
        "services",
        "utils",
        "uploads",
        "reports",
        "chroma_db",
        "logs",
        "tests",
        "static",
        "templates",
    ]

    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✓ Created directory: {directory}")

    # Create __init__.py files for Python packages
    python_packages = ["database", "services", "utils"]
    for package in python_packages:
        init_file = Path(package) / "__init__.py"
        init_file.touch()
        print(f"✓ Created {init_file}")


def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = Path(".env")
    if not env_file.exists():
        env_content = """# TaxWise Environment Configuration
GROQ_API_KEY=insertkey
DATABASE_URL=sqlite:///./taxwise.db
APP_NAME=TaxWise
DEBUG=True
SECRET_KEY=taxwise_secret_key_change_in_production
"""
        env_file.write_text(env_content)
        print("✓ Created .env file (please update with your actual values)")
    else:
        print("✓ .env file already exists")


def install_dependencies():
    """Install required Python packages"""
    print("Installing dependencies...")
    try:
        subprocess.run(
            [sys.executable, "-m", "uv", "pip", "install", "-r", "requirements.txt"],
            check=True,
            capture_output=True,
            text=True,
        )
        print("✓ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing dependencies: {e}")
        print("Please run: pip install -r requirements.txt manually")


def initialize_database():
    """Initialize the SQLite database"""
    print("Initializing database...")
    try:
        from sqlalchemy import create_engine
        from database.models import Base

        engine = create_engine("sqlite:///./taxwise.db")
        Base.metadata.create_all(engine)
        print("✓ Database initialized successfully")
    except Exception as e:
        print(f"✗ Error initializing database: {e}")


def main():
    """Main setup function"""
    print("🚀 Setting up TaxWise AI Tax Assistant...")
    print("=" * 50)

    # Create directory structure
    create_directory_structure()

    # Create .env file
    create_env_file()

    # Install dependencies
    install_dependencies()

    # Initialize database
    initialize_database()

    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Update .env file with your Groq API key")
    print("2. Run: python main.py to start the server")
    print("3. Visit: http://localhost:8000/docs for API documentation")
    print("\n💡 Tips:")
    print("- Check logs/ directory for application logs")
    print("- Upload test files to uploads/ directory")
    print("- Reports will be generated in reports/ directory")


if __name__ == "__main__":
    main()
