#!/usr/bin/env python3
"""
Monitoring and health check script for BukSU Chatbot
Provides comprehensive monitoring capabilities for production environments
"""

import os
import sys
import time
import json
import requests
import psutil
from pathlib import Path
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/monitoring.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class ChatbotMonitor:
    """Comprehensive monitoring system for BukSU Chatbot"""
    
    def __init__(self):
        self.config = self.load_config()
        self.metrics = {
            'uptime': 0,
            'requests_total': 0,
            'requests_success': 0,
            'requests_error': 0,
            'response_times': [],
            'memory_usage': [],
            'cpu_usage': []
        }
        self.start_time = time.time()
    
    def load_config(self):
        """Load monitoring configuration"""
        return {
            'rasa_url': os.getenv('RASA_URL', 'http://localhost:5005'),
            'health_check_interval': int(os.getenv('HEALTH_CHECK_INTERVAL', '60')),
            'log_retention_days': int(os.getenv('LOG_RETENTION_DAYS', '30')),
            'alert_threshold_cpu': float(os.getenv('ALERT_THRESHOLD_CPU', '80.0')),
            'alert_threshold_memory': float(os.getenv('ALERT_THRESHOLD_MEMORY', '80.0')),
            'enable_alerts': os.getenv('ENABLE_ALERTS', 'true').lower() == 'true'
        }
    
    def check_server_health(self):
        """Check if Rasa server is responding"""
        try:
            response = requests.get(
                f"{self.config['rasa_url']}/",
                timeout=10
            )
            if response.status_code == 200:
                logger.info("✅ Server health check passed")
                return True
            else:
                logger.error(f"❌ Server returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Health check failed: {e}")
            return False
    
    def check_system_resources(self):
        """Monitor system resources"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.metrics['cpu_usage'].append(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            self.metrics['memory_usage'].append(memory_percent)
            
            # Check thresholds and send alerts
            if self.config['enable_alerts']:
                if cpu_percent > self.config['alert_threshold_cpu']:
                    self.send_alert(f"High CPU usage: {cpu_percent:.1f}%")
                
                if memory_percent > self.config['alert_threshold_memory']:
                    self.send_alert(f"High memory usage: {memory_percent:.1f}%")
            
            logger.info(f"📊 CPU: {cpu_percent:.1f}%, Memory: {memory_percent:.1f}%")
            return True
            
        except Exception as e:
            logger.error(f"❌ Resource monitoring failed: {e}")
            return False
    
    def check_response_time(self):
        """Monitor API response times"""
        try:
            start_time = time.time()
            response = requests.get(
                f"{self.config['rasa_url']}/",
                timeout=5
            )
            response_time = time.time() - start_time
            
            self.metrics['response_times'].append(response_time)
            
            if response_time > 5.0:  # 5 second threshold
                logger.warning(f"⚠️ Slow response time: {response_time:.2f}s")
            else:
                logger.info(f"⚡ Response time: {response_time:.2f}s")
            
            return response_time
            
        except Exception as e:
            logger.error(f"❌ Response time check failed: {e}")
            return None
    
    def send_alert(self, message):
        """Send alert notification"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        alert_message = f"[ALERT] {timestamp} - {message}"
        
        # Log alert
        logger.warning(alert_message)
        
        # Here you can integrate with alert systems like:
        # - Email notifications
        # - Slack webhook
        # - SMS alerts
        # - Discord notifications
        
        # Example email integration (commented out, configure as needed)
        # import smtplib
        # self.send_email_alert(alert_message)
    
    def collect_metrics(self):
        """Collect and aggregate metrics"""
        uptime = time.time() - self.start_time
        
        # Calculate averages
        avg_response_time = sum(self.metrics['response_times']) / len(self.metrics['response_times']) if self.metrics['response_times'] else 0
        avg_cpu = sum(self.metrics['cpu_usage']) / len(self.metrics['cpu_usage']) if self.metrics['cpu_usage'] else 0
        avg_memory = sum(self.metrics['memory_usage']) / len(self.metrics['memory_usage']) if self.metrics['memory_usage'] else 0
        
        metrics_summary = {
            'timestamp': datetime.now().isoformat(),
            'uptime_hours': uptime / 3600,
            'requests_total': self.metrics['requests_total'],
            'success_rate': (self.metrics['requests_success'] / max(1, self.metrics['requests_total'])) * 100,
            'avg_response_time': avg_response_time,
            'avg_cpu_usage': avg_cpu,
            'avg_memory_usage': avg_memory
        }
        
        # Save metrics to file
        self.save_metrics(metrics_summary)
        return metrics_summary
    
    def save_metrics(self, metrics):
        """Save metrics to file"""
        metrics_file = Path('logs/metrics.json')
        metrics_file.parent.mkdir(exist_ok=True)
        
        # Load existing metrics
        existing_metrics = []
        if metrics_file.exists():
            try:
                with open(metrics_file, 'r') as f:
                    existing_metrics = json.load(f)
            except:
                existing_metrics = []
        
        # Add new metrics
        existing_metrics.append(metrics)
        
        # Keep only last 1000 entries
        if len(existing_metrics) > 1000:
            existing_metrics = existing_metrics[-1000:]
        
        # Save metrics
        with open(metrics_file, 'w') as f:
            json.dump(existing_metrics, f, indent=2)
    
    def cleanup_old_logs(self):
        """Clean up old log files"""
        cutoff_date = datetime.now() - timedelta(days=self.config['log_retention_days'])
        logs_dir = Path('logs')
        
        for log_file in logs_dir.glob('*.log'):
            try:
                file_time = datetime.fromtimestamp(log_file.stat().st_mtime)
                if file_time < cutoff_date:
                    log_file.unlink()
                    logger.info(f"🗑️ Deleted old log: {log_file}")
            except Exception as e:
                logger.error(f"❌ Failed to delete {log_file}: {e}")
    
    def run_monitoring(self):
        """Main monitoring loop"""
        logger.info("🔍 Starting monitoring system")
        logger.info(f"📊 Monitoring {self.config['rasa_url']}")
        
        try:
            while True:
                # Health check
                self.check_server_health()
                
                # System resources
                self.check_system_resources()
                
                # Response time
                self.check_response_time()
                
                # Collect metrics every 10 cycles
                if len(self.metrics['response_times']) % 10 == 0:
                    self.collect_metrics()
                
                # Cleanup logs every hour
                if int(time.time()) % 3600 == 0:
                    self.cleanup_old_logs()
                
                time.sleep(self.config['health_check_interval'])
                
        except KeyboardInterrupt:
            logger.info("⏹️ Monitoring stopped by user")
        except Exception as e:
            logger.error(f"❌ Monitoring error: {e}")

