function check(lat, lng, lat1, lng1, lat2, lng2){
    var pointA = L.latLng(lat1, lng1);
var pointB = L.latLng(lat2, lng2);

// Define the point to check
var pointC = L.latLng(lat, lng);

// Calculate the closest point on the line to pointC
var closestPoint = L.GeometryUtil.closestOnSegment(map, pointA, pointB, pointC);

// Check if the closest point is within a certain distance of pointC
var distance = pointC.distanceTo(closestPoint);
return (distance < 5);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
const earthRadiusKm = 6371;

const dLat = degreesToRadians(lat2 - lat1);
const dLon = degreesToRadians(lon2 - lon1);

const a =
Math.sin(dLat / 2) * Math.sin(dLat / 2) +
Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
Math.sin(dLon / 2) * Math.sin(dLon / 2);

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
const distance = earthRadiusKm * c;

return distance;
}

function degreesToRadians(degrees) {
return degrees * Math.PI / 180;
}

var map = L.map('map').setView([-32.522779, -55.765835], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
maxZoom: 19,
attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
}).addTo(map);

fetch('https://geoservicios.mtop.gub.uy/geoserver/caminerias_intendencias/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=caminerias_intendencias%3Av_camineria_flores&outputFormat=application%2Fjson&cql_filter=codigo=%27UYFS0081%27'
)
.then(response => response.json())
.then(data => {
var geojsonLayer = L.geoJSON(data, {
  style: function(feature) {
return {
  color: 'red',
  weight: 2,
};
  },
});
geojsonLayer.addTo(map);

geojsonLayer.on('click', function(e) {
  var lat = e.latlng.lat;
  var lng = e.latlng.lng;

  const point= {
      lat: lat,
      lng: lng,
  };
  
  //console.log(geojsonLayer);
  
  if (geojsonLayer._layers){
                        /* (lat, lng) */
      let init_point=null;
      
      let points=[];
                        let lines= [];
                        let intersect_line=null;
      let ok=false;
      
      for (var key in geojsonLayer._layers) {
          let layer = geojsonLayer._layers[key];				  		
          layer.feature.geometry.coordinates[0].forEach(x => {
                                    if (init_point){
                                        /*[lat, lng]*/
                                        lines.push([init_point, x]);

                                        if (check(point.lat, point.lng,
                                                init_point[1], init_point[0],
                                                x[1], x[0]
                                        )){
                                                ok=true;
                                                intersect_line=[init_point, x];
                                        }
                                    }

                                    init_point=x;
          });
      }
                        
                        if (ok && intersect_line){
                            fetch('https://geoservicios.mtop.gub.uy/geoserver/vialidad/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=vialidad%3Aprueba_alexis_puntos&maxFeatures=5000&outputFormat=application%2Fjson&cql_filter=codigo=%27UYFS0081%27&srsName=EPSG:4326')
                                .then(res => res.json())
                                .then(res => {
                                    const find =res.features.find(x => x.properties.inicio_fin=="inicio");
                                    let init=(find ? find.geometry.coordinates : null);
                                    
                                    if (init){                                                        
                                        let x= init;
                                        let y = lines.find(line => (line[0][0]==init[0] && line[0][1]==init[1]))[1];
                                        
                                        //console.log("Distancia de: ",distance);
                                        //alert(distance + " KM");
                                        
                                        if (y){
                                            let distance=0;
                                            let search=true;
                                            
                                            let index=lines.length;
                                            
                                            while (search) {                                                            
                                                const next_line = lines.find(line => ((line[0][0]!=line[1][0] || line[0][1]!=line[1][1]) && line[0][0]==y[0] && line[0][1]==y[1]));
                                                if (next_line){
                                                    if (next_line[0][0]==intersect_line[0][0] && next_line[0][1]==intersect_line[0][1]
                                                        && next_line[1][0]==intersect_line[1][0] && next_line[1][1]==intersect_line[1][1]
                                                    ){
                                                        distance+= calculateDistance(point.lat,point.lng,x[1],x[0]);
                                                        search=false;
                                                    }
                                                    else{
                                                        distance+= calculateDistance(x[1],x[0],y[1],y[0]);
                                                        x=y;
                                                        y=next_line[1];
                                                    }


                                                }
                                                else{
                                                    alert("No hay punto.");
                                                    search=false;
                                                }
                                                
                                                index--;
                                                if (index<=0){
                                                    alert("Index");
                                                    console.clear();
                                                    console.log(next_line);
                                                    search=false;
                                                }
                                            }
                                            
                                            //console.log("Distancia de: ",distance);
                                            //alert(distance + " KM");
                                            var marker = L.marker([point.lat, point.lng]);

                                            // Add a tooltip to the marker
                                            marker.bindTooltip("Camino UYFS0081 "+distance.toFixed(3).toString() + ' KM');

                                            // Add the marker to the map
                                            marker.addTo(map);
                                        }
                                        
                                        return;
                                    }
                                    
                                    alert("Camino sin inicio establecido.");
                                });
                        }
  }
});
});