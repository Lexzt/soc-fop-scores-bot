const request = require('sync-request');
const fastXmlParser = require('fast-xml-parser');

// The weather information are obtained from NEA.
// To see the full specifications, visit:
// https://www.nea.gov.sg/docs/default-source/api/developer's-guide.pdf

const apiURL = 'http://api.nea.gov.sg/api/WebAPI/?dataset=24hrs_forecast&keyref=' + process.env.NEA_KEY;

const forecastAbbrv = {
  'BR': 'Mist',
  'CL': 'Cloudy',
  'DR': 'Drizzle',
  'FA': 'Fair (Day)',
  'FG': 'Fog',
  'FN': 'Fair (Night)',
  'FW': 'Fair & Warm',
  'HG': 'Heavy Thundery Showers with Gusty Winds',
  'HR': 'Heavy Rain',
  'HS': 'Heavy Showers',
  'HT': 'Heavy Thundery Showers',
  'HZ': 'Hazy',
  'LH': 'Slightly Hazy',
  'LR': 'Light Rain',
  'LS': 'Light Showers',
  'OC': 'Overcast',
  'PC': 'Partly Cloudy (Day)',
  'PN': 'Partly Cloudy (Night)',
  'PS': 'Passing Showers',
  'RA': 'Moderate Rain',
  'SH': 'Showers',
  'SK': 'Strong Winds, Showers',
  'SN': 'Snow',
  'SR': 'Strong Winds, Rain',
  'SS': 'Snow Showers',
  'SU': 'Sunny',
  'SW': 'Strong Winds',
  'TL': 'Thundery Showers',
  'WC': 'Windy, Cloudy',
  'WD': 'Windy',
  'WF': 'Windy, Fair',
  'WR': 'Windy, Rain',
  'WS': 'Windy, Showers'
}

module.exports.getWeather = function() {
  return new Promise((resolve, reject) => {
    const res = request('GET', apiURL);
    if (res.statusCode !== 200) {
      reject('Error retriving weather: unable to reach server');
    }
    
    const forecast = fastXmlParser.parse(res.body.toString());
    let output = [];
    
    output.push({
      time: forecast.channel.morn.timePeriod,
      forecast: forecastAbbrv[forecast.channel.morn.wxsouth]
    });
    
    output.push({
      time: forecast.channel.afternoon.timePeriod,
      forecast: forecastAbbrv[forecast.channel.afternoon.wxsouth]
    });
    
    output.push({
      time: forecast.channel.night.timePeriod,
      forecast: forecastAbbrv[forecast.channel.night.wxsouth]
    });
    
    resolve(output);
  });
}