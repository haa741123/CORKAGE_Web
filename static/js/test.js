var markers = [];
var selectedMarker = null; // 현재 선택된 마커를 추적하기 위한 변수
var mapContainer = $("#map")[0];
var mapOption = {
  center: new kakao.maps.LatLng(37.606665, 127.027316),
  level: 3,
};

var map = new kakao.maps.Map(mapContainer, mapOption);
var ps = new kakao.maps.services.Places();
var infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

ps.keywordSearch("콜키지 무료", placesSearchCB);

$(document).ready(function () {
  $(".category").on("click", function () {
    const categoryValue = $(this).data("val");
    ps.keywordSearch(categoryValue, placesSearchCB);
  });
});

// 장소 검색 콜백 함수  
function placesSearchCB(data, status, pagination) {
  if (status === kakao.maps.services.Status.OK) {
    removeMarkers();
    let bounds = new kakao.maps.LatLngBounds();

    for (let i = 0; i < data.length; i++) {
      displayMarker(data[i]);
      bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
      
    }

    // 사용자 위치가 있는 경우, 사용자 위치도 bounds에 추가
    if (userPosition && userPosition.latitude && userPosition.longitude) {
      let userLatLng = new kakao.maps.LatLng(userPosition.latitude, userPosition.longitude);
      bounds.extend(userLatLng);
    }

    map.setBounds(bounds);

    // 모든 장소 정보를 infoContainer에 업데이트
    
    
  }
}


// 장소 마커 표시 함수
function displayMarker(place) {
  let marker = createMarker(place);

  kakao.maps.event.addListener(marker, "click", function () {
    var placeInfoHTML = generatePlaceInfo(place);


    changeMarkerImage(marker);
  });

  markers.push(marker);
}

// 마커 이미지 변경 함수
function changeMarkerImage(marker) {
  let clickedImageSrc = "/static/img/click_mark.jpg";
  let originalImageSrc = "/static/img/cork_restaurant.jpg";

  // 이전에 선택된 마커가 있으면 원래 이미지로 변경
  if (selectedMarker) {
    let imageSize = calculateMarkerSize();
    let imageOption = {
      offset: new kakao.maps.Point(imageSize.width / 2, imageSize.height),
    };

    let markerImage = new kakao.maps.MarkerImage(
      originalImageSrc,
      imageSize,
      imageOption
    );
    selectedMarker.setImage(markerImage);
  }

  // 새로운 마커 이미지를 클릭된 이미지로 변경하고 크기를 살짝 더 크게 설정
  let imageSize = calculateMarkerSize();
  let clickedImageSize = new kakao.maps.Size(
    imageSize.width * 1.2,
    imageSize.height * 1.2
  );
  let imageOption = {
    offset: new kakao.maps.Point(
      clickedImageSize.width / 2,
      clickedImageSize.height
    ),
  };

  let markerImage = new kakao.maps.MarkerImage(
    clickedImageSrc,
    clickedImageSize,
    imageOption
  );
  marker.setImage(markerImage);

  // 현재 선택된 마커 업데이트
  selectedMarker = marker;
}

// 마커 생성 함수
function createMarker(place) {
  let imageSrc = "/static/img/cork_restaurant.jpg";
  let imageSize = calculateMarkerSize();
  let imageOption = {
    offset: new kakao.maps.Point(imageSize.width / 2, imageSize.height),
  };

  let markerImage = new kakao.maps.MarkerImage(
    imageSrc,
    imageSize,
    imageOption
  );
  let markerPosition = new kakao.maps.LatLng(place.y, place.x);

  let marker = new kakao.maps.Marker({
    map: map,
    position: markerPosition,
    image: markerImage,
  });

  return marker;
}

// 마커 이미지 크기 계산 함수
function calculateMarkerSize() {
  let level = map.getLevel();
  let minSize = 24; // Increased minimum size for better visibility
  let maxSize = 48;
  let size = minSize + ((maxSize - minSize) * (10 - level)) / 9; // (assuming level 1-10)
  return new kakao.maps.Size(size, size * 1.2);
}



$(document).ready(function () {
  $("#restaurantInfo").on("click", ".more_info", function () {
    $(".more_info").not(this).hide();

    $(this).css("height", "360px");
    $(".res_loc, .res_menu").removeAttr("hidden");
  });
});

// 마커 제거 함수
function removeMarkers() {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
  selectedMarker = null; // 마커를 제거할 때 선택된 마커도 초기화
}

// 두 지점 간 거리 계산 함수
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // 지구 반경 (km)
  var dLat = (lat2 - lat1) * (Math.PI / 180); // 위도 차이 (라디안)
  var dLon = (lon2 - lon1) * (Math.PI / 180); // 경도 차이 (라디안)
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // 거리 (km)
  return d;
}

// 이동 시간 계산 함수
function calculateTime(distance, speed) {
  return distance / speed;
}

// 시간 포맷 함수
function formatTime(time) {
  var hours = Math.floor(time);
  var minutes = Math.round((time - hours) * 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
}

let userPosition;

// 사용자 위치 가져오기 함수
function UserLocation() {
  function success(position) {
    userPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    showUserPosition();
    ps.keywordSearch("콜키지 무료", placesSearchCB); // 위치가 설정된 후 검색 실행
  }

  function error() {
    console.error("위치 정보를 받아오는데 실패했습니다.");
    ps.keywordSearch("콜키지 무료", placesSearchCB); // 위치 가져오기에 실패해도 검색 실행
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    console.error("이 브라우저는 지오로케이션을 지원하지 않습니다.");
    ps.keywordSearch("콜키지 무료", placesSearchCB); // 지오로케이션을 지원하지 않으면 기본 검색 실행
  }
}

// 사용자 위치 마커 표시 함수
function showUserPosition() {
  let imageSrc = "/static/img/user_icon.png";
  let imageSize = new kakao.maps.Size(44, 49);
  let imageOption = { offset: new kakao.maps.Point(27, 69) };

  let markerImage = new kakao.maps.MarkerImage(
    imageSrc,
    imageSize,
    imageOption
  );
  let markerPosition = new kakao.maps.LatLng(
    userPosition.latitude,
    userPosition.longitude
  );

  let marker = new kakao.maps.Marker({
    position: markerPosition,
    image: markerImage,
  });
  marker.id = "user_icon";
  marker.setMap(map);

  map.setMaxLevel(12);
}

// 지도의 확대 및 축소 이벤트 리스너 등록
kakao.maps.event.addListener(map, "zoom_changed", function () {
  updateMarkerSizes();
});

// 마커 크기 업데이트 함수
function updateMarkerSizes() {
  for (let i = 0; i < markers.length; i++) {
    let marker = markers[i];
    let imageSrc = "/static/img/cork_restaurant.jpg";
    let imageSize = calculateMarkerSize();
    let imageOption = {
      offset: new kakao.maps.Point(imageSize.width / 2, imageSize.height),
    };

    let markerImage = new kakao.maps.MarkerImage(
      imageSrc,
      imageSize,
      imageOption
    );
    marker.setImage(markerImage);
  }
}

UserLocation();
