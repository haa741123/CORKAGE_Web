from flask import Flask
from routes.main_routes import main_routes
from modules.RecommendController import RecommendController

app = Flask(__name__)
app.register_blueprint(main_routes)
app.register_blueprint(RecommendController, url_prefix='/api/v1')  # 주류 추천 api

if __name__ == '__main__':
    app.debug = True
    app.run(use_reloader=False)









# from flask import Flask
# from routes.main_routes import main_routes
# # from routes.recommendation_routes import recommendation_routes

# app = Flask(__name__)

# app.register_blueprint(main_routes)
# # app.register_blueprint(recommendation_routes)

# if __name__ == '__main__':
#     app.debug = True
#     app.run(use_reloader=False)
