// Supabase 클라이언트 초기화
const SUPABASE_URL = "https://kovzqlclzpduuxejjxwf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdnpxbGNsenBkdXV4ZWpqeHdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg1NTE4NTEsImV4cCI6MjAzNDEyNzg1MX0.A4Vn0QJMKnMe4HAZnT-aEa2r0fL4jHOpKoRHmbls8fQ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 음식점 리스트 불러오기
 * @returns
 */
let get_res_info = function () {
  return supabase
    .from("corkage")
    .select(
      `
      id, 
      name, 
      address, 
      phone, 
      image_url, 
      category_name, 
      coordinates
    `
    )
    .neq("category_name", "") // category_name이 빈 문자열이 아닌 데이터를 필터링
    .limit(20) // 상위 20개 데이터만 가져옴
    .then((response) => {
      const { data, error } = response;

      if (error) {
        console.error("Supabase 데이터 가져오기 실패:", error);
        return [];
      }

      // 컬럼을 JS에서 재매핑
      const formattedData = data.map((item) => {
        const [x, y] = item.coordinates.split(",").map((coord) => coord.trim());
        return {
          id: item.id,
          place_name: item.name,
          road_address_name: item.address,
          phone: item.phone,
          image_url: item.image_url,
          category_name: item.category_name,
          x: x,
          y: y,
        };
      });

      return formattedData;
    });
};

/** 사용자 위치를 가져오는 함수 */
let getUserLocation = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        userPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        await processUserLocation();
      },
      async (error) => {
        console.log("브라우저에서 위치 정보를 받아올 수 없음", error);
        console.log("Flutter에서 위치 정보를 기다리는 중...");
        await processUserLocation();
      }
    );
  } else {
    console.log(
      "브라우저 지오로케이션에 액세스할 수 없습니다. Flutter 위치를 기다리는 중..."
    );
    processUserLocation();
  }
};

// Flutter에서 전달된 위치 정보를 처리하는 함수
async function handleFlutterLocation(latitude, longitude) {
  userPosition = {
    latitude: latitude,
    longitude: longitude,
  };
  console.log("Flutter에서 제공한 사용자 위치:", userPosition);
  await processUserLocation();
}

// 위치 정보 처리 및 지도 업데이트 함수
async function processUserLocation() {
    // 로딩 화면 표시
    document.getElementById("loading-screen").style.display = "flex";

    await showUserPosition(); // 사용자 위치를 지도에 표시
    await searchPlaces("콜키지 프리");

    async function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function moveMap() {
        await delay(1000); // 1초 대기
        map.setLevel(10); // 지도를 10레벨로 유지
        await moveMyloc(); // 비동기 함수 moveMyloc 실행
    }

    await moveMap();

    // 로딩 화면 숨김
    document.getElementById("loading-screen").style.display = "none";
}


// 초기 위치 정보 요청
getUserLocation();

let markers = [];
let selectedMarker = null;
let mapContainer = document.getElementById("map");
let mapOption = {
  center: new kakao.maps.LatLng(37.606665, 127.027316),
  level: 10,
};
let map = new kakao.maps.Map(mapContainer, mapOption);
map.setMaxLevel(12);
let ps = new kakao.maps.services.Places();
let infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });
let isSearchInProgress = false;
let userPosition = null; // 초기에는 null로 설정

/** 사용자 위치를 지도에 표시하는 함수 */
let showUserPosition = function () {
  if (!userPosition) return;

  let marker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(
      userPosition.latitude,
      userPosition.longitude
    ),
    image: new kakao.maps.MarkerImage(
      "/static/img/user_icon.png",
      new kakao.maps.Size(44, 49),
      { offset: new kakao.maps.Point(27, 69) }
    ),
  });
  marker.id = "user_icon";
  marker.setMap(map);
  map.setMaxLevel(12);
};

// 문서가 로드된 후 실행되는 함수
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".category").forEach((category) => {
    category.addEventListener("click", function () {
      searchPlaces(this.getAttribute("data-val"));
    });

    getUserLocation();

    $("#my_loc_img").on("click", function () {
      if (userPosition) {
        // userPosition이 설정된 경우에만
        moveMyloc();
      } else {
        console.error("User position is not available yet.");
      }
    });
  });
});

