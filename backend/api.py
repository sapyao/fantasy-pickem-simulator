from flask import Flask, jsonify, request, session
from flask_cors import CORS
import pandas as pd
import os
import json
from datetime import datetime
from pick_player_props import load_props, find_player_props  # adjust import
import user_db  # Import the user database module
import secrets

app = Flask(__name__)
# Set a secret key for session management
app.secret_key = secrets.token_hex(16)
# Enable CORS with credentials support
CORS(app, supports_credentials=True)

# Helper class for handling NaN values in JSON
class NaNHandler(json.JSONEncoder):
    def default(self, obj):
        if pd.isna(obj):
            return None
        return super().default(obj)

# Load props once (or reload each request if CSV updates often)
try:
    df = load_props()
    print("Props loaded successfully")
    if df is not None:
        print(f"Found {len(df)} props")
    else:
        print("Props file was found but DataFrame is None")
except Exception as e:
    print(f"Error loading props: {str(e)}")
    df = None

# Load past picks from files
def load_past_picks():
    past_picks = []
    data_dir = os.path.join(os.path.dirname(__file__), "Data")
    
    if not os.path.exists(data_dir):
        print(f"Data directory not found: {data_dir}")
        return past_picks
        
    for filename in os.listdir(data_dir):
        if filename.startswith("my_picks_") and filename.endswith(".csv"):
            try:
                filepath = os.path.join(data_dir, filename)
                picks_df = pd.read_csv(filepath)
                
                # Get date from filename (e.g., my_picks_2023-08-22_1244.csv)
                date_str = filename.split("_")[2].split(".")[0]
                
                # Group by some ID if needed
                # For now just add all as one pick set
                bet_amount = 10.0  # Default 
                if "bet_amount" in picks_df.columns:
                    bet_amount = picks_df["bet_amount"].iloc[0]
                
                mode = "PowerPlay"
                if "mode" in picks_df.columns:
                    mode = picks_df["mode"].iloc[0]
                
                # For example purposes, randomly determine if won
                import random
                won = random.choice([True, False])
                payout = 0
                if won:
                    # Calculate based on mode and # picks
                    if mode == "PowerPlay":
                        payout = bet_amount * 10  # Simple example
                    else:
                        payout = bet_amount * 5
                        
                picks_list = []
                for _, row in picks_df.iterrows():
                    picks_list.append({
                        "player": row.get("player", "Unknown"),
                        "stat": row.get("stat", "pts"),
                        "line": row.get("value", "0"),
                        "pick": row.get("pick", "OVER")
                    })
                
                past_picks.append({
                    "date": date_str,
                    "picks": picks_list,
                    "bet": bet_amount,
                    "mode": mode,
                    "won": won,
                    "payout": payout if won else 0
                })
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                
    return past_picks

@app.route("/api/props", methods=["GET"])
def get_all_props():
    try:
        if df is None:
            return jsonify({"error": "Props data not available. Try running the scraper first."}), 404
        
        # Handle NaN values
        return app.response_class(
            response=json.dumps(df.replace({pd.NA: None}).to_dict(orient="records"), cls=NaNHandler),
            status=200,
            mimetype="application/json"
        )
    except Exception as e:
        return jsonify({"error": f"Failed to get props: {str(e)}"}), 500

@app.route("/api/props/player/<player_name>", methods=["GET"])
def get_player_props(player_name):
    try:
        if df is None:
            return jsonify({"error": "Props data not available. Try running the scraper first."}), 404
        if not player_name or len(player_name) < 2:
            return jsonify({"error": "Player name must be at least 2 characters"}), 400
            
        matches = find_player_props(df, player_name)
        
        if matches.empty:
            return jsonify({"error": f"No props found for player: {player_name}", "matches": []}), 404
            
        # Handle NaN values
        return app.response_class(
            response=json.dumps(matches.replace({pd.NA: None}).to_dict(orient="records"), cls=NaNHandler),
            status=200,
            mimetype="application/json"
        )
    except Exception as e:
        return jsonify({"error": f"Failed to get player props: {str(e)}"}), 500

