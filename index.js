const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');

var routesUrl = "http://rptride.doublemap.com/map/v2/routes";

var busUrl = "http://rptride.doublemap.com/map/v2/buses";

var placeUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json?key=AIzaSyC6b4ZBprFyiauDZ38hqkxpwpkddBcXtaE&query=";

var distUrl = "https://maps.googleapis.com/maps/api/distancematrix/json?key=AIzaSyBwrzlQ7VXfO5oChYDB6_MLdC-DyaNUiIo&units=imperial&travel_mode=optimistic&origins="

var app = express();
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
}));

app.post('/api', (req, res) => {
  let queryText = req.body.place;
  let routeName = req.body.route;

  var routeIds = [];
  var busLocation, destLocation;

  rp(routesUrl)
  .then((routes) => {
     routes = JSON.parse(routes);
      for (let route of routes) {
        if (route.short_name.trim() == routeName) {
          routeIds.push(route.id);
        }
      }
     return rp(busUrl);
  })
    .then((buses) => {
      buses = JSON.parse(buses);
      for (let bus of buses) {
        if (routeIds.indexOf(bus.route) >= 0) {
          busLocation = `${bus.lat},${bus.lon}`;
        }
      }
      return rp(placeUrl + queryText);
    })
    .then((data) => {
        data = JSON.parse(data);
        let dest = data.results[0].geometry.location;
        destLocation = `${dest.lat},${dest.lng}`;
        return rp(distUrl + busLocation + "&destinations=" + destLocation)
    })
    .then((data) => {
      data = JSON.parse(data);
      var timing = data.rows[0].elements[0].duration.text;
      res.send(timing);
  })
  .catch((err) => {
    console.error(err);
    res.status(500);
  	res.send(err);
  })
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(process.env.PORT || 3000,() => {
  console.log("App started successfully");
});
