"""
Admin Dashboard Endpoints for Monitoring Online Learning
========================================================
Add these to main.py for dashboard monitoring.

Usage in main.py:
    from admin_dashboard import get_admin_dashboard
    
    @app.get("/admin/dashboard", response_class=HTMLResponse)
    def admin_dashboard():
        return get_admin_dashboard()
"""

from fastapi.responses import HTMLResponse
from datetime import datetime
from database import get_statistics


def get_admin_dashboard() -> str:
    """Generate admin dashboard HTML."""
    
    stats = get_statistics()
    
    # Determine status colors
    prediction_status = "✅ Active" if stats['total_predictions'] > 0 else "⏳ Waiting"
    feedback_status = "✅ Collecting" if stats['total_feedback'] > 0 else "⏳ Pending"
    feedback_rate_color = "#4caf50" if stats['feedback_rate'] >= 20 else "#ff9800" if stats['feedback_rate'] >= 10 else "#f44336"
    retrain_ready = "✅ Yes" if stats['total_feedback'] >= 20 else "❌ Not Yet"
    
    html_content = f"""
    <! DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mind Bloom - Online Learning Dashboard</title>
        <style>
            * {{
                margin: 0;
                padding:  0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background:  linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }}
            
            .container {{
                max-width: 1200px;
                margin: 0 auto;
            }}
            
            .header {{
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin-bottom: 30px;
            }}
            
            .header h1 {{
                color: #667eea;
                font-size: 2.5em;
                margin-bottom: 10px;
            }}
            
            .header p {{
                color: #666;
                font-size: 1.1em;
            }}
            
            .metrics {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }}
            
            . metric-card {{
                background: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow:  0 4px 6px rgba(0, 0, 0, 0.1);
                border-left: 5px solid #667eea;
            }}
            
            .metric-card h3 {{
                color: #666;
                font-size: 0.9em;
                text-transform: uppercase;
                margin-bottom: 15px;
                letter-spacing: 1px;
            }}
            
            . metric-value {{
                font-size: 2.5em;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
            }}
            
            .metric-status {{
                font-size: 0.9em;
                color: #999;
            }}
            
            .metric-card.predictions {{ border-left-color: #667eea; }}
            .metric-card.feedback {{ border-left-color: #f093fb; }}
            .metric-card.rate {{ border-left-color: #4facfe; }}
            .metric-card.confidence {{ border-left-color: #43e97b; }}
            
            .status-section {{
                background: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin-bottom: 30px;
            }}
            
            .status-section h2 {{
                color: #667eea;
                margin-bottom: 20px;
                font-size: 1.5em;
            }}
            
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }}
            
            th {{
                background: #f5f5f5;
                padding: 15px;
                text-align: left;
                font-weight: 600;
                color: #333;
                border-bottom: 2px solid #ddd;
            }}
            
            td {{
                padding: 12px 15px;
                border-bottom: 1px solid #eee;
            }}
            
            tr:hover {{
                background: #f9f9f9;
            }}
            
            .status-badge {{
                display: inline-block;
                padding: 5px 12px;
                border-radius:  20px;
                font-size:  0.85em;
                font-weight: 600;
            }}
            
            .badge-active {{
                background: #e8f5e9;
                color: #2e7d32;
            }}
            
            .badge-pending {{
                background: #fff3e0;
                color: #e65100;
            }}
            
            .badge-ready {{
                background: #e8f5e9;
                color: #2e7d32;
            }}
            
            .badge-not-ready {{
                background: #ffebee;
                color: #c62828;
            }}
            
            .progress-section {{
                background: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin-bottom: 30px;
            }}
            
            .progress-item {{
                margin-bottom: 20px;
            }}
            
            .progress-label {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 0.95em;
            }}
            
            .progress-bar {{
                width: 100%;
                height: 8px;
                background: #eee;
                border-radius: 4px;
                overflow:  hidden;
            }}
            
            .progress-fill {{
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 4px;
                transition: width 0.3s ease;
            }}
            
            .info-box {{
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding:  15px;
                border-radius: 4px;
                margin-bottom: 20px;
                color: #0d47a1;
            }}
            
            .warning-box {{
                background: #fff3e0;
                border-left: 4px solid #ff9800;
                padding:  15px;
                border-radius: 4px;
                margin-bottom: 20px;
                color: #e65100;
            }}
            
            .success-box {{
                background: #e8f5e9;
                border-left: 4px solid #4caf50;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 20px;
                color: #2e7d32;
            }}
            
            .footer {{
                text-align: center;
                color: white;
                margin-top: 40px;
                padding: 20px;
            }}
            
            .refresh-info {{
                font-size: 0.85em;
                color: #999;
                margin-top: 10px;
            }}
            
            .chart-section {{
                background: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                margin-bottom: 30px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🌸 Mind Bloom - Online Learning Dashboard</h1>
                <p>Real-time monitoring of prediction data collection and model retraining</p>
            </div>
            
            <!-- Key Metrics -->
            <div class="metrics">
                <div class="metric-card predictions">
                    <h3>Total Predictions</h3>
                    <div class="metric-value">{stats['total_predictions']}</div>
                    <div class="metric-status">{prediction_status}</div>
                </div>
                
                <div class="metric-card feedback">
                    <h3>Feedback Collected</h3>
                    <div class="metric-value">{stats['total_feedback']}</div>
                    <div class="metric-status">{feedback_status}</div>
                </div>
                
                <div class="metric-card rate">
                    <h3>Feedback Rate</h3>
                    <div class="metric-value" style="color: {feedback_rate_color};">{stats['feedback_rate']}%</div>
                    <div class="metric-status">Target: 30%+</div>
                </div>
                
                <div class="metric-card confidence">
                    <h3>Avg Confidence</h3>
                    <div class="metric-value">{stats['average_confidence']:.2%}</div>
                    <div class="metric-status">Model certainty</div>
                </div>
            </div>
            
            <!-- Status Overview -->
            <div class="status-section">
                <h2>📊 System Status</h2>
                
                {"<div class='warning-box'>⚠️ Low feedback rate!  Current: " + str(stats['feedback_rate']) + "% (Target: 30%)</div>" if stats['feedback_rate'] < 30 and stats['total_predictions'] > 5 else ""}
                
                {"<div class='success-box'>✅ Ready for retraining!  Collected " + str(stats['total_feedback']) + " labeled samples</div>" if stats['total_feedback'] >= 20 else ""}
                
                <table>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Status</th>
                    </tr>
                    <tr>
                        <td>Total Predictions Made</td>
                        <td>{stats['total_predictions']}</td>
                        <td><span class="status-badge badge-active">✅ Active</span></td>
                    </tr>
                    <tr>
                        <td>Labeled Samples (for Retraining)</td>
                        <td>{stats['total_feedback']}</td>
                        <td><span class="status-badge {'badge-ready' if stats['total_feedback'] >= 20 else 'badge-pending'}">{'✅ Ready' if stats['total_feedback'] >= 20 else '⏳ Collecting'}</span></td>
                    </tr>
                    <tr>
                        <td>Feedback Rate</td>
                        <td>{stats['feedback_rate']}%</td>
                        <td><span class="status-badge {'badge-ready' if stats['feedback_rate'] >= 20 else 'badge-pending'}">{'✅ Good' if stats['feedback_rate'] >= 20 else '⚠️ Needs Improvement'}</span></td>
                    </tr>
                    <tr>
                        <td>Model Retraining Ready</td>
                        <td>{retrain_ready}</td>
                        <td><span class="status-badge {'badge-ready' if stats['total_feedback'] >= 20 else 'badge-not-ready'}">{'🎉 Yes!' if stats['total_feedback'] >= 20 else '⏳ More data needed'}</span></td>
                    </tr>
                    <tr>
                        <td>Last Updated</td>
                        <td>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                        <td><span class="status-badge badge-active">Live</span></td>
                    </tr>
                </table>
            </div>
            
            <!-- Progress Tracking -->
            <div class="progress-section">
                <h2>🎯 Progress to Model Retraining</h2>
                
                <div class="progress-item">
                    <div class="progress-label">
                        <span>Data Collection Progress</span>
                        <span>{stats['total_predictions']}/100 predictions</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {min(stats['total_predictions']/100 * 100, 100)}%"></div>
                    </div>
                </div>
                
                <div class="progress-item">
                    <div class="progress-label">
                        <span>Feedback Collection Progress</span>
                        <span>{stats['total_feedback']}/20 labeled samples</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {min(stats['total_feedback']/20 * 100, 100)}%"></div>
                    </div>
                </div>
                
                <div class="progress-item">
                    <div class="progress-label">
                        <span>Feedback Rate Target</span>
                        <span>{stats['feedback_rate']}/30%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {min(stats['feedback_rate']/30 * 100, 100)}%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Schedule Information -->
            <div class="status-section">
                <h2>📅 Automation Schedule</h2>
                
                <table>
                    <tr>
                        <th>Task</th>
                        <th>Frequency</th>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>
                    <tr>
                        <td>Follow-up Reminders</td>
                        <td>Daily</td>
                        <td>8:00 AM</td>
                        <td><span class="status-badge badge-active">✅ Running</span></td>
                    </tr>
                    <tr>
                        <td>Data Quality Check</td>
                        <td>Daily</td>
                        <td>9:00 AM</td>
                        <td><span class="status-badge badge-active">✅ Running</span></td>
                    </tr>
                    <tr>
                        <td>Model Retraining</td>
                        <td>Weekly</td>
                        <td>Sundays at 2:00 AM</td>
                        <td><span class="status-badge badge-active">✅ Scheduled</span></td>
                    </tr>
                </table>
                
                <div class="info-box">
                    ℹ️ Model will automatically retrain once 20+ labeled samples are collected
                </div>
            </div>
            
            <!-- Next Steps -->
            <div class="status-section">
                <h2>🚀 Next Steps</h2>
                <ol style="line-height: 2; color: #333;">
                    <li>✅ Database layer implemented</li>
                    <li>✅ Scheduler running</li>
                    <li>✅ Prediction tracking active</li>
                    <li>⏳ Collecting user predictions...</li>
                    <li>⏳ Waiting for 6-week follow-ups to collect feedback</li>
                    <li>⏳ Accumulating labeled data for retraining</li>
                    <li>⏳ Auto-retrain model (weekly)</li>
                    <li>⏳ Monitor performance improvements</li>
                </ol>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>🌸 Mind Bloom Online Learning System</p>
                <p class="refresh-info">This page auto-refreshes every 60 seconds</p>
            </div>
        </div>
        
        <script>
            // Auto-refresh every 60 seconds
            setTimeout(function(){{
                location.reload();
            }}, 60000);
        </script>
    </body>
    </html>
    """
    

    return html_content


# http://127.0.0.1:8000/admin/dashboard
