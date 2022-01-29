// ==UserScript==
// @name         KakaoStory Enhanced
// @namespace    http://chihaya.kr
// @version      0.37
// @description  Add-on for Web KakaoStory
// @author       Reflection, 박종우
// @match        https://story.kakao.com/*
// @downloadURL  https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhacned/master/enhanced.user.js
// @updateURL    https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/enhanced.user.js
// @require      https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

/* 내부 설정 값
   ksDarkFontSize: 자체 폰트 크기 설정
   ksDarkThemeStyle: 테마 설정
   ksDarkThemeType: 다크테마 속 구체적 테마 설정
   ksDarkCustomFontName: 사용자 설정 폰트 이름
   ksDarkCustomFontCss: 사용자 설정 폰트 CSS 파일 경로
   ksDarkFontName: 폰트 설정 (현재 사용되지 않는 설정)
   ksDarkNotyTime: 알리미 시간 주기(초 단위)
   ksDarkNotyUse: 알리미 사용 여부
   ksDarkKillTeller: 스토리텔러/채널 버튼 삭제 여부 설정
   ksDarkNotySound: 알리미 사운드 출력 여부 설정
   ksDarkBan: 강화된 차단 사용 설정
   ksDarkHideLogo : 탭에서 카카오스토리를 네이버로 설정
   ksDarkVersion : Enhanced 버전
   ksDarkImageView : 이미지 숨길건지
   ksDarkThemeStyleSystem : OS의 테마 설정에 맞춰서 테마 설정
   ksDarkMention : 디코스타일 멘션 쓸거냐?
   ksDarkDownloadVideo : 동영상 다운로드 버튼 활성화 여부
   ksDarkHideHistory : 흑역사(과거추억) 안보이기
   ksDarkSticonSize : 이모티콘 크기 설정
*/

let currentPage = '';
let unlockBannedString = false;
let notyTimeCount = 0;
let banList = new Set();
let banStringArr = new Array();
let versionString = '0.37(211105)';
let cssVersion = 'CSS 업데이트 일자: ';
let myID = '';
let konami = [38,38,40,40,37,39,37,39,66,65];
let konamiCount = 0;
let shakeEaster = false;

function changeString() {
    replaceWordsByTagName('label', '우리끼리보기', '편한친구공개');
    replaceWordsByClassName('tit_story', '우리끼리', '편한친구');
    replaceWordsByClassName('ico_bestfriend_m _permissionPartOfFriends', '우리끼리보기', '편한친구공개');
    setAttributeByClassName('_permissionPartOfFriends', 'data-tooltip', '편한친구공개');
}

function hideOldHistory() {
    var oldhistory = document.getElementsByClassName("section section_time");
    for (var i = 0; i < oldhistory.length; i++) {
        oldhistory[i].parentElement.style.display = 'none';
    }
}

function hideBannedUserComment() {
    var comments = document.getElementsByClassName("_commentContent");
    for (var i = 0; i < comments.length; i++) {
        var tmpBannedID = comments[i].getElementsByClassName("txt")[0].getElementsByTagName("p")[0].getElementsByTagName("a")[0].getAttribute("href").replace("/", "");

        if (banList.has(tmpBannedID) == true) {
            comments[i].parentElement.style.display = 'none';
            //i -= 1; <-- only for remove()
        }
    }
}

function hideBannedStringComment() {
    if (unlockBannedString == true) {
        return;
    }
    var articles = document.getElementsByClassName("txt_wrap");
    for (var i = 0; i < articles.length; i++) {
        var articleText = articles[i].innerText.toLowerCase();

        for (var j = 0; j < banStringArr.length; j++) {
            if (articleText.includes(banStringArr[j].toLowerCase())) {
                if (articles[i].parentElement.className.toString().includes("share_wrap")) {
                    articles[i].parentElement.parentElement.parentElement.parentElement.parentElement.style.display = 'none';
                } else {
                    articles[i].parentElement.parentElement.parentElement.style.display = 'none';
                }
                continue;
            }
            //i -= 1; <-- only for remove()
        }
    }
}

function hideRecommendFeed() {
    var recommendFeed = document.getElementsByClassName("section recommend");
    for (var i = 0; i < recommendFeed.length; i++) {
        recommendFeed[i].remove();
    }
}



function saveText(str, fileName) {
    var blob = new Blob([str], { type: "text/plain;charset=utf-8" });
    saveAs(blob, fileName);
}

function saveFriends() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonFriends = JSON.parse(xmlHttp.responseText);
            var friendsText = '';
            for (var i = 0; i < jsonFriends.profiles.length; i ++) {
                friendsText = friendsText + String(jsonFriends.profiles[i]["display_name"]) + " : " + String(jsonFriends.profiles[i]["id"]) + '\n';
            }
            saveText(friendsText, "친구목록백업.txt");
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/friends");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

//게시글 전체 삭제(아직 구현 안됨)
function deleteArticlesConfirm() {
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "deleteLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('deleteLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;"><div class="inner_toast_layer _toastBody"><p class="txt _dialogText">정말 게시글을 전체 삭제하시겠습니까?</p><div class="btn_group"><a href="#" class="btn_com btn_wh _dialogCancel _dialogBtn" id="deleteArticlesConfirmCloseA"><span>취소</span></a><a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteArticlesConfirmOK"><span>확인</span></a> </div></div></div></div>';
}

//친구 전체 삭제 관련
function deleteFriendsConfirm() {
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "deleteLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('deleteLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;"><div class="inner_toast_layer _toastBody"><p class="txt _dialogText">정말 친구를 전체 삭제하시겠습니까?<br>취소하시려면 새로고침해야 합니다.</p><div class="btn_group"><a href="#" class="btn_com btn_wh _dialogCancel _dialogBtn" id="deleteFriendConfirmCloseA"><span>취소</span></a><a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteFriendConfirmOK"><span>확인</span></a> </div></div></div></div>';
}

//문자열 차단 관련
function killBanString() {
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "banStringLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('banStringLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="dim_ly cover_content cover_center" data-kant-group="msg.w"><div class="ly_con message" style="top:84px"><div class="_container box_writing"><fieldset><legend class="tit_message">문자열 차단</legend><div class="box_from _receiverWrap" data-model="c56736" data-part-name="receiver"><div class="_suggestionWrap friends_search" style="display: block;"><label class="_suggestionInputPlaceholder lab_from" for="messageReceiver">차단할 문자열을 한줄에 하나씩 입력하세요.</label></div></div><div class="box_write color_11" data-model="c56736" data-part-name="writing"><div class="editable"><span class="write_edit" style="top: 162px;"><textarea class="tf_write _texxtarea" id="textbanstring" style="font-size: 22px; line-height: 26px; height: 370px;"></textarea></span> <span class="edit_gap"></span></div></div><div class="box_media menu_on"><div class="bn_group"><a href="#" class="btn_com _sendMessage btn_or" id="ksdarkSaveBanString" data-kant-id="574"><em>저장</em></a></div></div><a href="#" class="link_close _hideWritingView" id="closeBanString"><span class="ico_ks ico_close">취소</span></a></fieldset></div></div></div></div>';
    document.getElementById("textbanstring").value = GM_getValue('ksdarkBanString', '');
}