let moveMyloc = function () {
  if (userPosition) {
    let moveLatLon = new kakao.maps.LatLng(
      userPosition.latitude,
      userPosition.longitude
    );
    map.panTo(moveLatLon);
    map.setLevel(5);
    map.setCenter(moveLatLon);
  } else {
    console.error("사용자 위치 정보를 받지 못했습니다.");
  }
};
/** 카테고리 이름에 따라 이미지 경로를 반환하는 함수 */
let getImageSrc = function (categoryName) {
  if (categoryName.includes("한식")) return "/static/img/kor_food.png";
  if (categoryName.includes("회") || categoryName.includes("돈까스"))
    return "/static/img/cutlet_sashimi.png";
  if (categoryName.includes("중식")) return "/static/img/ch_food.png";
  if (categoryName.includes("양식")) return "/static/img/fast_food.png";
  return "/static/img/cork_restaurant.jpg";
};

/** 키워드를 사용하여 장소를 검색하는 함수 */
let searchPlaces = function (keyword) {
  if (!isSearchInProgress) {
    isSearchInProgress = true;
    ps.keywordSearch(keyword, placesSearchCB);
  }
};

/** 장소 검색 결과를 처리하는 콜백 함수 - 수정하지마 제발 */
let placesSearchCB = function (data, status) {
  isSearchInProgress = false;

  if (status === kakao.maps.services.Status.OK) {
    removeMarkers();
    let bounds = new kakao.maps.LatLngBounds();

    // 기존 장소 검색 데이터를 처리
    let allPlacesInfo = data
      .map((place, index) => {
        displayMarker(place, index);
        bounds.extend(new kakao.maps.LatLng(place.y, place.x));
        return generatePlaceInfo(place, index);
      })
      .join("");

    // 비동기적으로 추가적인 장소 정보를 가져와 결합
    get_res_info().then((resData) => {
      console.log(resData);

      // 추가적인 장소 정보 처리
      let additionalPlacesInfo = resData
        .map((place, index) => {
          // place.id를 이용하거나, 그렇지 않은 경우 index를 사용
          let placeId = place.id ? place.id : index;

          // 필요한 경우 마커를 추가
          displayMarker(place, placeId);
          bounds.extend(new kakao.maps.LatLng(place.y, place.x));

          return generatePlaceInfo(place, placeId);
        })
        .join("");

      // 기존 장소 정보와 추가적인 장소 정보를 결합
      allPlacesInfo += additionalPlacesInfo;

      // 결합된 결과를 DOM에 삽입
      document.getElementById("restaurantInfo").innerHTML = allPlacesInfo;

      // 유저 위치가 있으면 경계에 포함시킴
      if (userPosition) {
        let userLatLng = new kakao.maps.LatLng(
          userPosition.latitude,
          userPosition.longitude
        );
        bounds.extend(userLatLng);
      }

      // 지도에 경계 설정
      map.setBounds(bounds);
      document.getElementById("infoContainer").style.display = "block";
    });
  } else {
    console.error("검색 결과를 불러올 수 없는 상태입니다.:", status);
  }
};