@app.route("/api/props/formatted", methods=["GET"])
def get_props_for_frontend():
    try:
        if df is None:
            return jsonify({"error": "Props data not available. Try running the scraper first."}), 404
            
        # Ensure keys: player, stat, value, sport
        props = []
        processed = set()  # To avoid duplicates
        
        # For debugging
        print(f"DataFrame columns: {df.columns.tolist()}")
        
        # Check if limit parameter is provided in the request
        limit_param = request.args.get("limit")
        if limit_param is not None:
            try:
                limit = int(limit_param)
            except ValueError:
                limit = None  # No limit if parameter is invalid
        else:
            limit = None  # No limit by default
            
        counter = 0
        
        for _, row in df.iterrows():
            # Get the key fields, with fallbacks for different column names
            player_value = row.get("full_name")
            player = player_value if pd.notna(player_value) else "Unknown Player"
            
            # Try different possible column names for the stat
            stat = None
            for stat_col in ["stat_name", "type_over_under", "selection_subheader"]:
                if stat_col in row and pd.notna(row[stat_col]):
                    stat = row[stat_col]
                    break
            
            if stat is None or pd.isna(stat):
                stat = "Unknown Stat"
                
            # Try different possible column names for the value
            value = None
            for val_col in ["stat_value", "line", "value", "non_discounted_stat_value"]:
                if val_col in row and pd.notna(row[val_col]):
                    value = row[val_col]
                    break
                    
            if value is None or pd.isna(value):
                value = "0"
            
            # Try different possible column names for the sport
            sport = "Unknown Sport"
            for sport_col in ["sport_id", "sport", "sport_name", "league", "league_id"]:
                if sport_col in row and pd.notna(row[sport_col]):
                    sport = row[sport_col]
                    break
                    
            # Make sure sport is not NaN
            if pd.isna(sport):
                sport = "Unknown Sport"
            
            # Create a unique key to avoid duplicate props
            key = f"{player}|{stat}|{value}"
            if key in processed:
                continue
                
            processed.add(key)
            
            props.append({
                "player": player,
                "stat": stat,
                "value": value,
                "sport": sport  # Add sport to each prop
            })
            
            counter += 1
            if limit is not None and counter >= limit:
                break
            
        if not props:
            # Create some sample data if no props found
            print("No valid props found, adding sample data")
            sample_players = [
                {"player": "LeBron James", "stat": "pts", "value": "25.5", "sport": "NBA"},
                {"player": "Stephen Curry", "stat": "pts", "value": "28.5", "sport": "NBA"},
                {"player": "Giannis Antetokounmpo", "stat": "pts", "value": "30.5", "sport": "NBA"},
                {"player": "Nikola Jokic", "stat": "ast", "value": "9.5", "sport": "NBA"},
                {"player": "Joel Embiid", "stat": "pts", "value": "29.5", "sport": "NBA"}
            ]
            props.extend(sample_players)
            
        print(f"Returning {len(props)} props")
        # Convert to JSON with NaN handling, then return
        return app.response_class(
            response=json.dumps(props, cls=NaNHandler),
            status=200,
            mimetype="application/json"
        )
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in formatting props: {str(e)}")
        print(error_trace)
        
        # Create some sample data as fallback
        sample_players = [
            {"player": "LeBron James", "stat": "pts", "value": "25.5", "sport": "NBA"},
            {"player": "Stephen Curry", "stat": "pts", "value": "28.5", "sport": "NBA"},
            {"player": "Giannis Antetokounmpo", "stat": "pts", "value": "30.5", "sport": "NBA"}
        ]
        return jsonify({
            "error": f"Failed to format props: {str(e)}",
            "sample_data": sample_players
        }), 500
    
# Keep backward compatibility for now with a redirect
@app.route("/props", methods=["GET"])
def redirect_props():
    return jsonify({"message": "Please use /api/props instead"}), 301

@app.route("/api/past-picks", methods=["GET"])
def get_past_picks():
    try:
        past_picks = load_past_picks()
        if not past_picks:
            return jsonify({
                "message": "No past picks found",
                "picks": []
            }), 404
        return jsonify(past_picks)
    except Exception as e:
        return jsonify({
            "error": f"Failed to get past picks: {str(e)}",
            "picks": []
        }), 500

