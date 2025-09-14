# Fantasy Pick'em Simulator

A web application that simulates the Underdog Fantasy Pick'em experience. This project allows you to browse player props, make picks, and simulate betting outcomes.

## Project Structure

The project is divided into two main components:

- **Frontend**: HTML, CSS, and JavaScript for the user interface
- **Backend**: Python Flask API for data processing and serving

```
fantasy-pickem-simulator/
├── backend/
│   ├── api.py                 # Flask API server
│   ├── config.json            # API configuration
│   ├── underdog_scraper.py    # Scraper for player props
│   ├── pick_player_props.py   # CLI tool for picking props
│   ├── underdog_props.csv     # Scraped data (generated)
│   └── Data/                  # Saved pick history
│       └── my_picks_*.csv     # Individual pick files
├── frontend/
│   ├── index.html            # Main HTML page
│   ├── app.js                # Frontend JavaScript
│   └── style.css             # CSS styles
└── README.md                 # This file
```

## Setup Instructions

### Prerequisites

- Python 3.8+ with pip
- Modern web browser (Chrome, Firefox, Edge, etc.)

### Backend Setup

1. Install the required Python packages:
   ```bash
   cd backend
   pip install flask flask-cors pandas requests
   ```

2. Run the scraper to fetch the latest player props:
   ```bash
   python underdog_scraper.py
   ```

3. Start the Flask API server:
   ```bash
   python api.py
   ```

   The server will run on http://localhost:5000 by default.

### Frontend Setup

1. With the backend running, simply open `frontend/index.html` in your web browser.

   For a better development experience, you can use a simple HTTP server:
   ```bash
   # Python's built-in server
   cd frontend
   python -m http.server
   ```
   
   Then open http://localhost:8000 in your browser.

## Features

### Backend

- **API Endpoints**:
  - `/api/props`: Get all available player props
  - `/api/props/player/<name>`: Get props for a specific player
  - `/api/props/formatted`: Get formatted props for the frontend
  - `/api/past-picks`: Get history of past picks

- **Command Line Interface**:
  - Run `python pick_player_props.py` for a text-based interface
  - Browse props, make picks, save results

### Frontend

- **Player Props**: Browse available props from Underdog Fantasy
- **Making Picks**: Select Over/Under for each prop
- **Payout Calculator**: See potential winnings based on your picks
- **Flex Mode**: Toggle between PowerPlay and Flex modes
- **Save Picks**: Save your picks and simulate results
- **Past Picks**: View history of your previous pick slips

## Usage

1. Browse the available player props
2. Click "Over" or "Under" to add a pick to your slip
3. Toggle between PowerPlay and Flex modes
4. Enter your bet amount
5. Click "Save Picks" to simulate and save your picks
6. View past picks by clicking "Load Past Picks"

## Development

### API Documentation

#### GET `/api/props`
Returns all available player props in raw format.

#### GET `/api/props/player/<player_name>`
Returns props for a specific player.

#### GET `/api/props/formatted`
Returns props formatted for frontend display with player, stat, and value fields.

#### GET `/api/past-picks`
Returns history of past picks from the Data directory.

## License

This project is for educational purposes only.

## Acknowledgements

- Inspired by Underdog Fantasy's Pick'em format
- Uses publicly available sports data
- Not affiliated with or endorsed by Underdog Fantasy