function loadForDeleteFriends() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            jsonMyFriends = JSON.parse(xmlHttp.responseText);

            var deleteCountLayer = document.createElement('div');
            deleteCountLayer.id = "deleteCountLayer";
            deleteCountLayer.className = "cover _cover";
            document.body.appendChild(deleteCountLayer);
            document.getElementById('deleteCountLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;"><div class="inner_toast_layer _toastBody"><p class="txt _dialogText" id="deleteFriendText">친구 삭제 중... (0 / 0)</p><div>※정책상 삭제 속도는 느리게 설정되었습니다.<br>취소하시려면 새로고침 하세요.</div><div class="btn_group"><a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteFriendComplete" style="display: none;"><span>확인</span></a> </div></div></div></div>';

            deleteFriends();
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/friends");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

var delFCount = 0;
var jsonMyFriends;

function deleteFriends() {
    setTimeout(function() {
        if (delFCount < jsonMyFriends.profiles.length) {
            deleteFriend(jsonMyFriends.profiles[delFCount]["id"]);
            document.getElementById('deleteFriendText').innerHTML = '친구 삭제 중... (' + (delFCount + 1) + ' / ' + jsonMyFriends.profiles.length + ')';
            delFCount++;
            deleteFriends();
        } else {
            document.getElementById('deleteFriendText').innerHTML = '전체 삭제 완료';
            document.getElementById('deleteFriendComplete').style.display = 'block';
        }
    }, 750);
}

function deleteFriend(userid) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            //ALLDONE
            //console.log("DELETE HERE");
        }
    }
    xmlHttp.open("DELETE", "https://story.kakao.com/a/friends/" + userid);
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}





//채널버튼, 텔러버튼 없애버리기
function killTellerChannel(val) {
    document.getElementsByClassName("storyteller_gnb")[0].style.display = val;
    document.getElementsByClassName("group_gnb")[0].style.display = val;
}

