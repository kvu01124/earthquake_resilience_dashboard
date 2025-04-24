import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import './LeafletDashboard.css';

/**
 * Define projection definitions for coordinate system transformations
 * EPSG:26910 - UTM Zone 10N (NAD83)
 * EPSG:4326 - WGS84 (standard lat/long)
 */
const proj4Defs = {
  'EPSG:26910': '+proj=utm +zone=10 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  'EPSG:4326': '+proj=longlat +datum=WGS84 +no_defs +type=crs'
};

/**
 * LeafletDashboard Component
 * 
 * An interactive dashboard that visualizes community earthquake resilience data
 * using Leaflet maps and Recharts visualizations
 */
const LeafletDashboard = () => {
  // Refs and state variables
  const mapRef = useRef(null);                                      // Reference to the map DOM element
  const [map, setMap] = useState(null);                             // Leaflet map instance
  const [geoJsonData, setGeoJsonData] = useState(null);             // GeoJSON data for mapping
  const [chartData, setChartData] = useState([]);                   // Data for the chart visualizations
  const [selectedRegion, setSelectedRegion] = useState(null);       // Currently selected region
  const [loading, setLoading] = useState(true);                     // Loading state indicator
  const [error, setError] = useState(null);                         // Error state
  const [selectedMetric, setSelectedMetric] = useState('Earthquake_Vulnerability_Index_Normalized'); // Currently selected metric to display
  const [chartType, setChartType] = useState('bar');                // Type of chart to display (bar or radar)
  const [legendControl, setLegendControl] = useState(null);         // Leaflet legend control instance
  const [librariesLoaded, setLibrariesLoaded] = useState(false);    // Flag indicating if external libraries are loaded

  /**
   * Available metrics for visualization with user-friendly labels and descriptions
   */
  const metrics = [
    { id: 'Earthquake_Vulnerability_Index_Normalized', label: 'Earthquake Resilience Score', description: 'Overall earthquake resilience index' },
    { id: 'Age_Normalized', label: 'Age Score', description: 'Normalized age metric' },
    { id: 'Building_Age_Normalized', label: 'Building Age Score', description: 'Age of buildings normalized' },
    { id: 'Urgent_Care_Accessibility_Normalized', label: 'Urgent Care Accessibility Score', description: 'Access to urgent care facilities' },
    { id: 'Hospital_Accessibility_Normalized', label: 'Hospital Accessibility Score', description: 'Access to hospital facilities' },
    { id: 'Housing_Suitability_Normalized', label: 'Housing Suitability Score', description: 'Suitability of housing' },
    { id: 'Communication_Normalized', label: 'Communication Score', description: 'Communication capabilities' },
  ];

  /**
   * Effect hook to dynamically load required external libraries (Leaflet and Proj4js)
   */
  useEffect(() => {
    // Helper function to load scripts dynamically
    const loadScript = (src, id, onLoad, onError) => {
      // Skip if script is already loaded
      if (document.getElementById(id)) {
        onLoad();
        return;
      }
      // Create and append script element
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.id = id;
      script.onload = onLoad;
      script.onerror = onError;
      document.body.appendChild(script);
    };

    // Load Leaflet and Proj4js libraries
    const loadLibraries = () => {
      let leafletLoaded = false;
      let proj4Loaded = false;

      // Check if both libraries are loaded
      const checkAllLoaded = () => {
        if (leafletLoaded && proj4Loaded) {
          setLibrariesLoaded(true);
          setLoading(false);
        }
      };

      // Load Leaflet.js
      loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js',
        'leaflet-script',
        () => {
          console.log('Leaflet loaded');
          leafletLoaded = true;
          checkAllLoaded();
        },
        () => {
          setError('Failed to load Leaflet library');
          setLoading(false);
        }
      );

      // Add Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(cssLink);

      // Load Proj4js for coordinate transformations
      loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.2/proj4.js',
        'proj4-script',
        () => {
          console.log('Proj4js loaded');
          proj4Loaded = true;
          checkAllLoaded();
        },
        () => {
          setError(prev => prev ? prev + ' and failed to load Proj4js library' : 'Failed to load Proj4js library');
          setLoading(false);
        }
      );
    };

    loadLibraries();

    // Cleanup function to remove scripts on component unmount
    return () => {
      const leafletScript = document.getElementById('leaflet-script');
      if (leafletScript) document.body.removeChild(leafletScript);
      const proj4Script = document.getElementById('proj4-script');
      if (proj4Script) document.body.removeChild(proj4Script);
    };
  }, []);

  /**
   * Effect hook to initialize the Leaflet map once libraries are loaded
   */
  useEffect(() => {
    if (librariesLoaded && mapRef.current && !map && window.L && window.proj4) {
      try {
        console.log("Initializing map...");
        // Create Leaflet map instance
        const leafletMap = window.L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true
        }).setView([49.13, -122.85], 11); // Center on Surrey, BC

        // Add dark theme basemap from CARTO
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(leafletMap);

        // Add scale control (metric only)
        window.L.control.scale({
          imperial: false,
          position: 'bottomleft'
        }).addTo(leafletMap);

        // Add click event for debugging coordinate info
        leafletMap.on('click', (e) => {
          console.log("Map clicked at:", e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
        });

        setMap(leafletMap);
        console.log("Map initialized.");
      } catch (err) {
        console.error("Failed to initialize map:", err);
        setError('Failed to initialize map: ' + err.message);
      }
    }
  }, [librariesLoaded, map]);

  /**
   * Effect hook to load GeoJSON data once the map is initialized
   */
  useEffect(() => {
    if (map && window.proj4) {
      const loadGeoJSON = () => {
        console.log("Attempting to load GeoJSON...");

        // Fetch GeoJSON data
        fetch('/earthquake_resilience_dashboard/data/map-data.geojson')
          .then(response => {
            if (!response.ok) {
              throw new Error(`File not found or network error: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log("Successfully loaded GeoJSON");
            console.log("GeoJSON CRS:", data.crs ? JSON.stringify(data.crs) : "No CRS defined");

            // Reproject the GeoJSON from UTM to WGS84 (Leaflet requires WGS84)
            console.log("Starting reprojection using proj4js...");
            try {
              const reprojectedData = reprojectGeoJSON(data);
              console.log("Reprojection complete");

              // Log sample coordinates for debugging
              if (reprojectedData.features && reprojectedData.features.length > 0) {
                const sampleFeature = reprojectedData.features[0];
                 if (sampleFeature.geometry.type === 'MultiPolygon' && sampleFeature.geometry.coordinates.length > 0 && sampleFeature.geometry.coordinates[0].length > 0 && sampleFeature.geometry.coordinates[0][0].length > 0) {
                     console.log("Sample reprojected coordinates (Lng, Lat):",
                       sampleFeature.geometry.coordinates[0][0].slice(0, 3));
                } else {
                     console.log("Sample reprojected coordinates: (Geometry type or structure not expected)");
                }
              }

              setGeoJsonData(reprojectedData);
            } catch (err) {
              console.error("Error during reprojection:", err);
              setError(`Failed to reproject GeoJSON: ${err.message}`);
            }
          })
          .catch(err => {
            console.error("Error loading GeoJSON:", err);
            setError(`Failed to load GeoJSON: ${err.message}`);
          });
      };

      loadGeoJSON();
    }
  }, [map, librariesLoaded]);

  /**
   * Reprojects GeoJSON from source CRS to destination CRS
   * @param {Object} data - The GeoJSON data to reproject
   * @returns {Object} - Reprojected GeoJSON data
   */
  const reprojectGeoJSON = (data) => {
    if (!window.proj4) {
      throw new Error("Proj4js library is not loaded.");
    }

    // Create a deep copy to avoid modifying the original data
    const result = JSON.parse(JSON.stringify(data));

    // Define source and destination coordinate reference systems
    const sourceCRS = 'EPSG:26910';  // UTM Zone 10N (NAD83)
    const destCRS = 'EPSG:4326';     // WGS84 (standard lat/long)

    // Register CRS definitions if they don't exist
    if (!window.proj4.defs(sourceCRS)) {
        window.proj4.defs(sourceCRS, proj4Defs[sourceCRS]);
    }
    if (!window.proj4.defs(destCRS)) {
        window.proj4.defs(destCRS, proj4Defs[destCRS]);
    }

    // Transform each feature's coordinates based on geometry type
    result.features.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        const transformCoords = (coords, type) => {
          if (!coords) return null;

          // Point transformation
          if (type === 'Point') {
             if (coords.length >= 2) {
                 const transformed = window.proj4(sourceCRS, destCRS, [coords[0], coords[1]]);
                 return [transformed[0], transformed[1]];
             }
             return coords;
          } 
          // LineString transformation
          else if (type === 'LineString') {
            return coords.map(point => {
               if (point.length >= 2) {
                   const transformed = window.proj4(sourceCRS, destCRS, [point[0], point[1]]);
                   return [transformed[0], transformed[1]];
               }
               return point;
            });
          } 
          // Polygon or MultiLineString transformation
          else if (type === 'Polygon' || type === 'MultiLineString') {
            return coords.map(ring => transformCoords(ring, 'LineString'));
          } 
          // MultiPolygon or GeometryCollection transformation
          else if (type === 'MultiPolygon' || type === 'GeometryCollection') {
             if (type === 'MultiPolygon') {
                 return coords.map(polygon => transformCoords(polygon, 'Polygon'));
             } else if (type === 'GeometryCollection') {
                 return coords.map(geom => transformCoords(geom.coordinates, geom.type));
             }
          }
          console.warn("Unsupported geometry type for reprojection:", type);
          return coords;
        };

        // Transform the feature's coordinates
        feature.geometry.coordinates = transformCoords(feature.geometry.coordinates, feature.geometry.type);
      }
    });

    // Update CRS information in the GeoJSON
    result.crs = {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:EPSG::4326"
      }
    };

    return result;
  };

  /**
   * Effect hook to update the map when GeoJSON data or selected metric changes
   */
  useEffect(() => {
    if (map && geoJsonData && window.L) {
      console.log("Attempting to add GeoJSON layer to map...");
      
      // Remove existing overlay layers
      map.eachLayer(layer => {
        if (layer.options && layer.options.pane === 'overlayPane' && layer.feature) {
           map.removeLayer(layer);
        }
        if (legendControl && layer === legendControl) {
             map.removeControl(layer);
        }
      });

      /**
       * Style function for GeoJSON features based on selected metric
       * @param {Object} feature - GeoJSON feature
       * @returns {Object} - Leaflet path style options
       */
      const style = (feature) => {
        const value = feature.properties[selectedMetric];
        return {
          fillColor: getColor(value),
          weight: 1,
          opacity: 1,
          color: 'black',
          dashArray: '3',
          fillOpacity: 0.7
        };
      };

      /**
       * Gets color based on metric value
       * @param {number} d - Metric value (0-1)
       * @returns {string} - Hex color code
       */
      function getColor(d) { // For normalized values (0-1 range) 
      return d > 1 ? '#006837' : 
             d > 0.80 ? '#31a354' :
             d > 0.60 ? '#78c679' : 
             d > 0.40 ? '#c2e699' : 
             d > 0.20 ? '#ffffcc' : 
                        '#ffffff'; }

      // Remove existing legend if present
      if (legendControl) {
        map.removeControl(legendControl);
      }

      // Create legend control
      const legend = new window.L.Control({position: 'bottomright'});
      legend.onAdd = function () {
        const div = window.L.DomUtil.create('div', 'info legend');
        const grades = [0, 0.20, 0.40, 0.60, 0.80];

        // Add header with current metric name
        div.innerHTML = '<h4>' + metrics.find(m => m.id === selectedMetric)?.label + '</h4>';

        // Add custom
        for (let i = 0; i < grades.length; i++) {
          div.innerHTML +=
          '<i style="background:' + getColor(grades[i] + 0.01) + '"></i> ' +
          grades[i].toFixed(2) + (i === grades.length - 1 ? '&ndash;1.00<br>' : '&ndash;' + grades[i + 1].toFixed(2) + '<br>');
          }

        return div;
      };

      legend.addTo(map);
      setLegendControl(legend);

      try {
        // Create GeoJSON layer with styling and interactions
        const geoJsonLayer = window.L.geoJSON(geoJsonData, {
          style: style,
          onEachFeature: (feature, layer) => {
            const props = feature.properties;

            if (!props) {
              console.warn("Feature without properties found:", feature);
              return;
            }

            // Create popup content
            const popupContent = `
              <div class="popup-content">
                <h3>Dissemination Area: ${props.DAUID || 'N/A'}</h3>
                <p><strong>${metrics.find(m => m.id === selectedMetric)?.label || selectedMetric}:</strong>
                    ${props[selectedMetric] != null ? props[selectedMetric].toFixed(2) : 'N/A'}
                </p>
                <p>Population: ${props.Population != null ? props.Population : 'N/A'}</p>
                <p>Land area: ${props.LANDAREA != null ? props.LANDAREA.toFixed(2) : 'N/A'} km²</p>
                <p>Population Density: ${props.PopulationDensity != null ? props.PopulationDensity.toFixed(0) : 'N/A'} people/km²</p>
                </div>
              `;

            layer.bindPopup(popupContent);

            // Add interaction events
            layer.on({
              // Highlight region on hover
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 3,
                  color: '#fff',
                  dashArray: '',
                  fillOpacity: 0.8
                });
                if (!window.L.Browser.ie && window.L.Browser.chrome) {
                  layer.bringToFront();
                }
              },
              // Reset style on mouseout
              mouseout: (e) => {
                geoJsonLayer.resetStyle(e.target);
              },
              // Handle region selection on click
              click: (e) => {
                const properties = e.target.feature.properties;
                setSelectedRegion(properties);

                // Prepare data for charts
                const chartMetrics = metrics.filter(m => m.id !== 'PopulationDensity');
                const newChartData = chartMetrics.map(metric => ({
                  name: metric.label,
                  value: properties[metric.id] != null ? properties[metric.id] : 0
                }));

                setChartData(newChartData);
              }
            });
          }
        }).addTo(map);

        console.log("GeoJSON layer added.");

        // Fit map to bounds of GeoJSON layer
        try {
           const bounds = geoJsonLayer.getBounds();
           if (bounds.isValid()) {
              console.log("GeoJSON layer bounds:", bounds);
              console.log("Center point:", bounds.getCenter());
              map.fitBounds(bounds);
              console.log("Map fit to bounds of GeoJSON layer");
           } else {
               console.warn("Invalid GeoJSON bounds, cannot fit map. Centering on Surrey.");
               map.setView([49.13, -122.85], 11); // Default center on Surrey, BC
           }
        } catch (err) {
           console.error("Error getting or setting bounds:", err);
           map.setView([49.13, -122.85], 11); // Default center on Surrey, BC
        }

      } catch (err) {
        console.error("Error creating GeoJSON layer:", err);
        setError(`Failed to create GeoJSON layer: ${err.message}`);
      }
    }
  }, [map, geoJsonData, selectedMetric]);

  /**
   * Handle metric selection change
   * @param {Event} e - Change event
   */
  const handleMetricChange = (e) => {
    setSelectedMetric(e.target.value);
  };

  /**
   * Handle chart type change
   * @param {Event} e - Change event
   */
  const handleChartTypeChange = (e) => {
    setChartType(e.target.value);
  };

  /**
   * Custom tooltip component for charts
   * @param {Object} props - Props for the tooltip
   * @returns {JSX.Element|null} - Tooltip JSX or null if inactive
   */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formattedValue = value.toFixed(2);

      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}: ${formattedValue}`}</p>
        </div>
      );
    }
    return null;
  };

  /**
   * Render the appropriate chart based on selected chart type
   * @returns {JSX.Element} - Chart component
   */
  const renderChart = () => {
    if (!selectedRegion || chartData.length === 0) {
      return (
        <div className="no-selection">
          <p>Select a region on the map to view its data</p>
        </div>
      );
    }

    const maxValue = 1.0; // All metrics are normalized to 0-1 range

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, maxValue]}
                tickFormatter={(value) => `${value.toFixed(1)}`}
                tick={{ fill: '#a0a0a0', fontSize: 12 }}
                axisLine={{ stroke: '#a0a0a0' }}
                tickLine={{ stroke: '#a0a0a0' }}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: '#a0a0a0', fontSize: 12 }}
                width={150}
                axisLine={{ stroke: '#a0a0a0' }}
                tickLine={{ stroke: '#a0a0a0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="#4caf50"
                background={{ fill: '#2c2f33' }}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar':
        // Format data for radar chart
        const radarChartData = chartData.map(item => ({
          subject: item.name,
          A: item.value,
          fullMark: maxValue
        }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              cx="50%"
              cy="50%"
              outerRadius="80%"
              data={radarChartData}
            >
              <PolarGrid stroke="#3a3a3a" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#a0a0a0', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, maxValue]}
                tick={{ fill: '#a0a0a0', fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              <Radar
                name={selectedRegion?.DAUID || "Region"}
                dataKey="A"
                stroke="#4caf50"
                fill="#4caf50"
                fillOpacity={0.6}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="error">
            <p>Unknown chart type</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* GitHub corner link */}
      <a
        href="https://github.com/pkoelich/Community_Earthquake_Resilience"
        className="github-corner"
        aria-label="View source on GitHub"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1000
        }}
      >
        <svg width="80" height="80" viewBox="0 0 250 250" style={{
          fill: '#4caf50',
          color: '#fff',
          border: 0
        }} aria-hidden="true">
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
          <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style={{transformOrigin: '130px 106px'}} className="octo-arm"></path>
          <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" className="octo-body"></path>
        </svg>
      </a>

      {/* Header */}
      <div className="app-header" style={{
        backgroundColor: '#1e2124',
        color: '#fff',
        padding: '15px 20px',
        borderBottom: '1px solid #3a3a3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          Community Earthquake Resilience Dashboard
        </h1>
      </div>

      {/* Main dashboard container */}
      <div className="leaflet-dashboard">
        <div className="dashboard-container">
          {loading ? (
            // Loading state
            <div className="loading">
              <p>Loading map dashboard...</p>
               {!librariesLoaded && <p>Loading required libraries...</p>}
            </div>
          ) : error ? (
            // Error state
            <div className="error">
              <p>{error}</p>
            </div>
          ) : (
            // Main dashboard content
            <>
              {/* Map section */}
              <div className="map-container">
                <div className="map-card">
                  <h2>Community Earthquake Resilience Visualizer</h2>
                  <p>Welcome to the Community Earthquake Resilience Visualizer for Surrey, BC.
                    This interactive dashboard highlights how different areas of the city may be
                    more or less resilient to earthquake-related impacts, based on key social, structural,
                    and geographic factors. Explore a resilience score map calculated through a Multi-Criteria Decision Analysis (MCDA)
                    using data such as building age, housing suitability, population vulnerability, communication barriers, and proximity to healthcare.</p>

                  {/* Metric selection control */}
                  <div className="control-panel">
                    <div className="select-container">
                      <label htmlFor="metric-select">Display Index:</label>
                      <select
                        id="metric-select"
                        value={selectedMetric}
                        onChange={handleMetricChange}
                        className="metric-select"
                      >
                        {metrics.map(metric => (
                          <option key={metric.id} value={metric.id}>
                            {metric.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Map container */}
                  <div ref={mapRef} className="map"></div>
                  <p className="instructions">Click on a region to view detailed metrics</p>
                </div>
              </div>

              {/* Chart section */}
              <div className="chart-container">
                <div className="chart-card">
                  <h2>
                    {selectedRegion ? `Resilience Metrics | Dissemination Area: ${selectedRegion.DAUID || 'N/A'}` : 'Region Metrics'}
                  </h2>

                  {selectedRegion ? (
                    // Region details and chart
                    <div className="chart-wrapper">
                      {/* Selected region information */}
                      <div className="region-info">
                        <p className="region-name">Dissemination Area: {selectedRegion.DAUID || 'N/A'}</p>

                        {/* Display selected metrics for the region */}
                        <p><strong>{metrics.find(m => m.id === selectedMetric)?.label || selectedMetric}:</strong> {
                            selectedRegion[selectedMetric] != null ? selectedRegion[selectedMetric].toFixed(2) : 'N/A'
                        }</p>

                        {/* Display demographic information */}
                        <p>Population: {selectedRegion.Population != null ? selectedRegion.Population : 'N/A'}</p>
                        <p>Land Area: {selectedRegion.LANDAREA != null ? selectedRegion.LANDAREA.toFixed(2) : 'N/A'} km²</p>
                        <p>Population Density: {selectedRegion.PopulationDensity != null ? selectedRegion.PopulationDensity.toFixed(0) : 'N/A'} people/km²</p>
                      </div>

                      {/* Chart type selection control */}
                      <div className="chart-controls">
                        <label htmlFor="chart-type">Chart type:</label>
                        <select
                          id="chart-type"
                          value={chartType}
                          onChange={handleChartTypeChange}
                          className="chart-type-select"
                        >
                          <option value="bar">Bar Chart</option>
                          <option value="radar">Radar Chart</option>
                        </select>
                      </div>

                      {/* Chart visualization container */}
                      <div className="chart">
                        {renderChart()}
                      </div>
                    </div>
                  ) : (
                    // Placeholder when no region is selected
                    <div className="no-selection">
                      <p>Select a region on the map to view detailed metrics</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Export the component for use in other parts of the application
export default LeafletDashboard;
