#!/usr/bin/env python3
"""
Production-ready startup script for BukSU Chatbot
Handles different environments and provides comprehensive startup options
"""

import os
import sys
import signal
import subprocess
import time
from pathlib import Path
import logging
from datetime import datetime

# Configure logging
def setup_logging():
    """Setup logging configuration"""
    log_level = os.getenv('LOG_LEVEL', 'INFO')
    log_file = os.getenv('LOG_FILE', 'logs/app.log')
    
    # Create logs directory
    Path('logs').mkdir(exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    return logging.getLogger(__name__)

def load_environment():
    """Load environment-specific configuration"""
    env = os.getenv('NODE_ENV', 'development')
    
    if env == 'production':
        config_file = 'config/production.yml'
        port = os.getenv('PORT', '5005')
        log_level = 'INFO'
    elif env == 'staging':
        config_file = 'config/staging.yml'
        port = os.getenv('PORT', '5006')
        log_level = 'INFO'
    else:
        config_file = 'config/development.yml'
        port = os.getenv('PORT', '5005')
        log_level = 'DEBUG'
    
    return {
        'env': env,
        'config_file': config_file,
        'port': port,
        'log_level': log_level
    }

def check_dependencies():
    """Check if all dependencies are installed"""
    try:
        import rasa
        import flask
        print("✅ Core dependencies available")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False
    
    return True

def start_rasa_server(config):
    """Start Rasa server with environment-specific configuration"""
    logger = setup_logging()
    logger.info(f"Starting Rasa server in {config['env']} mode")
    logger.info(f"Using config file: {config['config_file']}")
    logger.info(f"Port: {config['port']}")
    
    # Rasa server command
    cmd = [
        'rasa', 'run',
        '--enable-api',
        '--cors', '*',
        '--debug' if config['env'] == 'development' else '',
        '--config', config['config_file'],
        '--port', config['port'],
        '--log-level', config['log_level'].lower()
    ]
    
    # Remove empty strings from command
    cmd = [arg for arg in cmd if arg]
    
    try:
        logger.info("Starting Rasa server...")
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Handle graceful shutdown
        def signal_handler(sig, frame):
            logger.info("Shutting down Rasa server...")
            process.terminate()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Wait for process
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            logger.error(f"Rasa server exited with code {process.returncode}")
            if stderr:
                logger.error(f"Error: {stderr.decode()}")
        else:
            logger.info("Rasa server stopped successfully")
            
    except Exception as e:
        logger.error(f"Failed to start Rasa server: {e}")
        return False
    
    return True

def start_action_server(config):
    """Start Rasa action server"""
    logger = setup_logging()
    logger.info("Starting Rasa action server...")
    
    cmd = [
        'rasa', 'run', 'actions',
        '--debug' if config['env'] == 'development' else '',
        '--log-level', config['log_level'].lower()
    ]
    
    # Remove empty strings from command
    cmd = [arg for arg in cmd if arg]
    
    try:
        process = subprocess.Popen(cmd, cwd='rasa/actions')
        logger.info("Action server started")
        return process
    except Exception as e:
        logger.error(f"Failed to start action server: {e}")
        return None

def health_check(port):
    """Perform health check on the server"""
    import requests
    
    try:
        response = requests.get(f"http://localhost:{port}/", timeout=5)
        if response.status_code == 200:
            print("✅ Server is healthy")
            return True
    except:
        pass
    
    print("❌ Server health check failed")
    return False

def show_status():
    """Show current server status"""
    config = load_environment()
    port = config['port']
    
    print(f"📊 Server Status Check")
    print(f"Environment: {config['env']}")
    print(f"Port: {port}")
    
    if health_check(port):
        print("Status: 🟢 RUNNING")
    else:
        print("Status: 🔴 STOPPED")

def main():
    """Main startup function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='BukSU Chatbot Startup Script')
    parser.add_argument('--env', choices=['development', 'staging', 'production'], 
                       help='Environment to run in')
    parser.add_argument('--mode', choices=['rasa', 'actions', 'both'], 
                       default='both', help='What to start')
    parser.add_argument('--status', action='store_true', 
                       help='Show server status')
    parser.add_argument('--train', action='store_true', 
                       help='Train model before starting')
    
    args = parser.parse_args()
    
    # Override environment if specified
    if args.env:
        os.environ['NODE_ENV'] = args.env
    
    config = load_environment()
    
    # Show status if requested
    if args.status:
        show_status()
        return
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Train model if requested
    if args.train:
        print("🎓 Training Rasa model...")
        train_result = subprocess.run(['rasa', 'train'], 
                               capture_output=True, text=True)
        if train_result.returncode == 0:
            print("✅ Model training completed")
        else:
            print(f"❌ Model training failed: {train_result.stderr}")
            return
    
    print(f"🚀 Starting BukSU Chatbot in {config['env']} mode")
    print("=" * 50)
    
    # Start servers based on mode
    if args.mode == 'actions':
        start_action_server(config)
    elif args.mode == 'rasa':
        start_rasa_server(config)
    else:  # both
        action_process = start_action_server(config)
        time.sleep(3)  # Give action server time to start
        start_rasa_server(config)
        
        if action_process:
            action_process.wait()

if __name__ == "__main__":
    main()