//전체 설정 추가
function addCustomFontSetting() {
    //다크모드 설정 웹 HTML 설정용
    var customSetting = document.createElement('div');
    customSetting.id = 'enhancedLayer';
    customSetting.className = 'cover _cover';
    customSetting.style.cssText = 'display: none;  overflow-y: scroll;';
    document.body.appendChild(customSetting);
    document.getElementById('enhancedLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div>'
        + '<div class="cover_wrapper" style="z-index: 201;">'
        + '<div class="write cover_content cover_center">'
        + '<div class="_layerWrapper layer_write">'
        + '<div class="section _dropZone account_modify">'
        + '<strong class="subtit_modify subtit_enhanced">\' Enhanced 설정</strong>'
        + '<dl class="list_account">'
          //폰트 설정
        + '<dt>폰트 설정</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_font1" class="inp_radio _friendListExposure" id="fontNoto" value="Noto Sans KR"> <label for="fontNoto">NotoSans</label></div><div class="radio_inp"> <input type="radio" name="open_font1" class="inp_radio _friendListExposure" id="fontNanum" value="나눔고딕"> <label for="fontNanum">나눔고딕</label></div><div class="radio_inp"> <input type="radio" name="open_font1" class="inp_radio _friendListExposure" id="fontCustom" value="Custom"> <label for="fontCustom">사용자 설정</label></div></div></dd>'
          //폰트 크기 설정
        + '<dt>폰트 크기</dt>'
        + '<dd><input type="text" class="tf_profile _input _ksdark_cls" id="ksdark_font_size_add" value="' + GM_getValue('ksDarkFontSize', '') + '" style="border: 0px; font-size: 13px; width: 30px; height: 16px; padding: 6px 8px;"> px 추가</dd>'
          //사용자 설정 폰트 이름
        + '<dt>사용자 설정 폰트명</dt>'
        + '<dd><input type="text" class="tf_profile _input _ksdark_cls" id="ksdark_font_css_name" value="' + GM_getValue('ksDarkCustomFontName', '') + '" style="background-color: ' + GM_getValue('ksDarkThemeStyle', '') + '; border: 0px; font-size: 13px; width: 316px; height: 16px; padding: 6px 8px;"><br>※사용자 폰트 설정 TIP<br>웹 폰트가 아니어도 사용자의 PC에 설치된 폰트도 적용할 수 있습니다.</dd>'
        + '<dt>사용자 설정 폰트<br>CSS URL</dt>'
          //사용자 설정 폰트 CSS
        + '<dd><input type="text" class="tf_profile _input _ksdark_cls" id="ksdark_font_css_url" style="background-color: ' + GM_getValue('ksDarkThemeStyle', '') + '; border: 0px; font-size: 13px; width: 316px; height: 16px; padding: 6px 8px;" value="' + GM_getValue('ksDarkCustomFontCss', '') + '"></dd>'
          //다크테마 설정
        + '<dt>테마 설정</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarkstyle1" class="inp_radio _friendListExposure" id="ksDarkThemeWhite" value="#ffffff"> <label for="ksDarkThemeWhite">Light Mode</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkstyle1" class="inp_radio _friendListExposure" id="ksDarkThemeDark" value="#40444b"> <label for="ksDarkThemeDark">Dark Mode</label></div></div><div><input type="checkbox" class="inp_radio _friendListExposure" name="ksdarkusesystemtheme" id="ksDarkSystemTheme"> <label for="ksDarkSystemTheme">내 PC의 테마 따라가기</label></div></dd>'
        + '<dt>다크테마 스타일</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarkType" class="inp_radio _friendListExposure" id="ksDarkTypeDiscord" value="discord"> <label for="ksDarkTypeDiscord">Discord</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkType" class="inp_radio _friendListExposure" id="ksDarkTypeRed" value="darkred"> <label for="ksDarkTypeRed">Dark Red</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkType" class="inp_radio _friendListExposure" id="ksDarkTypeBlue" value="darkblue"> <label for="ksDarkTypeBlue">Dark Blue</label></div></div>※해당 기능은 실험적인 기능이며, 다크모드를 활성화 해야 정상적으로 적용됩니다.</dd>'
          //스토리 텔러, 채널 버튼 삭제 설정
        + '<dt>스토리텔러/채널<br>버튼</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarktellerkill" class="inp_radio _friendListExposure" id="ksDarkTellerNoKill" value="F"> <label for="ksDarkTellerNoKill">보이기</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarktellerkill" class="inp_radio _friendListExposure" id="ksDarkTellerKill" value="T"> <label for="ksDarkTellerKill">안보이기</label></div></div></dd>'
        + '<dt>디스코드 언급 스타일</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarkmention" class="inp_radio _friendListExposure" id="ksDarkMention" value="true"> <label for="ksDarkMention">사용</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkmention" class="inp_radio _friendListExposure" id="ksDarkNoMention" value="false"> <label for="ksDarkNoMention">사용안함</label></div></div>※사용자의 스토리에 최소 하나 이상의 글이 작성되어 있어야 정상 작동합니다.</dd>'
        //알림 알림기능
        + '<dt>스토리 알림 기능</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarknoty" class="inp_radio _friendListExposure" id="ksDarkNotyUse" value="T"> <label for="ksDarkNotyUse">사용</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarknoty" class="inp_radio _friendListExposure" id="ksDarkNotyNotUse" value="F"> <label for="ksDarkNotyNotUse">사용안함</label></div></div></dd>'
          //알림 사운드 출력할거야 말거야(false가 소리켜는거임 사일런트옵션이라)
        + '<dt>알림 사운드</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarknotysound" class="inp_radio _friendListExposure" id="ksDarkNotySound" value="false"> <label for="ksDarkNotySound">켜기</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarknotysound" class="inp_radio _friendListExposure" id="ksDarkNotyNoSound" value="true"> <label for="ksDarkNotyNoSound">끄기</label></div></div></dd>'
          //알림 체크주기
        + '<dt>알림 체크 주기</dt>'
        + '<dd><input type="text" class="tf_profile _input _ksdark_cls" id="ksdark_notytime" value="' + GM_getValue('ksDarkNotyTime', '') + '" style="background-color: ' + GM_getValue('ksDarkThemeStyle', '') + '; border: 0px; font-size: 13px; width: 30px; height: 16px; padding: 6px 8px;"> 초마다 로드<br>※20초를 권장하며 이보다 더 짧게 설정하는 것은 권장하지 않습니다.</dd>'
          //강화된 차단
        + '<dt>강화된 차단 사용</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarkban" class="inp_radio _friendListExposure" id="ksDarkBan" value="true"> <label for="ksDarkBan">사용</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkban" class="inp_radio _friendListExposure" id="ksDarkNoBan" value="false"> <label for="ksDarkNoBan">미사용</label></div></div>※해당 기능을 사용하면 차단한 유저의 댓글이 어느 게시글에서도 보이지 않습니다.<br>문자열 차단 기능도 함께 적용됩니다.</dd>'
        + '<dt>문자열 차단</dt>'
        + '<dd><div class="btn_area"><a href="#" class="btn_com btn_wh _changePasswd" style="background: #43b581 !important;" id="ksdarkStringKill"><em>차단할 문자열 등록</em></a></div>※해당 기능을 사용하면 등록한 문자열이 있는 글은 보이지 않습니다.</dd>'
        + '<dt>로고 숨기기</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarkhidelogo" class="inp_radio _friendListExposure" id="ksDarkHideLogo" value="true"> <label for="ksDarkHideLogo">숨기기</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkhidelogo" class="inp_radio _friendListExposure" id="ksDarkNoHideLogo" value="false"> <label for="ksDarkNoHideLogo">숨기지 않기</label></div></div>※해당 기능을 사용하면 카카오스토리 로고가 삭제되고, 파비콘 및 타이틀이 네이버로 변경됩니다.</dd>'
        + '<dt>이미지 숨기기</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarkhideimage" class="inp_radio _friendListExposure" id="ksDarkHideImage" value="hide"> <label for="ksDarkHideImage">숨기기</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkhideimage" class="inp_radio _friendListExposure" id="ksDarkVisibleImage" value="view"> <label for="ksDarkVisibleImage">숨기지 않기</label></div></div>※해당 기능을 사용하면 이미지가 블러처리 되어 보이지 않습니다.</dd>'
        + '<dt>흑역사 숨기기</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarkhidehistory" class="inp_radio _friendListExposure" id="ksDarkHideHistory" value="true"> <label for="ksDarkHideHistory">숨기기</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkhidehistory" class="inp_radio _friendListExposure" id="ksDarkNoHideHistory" value="false"> <label for="ksDarkNoHideHistory">숨기지 않기</label></div></div>※해당 기능을 사용하면 "과거의 오늘 있었던 추억들"이 보이지 않습니다.</dd>'
        + '<dt>이모티콘 크기</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarksticonsize" class="inp_radio _friendListExposure" id="ksDarkSticonSmall" value="small"> <label for="ksDarkSticonSmall">소(64px/84px)</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarksticonsize" class="inp_radio _friendListExposure" id="ksDarkSticonMiddle" value="middle"> <label for="ksDarkSticonMiddle">중(96px)</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarksticonsize" class="inp_radio _friendListExposure" id="ksDarkSticonBig" value="big"> <label for="ksDarkSticonBig">대(128px)</label></div></div>※소(64px/84px) 크기는 카카오스토리 기본 크기이며, 댓글과 글 내의 이모티콘 크기가 각각 다르게 표시됩니다.</dd>'
        + '<dt>동영상 다운로드</dt>'
        + '<dd><div class="option_msg"><div class="radio_inp"> <input type="radio" name="open_ksdarkdownloadvideo" class="inp_radio _friendListExposure" id="ksDarkDownloadEnable" value="enable"> <label for="ksDarkDownloadEnable">활성화</label></div><div class="radio_inp"> <input type="radio" name="open_ksdarkdownloadvideo" class="inp_radio _friendListExposure" id="ksDarkDownloadDisable" value="disable"> <label for="ksDarkDownloadDisable">비활성화</label></div></div>※해당 기능을 사용하여 발생하는 책임은 사용자에게 있습니다.<br>다운로드 하신 영상은 국내 저작권법에 의거, 저작자의 동의가 없는 한 개인소장만 가능합니다.</dd>'
        + '<dt>친구 목록 백업</dt>'
        + '<dd><div class="btn_area"><a href="#" class="btn_com btn_wh _changePasswd" style="background: #43b581 !important;" id="ksdarkBackupFriend"><em>텍스트 파일로 저장</em></a></div>※스크립트 특성상 다른 이름으로 링크 저장을 사용할 수 없습니다.</dd>'
        + '<dt>부가 기능</dt>'
        + '<dd><div class="btn_area"><a href="#" class="btn_com btn_wh _changePasswd" style="background: #43b581 !important;" id="ksdarkDeleteAllFriend"><em>친구 전체 삭제</em></a><a href="#" class="btn_com btn_wh _changePasswd" style="background: #43b581 !important; display: none;" id="ksdarkDeleteAllArticles"><em>게시글 전체 삭제</em></a></div>※시작하면 되돌릴 수 없으며 도중 취소를 원하면 새로고침해야 합니다.</dd>'
        //다크테마 정보 보여주기
        + '<dt>KakaoStory Enhanced 정보</dt>'
        + '<dd>Enhanced 버전: ' + versionString + '<br><div id="d_cssVersion">' + cssVersion + '</div>개발: <a href="/_jYmvy" data-id="_jYmvy" data-profile-popup="_jYmvy" style="color: #00b5ff" class="_decoratedProfile" data-kant-id="516">Reflection</a>, <a href="/ldc6974" data-id="ldc6974" data-profile-popup="ldc6974" style="color: #00b5ff" class="_decoratedProfile">박종우</a><br>도움주신 분들: <a href="/_2ZQlS7" data-id="_2ZQlS7" data-profile-popup="_2ZQlS7" style="color: #00b5ff" class="_decoratedProfile">AppleWebKit</a>, 사일<br><a href="/_jYmvy/IJRIyFQOVWA" data-id="_jYmvy" data-profile-popup="_jYmvy" style="color: #00b5ff" class="_decoratedProfile">\' Enhanced 정보</a></dd>'
          //Apply
        + '</dl>'
        + '<div class="inp_footer"><div class="bn_group"><a href="#" class="_cancelBtn btn_com btn_wh" id="ksdarkCancel"><em>취소</em></a> <a class="btn_com btn_or" id="ksdarkApplyCustom"><em>저장</em></a></div><div id="ksdarkSaveInfo">일부 설정은 새로고침 해야 반영됩니다.</div></div>'
        + '</div></div></div></div>'

    if (GM_getValue('ksDarkCustomFontName', '') == "Noto Sans KR") {
        document.getElementById("fontNoto").checked = true;
    } else if (GM_getValue('ksDarkCustomFontName', '') == "나눔고딕") {
        document.getElementById("fontNanum").checked = true;
    } else {
        document.getElementById("fontCustom").checked = true;
    }

    if (GM_getValue('ksDarkThemeType', '') == "darkred") {
        document.getElementById("ksDarkTypeRed").checked = true;
    } else if (GM_getValue('ksDarkThemeType', '') == "darkblue") {
        document.getElementById("ksDarkTypeBlue").checked = true;
    } else {
        document.getElementById("ksDarkTypeDiscord").checked = true;
    }

    if (GM_getValue('ksDarkSticonSize', '') == "small") {
        document.getElementById("ksDarkSticonSmall").checked = true;
    } else if (GM_getValue('ksDarkSticonSize', '') == "middle") {
        document.getElementById("ksDarkSticonMiddle").checked = true;
    } else {
        document.getElementById("ksDarkSticonBig").checked = true;
    }

    if (GM_getValue('ksDarkThemeStyle', '') == "#40444b") {
        document.getElementById("ksDarkThemeDark").checked = true;
    } else {
        document.getElementById("ksDarkThemeWhite").checked = true;
    }

    if (GM_getValue('ksDarkThemeStyleSystem', '') == 'true') {
        document.getElementById("ksDarkSystemTheme").checked = true;
    } else {
        document.getElementById("ksDarkSystemTheme").checked = false;
    }

    if (GM_getValue('ksDarkHideHistory', '') == 'true') {
        document.getElementById("ksDarkHideHistory").checked = true;
    } else {
        document.getElementById("ksDarkNoHideHistory").checked = true;
    }

    if (GM_getValue('ksDarkHideLogo', '') == "true") {
        document.getElementById("ksDarkHideLogo").checked = true;
    } else {
        document.getElementById("ksDarkNoHideLogo").checked = true;
    }

    if (GM_getValue('ksDarkMention', '') == "true") {
        document.getElementById("ksDarkMention").checked = true;
    } else {
        document.getElementById("ksDarkNoMention").checked = true;
    }

    if (GM_getValue('ksDarkKillTeller', '') == "T") {
        document.getElementById("ksDarkTellerKill").checked = true;
    } else {
        document.getElementById("ksDarkTellerNoKill").checked = true;
    }

    if (GM_getValue('ksDarkNotyUse', '') == "T") {
        document.getElementById("ksDarkNotyUse").checked = true;
    } else {
        document.getElementById("ksDarkNotyNotUse").checked = true;
    }

    if (GM_getValue('ksDarkNotySound', '') == "true") {
        document.getElementById("ksDarkNotyNoSound").checked = true;
    } else {
        document.getElementById("ksDarkNotySound").checked = true;
    }

    if (GM_getValue('ksDarkBan', '') == "true") {
        document.getElementById("ksDarkBan").checked = true;
    } else {
        document.getElementById("ksDarkNoBan").checked = true;
    }

    if (GM_getValue('ksDarkImageView', '') == "nothing") {
        document.getElementById("ksDarkDelImage").checked = true;
    } else if (GM_getValue('ksDarkImageView', '') == "hide") {
        document.getElementById("ksDarkHideImage").checked = true;
    } else {
        document.getElementById("ksDarkVisibleImage").checked = true;
    }

    if (GM_getValue('ksDarkDownloadVideo', '') == "enable") {
        document.getElementById("ksDarkDownloadEnable").checked = true;
    } else {
        document.getElementById("ksDarkDownloadDisable").checked = true;
    }

    $(document).on("change",'input[name="open_font1"]',function(){
        var fontName = $('[name="open_font1"]:checked').val();
        if (fontName == 'Custom') {
            fontName = GM_getValue('ksDarkCustomFontName', '');
        }
        GM_setValue('ksDarkCustomFontName', fontName);
        GM_addStyle ( "body, button, input, select, td, textarea, th {font-family: '" + fontName + "' !important;}" );
        document.getElementById("ksdark_font_css_name").value = fontName;
    });

    $(document).on("change",'input[name="open_ksdarkstyle1"]',function(){
        if (GM_getValue("ksDarkThemeStyleSystem", '') == 'false') {
            GM_setValue("ksDarkThemeStyle", $('[name="open_ksdarkstyle1"]:checked').val());
            changeTheme();
        }
    });

    $(document).on("change",'input[name="ksdarkusesystemtheme"]',function(){
        if (document.getElementById("ksDarkSystemTheme").checked) {
            GM_setValue("ksDarkThemeStyleSystem", 'true');
            var systemTheme = isSystemDark();
            var nowTheme = GM_getValue('ksDarkThemeStyle', '');
            if (systemTheme != nowTheme) {
                GM_setValue('ksDarkThemeStyle', systemTheme);
                changeTheme();
            }
        } else {
            GM_setValue("ksDarkThemeStyleSystem", 'false');

        }
    });

    $(document).on("change",'input[name="open_ksdarknoty"]',function(){
        GM_setValue("ksDarkNotyUse", $('[name="open_ksdarknoty"]:checked').val());
    });

    $(document).on("change",'input[name="open_ksdarkType"]',function(){
        GM_setValue("ksDarkThemeType", $('[name="open_ksdarkType"]:checked').val());
        loadThemeColor(loadValue('ksDarkThemeType', 'discord'));
    });

    $(document).on("change",'input[name="open_ksdarkhidelogo"]',function(){
        GM_setValue("ksDarkHideLogo", $('[name="open_ksdarkhidelogo"]:checked').val());
    });

    $(document).on("change",'input[name="open_ksdarkhidehistory"]',function(){
        GM_setValue("ksDarkHideHistory", $('[name="open_ksdarkhidehistory"]:checked').val());
    });

    $(document).on("change",'input[name="open_ksdarktellerkill"]',function(){
        GM_setValue("ksDarkKillTeller", $('[name="open_ksdarktellerkill"]:checked').val());
        if (loadValue('ksDarkKillTeller', 'T') == 'T') {
            killTellerChannel('none');
        } else {
            killTellerChannel('block');
        }
    });

    $(document).on("change",'input[name="open_ksdarkmention"]',function(){
        GM_setValue("ksDarkMention", $('[name="open_ksdarkmention"]:checked').val());
    });

    $(document).on("change",'input[name="open_ksdarknotysound"]',function(){
        GM_setValue("ksDarkNotySound", $('[name="open_ksdarknotysound"]:checked').val());
    });

    $(document).on("change",'input[name="open_ksdarkban"]',function(){
        GM_setValue("ksDarkBan", $('[name="open_ksdarkban"]:checked').val());
    });

    $(document).on("change",'input[name="open_ksdarkhideimage"]',function(){
        GM_setValue("ksDarkImageView", $('[name="open_ksdarkhideimage"]:checked').val());
    });

    $(document).on("change",'input[name="open_ksdarkdownloadvideo"]',function(){
        GM_setValue("ksDarkDownloadVideo", $('[name="open_ksdarkdownloadvideo"]:checked').val());
    });

    $(document).on("change",'input[name="open_ksdarksticonsize"]',function(){
        GM_setValue("ksDarkSticonSize", $('[name="open_ksdarksticonsize"]:checked').val());
        setSticonSize();
    });

    $('body').on('click', '#ksdarkBackupFriend', function() {
        saveFriends();
    });

    $('body').on('click', '#ksdarkDeleteAllFriend', function() {
        deleteFriendsConfirm();
    });

    $('body').on('click', '#ksdarkDeleteAllArticles', function() {
        deleteArticlesConfirm();
    });

    $('body').on('click', '#ksdarkStringKill', function() {
        killBanString();
    });

    $('body').on('click', '#ksdarkApplyCustom', function() {
        GM_setValue('ksDarkCustomFontName', document.getElementById("ksdark_font_css_name").value);
        GM_setValue('ksDarkCustomFontCss', document.getElementById("ksdark_font_css_url").value);
        GM_setValue('ksDarkFontSize', document.getElementById("ksdark_font_size_add").value);
        GM_setValue('ksDarkNotyTime', document.getElementById("ksdark_notytime").value);
        GM_addStyle("@import url(" + GM_getValue('ksDarkCustomFontCss', '') + ")");
        GM_addStyle ( "body, button, input, select, td, textarea, th {font-family: " + GM_getValue('ksDarkCustomFontName', '') + " !important;}" );
        setFontSize();
        document.getElementById("enhancedLayer").style.display = 'none';
        enableScroll();
    });

    $('body').on('click', '#ksdarkCancel', function() {
        document.getElementById("enhancedLayer").style.display = 'none';
        enableScroll();
    });
}

function changeTheme() {
    if (loadValue('ksDarkThemeStyle', '#40444b') == '#40444b') {
        changeDark();

    } else {
        changeLight();

    }
}

function changeDark() {
    loadDarkTheme();
    GM_setValue('ksDarkThemeStyle', '#40444b');
    GM_addStyle('._ksdark_cls { background-color: ' + loadValue('ksDarkThemeStyle', '#40444b')+ ' !important; }');
}

function changeLight() {
    $('style').remove();
    setFontSize();
    loadSettingsV2();
    GM_setValue('ksDarkThemeStyle', '#ffffff');
    GM_addStyle('.head_story .tit_kakaostory .link_kakaostory { background: url(\'https://raw.githubusercontent.com/reflection1921/KakaoStory-DarkTheme/master/logo_kseh.png\'); } ');
    GM_addStyle('._ksdark_cls { background-color: ' + loadValue('ksDarkThemeStyle', '#40444b')+ ' !important; }');
}

function setNotify(content, title_, url) {
    GM_notification ({
        text: content,
        title: title_,
        image: 'https://i.imgur.com/FSvg18g.png',
        highlight: false,
        silent: (GM_getValue('ksDarkNotySound', '') === 'true'),
        timeout: 5000,
        onclick: function () {
            space.Router.navigate("/" + url);
        }
    });
}

//최신 알림 받아오기
function getLatestNotify() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonNoty = JSON.parse(xmlHttp.responseText);
            var notyID = jsonNoty[0]["id"];
            var notyMessage = jsonNoty[0]["message"];
            var notyScheme = jsonNoty[0]["scheme"];
            var notyContent = jsonNoty[0]["content"];
            var tmpNotyURL = String(notyScheme).split("/");
            var notyURL = tmpNotyURL[tmpNotyURL.length-1].replace(".", "/");
            //console.log(notyURL);
            if (String(notyID) == GM_getValue('latestNotyID', '')) {
            } else {
                GM_setValue('latestNotyID', String(notyID));
                if (String(jsonNoty[0]["is_new"]) == 'false') {
                    return;
                }
                //console.log((GM_getValue('ksDarkNotySound', '') === 'true'));
                if (notyContent == undefined) {
                    notyContent = ' ';
                }
                setNotify(String(notyContent), String(notyMessage), String(notyURL));
            }
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/notifications");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

//폰트 사이즈 변경


function getCSSVersion() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            cssVersion = xmlHttp.responseText;
            document.getElementById('d_cssVersion').innerText = "CSS 업데이트 일자: " + cssVersion;
        }
    }
    xmlHttp.open("GET", "https://raw.githubusercontent.com/reflection1921/KakaoStory-DarkTheme/master/css_version");
    xmlHttp.send();

}