def show_status():
    """Show current monitoring status"""
    monitor = ChatbotMonitor()
    
    print("📊 BukSU Chatbot Monitoring Status")
    print("=" * 40)
    
    # Server health
    if monitor.check_server_health():
        print("🟢 Server Status: HEALTHY")
    else:
        print("🔴 Server Status: UNHEALTHY")
    
    # System resources
    monitor.check_system_resources()
    
    # Recent metrics
    try:
        with open('logs/metrics.json', 'r') as f:
            metrics = json.load(f)
            if metrics:
                latest = metrics[-1]
                print(f"📈 Latest Metrics:")
                print(f"   Uptime: {latest['uptime_hours']:.1f} hours")
                print(f"   Success Rate: {latest['success_rate']:.1f}%")
                print(f"   Avg Response Time: {latest['avg_response_time']:.2f}s")
                print(f"   Avg CPU: {latest['avg_cpu_usage']:.1f}%")
                print(f"   Avg Memory: {latest['avg_memory_usage']:.1f}%")
    except:
        print("📈 No metrics available")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='BukSU Chatbot Monitoring')
    parser.add_argument('--status', action='store_true',
                       help='Show current status')
    parser.add_argument('--daemon', action='store_true',
                       help='Run monitoring in background')
    
    args = parser.parse_args()
    
    if args.status:
        show_status()
    else:
        monitor = ChatbotMonitor()
        if args.daemon:
            # Run as daemon (background process)
            import daemon
            with daemon.DaemonContext():
                monitor.run_monitoring()
        else:
            monitor.run_monitoring()

if __name__ == "__main__":
    main()
