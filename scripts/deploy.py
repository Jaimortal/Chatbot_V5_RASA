#!/usr/bin/env python3
"""
Deployment script for BukSU Chatbot
Handles deployment to different environments with proper validation and rollback
"""

import os
import sys
import argparse
import subprocess
import shutil
from pathlib import Path
from datetime import datetime

def backup_current_data():
    """Create backup of current data before deployment"""
    backup_dir = Path(f"data/backup/deployment_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Backup important files
    files_to_backup = [
        'rasa/domain.yml',
        'rasa/data/nlu.yml',
        'rasa/data/stories.yml',
        'rasa/actions/responses.json',
        'rasa/actions/responses_new.json',
        'models/'
    ]
    
    for file_path in files_to_backup:
        src = Path(file_path)
        if src.exists():
            if src.is_dir():
                dst = backup_dir / src.name
                shutil.copytree(src, dst)
            else:
                dst = backup_dir / src.name
                shutil.copy2(src, dst)
            print(f"✅ Backed up: {file_path}")
    
    print(f"📦 Backup created: {backup_dir}")
    return backup_dir

def validate_deployment():
    """Validate that deployment is ready"""
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
        print("❌ Deployment validation failed - missing files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    print("✅ Deployment validation passed")
    return True

def train_model():
    """Train the Rasa model"""
    print("🎓 Training Rasa model...")
    
    cmd = ['rasa', 'train']
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Model training completed successfully")
        return True
    else:
        print(f"❌ Model training failed: {result.stderr}")
        return False

def test_model():
    """Test the trained model"""
    print("🧪 Testing trained model...")
    
    cmd = ['rasa', 'test']
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Model tests passed")
        return True
    else:
        print(f"⚠️ Model tests had issues: {result.stderr}")
        return False

def deploy_to_environment(env):
    """Deploy to specified environment"""
    print(f"🚀 Deploying to {env} environment...")
    
    # Set environment
    os.environ['NODE_ENV'] = env
    
    # Stop existing services
    stop_services()
    
    # Train and test model
    if not train_model():
        print("❌ Deployment failed - model training")
        return False
    
    if not test_model():
        print("⚠️ Continuing deployment despite test issues")
    
    # Start services
    start_services(env)
    
    print(f"✅ Deployment to {env} completed")
    return True

def stop_services():
    """Stop existing services"""
    print("🛑 Stopping existing services...")
    
    # Kill existing Rasa processes
    try:
        subprocess.run(['pkill', '-f', 'rasa'], capture_output=True)
        print("✅ Stopped existing Rasa processes")
    except:
        pass
    
    # Kill Python processes on our ports
    try:
        subprocess.run(['pkill', '-f', 'python.*5005'], capture_output=True)
        subprocess.run(['pkill', '-f', 'python.*5006'], capture_output=True)
        print("✅ Stopped existing Python processes")
    except:
        pass

def start_services(env):
    """Start services for the environment"""
    print("▶️ Starting services...")
    
    # Start action server
    action_cmd = ['python', 'scripts/start.py', '--env', env, '--mode', 'actions']
    subprocess.Popen(action_cmd)
    
    # Start Rasa server
    rasa_cmd = ['python', 'scripts/start.py', '--env', env, '--mode', 'rasa']
    subprocess.Popen(rasa_cmd)
    
    print("✅ Services started")

def rollback_deployment(backup_dir):
    """Rollback to previous deployment"""
    print(f"🔄 Rolling back deployment using backup: {backup_dir}")
    
    # Stop services
    stop_services()
    
    # Restore from backup
    if backup_dir.exists():
        files_to_restore = [
            'domain.yml',
            'nlu.yml',
            'stories.yml',
            'responses.json',
            'responses_new.json'
        ]
        
        for file_name in files_to_restore:
            src = backup_dir / file_name
            dst = Path(f'rasa/{file_name}') if file_name != 'domain.yml' else Path(f'rasa/data/{file_name}')
            if src.exists():
                shutil.copy2(src, dst)
                print(f"✅ Restored: {file_name}")
        
        print("✅ Rollback completed")
        return True
    
    print("❌ Backup directory not found")
    return False

def create_deployment_log(env, success=True):
    """Create deployment log entry"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'environment': env,
        'success': success,
        'git_commit': get_git_commit() if Path('.git').exists() else 'N/A'
    }
    
    log_file = Path('logs/deployments.log')
    log_file.parent.mkdir(exist_ok=True)
    
    with open(log_file, 'a') as f:
        f.write(f"{log_entry}\n")
    
    print(f"📝 Deployment logged: {log_entry['timestamp']}")

def get_git_commit():
    """Get current Git commit hash"""
    try:
        result = subprocess.run(['git', 'rev-parse', 'HEAD'], 
                          capture_output=True, text=True)
        return result.stdout.strip()
    except:
        return 'N/A'

def main():
    """Main deployment function"""
    parser = argparse.ArgumentParser(description='BukSU Chatbot Deployment Script')
    parser.add_argument('environment', 
                       choices=['development', 'staging', 'production'],
                       help='Target environment for deployment')
    parser.add_argument('--backup', action='store_true',
                       help='Create backup before deployment')
    parser.add_argument('--rollback', 
                       help='Rollback to specified backup directory')
    parser.add_argument('--validate-only', action='store_true',
                       help='Only validate, do not deploy')
    
    args = parser.parse_args()
    
    print("🚀 BukSU Chatbot Deployment")
    print("=" * 40)
    
    # Handle rollback
    if args.rollback:
        rollback_deployment(Path(args.rollback))
        return
    
    # Validate deployment
    if not validate_deployment():
        print("❌ Deployment validation failed")
        sys.exit(1)
    
    if args.validate_only:
        print("✅ Validation completed - ready for deployment")
        return
    
    # Create backup if requested
    backup_dir = None
    if args.backup:
        backup_dir = backup_current_data()
    else:
        print("⚠️ Skipping backup (use --backup to enable)")
    
    try:
        # Deploy to environment
        success = deploy_to_environment(args.environment)
        
        # Log deployment
        create_deployment_log(args.environment, success)
        
        if success:
            print("🎉 Deployment completed successfully!")
        else:
            print("❌ Deployment failed!")
            if backup_dir:
                print("🔄 Consider rolling back with --rollback")
    
    except KeyboardInterrupt:
        print("\n❌ Deployment interrupted by user")
        if backup_dir:
            print("🔄 Consider rolling back with --rollback")
    except Exception as e:
        print(f"❌ Deployment error: {e}")
        if backup_dir:
            print("🔄 Consider rolling back with --rollback")

if __name__ == "__main__":
    main()