function viewUpdate() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var filter = xmlHttp.responseText;
            var updateNotice = document.createElement('div');
            updateNotice.id = 'updateNoticeLayer';
            updateNotice.className = 'cover _cover';
            updateNotice.style.cssText = 'overflow-y: scroll;';
            document.body.appendChild(updateNotice);
            document.getElementById('updateNoticeLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="write cover_content cover_center" data-kant-group="wrt" data-part-name="view"><div class="_layerWrapper layer_write"><div class="section _dropZone account_modify"><div class="writing"><div class="inp_contents" data-part-name="editor"><strong class="subtit_modify subtit_enhanced">\' Enhanced 업데이트 내역</strong><div style="word-break: break-all">' + filter + '</div></div></div><div></div><div class="inp_footer"><div class="bn_group"> <a href="#" class="_postBtn btn_com btn_or" id="ksdarkUpdateNoticeOK"><em>알겠어용</em></a></div></div></div></div><div></div></div></div>';
            disableScroll();
            $('body').on('click', '#ksdarkUpdateNoticeOK', function() {
                document.getElementById("updateNoticeLayer").style.display = 'none';
                enableScroll();
            });
        }
    }
    xmlHttp.open("GET", "https://raw.githubusercontent.com/reflection1921/KakaoStory-DarkTheme/master/update_notice_new2.html");
    xmlHttp.send();

}

