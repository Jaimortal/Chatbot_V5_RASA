#!/usr/bin/env python3
"""
Environment Setup Script for BukSU Chatbot
Automatically configures environment based on NODE_ENV
"""

import os
import sys
import shutil
from pathlib import Path

def create_env_file():
    """Create .env file from template if it doesn't exist"""
    env_example = Path('.env.example')
    env_file = Path('.env')
    
    if not env_file.exists() and env_example.exists():
        shutil.copy('.env.example', '.env')
        print("✅ Created .env file from .env.example")
        print("⚠️  Please update .env with your environment-specific values")
    elif env_file.exists():
        print("✅ .env file already exists")
    else:
        print("❌ .env.example file not found!")
        return False
    
    return True

def create_directories():
    """Create necessary directories for the application"""
    directories = [
        'logs',
        'uploads',
        'models',
        'data/backup',
        'config/environments',
        'scripts/deployment',
        'monitoring'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def setup_python_environment():
    """Set up Python virtual environment and install dependencies"""
    if not Path('venv').exists():
        print("🐍 Creating Python virtual environment...")
        os.system('python -m venv venv')
        print("✅ Virtual environment created")
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        activate_cmd = 'venv\\Scripts\\activate'
        pip_cmd = 'venv\\Scripts\\pip'
    else:  # Unix/Linux/Mac
        activate_cmd = 'source venv/bin/activate'
        pip_cmd = 'venv/bin/pip'
    
    print("📦 Installing dependencies...")
    os.system(f'{pip_cmd} install -r requirements.txt')
    print("✅ Dependencies installed")

def validate_environment():
    """Validate that all required files and configurations exist"""
    required_files = [
        'rasa/domain.yml',
        'rasa/data/nlu.yml',
        'rasa/data/stories.yml',
        'rasa/actions/actions.py',
        'rasa/actions/responses.json',
        'rasa/actions/responses_new.json'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    print("✅ All required files present")
    return True

def get_environment_config():
    """Get current environment configuration"""
    env = os.getenv('NODE_ENV', 'development')
    
    configs = {
        'development': {
            'config_file': 'config/development.yml',
            'log_level': 'DEBUG',
            'port': 5005,
            'description': 'Development Environment'
        },
        'staging': {
            'config_file': 'config/staging.yml',
            'log_level': 'INFO',
            'port': 5006,
            'description': 'Staging Environment'
        },
        'production': {
            'config_file': 'config/production.yml',
            'log_level': 'INFO',
            'port': 5005,
            'description': 'Production Environment'
        }
    }
    
    return configs.get(env, configs['development'])

def main():
    """Main setup function"""
    print("🚀 Setting up BukSU Chatbot Environment")
    print("=" * 50)
    
    # Create environment file
    if not create_env_file():
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Validate environment
    if not validate_environment():
        print("❌ Please fix missing files before continuing")
        sys.exit(1)
    
    # Setup Python environment
    setup_python_environment()
    
    # Show current configuration
    config = get_environment_config()
    print(f"\n📋 Current Environment: {config['description']}")
    print(f"📄 Config File: {config['config_file']}")
    print(f"📊 Log Level: {config['log_level']}")
    print(f"🌐 Port: {config['port']}")
    
    print("\n✅ Environment setup complete!")
    print("\n📝 Next steps:")
    print("1. Update .env file with your specific values")
    print("2. Run 'python scripts/start.py' to start the application")
    print("3. Run 'python scripts/train.py' to train the Rasa model")

if __name__ == "__main__":
    main()
