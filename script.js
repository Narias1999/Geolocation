let map, routeService, routeRender, autocompleteService
const txtCity = document.getElementById('city')
const citys = document.getElementById('citys')
const key = 'AIzaSyBHL_1DJMdMTtzzB5fzW5QLrZ3eEJX7Yqc'
const baseURL ='https://maps.googleapis.com/maps/api/'
const button = document.getElementById('button')
let predictions = []
let markers = []
const initialCenter = {lat: 37.766667, lng: -122.433333}

const http = leftURL => fetch(`${baseURL}${leftURL}`)

button.addEventListener('click', e => {
    if (predictions.length) {
        putMarker({place: txtCity.value})
        document.querySelector('.wrap').classList.add('unactive')
    } else {
        alert('Esta ciudad no está en los registros de google.')
    }
})
txtCity.addEventListener('keyup', function (e){
    if(this.value.length > 3) {
        getCitys(this.value)
    } else citys.style.display = 'none'
})
window.onload = async function (){
    try {
        const coords = await getCurrentPos()
        map.setCenter(coords)
        putMarker({coords})
    } catch (e) {
        putMarker({coords: initialCenter})
    }
}
function setText(text) {
    txtCity.value = text
    citys.style.display = 'none'
}
async function getCitys(city) {
    city = normalize(city)
    let promise = new Promise((rs, rj) => {
        autocompleteService.getQueryPredictions({ input: city },
        (predictions, status) => {
            if (status != google.maps.places.PlacesServiceStatus.OK) {
                return rj(status)
            } else return rs (predictions)
        })
    })


    predictions = await promise
    console.log(predictions)
    if(predictions.length){
        citys.style.display = 'block'
        if(citys.childNodes.length) citys.removeChild(citys.childNodes[0])
        const list = document.createElement('ul')
        for (const city of predictions) {
            const listItem = document.createElement('li')
            listItem.setAttribute('onclick', `setText('${city.description}')`)
            listItem.innerHTML = city.description
            list.appendChild(listItem)
        }
        citys.appendChild(list)
    } else citys.style.display = 'none'
}
function getCurrentPos() {
    const options = {
        enableHighHighAccuracy: true
    }
    return new Promise((rsl, rj) => {
        navigator.geolocation.getCurrentPosition((res) => {
            console.log(res)
            const lat = res.coords.latitude
            const lng = res.coords.longitude
            rsl({lat, lng})
        }, rj, options)
    })
}
function initMap() {
    const mapa = document.querySelector('#map')
    map = new google.maps.Map(mapa, {
        center: initialCenter,
        zoom:10
    })
    autocompleteService = new google.maps.places.AutocompleteService()
    routeService = new google.maps.DirectionsService()
    routeRender = new google.maps.DirectionsRenderer()
    routeRender.setMap(map)
}
const normalize = sentence => sentence.split(' ').join('+')
async function getCoords(place) {
    const res = await http(`geocode/json?address=${place}&key=${key}`)
    console.log(res.type)
    const json = await res.json()
    console.log(json)
    return json.results[0].geometry.location
}
async function putMarker(conf) {
    console.log(conf.place)
    let position
    if (conf.place) {
        position = await getCoords(normalize(conf.place)) 
    } else if(conf.coords) {
        position = conf.coords
    }
    const mark = new google.maps.Marker({position, map})
    markers.push(mark)
    if (markers.length > 1) {
        let origin = {
            lat: markers[0].position.lat(),
            lng: markers[0].position.lng()
        }
        let destination = {
            lat: markers[1].position.lat(),
            lng: markers[1].position.lng()
        }
        createRoute(origin,destination)
    }
}
function createRoute(origin, destination) {
    let request = {
        origin,
        destination,
        travelMode: 'DRIVING'
    }
    routeService.route(request, (res, status) => {
        console.log(res,status)
        if (status == 'OK'){
            routeRender.setDirections(res)
        }
    } )
}