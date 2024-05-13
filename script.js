// Crear el mapa
const map = L.map('map').setView([-33.027, -52.811],7);

// Definir los mapas bases
let baseMap = L.tileLayer('https://cartocdn_{s}.global.ssl.fastly.net/base-midnight/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
});
const ideUy= L.tileLayer.wms("https://mapas.ide.uy/geoserver-raster/ortofotos/ows?", {
    layers: "ORTOFOTOS_2019",
    format: 'image/jpeg',
    transparent: true,
    version: '1.3.0',
    attribution: "IDE-URUGUAY"
});
let openStreetmap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});
let openstreetmapdark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
});
let openstreetmapOsm = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
});

// Caminerìa WMS

let camineriawms=L.tileLayer.wms('https://geoservicios.mtop.gub.uy/geoserver/inf_tte_ttelog_terrestre/v_camineria_nacional/ows?',{
    layers: "v_camineria_nacional",
    format: 'image/jpeg',
    opacity: 0.5,
    transparent: false,
    version: '1.3.0',
    attribution: "IDE UY"
});

//Añadir wfs caminería nacional
// URL del servicio WFS
let url_geoserver_wfs = "https://geoservicios.mtop.gub.uy/geoserver/inf_tte_ttelog_terrestre/v_camineria_nacional/ows?";
let wfsURL = url_geoserver_wfs + "service=WFS&request=GetFeature&typeName=v_camineria_nacional&outputFormat=application/json";

// Función para obtener datos WFS en formato GeoJSON
async function getWFSgeojson() {
    try {
        const response = await fetch(wfsURL);
        return await response.json();
    } catch (err) {
        console.log(err);
    }
}

// Obtener datos WFS y agregar la capa al mapa y al control de capas
getWFSgeojson().then(data => {
    // Crear capa de GeoJSON
    let wfspolylayer = L.geoJSON(data, {
        style: function(feature) {
            return {
                color: 'red',
                weight: 0.4,
            };
        },
        onEachFeature: function(feature, layer) {
            let customOptions = {
                maxWidth: "500px",
                className: "customPop"
            }
            let popupcontent = "<div>Código:<b>" + feature.properties.codigo + "</b></div>";
            layer.bindPopup(popupcontent, customOptions);
        }
    });
    // Agregar la capa al objeto overlayLayers
    overlayLayers["Caminería WFS"] = wfspolylayer;
    // Añadir el control de capas al mapa
    controlDeCapas.addOverlay(wfspolylayer, "Caminería WFS");
});

// Definir capas base
let baseLayers = {
    "Mosaico IDE": ideUy,
    "Open StreetMap": openStreetmap,
    "CartoDB Dark": openstreetmapdark,
    "Blue Base Map": baseMap,
    "CartoDB Light": openstreetmapOsm
};

// Capas de control
let overlayLayers = {
    "Caminería WMS": camineriawms
};

// Añadir el control de capas al mapa
let controlDeCapas = L.control.layers(baseLayers, overlayLayers).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

//Mini Mapa
let osmURL='https://tile.openstreetmap.org/{z}/{x}/{y}.png'
let osmAttrib='Map data &copy; OpenStreetMap contributors';

//Plugin
let osm2 = new L.TileLayer(osmURL, {minZoom: 0, maxZoom: 7, attribution: osmAttrib});
let miniMap = new L.Control.MiniMap(osm2).addTo(map);


//Ajustar la posición del control de capas
controlDeCapas.setPosition('bottomright');
// Añadir el mapa base predeterminado
openstreetmapOsm.addTo(map);

// Estilo para la capa cargada
let style = {
    color: 'blue',
    opacity: 1.0,
    fillOpacity: 1.0,
    weight: 2,
    clickable: false
};
//Geolocate
let lc = L.control
  .locate({
    position: "bottomright",
    strings: {
      title: "Esta es tu ubicación"
    }
  })
  .addTo(map);


// Configurar el control de carga de archivos
L.Control.FileLayerLoad.LABEL = '<img class="icon" src="img/folder.svg" alt="file icon"/>';
let control = L.Control.fileLayerLoad({
    fitBounds: true,
    layerOptions: {
        style: style,
        pointToLayer: function (data, latlng) {
            return L.circleMarker(latlng, { style: style });
        }
    }
});

// Agregar el control de carga de archivos al mapa
control.addTo(map);


// Manejar el evento 'data:loaded'
control.loader.on('data:loaded', function (e) {
    // Aquí puedes hacer algo con la capa cargada, como añadirla al control de capas
    let layer = e.layer;
    L.control.layers(null, { 'Cargado': layer }).addTo(map);
});


//SideBar
$(document).ready(function () {
  $('.sidemenu-toggler').on('click',function(){
      $('.sideMenu').toggleClass('active');
      $('.row').toggleClass('translate');
      $('.line').toggleClass('close');
  }); 

});


//Añadir Plugin ubicaciòn en tiempo real
L.control.measure(baseLayers).addTo(map);


//Segmentaciòn Dinàmica
let isContentVisible = false
function segmentacion(){
    document.querySelector("#btnSeg")
    onclick=function(){
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
    }
    if (x.style.display == 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
}