$(document).ready(function(){
    //차단 시 밴 리스트에 추가함
    $(document).on('click', 'a[data-kant-id="1391"]', function(){
        $(document).on('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]', function(){
            var splittedURL = $(location).attr('href').split('/');
            var bannedUserID = splittedURL[splittedURL.length - 1];
            banList.add(bannedUserID);
            $(document).off('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]');
        });
    });
    //차단 해제 시 밴 리스트에서 삭제함
    $(document).on('click', 'a[data-kant-id="1392"]', function(){
        var splittedURL = $(location).attr('href').split('/');
        var bannedUserID = splittedURL[splittedURL.length - 1];
        banList.delete(bannedUserID);
        $(document).off('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]');
    });
    //설정 창에서 차단 해제 시 밴 리스트에서 삭제함
    $(document).on('click', 'a[data-kant-id="845"]', function() {
        var userIdx = $('a[data-kant-id="845"]').index(this);
        var userID = $('a[data-kant-id="844"]').eq(userIdx).parent().attr('data-model');
        banList.delete(userID);
    });

    $(document).on('click', 'a[data-kant-id="119"]', function(e) {
        e.target.parentNode.parentNode.getElementsByClassName("txt_wrap")[0].getElementsByClassName("_content")[0].style.cssText = "height: -1;";
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (loadValue('ksDarkThemeStyleSystem', 'false') == 'true') {
            var systemColor = e.matches ? changeDark() : changeLight();
        }
    });

    GM_addStyle("@keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }");
    GM_addStyle(".shake_text { animation: shake 0.5s; animation-iteration-count: infinite; }");

    document.addEventListener('keydown', function(e) {
        if (e.keyCode == konami[konamiCount]) {
            konamiCount++;
            if (konamiCount >= 10) {
                konamiCount = 0;
                shakeEaster = (shakeEaster ? false : true);
            }
        } else {
            konamiCount = 0;
        }
    });

    $(document).on('keydown', '._editable', function(e) {
        if (shakeEaster == true) {
            $('div[data-part-name="writing"]').addClass("shake_text");
        }

    });

    $(document).on('keyup', '._editable', function() {
        $('div[data-part-name="writing"]').removeClass("shake_text");
    });

    /*친구 전체 삭제 관련 이벤트*/
    $('body').on('click', '#deleteFriendComplete', function() {
        document.getElementById("deleteCountLayer").remove();
    });

    $('body').on('click', '#deleteFriendConfirmCloseA', function() {
        document.getElementById("deleteLayer").remove();
    });

    $('body').on('click', '#deleteFriendConfirmOK', function() {
        document.getElementById("deleteLayer").remove();
        loadForDeleteFriends();
    });

    $('body').on('click', '#deleteArticlesConfirmCloseA', function() {
        document.getElementById("deleteLayer").remove();
    });

    $('body').on('click', '#deleteArticlesConfirmOK', function() {
        document.getElementById("deleteLayer").remove();
        //loadForDeleteFriends();
    });

    $('body').on('click', '#closeBanString', function() {
        document.getElementById("banStringLayer").remove();
    });

    $('body').on('click', '#ksdarkSaveBanString', function() {
        var banStrings = document.getElementById("textbanstring").value;
        GM_setValue('ksdarkBanString', banStrings);
        loadBanStringArray();
        document.getElementById("banStringLayer").remove();
    });

    //글쓰기 버그 수정용
    $('body').on('keydown', '#contents_write', function() {
        //console.log(document.getElementById("contents_write").innerText);
        var str = document.getElementById("contents_write").innerText;
         if (str.charAt(str.length - 1) != "\n") {
             //console.log("New Line!");
             document.getElementById("contents_write").innerHTML += "<br><br>";
         }
    });

});