# Authentication endpoints
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    email = data.get("email", "")
    
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400
    
    # Register user
    result = user_db.register_user(username, password, email)
    
    if result["success"]:
        # Set session
        session["username"] = username
        return jsonify(result), 201
    else:
        return jsonify(result), 400

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400
    
    # Authenticate user
    result = user_db.authenticate_user(username, password)
    
    if result["success"]:
        # Set session
        session["username"] = username
        return jsonify(result), 200
    else:
        return jsonify(result), 401

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    # Clear session
    session.clear()
    return jsonify({"success": True}), 200

@app.route("/api/auth/user", methods=["GET"])
def get_current_user():
    username = session.get("username")
    if not username:
        return jsonify({"success": False, "error": "Not logged in"}), 401
    
    # Get user data
    user_data = user_db.get_user(username)
    return jsonify(user_data), 200

@app.route("/api/picks", methods=["POST"])
def save_picks():
    username = session.get("username")
    data = request.get_json()
    
    picks = data.get("picks", [])
    bet_amount = float(data.get("bet_amount", 10))
    mode = data.get("mode", "PowerPlay")
    
    if not username:
        # For non-authenticated users, respond with simulated result
        import random
        is_win = random.choice([True, False])
        
        # Calculate payout based on number of picks and mode
        n_picks = len(picks)
        multiplier = 0
        
        if mode == "PowerPlay":
            # PowerPlay multiplier increases with each pick
            if n_picks == 1: multiplier = 2
            elif n_picks == 2: multiplier = 3
            elif n_picks == 3: multiplier = 5
            elif n_picks == 4: multiplier = 10
            elif n_picks == 5: multiplier = 20
            else: multiplier = 20 + (n_picks - 5) * 10
        else:
            # Flex mode
            if n_picks == 3: multiplier = 2
            elif n_picks == 4: multiplier = 3
            elif n_picks == 5: multiplier = 5
            else: multiplier = 5 + (n_picks - 5)
        
        payout = bet_amount * multiplier if is_win else 0
        
        return jsonify({
            "success": True,
            "guest": True,
            "result": "win" if is_win else "loss",
            "payout": payout,
            "picks": picks,  # Return the picks data for the frontend to display
        }), 200
    
    # Get user data
    user_data = user_db.get_user(username)
    if not user_data["success"]:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    # Check if user has enough balance
    balance = user_data["balance"]
    if balance < bet_amount:
        return jsonify({"success": False, "error": "Insufficient balance"}), 400
    
    # Process the picks (simulate a win/loss result)
    import random
    is_win = random.choice([True, False])
    
    # Calculate payout based on number of picks and mode
    n_picks = len(picks)
    multiplier = 0
    
    if mode == "PowerPlay":
        # PowerPlay multiplier increases with each pick
        if n_picks == 1: multiplier = 2
        elif n_picks == 2: multiplier = 3
        elif n_picks == 3: multiplier = 5
        elif n_picks == 4: multiplier = 10
        elif n_picks == 5: multiplier = 20
        else: multiplier = 20 + (n_picks - 5) * 10
    else:
        # Flex mode
        if n_picks == 3: multiplier = 2
        elif n_picks == 4: multiplier = 3
        elif n_picks == 5: multiplier = 5
        else: multiplier = 5 + (n_picks - 5)
    
    payout = bet_amount * multiplier if is_win else 0
    
    # Update user balance
    new_balance = balance - bet_amount + payout
    user_db.update_user_balance(username, new_balance)
    
    # Record the pick in user history
    pick_record = {
        "created_at": int(datetime.now().timestamp()),
        "picks": picks,
        "bet_amount": bet_amount,
        "mode": mode,
        "result": "win" if is_win else "loss",
        "payout": payout,
        "is_completed": True
    }
    
    user_db.add_pick_to_history(username, pick_record)
    
    return jsonify({
        "success": True,
        "result": "win" if is_win else "loss",
        "payout": payout,
        "new_balance": new_balance,
        "picks": picks  # Return the picks data for the frontend to display
    }), 200

@app.route("/api/past-picks", methods=["GET"])
def get_user_past_picks():
    username = session.get("username")
    
    if not username:
        # For non-authenticated users, load sample data
        return jsonify(load_past_picks()), 200
    
    # Get user picks history
    picks_history = user_db.get_user_picks_history(username)
    
    if not picks_history:
        return jsonify({"message": "No past picks found", "picks": []}), 404
    
    return jsonify(picks_history), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
