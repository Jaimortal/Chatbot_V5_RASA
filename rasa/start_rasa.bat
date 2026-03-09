@echo off
cd "c:\School Related File\3rd year\Capstone dev\Chatbot\Chatbot-v4-BUKSU\rasa"
call venv\Scripts\activate
rasa run --enable-api --cors "*"
pause