//파비콘, 타이틀 네이버로 변경
function hideLogo() {
    document.getElementsByTagName('title')[0].innerText = "NAVER"
    var link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = 'https://raw.githubusercontent.com/reflection1921/KakaoStory-DarkTheme/master/naver_favi.ico';
}


function addEnhancedMenu() {
    document.getElementsByClassName("menu_util")[0].innerHTML = '<li><a href="#" id="ksdarkEnhancedOpen" class="link_menu _btnSettingProfile">Enhanced 설정</a></li>' + document.getElementsByClassName("menu_util")[0].innerHTML;
    $('body').on('click', '#ksdarkEnhancedOpen', function() {
        document.getElementById("enhancedLayer").style.display = 'block';
        $('html,body').scrollTop(0);
        disableScroll();
    });
}


function enableScroll() {
    window.onscroll = function() {};
}

function disableScroll() {
    window.onscroll = function() {
        window.scrollTo(0, 0);
    };
}

function loadSettingsV2() {
    GM_addStyle ( "@import url(//fonts.googleapis.com/earlyaccess/notosanskr.css);" );
    GM_addStyle ("@import url(" + loadValue('ksDarkCustomFontCss', 'https://fonts.googleapis.com/css2?family=Gaegu&display=swap') + ");");
    GM_addStyle ( "body, button, input, select, td, textarea, th {font-family: '" + loadValue('ksDarkCustomFontName', 'Noto Sans KR') + "' !important;}" );

    if (loadValue('ksDarkHideLogo', 'false') == 'true') {
        GM_addStyle('.head_story .tit_kakaostory .link_kakaostory { width: 60px !important; }');
        GM_addStyle('.kakao_search { margin-left: 40px !important; }');
        GM_addStyle('.head_story .tit_kakaostory .link_kakaostory  { background: rgba(0,0,0,0) !important; }');
        GM_addStyle('.head_story .tit_kakaostory { width: 60px !important; }');
    } else {
        GM_addStyle('.head_story .tit_kakaostory .link_kakaostory { width: 144px !important; }');
    }

    var imageStatus = loadValue('ksDarkImageView', 'view');
    if (imageStatus == 'nothing') {
        //GM_addStyle('.fd_cont .img_wrap { display: none !important; }');
        //GM_addStyle('.wrap_swipe { display: none !important; }');
        //GM_addStyle('.fd_cont .movie_wrap { display: none !important; }');
    } else if (imageStatus == 'hide') {
        GM_addStyle('.fd_cont .img_wrap .img { filter: blur(150px) !important; }');
        GM_addStyle('.wrap_swipe .link_swipe { filter: blur(150px) !important; }');
        GM_addStyle('.fd_cont .movie_wrap.v2 .img_movie { filter: blur(150px) !important; }');
        GM_addStyle('.fd_cont .movie_wrap .img_movie { filter: blur(150px) !important; }');
    }

    GM_addStyle('.head_story .tit_kakaostory .logo_kakaostory { width: 0px !important; }');
    GM_addStyle('.head_story .tit_kakaostory .link_kakaostory { height: 27px !important; }');
    GM_addStyle('._ksdark_cls { background-color: ' + loadValue('ksDarkThemeStyle', '#40444b')+ ' !important; }');
}

