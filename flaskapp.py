import requests
import jwt
import logging
from flask import Flask, request, jsonify, redirect, render_template, make_response
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from routes.main_routes import main_routes

app = Flask(__name__)
app.register_blueprint(main_routes)


# LoginController 모듈 임포트 및 등록
from modules.LoginController import LoginController
app.register_blueprint(LoginController, url_prefix='/auth/kakao')  # 카카오 로그인


# 주류 추천 API
try:
    from modules.RecommendController import RecommendController
    app.register_blueprint(RecommendController, url_prefix='/api/v1')  # 주류 추천
except ImportError as e:
    logging.error(f"RecommendController 모듈 임포트 중 오류 발생: {e}")
except Exception as e:
    logging.error(f"RecommendController 블루프린트 등록 중 오류 발생: {e}")

# 주류 인식 API 
try:
    from modules.WineDetectionController import WineDetectionController
    app.register_blueprint(WineDetectionController, url_prefix='/api/v1')  # 사진 분석
except ImportError as e:
    logging.error(f"WineDetectionController 모듈 임포트 중 오류 발생: {e}")
except Exception as e:
    logging.error(f"WineDetectionController 블루프린트 등록 중 오류 발생: {e}")


# 메인 실행
if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=5000, use_reloader=False)
