# Community Earthquake Resilience Visualizer

## Overview

This interactive web application visualizes earthquake vulnerability and resilience metrics across different communities. The dashboard provides a comprehensive view of multiple factors that contribute to earthquake preparedness, including building age, healthcare accessibility, and communication infrastructure.

## Features

- **Interactive Map**: Color-coded visualization of different resilience metrics
- **Multiple Metrics**: View various normalized vulnerability indexes (0-1 scale)
- **Detailed Analysis**: Click on regions to view comprehensive data breakdowns
- **Responsive Charts**: Bar and radar chart visualizations of all resilience metrics
- **User-Friendly Interface**: Simple navigation with clear data presentation

## App

You can explore the live dashboard at [https://kvu01124.github.io/earthquake_resilience_dashboard/](https://kvu01124.github.io/earthquake_resilience_dashboard/)

## Technologies Used

- React.js
- Leaflet for interactive mapping
- Recharts for data visualization
- GeoJSON for spatial data representation

## Installation and Setup

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/kvu01124/earthquake_resilience_dashboard.git
   ```

2. Navigate to the project directory:
   ```bash
   cd earthquake_resilience_dashboard
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Data Sources

The dashboard uses normalized data across several metrics:
- Earthquake Vulnerability Index
- Age Demographics
- Building Age
- Urgent Care Accessibility
- Hospital Accessibility
- Housing Suitability
- Communication Barrier

All data is represented on a 0 to 1 scale for easy comparison, with higher values indicating better resilience.

## Deployment

To deploy this project to GitHub Pages:

1. Install GitHub Pages package:
   ```bash
   npm install --save gh-pages
   ```

2. Add the following to your `package.json`:
   ```json
   "homepage": "https://yourname.github.io/yourrepository",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. Deploy the application:
   ```bash
   npm run deploy
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