function getMyID() {
    var tmpMyID = $('a[data-kant-id="737"]').attr('href').substring(1);
    if (tmpMyID.charAt(0) == '_') {
        myID = tmpMyID;
    } else {
        getMySID(tmpMyID);
    }
}

function getMySID(val) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonProf = JSON.parse(xmlHttp.responseText);
            if (jsonProf.activities.length == 0) {
                myID = '';
            } else {
                var tmpID = jsonProf.activities[0].id;
                myID = tmpID.split(".")[0];
            }
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/profiles/" + val + "?with=activities");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function highlightComment() {
    var comments = document.getElementsByClassName("_commentContent");
    for (var i = 0; i < comments.length; i++) {
        var tmpComment = comments[i].getElementsByClassName("txt")[0].getElementsByClassName("_decoratedProfile");
        for ( var j = 0; j < tmpComment.length; j++) {
            var tmpUserID = tmpComment[j].getAttribute("data-id");
            if (myID == tmpUserID) {
                tmpComment[j].style.cssText = "background-color:rgba(0,0,0,0) !important;";
                comments[i].parentElement.style.cssText = 'background-color: rgba(250,166,26,0.1); border-left: 5px solid #f6a820; padding-left: 4px;';
            }
        }
        //console.log(tmpUserID);
    }
}

function strToHTML() {
    var articles = document.getElementsByClassName("fd_cont _contentWrapper");
    //console.log(articles.length);
    for (var i = 0; i < articles.length; i++) {
        var htmlStr = articles[i].getElementsByClassName("txt_wrap")[0].getElementsByClassName("_content")[0].textContent;
        //console.log(htmlStr.substring(15).toUpperCase());
        if (htmlStr.substring(0, 15).toUpperCase() == '<!DOCTYPE HTML>') {
            document.getElementsByClassName("fd_cont _contentWrapper")[i].getElementsByClassName("txt_wrap")[0].getElementsByClassName("_content")[0].innerHTML = htmlStr.substring(15);
        }
    }
}

function detailViewNotFriend() {
    var detail = document.getElementsByClassName("_btnViewDetailInShare");
    for (var i = 0; i < detail.length; i++) {
        detail[i].href = "javascript:space.Router.navigate('https://story.kakao.com/')";
        detail[i].className = "time _btnViewDetailInSharX";
    }
}

function addDownloadVideo() {
    var videoControl = document.getElementsByClassName("mejs-controls");
    for (var i = 0; i < videoControl.length; i++) {
        var checkDownExists = videoControl[i].getElementsByClassName("mejs-button mejs-videodown-button");
        //console.log(checkDownExists.length);
        if (checkDownExists.length == 0) {
            var videourl = videoControl[i].parentElement.getElementsByClassName("mejs-mediaelement")[0].getElementsByClassName("mejs-kakao")[0].getAttribute("src");
            //videourl = replaceAll(videourl, "m2.mp4", "m1.mp4");
            var downloadElement = document.createElement('div');
            downloadElement.id = 'videodown';
            downloadElement.className = 'mejs-button mejs-videodown-button';
            videoControl[i].appendChild(downloadElement);
            videoControl[i].getElementsByClassName("mejs-button mejs-videodown-button")[0].innerHTML = '<button type="button" aria-controls="mep_2" title="Download" onclick="window.open(\'' + videourl + '\')" aria-label="Download"></button>';
        }
    }
}

