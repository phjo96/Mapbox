import './App.css';
import React, { useRef, useEffect, useState } from 'react';
import * as turf from "@turf/turf"
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
mapboxgl.accessToken = 'pk.eyJ1IjoidG9iaWFzZnJpZGVuIiwiYSI6ImNrb2IzYXdybjFhcjYybm1xc2V0cjR2OWUifQ.TlabG6MGVT73ENCTJ5xy1A';

var is_drawing = false;
var coordinates = [];
var data = {
  'type': 'Feature',
  'geometry': {
  'type': 'LineString',
  'coordinates': coordinates
  }
};

// Draw the temporary polygon
function draw_active(map, lng, lat) {
  var temp_coordinates = [...coordinates];
  temp_coordinates.push([lng, lat]);
  map.getSource('route').setData({
    'type': 'Feature',
    'properties': {},
    'geometry': {
      'type': 'LineString',
      'coordinates': temp_coordinates
    }
  });
};
  


function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState("0 kr");
  const [export_data, setExport] = useState("")
  const price_p_km = 100;


  useEffect(() => {
    if (map.current) return; // initialize only once
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [11.99, 57.71],
      zoom: 9
    });

    // Wait until map has loaded
    map.current.on('load', () => {

      // Polygon data
      map.current.addSource('route', {
        'type': 'geojson',
        'data': data
      });

      // Polyline
      map.current.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': 'rgba(55,148,179,1)',
          'line-width': 2
        }
      });

      // Points on line
      map.current.addLayer({
        'id': 'route-circle',
        'type': 'circle',
        'source': 'route',
        'layout': {
          'visibility': 'visible'
        },
        'paint': {
          'circle-radius': 8,
          'circle-color': 'rgba(55,148,179,1)'
        }
      });

      // Add point on click
      map.current.on('click', (e) => {
        
        // TODO Add function to remove points
        // use map.current.project() to get the pixel coordinates 

        if (is_drawing || coordinates.length === 0) {
          e.preventDefault();
          coordinates.push([e.lngLat["lng"], e.lngLat["lat"]]);
          data['coordinates'] = coordinates;
          map.current.getSource('route').setData(data);

          // Update distance and price
          if (coordinates.length > 1){
            setDistance(turf.length(data).toFixed(2))
            setPrice((turf.length(data)*price_p_km).toFixed(0) + ' kr')
            setExport(JSON.stringify(coordinates))
          };
        }

        // Update status
        is_drawing = true
        draw_active(map.current, e.lngLat["lng"], e.lngLat["lat"])
      });
      
      // Stop Drawing
      map.current.on('contextmenu', (e) => {
        e.preventDefault()
        is_drawing = false;
        data['coordinates'] = coordinates;
        map.current.getSource('route').setData(data);
      })

      // Follow the cursor with polygon
      map.current.on('mousemove', (e) => {
        if (is_drawing) {
          draw_active(map.current, e.lngLat["lng"], e.lngLat["lat"])
        }
      });
    });
  });
  
  return (
    <div>
      <pre id="info"></pre>
      <div ref={mapContainer} className="map-container" />
      <div id = "form">
        <form action="/action_page" method="post">
          <label>
            Name:
            <input type="text" name="name" />
          </label><br/>
          <label>
            Distance [km]:
            <input type="text" name="distance" readOnly value={distance} />
          </label><br/>
          <label>
            Price:
            <input type="text" name="price" readOnly value = {price} />
          </label>
          <input type="hidden" name="data" readOnly value = {export_data}/>
          <input type="submit" value="Submit" />        
        </form>
      </div>
    </div>
    );
}

export default App;