/** 장소에 마커를 표시하는 함수 */
let displayMarker = function (place, index) {
  let marker = createMarker(place);

  kakao.maps.event.addListener(marker, "click", function () {
    if (selectedMarker === marker) {
      if (selectedMarker.customOverlay) {
        selectedMarker.customOverlay.setMap(null); // 오버레이를 닫음
        selectedMarker = null;
        setMarkerImage(marker, marker.originalImageSrc);
      }
    } else {
      if (selectedMarker) {
        setMarkerImage(selectedMarker, selectedMarker.originalImageSrc);
        if (selectedMarker.customOverlay) {
          selectedMarker.customOverlay.setMap(null);
        }
      }

      // 말풍선 스타일과 꼬리표를 자연스럽게 맞춤
      let content = `
        <div style="position: relative;">
          <div style="display: flex; align-items: center; padding: 10px 20px 10px 10px; background-color: #F8E9E9; border: 2px solid #EFC3C3; border-radius: 20px; box-shadow: 0px 2px 6px rgba(0,0,0,0.3);">
            <div style="margin-right: 10px;">
              <img src="${getImageSrc(
                place.category_name
              )}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            </div>
            <div style="display: flex; flex-direction: column; text-align: left;">
              <span style="font-size: 14px; font-weight: bold; color: #D0273B;">${
                place.place_name
              }</span>
              <span style="display: inline-block; font-size: 12px; color: #FFFFFF; background-color: #E1707A; padding: 2px 5px; border-radius: 5px; margin-top: 2px;">콜키지 프리</span>
            </div>
          </div>
          <div style="position: absolute; bottom: -11px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 11px solid transparent; border-right: 11px solid transparent; border-top: 11px solid #F8E9E9; border-top-color: #EFC3C3; border-top: 11px solid #EFC3C3;"></div>
        </div>`;

      let customOverlay = new kakao.maps.CustomOverlay({
        content: content,
        position: new kakao.maps.LatLng(place.y, place.x),
        yAnchor: 1.5,
      });
      customOverlay.setMap(map);

      marker.customOverlay = customOverlay;
      // 이미지가 cork_restaurant.jpg인 경우만 click_mark.jpg로 변경
      if (marker.originalImageSrc === "/static/img/cork_restaurant.jpg") {
        setMarkerImage(marker, "/static/img/click_mark.jpg", 1.2);
      }

      document
        .getElementById(`res_info_${index}`)
        .scrollIntoView({ behavior: "smooth", block: "center" });

      selectedMarker = marker;
    }
  });

  markers.push(marker);
};

/** 마커 이미지를 설정하는 함수 */
let setMarkerImage = function (marker, imageSrc, scale = 1) {
  let imageSize = calculateMarkerSize(scale);
  let markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, {
    offset: new kakao.maps.Point(imageSize.width / 2, imageSize.height),
  });
  marker.setImage(markerImage);
};

/** 장소 정보를 바탕으로 마커를 생성하는 함수 */
let createMarker = function (place) {
  let imageSrc = getImageSrc(place.category_name);
  let imageSize = calculateMarkerSize();
  let markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, {
    offset: new kakao.maps.Point(imageSize.width / 2, imageSize.height),
  });
  let markerPosition = new kakao.maps.LatLng(place.y, place.x);

  let marker = new kakao.maps.Marker({
    map: map,
    position: markerPosition,
    image: markerImage,
  });

  marker.originalImageSrc = imageSrc;
  return marker;
};

/** 지도 레벨에 따라 마커 크기를 계산하는 함수 */
let calculateMarkerSize = function (scale = 1) {
  let level = map.getLevel();
  let size = 24 + (((48 - 24) * (10 - level)) / 9) * scale;
  return new kakao.maps.Size(size, size * 1.2);
};

/** 장소 정보를 HTML 형식으로 생성하는 함수 */
let generatePlaceInfo = function (place, index) {
  let distance = 0;
  let walkingTime = "알 수 없음";
  let drivingTime = "알 수 없음";

  if (!place.image_url) place.image_url = "/static/img/res_sample_img.jpg";

  if (userPosition) {
    distance = calculateDistance(
      userPosition.latitude,
      userPosition.longitude,
      place.y,
      place.x
    );
    walkingTime = formatTime(calculateTime(distance, 4));
    drivingTime = formatTime(calculateTime(distance, 40));
  }

  let categoryImageSrc = getImageSrc(place.category_name);

  return `
    <div id="res_info_${index}" class="res_info" 
        data-place_name="${place.place_name}"
        data-address_name="${place.address_name}"
        data-phone="${place.phone}"
        data-distance="${distance.toFixed(2)}"
        data-walking_time="${walkingTime}"
        data-driving_time="${drivingTime}"
        data-category_name="${place.category_name}">
        <div class="row">
            <div class="col-4" style="padding-right: 1px;">
                <div class="image-container">
                    <img src="${place.image_url}" alt="${
    place.place_name
  }" class="cover-image">
                </div>
            </div>
            <div class="col-8 info-container">
                <p class="place-name">
                    <img src="${categoryImageSrc}" alt="${
    place.category_name
  }" class="category-icon"> 
                    ${place.place_name}
                    <span class="bookmark-icon">
                      <img src="/static/img/UnBookmark.png" alt="즐겨찾기 아이콘">
                    </span>
                </p>
                <div class="tag-container">
                    <span class="tag red">콜키지 프리</span>
                    <span class="tag black">3병 제한</span>
                </div>
                <p class="description">"숙성된 자연산 사시미와 스시를 즐길..."</p>
                <p class="rating">평점: 4.5</p>
            </div>
        </div>
    </div>
  `;
};