(function() {

    


    

    
    
    
    addCustomFontSetting();
    getCSSVersion();
    
    setSticonSize();
    //업데이트 내역 표시
    if (GM_getValue("ksDarkVersion", '') !== versionString) {
        viewUpdate();
        GM_setValue('ksDarkVersion', versionString);
    }

    loadSettingsV2();

    if (loadValue('ksDarkKillTeller', 'T') == 'T') {
        setTimeout(() => killTellerChannel('none'), 1000);
    }

    setTimeout(() => addEnhancedMenu(), 1000);

    setTimeout(() => getMyID(), 3000);

    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button { top: -42px !important; } ");
    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button { left: 14px !important; } ");
    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button { width: 42px !important; } ");
    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button { height: 42px !important; } ");
    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button button { width: 18px !important; }");
    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button button { height: 18px !important; }");
    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button button { background: url(https://raw.githubusercontent.com/reflection1921/KakaoStory-DarkTheme/master/btn_download.png) !important; }");
    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button button { margin: 10px 6px !important; }");
    GM_addStyle(".mejs-container.mejs-kakao .mejs-controls .mejs-videodown-button button { padding: 0 !important; }");

    setInterval(function() {
         if (GM_getValue('ksDarkNotyUse', '') == "T") {
             notyTimeCount += 1;
             if (notyTimeCount >= parseInt(GM_getValue('ksDarkNotyTime', '')) * 10) {
                 notyTimeCount = 0;
                 getLatestNotify();
             }
         }
        if (GM_getValue('ksDarkBan', '') == "true") {
            hideBannedUserComment();
            hideBannedStringComment();
        }

        hideRecommendFeed();
        //strToHTML();
        //detailViewNotFriend();

        if (GM_getValue('ksDarkMention', '') == 'true') {
            highlightComment();
        }

        if (GM_getValue('ksDarkDownloadVideo', '') == 'enable') {
            addDownloadVideo();
        }

        if (GM_getValue('ksDarkHideHistory', 'false') == 'true') {
            hideOldHistory();
        }

        //addTextNewLine();

        if (currentPage != location.href) {
            currentPage = location.href;
            var url_parts = currentPage.split("/");
            var url_last_part = url_parts[url_parts.length-1];
            if (GM_getValue('ksDarkHideLogo', '') == 'true') {
                setTimeout(() => hideLogo(), 750);
            }
            //setTimeout(() => addCustomFontSetting(), 750);
            //setTimeout(() => changeFontSize(), 5000);
        }
    }, 100);
})();



//Restart here



//GM_getValue, GM_setValue for Chrome
function GM_getValue(key, def) {
    return localStorage[key] || def;
}

function GM_setValue(key, value) {
    return localStorage[key]=value;
}

// Load setting value with valueID.
// If value is not exist, set setting value to default.
function loadValue(valueID, defaultValue) {
    if (GM_getValue(valueID, '') == "") {
        GM_setValue(valueID, defaultValue);
    }
    return GM_getValue(valueID, '');
}

// Get CSS version data
function getCSSVersion() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            cssVersion = xmlHttp.responseText;
            document.getElementById('d_cssVersion').innerText = "CSS 업데이트 일자: " + cssVersion;
        }
    }
    xmlHttp.open("GET", "https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/css_version.txt");
    xmlHttp.send();
}

// Check if system theme is dark.
function isSystemDark() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return '#40444b';
    } else {
        return '#ffffff';
    }
}

// Load dark theme css.
function loadDarkTheme() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var filter = xmlHttp.responseText;
            GM_addStyle ( filter );
        }
    }
    xmlHttp.open("GET", "https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/css/darktheme.css");
    xmlHttp.send();
}

// Load dark theme color css.
function loadThemeColor(typename) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var lines = xmlHttp.responseText.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var variableName = lines[i].split(":")[0];
                var variableValue = lines[i].split(": ")[1].split(";")[0];
                document.documentElement.style.setProperty(variableName, variableValue);
            }
        }
    }
    xmlHttp.open("GET", "https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/css/" + typename + ".txt");
    xmlHttp.send();
}

// Set font size.
function setFontSize() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var lines = xmlHttp.responseText.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var originSize = lines[i].split("font-size: ")[1].split("px")[0];
                var modifiedCSS = lines[i].replace( originSize , parseInt(parseInt(originSize) + parseInt(GM_getValue('ksDarkFontSize', ''))))
                GM_addStyle ( modifiedCSS );
            }
        }
    }
    xmlHttp.open("GET", "https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/css/font_size.css");
    xmlHttp.send();
}

// Initialize notification.(Get latest notification ID.)
function initializeNotify() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonNoty = JSON.parse(xmlHttp.responseText);
            GM_setValue('latestNotyID', String(jsonNoty[0]["id"]));
            //setNotify(String(notyContent), String(notyMessage), String(notyID));
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/notifications");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

// Get blocked user list.
function getBlockedUsers() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonNoty = JSON.parse(xmlHttp.responseText);
            //bannedUserIDArr = new Array(jsonNoty.length);
            for (var i = 0; i < jsonNoty.length; i ++) {
                banList.add(String(jsonNoty[i]["id"]));
            }
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/bans");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

// Set css for Enhanced settings page.
function loadEnhancedCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var filter = xmlHttp.responseText
            GM_addStyle ( filter );
        }
    }
    xmlHttp.open("GET", "https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/css/enhanced.css");
    xmlHttp.send();
}

// Load ban string from saved setting value.
function loadBanStringArray() {
    var banStrings = GM_getValue('ksdarkBanString', '').split("\n");
    var banStringList = new Set();
    for (var i = 0; i < banStrings.length; i++) {
        if (banStrings[i] == "") { //Skip empty string.
            continue;
        } else {
            banStringList.add(banStrings[i]);
       }
    }
    banStringArr = Array.from(banStringList);
}

// Set sticon size.
function setSticonSize() {
    var size = loadValue('ksDarkSticonSize', 'small');
    if (size == 'small') {
        GM_addStyle('.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 64px !important; height: 64px !important; }');
        GM_addStyle('.fd_cont .txt_wrap .kakao_emoticon { width: 84px !important; height: 84px !important; }');
    } else if (size == 'middle') {
        GM_addStyle('.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 96px !important; height: 96px !important; }');
        GM_addStyle('.fd_cont .txt_wrap .kakao_emoticon { width: 96px !important; height: 96px !important; }');
    } else {
        GM_addStyle('.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 128px !important; height: 128px !important; }');
        GM_addStyle('.fd_cont .txt_wrap .kakao_emoticon { width: 128px !important; height: 128px !important; }');
    }
}

// Main code.
(function() {
    loadValue('ksDarkFontSize', '0');
    loadValue('ksDarkNotyTime', '20');
    loadValue('ksDarkNotySound', true);
    loadValue('ksDarkBan', false);
    loadValue('ksDarkMention', false);
    loadValue('ksDarkDownloadVideo', 'disable');

    if (loadValue('ksDarkThemeStyleSystem', true)) {
        GM_setValue('ksDarkThemeStyle', isSystemDark());
    }

    if (loadValue('ksDarkThemeStyle', '#40444b') == '#40444b') {
        loadDarkTheme();
        loadThemeColor(loadValue('ksDarkThemeType', 'discord'));
    } else {
        GM_addStyle('.head_story .tit_kakaostory .link_kakaostory { background: url(\'https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/images/logo_kseh.png\'); } ');
    }

    loadValue('ksDarkNotyUse', true);

    setFontSize();
    initializeNotify();
    getBlockedUsers();
    loadEnhancedCSS();
    loadBanStringArray();
    setSticonSize();
    getCSSVersion();

})();