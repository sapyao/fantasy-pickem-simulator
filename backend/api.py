from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from pick_player_props import load_props, find_player_props  # adjust import

app = Flask(__name__)
CORS(app)

# Load props once (or reload each request if CSV updates often)
df = load_props()

@app.route("/api/player-props", methods=["GET"])
def get_all_props():
    if df is None:
        return jsonify({"error": "Props file not found"}), 404
    return df.to_dict(orient="records")

@app.route("/api/player-props/<player_name>", methods=["GET"])
def get_player_props(player_name):
    if df is None:
        return jsonify({"error": "Props file not found"}), 404
    matches = find_player_props(df, player_name)
    return matches.to_dict(orient="records")

@app.route("/props", methods=["GET"])
def get_props_for_frontend():
    if df is None:
        return jsonify({"error": "Props file not found"}), 404
    # Ensure keys: player, stat, value
    props = []
    for _, row in df.iterrows():
        props.append({
            "player": row.get("full_name", ""),
            "stat": row.get("stat_name", ""),
            "value": row.get("stat_value", "")
        })
    return jsonify(props)

if __name__ == "__main__":
    app.run(debug=True)