/**
 * 북마크 아이콘을 클릭하면 북마크 테이블 업데이트 (true or false)
 * @param {number} id 레스토랑 id
 */
const setBookmark = async (id, status) => {
  if (!id) {
    console.error("요소에 ID가 존재하지 않습니다.:", id);
    return;
  }

  Swal.fire({
    title: "북마크를 취소하시겠습니까?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "네",
    cancelButtonText: "아니요",
    customClass: {
      confirmButton: "swal2-confirm-btn",
      cancelButton: "swal2-cancel-btn",
    },
    buttonsStyling: false,
  }).then(async (result) => {
    if (result.isConfirmed) {
      // 북마크 테이블에 데이터가 존재하지 않은 경우 북마크 테이블에 데이터 생성 (user_id, restaurant_id, status)

      // 북마크 테이블에 데이터가 존재하고 status가 true인 상태에서 버튼을 누른 경우 북마크 상태를 false로 업데이트
      const { error } = await supabase
        .from("bookmark") // bookmark 테이블을 업데이트
        .update({ status: false }) // status 컬럼을 false로 변경
        .eq("restaurant_id", id);

      if (error) {
        console.error("DB 에러:", error);
        return;
      }
      // 토스트 스타일의 알림 메시지 표시
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "북마크 상태가 변경되었습니다.",
        showConfirmButton: false,
        timer: 1500, // 1.5초 후 자동으로 사라짐
        timerProgressBar: true,
        customClass: {
          popup: "swal2-toast",
        },
      });
    }
  });
};

// 장소 정보 클릭 시 상세 페이지로 이동하는 함수
document.addEventListener("click", function (event) {
  let target = event.target.closest(".res_info");

  if (target) {
    window.location.href = "/restaurant";
  }
});

/** 지도에서 마커를 제거하는 함수 */
let removeMarkers = function () {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  selectedMarker = null;
};

/** 두 지점 간의 거리를 계산하는 함수 */
let calculateDistance = function (lat1, lon1, lat2, lon2) {
  let R = 6371;
  let dLat = (lat2 - lat1) * (Math.PI / 180);
  let dLon = (lon2 - lon1) * (Math.PI / 180);
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/** 거리와 속도를 사용해 시간을 계산하는 함수 */
let calculateTime = function (distance, speed) {
  return distance / speed;
};

/** 시간을 형식에 맞게 포맷하는 함수 */
let formatTime = function (time) {
  let hours = Math.floor(time);
  let minutes = Math.round((time - hours) * 60);
  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
};

// 지도의 줌 레벨이 변경될 때 마커 크기를 업데이트하는 함수
kakao.maps.event.addListener(map, "zoom_changed", updateMarkerSizes);

/** 마커 크기를 업데이트하는 함수 */
function updateMarkerSizes() {
  markers.forEach((marker) => setMarkerImage(marker, marker.originalImageSrc));
}

// 지도 위에 띄워줄 모달창 (검색 조건)
let $modal = $("#filterModal");
let $btn = $("#col_kitchen");
let $span = $(".close").first();
let $dragHandle = $(".drag-handle"); // 드래그 핸들 요소 선택자 추가
let $backgroundElements = $(
  ".map_wrap, .search-bar, .category-swiper, .res_info_swiper"
);

// 스크립트를 로드하는 함수
function loadScript(url, callback) {
  $.getScript(url, callback);
}

// 모달창을 여는 버튼 이벤트 리스너
$btn.on("click", function () {
  $modal.show();
  $backgroundElements.addClass("blur-background");
  loadScript("/static/js/filter.js");
});

// 모달창을 닫는 함수
function closeModal() {
  $modal.hide();
  $backgroundElements.removeClass("blur-background");
  $("script[src='/static/js/filter.js']").remove();
}
