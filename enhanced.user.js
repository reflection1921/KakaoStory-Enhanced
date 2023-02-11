// ==UserScript==
// @name         KakaoStory Enhanced
// @namespace    http://chihaya.kr
// @version      1.11
// @description  Add-on for KakaoStory
// @author       Reflection, 박종우
// @match        https://story.kakao.com/*
// @icon         https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/story_favicon.ico
// @downloadURL  https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/enhanced.user.js
// @updateURL    https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/enhanced.user.js
// ==/UserScript==

/*
 * Settings Parameters
 * enhancedSystemTheme : OS에 적용된 시스템 테마 사용 여부
 * enhancedSelectTheme : 선택한 테마(Light, Dark)
 * enhancedDarkThemeStyle : 다크 테마의 스타일(Discord, Dark Blue, Dark Red)
 * enhancedDiscordMention : 디스코드 멘션 스타일의 언급 UI 사용 여부
 * enhancedFontName : 설정된 폰트명
 * enhancedFontCSS : 설정된 폰트 CSS URL
 * enhancedFontSize : 설정된 폰트 크기
 * enhancedNotify : 알림 사용 여부
 * enhancedNotifySound : 알림 사운드 켜기 / 끄기
 * enhancedNotifyTime : 알림 시간
 * enhancedDownloadVideo : 동영상 다운로드 여부
 * enhancedHideChannelButton : 텔러/채널 버튼 숨기기
 * enhancedHideMemorize : 흑역사 숨기기
 * enhancedEmoticonSize : 이모티콘 크기
 * enhancedBlockUser : 강화된 차단 사용
 * enhancedVersion : 버전 정보
 * enhancedBlockStringList : 차단 문자열 리스트
 * enhancedKittyMode : Kitty Mode(verycute: sound + kitty, cute: kitty, none: 적용안함)
 * enhancedLatestNotyID : 알림 마지막 ID(여러 개 창에서 중복 알림 발생 방지)
 * enhancedHideRecommendFriend : 추천친구 숨기기
 * enhancedHideLogo : 로고 숨기기(네이버)
 * enhancedEarthquake : EARTHQUAKE!!!
 * enhancedBlink : BLINK!!!
 * enhancedBlockArticleAll : 강화된 차단의 공유글 전체 보이기 / 숨기기(현재 지원안함. 추후 지원 예정.)
 */


let scriptVersion = "1.11";

//let resourceURL = 'http://127.0.0.1:8188/kakaostory-enhanced/'; //for debug
//let resourceURL = 'https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/dev/'; //github dev
let resourceURL = 'https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/';
let myID = ''; //for discord mention style feature
//let latestNotyID = ''; //for notification feature
let notyTimeCount = 0; //for notification feature
let blockedList = new Set(); //block users
let blockedStringList = new Array(); //block strings
let catEffect = new Audio(resourceURL + 'sounds/cat-meow.mp3');
let jThemes;

let powerComboCnt = 0;
let powerComboTimeCnt = 0;

let deletedFriendCount = 0;
let jsonMyFriends;

function AddEnhancedMenu() {
    document.getElementsByClassName("menu_util")[0].innerHTML = '<li><a href="#" id="enhancedOpenSettings" class="link_menu _btnSettingProfile">Enhanced 설정</a></li>' + document.getElementsByClassName("menu_util")[0].innerHTML;
    $('body').on('click', '#enhancedOpenSettings', function() {
        document.getElementById("enhancedLayer").style.display = 'block';
        $('html,body').scrollTop(0);
        DisableScroll();
    });
}

function EnableScroll() {
    window.onscroll = function() {};
}

function DisableScroll() {
    window.onscroll = function() {
        window.scrollTo(0, 0);
    };
}

function GetMyID() {
    var tmpMyID = $('a[data-kant-id="737"]').attr('href').substring(1);
    if (tmpMyID.charAt(0) == '_') {
        myID = tmpMyID;
    } else {
        GetMySID(tmpMyID);
    }
}

function GetMySID(val) {
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

function HighlightCommentLikeDiscord() {
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
    }
}

// Settings Page
function InitEnhancedSettingsPage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var html = xmlHttp.responseText;

            AttachEnhancedSettingsPage(html);
            InitEnhancedValues();
            LoadSettingsPageEvents();
        }
    }
    xmlHttp.open("GET", resourceURL + "enhanced_settings.html");
    xmlHttp.send();
}

function AttachEnhancedSettingsPage(html)
{
    var settings = document.createElement('div');
    settings.id = 'enhancedLayer';
    settings.className = 'cover _cover';
    settings.style.cssText = 'display: none;  overflow-y: scroll;';
    document.body.appendChild(settings);
    document.getElementById('enhancedLayer').innerHTML = html;
}

function InitEnhancedValues()
{
    var selectedTheme = GetValue('enhancedSelectTheme', 'dark');
    $('input:radio[name="enhancedSelectTheme"]:input[value=' + selectedTheme + ']').attr("checked", true);
    ChangeTheme(selectedTheme);

    LoadThemeList();

    var useDiscordMention = GetValue('enhancedDiscordMention', 'false');
    $('input:radio[name="enhancedSelectDiscordMention"]:input[value=' + useDiscordMention + ']').attr("checked", true);

    if (GetValue('enhancedSystemTheme', 'true') == 'true'){
        document.getElementById('enhancedSystemTheme').checked = true;
    }
    else
    {
        document.getElementById('enhancedSystemTheme').checked = false;
    }

    var fontName = GetValue('enhancedFontName', 'Noto Sans KR');
    document.getElementById("enhancedTxtFontName").value = fontName;
    document.getElementById("enhancedTxtFontCSS").value = GetValue('enhancedFontCSS', 'https://fonts.googleapis.com/earlyaccess/notosanskr.css');
    SetFont();

    if (fontName == 'Noto Sans KR')
    {
        document.getElementById("enhancedFontNoto").checked = true;
    }
    else if (fontName == '나눔고딕')
    {
        document.getElementById("enhancedFontNanum").checked = true;
    }
    else
    {
        document.getElementById("enhancedFontCustom").checked = true;
    }

    document.getElementById('enhancedTxtFontSize').value = GetValue('enhancedFontSize', '0');
    SetFontSize();

    var notifyEnabled = GetValue('enhancedNotify', 'false');
    $('input:radio[name="enhancedSelectNotifyUse"]:input[value=' + notifyEnabled + ']').attr("checked", true);

    var notifySoundEnabled = GetValue('enhancedNotifySound', 'true');
    $('input:radio[name="enhancedSelectNotifySoundUse"]:input[value=' + notifySoundEnabled + ']').attr("checked", true);

    document.getElementById('enhancedTxtNotifyTime').value = GetValue('enhancedNotifyTime', '20');

    var downloadVideoEnabled = GetValue('enhancedDownloadVideo', 'false');
    $('input:radio[name="enhancedSelectDownloadVideo"]:input[value=' + downloadVideoEnabled + ']').attr("checked", true);

    var isHidden = GetValue('enhancedHideChannelButton', 'true');
    $('input:radio[name="enhancedSelectHideChannelButton"]:input[value=' + isHidden + ']').attr("checked", true);

    var isHiddenLogo = GetValue('enhancedHideLogo', 'false');
    $('input:radio[name="enhancedSelectHideLogo"]:input[value=' + isHiddenLogo + ']').attr("checked", true);

    var isHiddenMemorize = GetValue('enhancedHideMemorize', 'true');
    $('input:radio[name="enhnacnedSelectHideMemorize"]:input[value=' + isHiddenMemorize + ']').attr("checked", true);

    var isHiddenRecommendFriend = GetValue('enhancedHideRecommendFriend', 'false');
    $('input:radio[name="enhancedSelectRecommendFriend"]:input[value=' + isHiddenRecommendFriend + ']').attr("checked", true);

    var size = GetValue('enhancedEmoticonSize', 'small');
    $('input:radio[name="enhancedSelectEmoticonSize"]:input[value=' + size + ']').attr("checked", true);
    SetEmoticonSize();

    var isEnhancedBlock = GetValue('enhancedBlockUser', 'true');
    $('input:radio[name="enhancedSelectBlockUser"]:input[value=' + isEnhancedBlock + ']').attr("checked", true);

    var isKitty = GetValue('enhancedKittyMode', 'none');
    $('input:radio[name="enhancedSelectKittyMode"]:input[value=' + isKitty + ']').attr("checked", true);

    var isEarthquake = GetValue('enhancedEarthquake', 'false');
    $('input:radio[name="enhancedSelectEarthquake"]:input[value=' + isEarthquake + ']').attr("checked", true);

    var isBlink = GetValue('enhancedBlink', 'false');
    $('input:radio[name="enhancedSelectBlink"]:input[value=' + isBlink + ']').attr("checked", true);

    var isBlockAllArticle = GetValue('enhancedBlockArticleAll', 'true');
    $('input:radio[name="enhancedSelectBlockArticleAll"]:input[value=' + isBlockAllArticle + ']').attr("checked", true);

    

    // old check
    // if (latestVersion != GetValue('enhancedVersion', ''))
    // {
    //     ViewUpdatePage();
    //     SetValue('enhancedVersion', version);
    // }

    document.getElementById('enhancedCurrentVersion').innerText = "현재버전: " + scriptVersion;

    GetCSSVersion();
    GetLatestVersion();

    CreateBlockStringList();
}

function RemoveRecommendFeed() {
    var recommendFeed = document.getElementsByClassName("section recommend");
    for (var i = 0; i < recommendFeed.length; i++) {
        recommendFeed[i].remove();
    }
}

function CloseSettingsPage()
{
    document.getElementById("enhancedLayer").style.display = 'none';
    EnableScroll();
}

function GetCSSVersion() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var cssVersion = xmlHttp.responseText;
            document.getElementById('enhancedCSSVersion').innerText = cssVersion;
        }
    }
    xmlHttp.open("GET", resourceURL + "versions/css_version.txt");
    xmlHttp.send();
}

function GetLatestVersion() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var scriptData = xmlHttp.responseText;
            var latestVersion = scriptData.split("// @version      ")[1].split("\n")[0];
            document.getElementById('enhancedLatestVersion').innerText = "최신버전: " + latestVersion;
            //Update
            var majorLatestVersion = latestVersion.split(".")[0];
            majorLatestVersion = Number(majorLatestVersion);
            var minorLatestVersion = latestVersion.split(".")[1];
            minorLatestVersion = Number(minorLatestVersion);

            var majorScriptVersion = scriptVersion.split(".")[0];
            majorScriptVersion = Number(majorScriptVersion);

            var minorScriptVersion = scriptVersion.split(".")[1];
            minorScriptVersion = Number(minorScriptVersion);

            if (majorLatestVersion > majorScriptVersion || (majorLatestVersion == majorScriptVersion && minorLatestVersion > minorScriptVersion))
            {
                ViewUpdatePage();
            }
        }
    }
    xmlHttp.open("GET", resourceURL + "enhanced.user.js");
    xmlHttp.send();
}

function ViewUpdatePage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var updatehtml = xmlHttp.responseText;
            var updateNotice = document.createElement('div');
            updateNotice.id = 'updateNoticeLayer';
            updateNotice.className = 'cover _cover';
            updateNotice.style.cssText = 'overflow-y: scroll;';
            document.body.appendChild(updateNotice);
            document.getElementById('updateNoticeLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="write cover_content cover_center" data-kant-group="wrt" data-part-name="view"><div class="_layerWrapper layer_write"><div class="section _dropZone account_modify"><div class="writing"><div class="inp_contents" data-part-name="editor"><strong class="subtit_modify subtit_enhanced">\' Enhanced 업데이트 내역</strong><div style="word-break: break-all">' + updatehtml + '</div></div></div><div></div><div class="inp_footer"><div class="bn_group"> <a href="https://github.com/reflection1921/KakaoStory-Enhanced/raw/main/enhanced.user.js" class="_postBtn btn_com btn_or" id="enhancedUpdateNoticeOK"><em>업데이트</em></a></div></div></div></div><div></div></div></div>';
            DisableScroll();
        }
    }
    xmlHttp.open("GET", resourceURL + "update_notice/update_notice.html");
    xmlHttp.send();
}

function ViewUpdateAllPage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var updatehtml = xmlHttp.responseText;
            var updateNotice = document.createElement('div');
            updateNotice.id = 'updateNoticeLayer';
            updateNotice.className = 'cover _cover';
            updateNotice.style.cssText = 'overflow-y: scroll;';
            document.body.appendChild(updateNotice);
            document.getElementById('updateNoticeLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="write cover_content cover_center" data-kant-group="wrt" data-part-name="view"><div class="_layerWrapper layer_write"><div class="section _dropZone account_modify"><div class="writing"><div class="inp_contents" data-part-name="editor"><strong class="subtit_modify subtit_enhanced">\' Enhanced 업데이트 내역</strong><div style="word-break: break-all">' + updatehtml + '</div></div></div><div></div><div class="inp_footer"><div class="bn_group"> <a href="#" class="_postBtn btn_com btn_or" id="enhancedAllUpdateNoticeOK"><em>알겠어용</em></a></div></div></div></div><div></div></div></div>';
        }
    }
    xmlHttp.open("GET", resourceURL + "update_notice/update_notice_all.html");
    xmlHttp.send();
}

function ViewDetailNotFriendArticle()
{
    var detail = document.getElementsByClassName("_btnViewDetailInShare");
    for (var i = 0; i < detail.length; i++)
    {
        if (detail[i].innerText == "...더보기")
        {
            detail[i].href = "javascript:void(0);";
            detail[i].className = "_btnViewDetailNotFriend";
        }
    }
}

function LoadCommonEvents()
{
    //Add user to block list when block.
    $(document).on('click', 'a[data-kant-id="1391"]', function(){
        $(document).on('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]', function(){
            var splittedURL = $(location).attr('href').split('/');
            var bannedUserID = splittedURL[splittedURL.length - 1];
            blockedList.add(bannedUserID);
            $(document).off('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]');
        });
    });
    //Delete user to block list when unblock.
    $(document).on('click', 'a[data-kant-id="1392"]', function(){
        var splittedURL = $(location).attr('href').split('/');
        var bannedUserID = splittedURL[splittedURL.length - 1];
        blockedList.delete(bannedUserID);
        $(document).off('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]');
    });
    //Delete user to block list when unblock in settings page.
    $(document).on('click', 'a[data-kant-id="845"]', function() {
        var userIdx = $('a[data-kant-id="845"]').index(this);
        var userID = $('a[data-kant-id="844"]').eq(userIdx).parent().attr('data-model');
        blockedList.delete(userID);
    });

    $('body').on('click', '#enhancedBtnCancelBlockString', function() {
        document.getElementById("banStringLayer").remove();
    });

    $('body').on('click', '#enhancedBtnCancelBlockString', function() {
        document.getElementById("banStringLayer").remove();
    });

    $('body').on('click', '._btnViewDetailNotFriend', function() {
        this.parentElement.parentElement.getElementsByClassName("txt_wrap")[0].getElementsByClassName("_content")[0].style.cssText = "overflow: hidden;";
        this.style.display = 'none';
    });

    $(document).on('keydown', '._editable', function(e) {
        if (GetValue("enhancedEarthquake", 'false') == 'true') {
            $('div[data-part-name="writing"]').addClass("shake_text");
            $('.layer_write').addClass("shake_text");
            VisibleEnhancedPowerModeCount();
        }
        if (GetValue("enhancedBlink", 'false') == 'true') {
            document.getElementById("contents_write").classList.add("blink_text");
        }
    });

    $(document).on('keydown', '[id^=comt_view]', function(e) {
        if (GetValue("enhancedEarthquake", 'false') == 'true') {
            if ($(e.target).parents('._commentWriting').length > 0) {
                $(e.target).parents('._commentWriting').addClass("shake_text");
                VisibleEnhancedPowerModeCount();
            }
            //$('._commentWriting').addClass("shake_text");
        }
        // if (GetValue("enhancedBlink", 'false') == 'true') {
        //     $('#contents_write').addClass("blink_text");
        // }
    });

    $(document).on('keyup', '._editable', function() {
        $('div[data-part-name="writing"]').removeClass("shake_text");
        $('.layer_write').removeClass("shake_text");
        document.getElementById("contents_write").classList.remove("blink_text");
        //StopEnhancedPowerModeShake();
    });

    $(document).on('keyup', '[id^=comt_view]', function() {
        $('._commentWriting').removeClass("shake_text");
        //$('#contents_write').removeClass("blink_text");
        //StopEnhancedPowerModeShake();
    });

    //$('body').on('input', '#contents_write', function() {
        //catEffect.pause();
        //catEffect.currentTime = 0;
        //setTimeout(() => null, 1);
        //catEffect.play();
    //});
}

function VisibleEnhancedPowerModeCount()
{
    powerComboCnt += 1;
    powerComboTimeCnt = 0;

    document.getElementById("enhancedPowerModeScore").style.visibility = 'visible';
    document.getElementById("enhancedPowerModeScore").classList.add("enhanced_power_mode_score_enable");
    document.getElementById("enhancedPowerModeScore").innerText = "COMBO " + powerComboCnt;
    if (powerComboCnt > 100 && powerComboCnt < 300)
    {
        document.getElementById("enhancedPowerModeScore").classList.add("shake_text_s");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_l");
    }
    else if (powerComboCnt > 300 && powerComboCnt < 500)
    {  
        document.getElementById("enhancedPowerModeScore").classList.add("shake_text");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_s");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_l");
    }
    else if (powerComboCnt > 500)
    {
        document.getElementById("enhancedPowerModeScore").classList.add("shake_text_l");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_s");
    }
}

function InvisibleEnhancedPowerModeCount()
{
    powerComboCnt = 0;
    document.getElementById("enhancedPowerModeScore").style.visibility = 'hidden';
    document.getElementById("enhancedPowerModeScore").classList.remove("enhanced_power_mode_score_enable");
    StopEnhancedPowerModeShake();
}

function StopEnhancedPowerModeShake()
{
    document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_s");
    document.getElementById("enhancedPowerModeScore").classList.remove("shake_text");
    document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_l");
}

function LoadSettingsPageEvents()
{
    $(document).on('click', '#enhancedBtnOK', function() {
        SetValue('enhancedFontName', document.getElementById("enhancedTxtFontName").value);
        SetValue('enhancedFontCSS', document.getElementById("enhancedTxtFontCSS").value);
        SetFont();
        SetValue('enhancedFontSize', document.getElementById('enhancedTxtFontSize').value);
        SetFontSize();
        SetValue('enhancedNotifyTime', document.getElementById('enhancedTxtNotifyTime').value);
        CloseSettingsPage();
    });

    $(document).on("change",'input[name="enhancedSelectTheme"]',function(){
        if (GetValue('enhancedSystemTheme', 'true') == 'false') {
            var theme = $('[name="enhancedSelectTheme"]:checked').val();
            SetValue("enhancedSelectTheme", theme);
            ChangeTheme(theme);
        }
    });

    $(document).on("change",'select[name="enhancedSelectDarkStyle"]',function(){
        var styleName = document.getElementById("enhancedOptionDarkTheme").value;
        var authorIdx = document.getElementById("enhancedOptionDarkTheme").selectedIndex;
        var authorEl = document.getElementById("themeAuthor");
        var authorLink = jThemes.themes[authorIdx].url;
        authorEl.innerText = jThemes.themes[authorIdx].author;
        authorEl.href = authorLink;
        SetValue("enhancedDarkThemeStyle", styleName);
        SetDarkThemeStyle(styleName);
    });

    $(document).on("change",'input[name="enhancedSelectDiscordMention"]',function(){
        var useMention = $('[name="enhancedSelectDiscordMention"]:checked').val();
        SetValue("enhancedDiscordMention", useMention);
        if (useMention == 'true')
        {
            GetMyID();
        }
    });

    $(document).on("change",'input[name="enhancedUseSystemTheme"]',function(){
        if (document.getElementById("enhancedSystemTheme").checked) {
            SetValue('enhancedSystemTheme', 'true');
            var systemTheme = GetOSTheme();
            var currentTheme = GetValue('enhancedSelectTheme', 'dark');
            if (systemTheme != currentTheme) {
                SetValue('enhancedSelectTheme', systemTheme);
                ChangeTheme(systemTheme);
            }
        } else {
            SetValue('enhancedSystemTheme', 'false');
        }
    });

    $(document).on('click', '#enhancedFontNanum', function() {
        var fontName = "나눔고딕";
        var fontCSS = "";
        document.getElementById("enhancedTxtFontName").value = fontName;
        document.getElementById("enhancedTxtFontCSS").value = fontCSS;
        SetValue('enhancedFontName', fontName);
        SetValue('enhancedFontCSS', fontCSS);
    });

    $(document).on('click', '#enhancedFontNoto', function() {
        var fontName = "Noto Sans KR";
        var fontCSS = "https://fonts.googleapis.com/earlyaccess/notosanskr.css";
        document.getElementById("enhancedTxtFontName").value = fontName;
        document.getElementById("enhancedTxtFontCSS").value = fontCSS;
        SetValue('enhancedFontName', fontName);
        SetValue('enhancedFontCSS', fontCSS);
    });

    $(document).on('click', '.close_btn_cls', function() {
        CloseSettingsPage();
    });

    $(document).on('click', '#enhancedBtnBackupFriendsList', function() {
        BackupFriendsList();
    });

    $(document).on('click', '#enhancedBtnBackupBannedUserList', function() {
        BackupBannedUserList();
    });

    $(document).on('click', '#enhancedBtnUpdateInfo', function() {
        ViewUpdateAllPage();
    });

    $(document).on('click', '#enhancedBtnDeleteFriendConfirm', function() {
        DeleteFriendsConfirm();
    });

    $(document).on('click', '#deleteFriendConfirmCancel', function() {
        document.getElementById("deleteLayer").remove();
    });

    $(document).on('click', '#deleteFriendConfirmOK', function() {
        document.getElementById("deleteLayer").remove();
        DeleteFriendsReConfirm();
    });

    $(document).on('click', '#deleteFriendReConfirmCancel', function() {
        document.getElementById("deleteLayer").remove();
    });

    $(document).on('click', '#deleteFriendReConfirmOK', function() {
        LoadForDeleteFriends();
    });

    $(document).on("change",'input[name="enhancedSelectNotifyUse"]',function(){
        var changed = $('[name="enhancedSelectNotifyUse"]:checked').val();
        SetValue("enhancedNotify", changed);
        if (GetValue("enhancedNotify", "false") == "true")
        {
            Notification.requestPermission();
        }
    });

    $(document).on("change",'input[name="enhancedSelectNotifySoundUse"]',function(){
        var changed = $('[name="enhancedSelectNotifySoundUse"]:checked').val();
        SetValue("enhancedNotifySound", changed);
    });

    $(document).on("change",'input[name="enhancedSelectDownloadVideo"]',function(){
        var changed = $('[name="enhancedSelectDownloadVideo"]:checked').val();
        SetValue("enhancedDownloadVideo", changed);
    });

    $(document).on("change",'input[name="enhancedSelectHideChannelButton"]',function(){
        var changed = $('[name="enhancedSelectHideChannelButton"]:checked').val();
        SetValue("enhancedHideChannelButton", changed);
        HideChannelButton();
    });

    $(document).on("change",'input[name="enhancedSelectHideLogo"]',function(){
        var changed = $('[name="enhancedSelectHideLogo"]:checked').val();
        SetValue("enhancedHideLogo", changed);
    });

    $(document).on("change",'input[name="enhnacnedSelectHideMemorize"]',function(){
        var changed = $('[name="enhnacnedSelectHideMemorize"]:checked').val();
        SetValue("enhancedHideMemorize", changed);
    });

    $(document).on("change",'input[name="enhancedSelectRecommendFriend"]',function(){
        var changed = $('[name="enhancedSelectRecommendFriend"]:checked').val();
        SetValue("enhancedHideRecommendFriend", changed);
    });

    $(document).on("change",'input[name="enhancedSelectEmoticonSize"]',function(){
        var size = $('[name="enhancedSelectEmoticonSize"]:checked').val();
        SetValue("enhancedEmoticonSize", size);
        SetEmoticonSize();
    });

    $(document).on("change",'input[name="enhancedSelectKittyMode"]',function(){
        var changed = $('[name="enhancedSelectKittyMode"]:checked').val();
        SetValue("enhancedKittyMode", changed);
        MoveKitty();
    });

    $(document).on("change",'input[name="enhancedSelectBlockUser"]',function(){
        var isEnhancedBlock = $('[name="enhancedSelectBlockUser"]:checked').val();
        SetValue("enhancedBlockUser", isEnhancedBlock);
    });

    $(document).on("change",'input[name="enhancedSelectEarthquake"]',function(){
        var changed = $('[name="enhancedSelectEarthquake"]:checked').val();
        SetValue("enhancedEarthquake", changed);
    });

    $(document).on("change",'input[name="enhancedSelectBlink"]',function(){
        var changed = $('[name="enhancedSelectBlink"]:checked').val();
        SetValue("enhancedBlink", changed);
    });

    $(document).on("change",'input[name="enhancedSelectBlockArticleAll"]',function(){
        var changed = $('[name="enhancedSelectBlockArticleAll"]:checked').val();
        SetValue("enhancedBlockArticleAll", changed);
    });

    $('body').on('click', '#enhancedUpdateNoticeOK', function() {
        document.getElementById("updateNoticeLayer").remove();
        EnableScroll();
    });

    $('body').on('click', '#enhancedAllUpdateNoticeOK', function() {
        document.getElementById("updateNoticeLayer").remove();
    });

    $('body').on('click', '#enhancedBtnBlockString', function() {
        ShowBlockStringPage();
    });

    $('body').on('click', '#enhancedKittyImage', function() {
        if (GetValue('enhancedKittyMode', 'none') == 'verycute') {
            catEffect.play();
        }
    });
}

function LoadForDeleteFriends() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            jsonMyFriends = JSON.parse(xmlHttp.responseText);

            var deleteCountLayer = document.createElement('div');
            deleteCountLayer.id = "deleteCountLayer";
            deleteCountLayer.className = "cover _cover";
            document.body.appendChild(deleteCountLayer);
            document.getElementById('deleteCountLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;"><div class="inner_toast_layer _toastBody"><p class="txt _dialogText" id="deleteFriendText">친구 삭제 중... (0 / 0)</p><div>※정책상 삭제 속도는 느리게 설정되었습니다.<br>취소하시려면 새로고침 하세요.</div><div class="btn_group"><a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteFriendComplete" style="display: none;"><span>확인</span></a> </div></div></div></div>';
            //deletedFriendCount = 0;
            DeleteFriends();
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/friends");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function DeleteFriendsConfirm()
{
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "deleteLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('deleteLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div>' + 
                                                        '<div class="cover_wrapper" style="z-index: 201;">' + 
                                                        '<div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;">' +
                                                                '<div class="inner_toast_layer _toastBody">' + 
                                                                    '<p class="txt _dialogText">정말 친구~를 전체 삭제하시겠습니까?<br>취소하시려면 새로고침해야 합니다.</p>' +
                                                                    '<div class="btn_group">' + 
                                                                        '<a href="#" class="btn_com btn_wh _dialogCancel _dialogBtn" id="deleteFriendConfirmCancel"><span>취소</span></a>' + 
                                                                        '<a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteFriendConfirmOK"><span>확인</span></a>' +
                                                                    '</div>' +
                                                                '</div>' +
                                                            '</div>' +
                                                        '</div>';
}

function DeleteFriendsReConfirm()
{
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "deleteLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('deleteLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div>' + 
                                                        '<div class="cover_wrapper" style="z-index: 201;">' + 
                                                        '<div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;">' +
                                                                '<div class="inner_toast_layer _toastBody">' + 
                                                                    '<p class="txt _dialogText">정말 친구를 전체 삭제하시겠습니까?<br>진행하면 되돌릴 수 없습니다!<br>다시 한 번 신중하게 생각해주세요!</p>' +
                                                                    '<div class="btn_group">' + 
                                                                        '<a href="#" class="btn_com btn_wh _dialogCancel _dialogBtn" id="deleteFriendReConfirmCancel"><span>취소</span></a>' + 
                                                                        '<a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteFriendReConfirmOK"><span>확인</span></a>' +
                                                                    '</div>' +
                                                                '</div>' +
                                                            '</div>' +
                                                        '</div>';
}

function DeleteFriends() {
    setTimeout(function() {
        if (deletedFriendCount < jsonMyFriends.profiles.length) {
            _DeleteFriend(jsonMyFriends.profiles[deletedFriendCount]["id"]);
            document.getElementById('deleteFriendText').innerHTML = '친구 삭제 중... (' + (deletedFriendCount + 1) + ' / ' + jsonMyFriends.profiles.length + ')';
            deletedFriendCount++;
            DeleteFriends();
        } else {
            document.getElementById('deleteFriendText').innerHTML = '전체 삭제 완료';
            document.getElementById('deleteFriendComplete').style.display = 'block';
        }
    }, 750);
}

function _DeleteFriend(userid) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            //Deleted Message;
        }
    }
    xmlHttp.open("DELETE", "https://story.kakao.com/a/friends/" + userid);
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function HideRecommendFriend()
{
    var el = document.getElementsByClassName("tit_widgets");
    for (var i = 0; i < el.length; i++)
    {
        if (el[i].innerText == '추천친구')
        {
            el[i].parentElement.style.display = "none";
        }
    }
}

function CreateBlockStringList() {
    var banStrings = GetValue('enhancedBlockStringList', '').split("\n");
    var blockedStringSet = new Set();
    for (var i = 0; i < banStrings.length; i++) {
        if (banStrings[i] == "") {
            continue;
        } else {
            blockedStringSet.add(banStrings[i]);
       }
    }

    blockedStringList = Array.from(blockedStringSet);
}

function SetFont()
{
    SetCSS("enhancedFontCSS", "body, button, input, select, td, textarea, th {font-family: '" + GetValue('enhancedFontName', 'Noto Sans KR') + "', 'Nanum Gothic' !important;}");
    SetCSS("enhancedFontURLCSS", "@import url(" + GetValue('enhancedFontCSS', 'https://fonts.googleapis.com/earlyaccess/notosanskr.css') + ");");
}

function SetFontSize() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var lines = xmlHttp.responseText.split("\n");
            for (var i = 0; i < lines.length; i++) {

                var originSize = parseInt(lines[i].split("font-size: ")[1].split("px")[0]);
                var changedSize = originSize + parseInt(GetValue('enhancedFontSize', '0'));
                var modifiedCSS = lines[i].replace( originSize , changedSize);
                SetCSS('enhancedFontSizeCSS' + i, modifiedCSS);
            }
        }
    }
    xmlHttp.open("GET", resourceURL + "css/font_size.css");
    xmlHttp.send();
}

function GetOSTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    } else {
        return 'light';
    }
}

function SetDarkThemeStyle(styleName) {
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
    xmlHttp.open("GET", resourceURL + "theme_colors/" + styleName + ".css");
    xmlHttp.send();
}

function LoadThemeList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            jThemes = JSON.parse(xmlHttp.responseText);
            for (var i = 0; i < jThemes.themes.length; i++)
            {
                var opTheme = document.getElementById("enhancedOptionDarkTheme").options;
                var op = new Option();
                op.value = jThemes.themes[i].id;
                op.text = jThemes.themes[i].name;

                opTheme.add(op);
            }

            var selectedDarkStyle = GetValue('enhancedDarkThemeStyle', 'discord');
            document.getElementById("enhancedOptionDarkTheme").value = selectedDarkStyle;
            var authorIdx = document.getElementById("enhancedOptionDarkTheme").selectedIndex;
            var authorEl = document.getElementById("themeAuthor");
            var authorLink = jThemes.themes[authorIdx].url;
            authorEl.innerText = jThemes.themes[authorIdx].author;
            authorEl.href = authorLink;
            SetDarkThemeStyle(selectedDarkStyle);
            
        }
    }
    xmlHttp.open("GET", resourceURL + "theme_colors/themes.json");
    xmlHttp.send();
}

function LoadDarkThemeCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var darkcss = xmlHttp.responseText;
            SetCSS("enhancedDarkCSS", darkcss);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/darktheme.css");
    xmlHttp.send();
}

function LoadEnhancedCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var darkcss = xmlHttp.responseText;
            SetCSS('enhancedCSS', darkcss);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/enhanced.css");
    xmlHttp.send();
}

function ChangeTheme(styleName)
{
    if (styleName == 'dark')
    {
        LoadDarkThemeCSS();
    }
    else
    {
        $('style').remove(); //Remove Dark Theme CSS
        SetFont();
        SetFontSize();
        //SettingsV2 //Reload font css changed
        SetCSS('enhancedLightLogo', '.head_story .tit_kakaostory .link_kakaostory { background: url(\''+ resourceURL + 'images/logo_kseh.png\'); } ');
    }
    //hide original logo
    var hideOriginLogo = '.head_story .tit_kakaostory .logo_kakaostory { width: 0px !important; }'
    + '.head_story .tit_kakaostory .link_kakaostory { width: 144px !important; }';
    SetCSS('enhancedHideLogoCSS', hideOriginLogo);
    LoadEnhancedCSS();
}

function GetLatestNotify() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonNoty = JSON.parse(xmlHttp.responseText);
            var notyID = jsonNoty[0]["id"];
            var notyMessage = jsonNoty[0]["message"];
            var notyScheme = jsonNoty[0]["scheme"];
            var notyContent = jsonNoty[0]["content"];
            var notyURL = String(notyScheme).split("/");
            notyURL = notyURL[notyURL.length-1].replace(".", "/");
            if (String(notyID) != GetValue('enhancedLatestNotyID', ''))
            {
                SetValue('enhancedLatestNotyID', String(notyID));
                if (String(jsonNoty[0]["is_new"]) == 'false') {
                    return;
                }
                if (notyContent == undefined) {
                    notyContent = ' ';
                }
                SetNotify(String(notyContent), String(notyMessage), String(notyURL));
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

function SetNotify(content, title_, url)
{
    var options = {
        body: content,
        icon: 'https://i.imgur.com/FSvg18g.png',
        silent: (GetValue('enhancedNotifySound', 'true') === 'true'),
        onclick: function() {
            space.Router.navigate("/" + url);
        }
    }

    var noty = new Notification(title_, options);
}

// GM version
// function SetNotify(content, title_, url) {
//     GM_notification ({
//         text: content,
//         title: title_,
//         image: 'https://i.imgur.com/FSvg18g.png',
//         highlight: false,
//         silent: (GetValue('enhancedNotifySound', 'true') === 'true'),
//         timeout: 5000,
//         onclick: function () {
//             space.Router.navigate("/" + url);
//         }
//     });
// }

function DEPRECATEDSaveText(str, fileName) {
    var blob = new Blob([str], { type: "text/plain;charset=utf-8" });
    saveAs(blob, fileName);
}

function SaveText(text, name, type, btnID) {
    var btnEl = document.getElementById(btnID);
    var file = new Blob([text], {type: type});
    btnEl.href = URL.createObjectURL(file);
    btnEl.download = name;
}

function BackupFriendsList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonFriends = JSON.parse(xmlHttp.responseText);
            var friendsText = '';
            for (var i = 0; i < jsonFriends.profiles.length; i ++) {
                friendsText = friendsText + String(jsonFriends.profiles[i]["display_name"]) + " : " + String(jsonFriends.profiles[i]["id"]) + '\n';
            }
            document.getElementById("enhancedFriendsBackupDescription").innerHTML = "※백업 데이터가 생성 되었습니다! 한번 더 클릭하여 다운로드를 진행하세요.<br>만약 다운로드가 진행되지 않을 경우, 우클릭하여 다른 이름으로 링크 저장을 사용해보세요.<br>다시 새로운 정보로 다운로드 하시려면, 새로고침이 필요합니다.";
            SaveText(friendsText, "친구목록백업.txt", "text/plain", "enhancedBtnBackupFriendsList");
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/friends");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function BackupBannedUserList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonBannedUsers = JSON.parse(xmlHttp.responseText);
            var bannedUsersText = '';
            for (var i = 0; i < jsonBannedUsers.length; i ++) {
                bannedUsersText = bannedUsersText + String(jsonBannedUsers[i]["display_name"]) + " : " + String(jsonBannedUsers[i]["id"]) + '\n';
            }
            document.getElementById("enhancedBannedUserBackupDescription").innerHTML = "※백업 데이터가 생성 되었습니다! 한번 더 클릭하여 다운로드를 진행하세요.<br>만약 다운로드가 진행되지 않을 경우, 우클릭하여 다른 이름으로 링크 저장을 사용해보세요.<br>다시 새로운 정보로 다운로드 하시려면, 새로고침이 필요합니다.";
            SaveText(bannedUsersText, "차단목록백업.txt", "text/plain", "enhancedBtnBackupBannedUserList");
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/bans");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function AddDownloadVideoButton() {
    var videoControl = document.getElementsByClassName("mejs-controls");
    for (var i = 0; i < videoControl.length; i++) {
        var checkDownExists = videoControl[i].getElementsByClassName("mejs-button mejs-videodown-button");
        if (checkDownExists.length == 0) {
            var videoURL = videoControl[i].parentElement.getElementsByClassName("mejs-mediaelement")[0].getElementsByClassName("mejs-kakao")[0].getAttribute("src");
            var downloadBtnEl = document.createElement('div');
            downloadBtnEl.id = 'videodown';
            downloadBtnEl.className = 'mejs-button mejs-videodown-button';
            videoControl[i].appendChild(downloadBtnEl);
            videoControl[i].getElementsByClassName("mejs-button mejs-videodown-button")[0].innerHTML = '<button type="button" aria-controls="mep_2" title="Download" onclick="window.open(\'' + videoURL + '\')" aria-label="Download"></button>';
        }
    }
}

function HideChannelButton() {
    var isHidden = GetValue("enhancedHideChannelButton", "true");
    var val = isHidden == "true" ? 'none' : 'block';
    document.getElementsByClassName("storyteller_gnb")[0].style.display = val;
    document.getElementsByClassName("group_gnb")[0].style.display = val;
}

function HideMemorize() {
    var memorize = document.getElementsByClassName("section section_time");
    for (var i = 0; i < memorize.length; i++) {
        memorize[i].parentElement.style.display = 'none';
    }
}

function SetEmoticonSize()
{
    var sSize = GetValue("enhancedEmoticonSize", 'small');
    if (sSize == "small")
    {
        SetCSS('enhancedCommentEmoticonSize', '.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 64px !important; height: 64px !important; }');
        SetCSS('enhancedArticleEmoticonSize', '.fd_cont .txt_wrap .kakao_emoticon { width: 84px !important; height: 84px !important; }');
        SetCSS('enhancedWriteEmoticonSize', '.write .inp_contents .sticon { height: 84px !important; }')
    } else if (sSize == "middle")
    {
        SetCSS('enhancedCommentEmoticonSize', '.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 96px !important; height: 96px !important; }');
        SetCSS('enhancedArticleEmoticonSize', '.fd_cont .txt_wrap .kakao_emoticon { width: 96px !important; height: 96px !important; }');
        SetCSS('enhancedWriteEmoticonSize', '.write .inp_contents .sticon { height: 96px !important; }')
    } else
    {
        SetCSS('enhancedCommentEmoticonSize', '.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 128px !important; height: 128px !important; }');
        SetCSS('enhancedArticleEmoticonSize', '.fd_cont .txt_wrap .kakao_emoticon { width: 128px !important; height: 128px !important; }');
        SetCSS('enhancedWriteEmoticonSize', '.write .inp_contents .sticon { height: 128px !important; }')
    }
}

function SetEmoticonSelectorSize()
{
    var sSize = GetValue("enhancedEmoticonSize", 'small');
    console.log(sSize)

    if (sSize == "middle")
    {
        SetCSS('enhancedEmoticonSelectorItemSize', '.emoticon_keyboard .emt_il .emt_il_item { width: 96px !important; height: 96px !important; } .emoticon_keyboard .emt_il img { width: 96px !important; height: 96px !important; }')
        SetCSS('enhancedEmoticonSelectorBoxSize', '.write .section .inp_footer .emoticon_layer { width: 500px !important; } .emoticon_keyboard .emoticon_item_list { height: 350px !important; } .emoticon_layer { width: 500px !important; }')
    }
    else if (sSize == "big")
    {
        SetCSS('enhancedEmoticonSelectorItemSize', '.emoticon_keyboard .emt_il .emt_il_item { width: 128px !important; height: 128px !important; } .emoticon_keyboard .emt_il img { width: 128px !important; height: 128px !important; }')
        SetCSS('enhancedEmoticonSelectorBoxSize', '.write .section .inp_footer .emoticon_layer { width: 630px !important; } .emoticon_keyboard .emoticon_item_list { height: 450px !important; } .emoticon_layer { width: 630px !important; }')
    }
    
}

function HideBlockedUserComment() {
    var comments = document.getElementsByClassName("_commentContent");
    for (var i = 0; i < comments.length; i++) {
        var bannedID = comments[i].getElementsByClassName("txt")[0].getElementsByTagName("p")[0].getElementsByTagName("a")[0].getAttribute("href").replace("/", "");

        if (blockedList.has(bannedID) == true) {
            comments[i].parentElement.style.display = 'none';
            /*
            comments[i].parentElement.remove();
            i -= 1; // only for remove()
            */
        }
    }
}

function HideBlockedUserArticle()
{
    var articles = document.getElementsByClassName("section _activity");
    for (var i = 0; i < articles.length; i++)
    {
        if (articles[i].getElementsByClassName("fd_cont _contentWrapper").length <= 0) //this is not article
        {
            continue;
        }

        var content = articles[i].getElementsByClassName("fd_cont _contentWrapper")[0];

        if (content.getElementsByClassName("share_wrap share_wrap_v2").length <= 0) //this is not shared article
        {
            continue;
        }

        var shared_content = content.getElementsByClassName("share_wrap share_wrap_v2")[0];
        
        if (shared_content.getElementsByClassName("pf") <= 0) //???
        {
            continue;
        }

        var profile_info = shared_content.getElementsByClassName("pf")[0];
        var bannedID = profile_info.getElementsByTagName("a")[0].getAttribute("href").replace("/", "");

        if (blockedList.has(bannedID) == true) {

            //not used.
            /*
            if (GetValue('enhancedBlockArticleAll', 'true') == 'false')
            {
                shared_content.style.display = 'none';
                continue;
            }
            */

            articles[i].style.display = 'none';
            /*
            comments[i].parentElement.remove();
            i -= 1; // only for remove()
            */
        }

    }

    var bundle_articles = document.getElementsByClassName("section section_bundle");
    for (var i = 0; i < bundle_articles.length; i++)
    {
        if (bundle_articles[i].getElementsByClassName("fd_cont").length <= 0) //this is not valid bundled article
        {
            continue;
        }

        var content = bundle_articles[i].getElementsByClassName("fd_cont")[0];

        if (content.getElementsByClassName("_bundleContainer").length <= 0) //this is not valid bundled article
        {
            continue;
        }

        if (content.querySelector("div[data-part-name='originalActivity']") == null) //this is not valid bundled article
        {
            continue;
        }

        var profile_info = content.querySelector("div[data-part-name='originalActivity']").getElementsByClassName("pf")[0];
        var bannedID = profile_info.getElementsByTagName("a")[0].getAttribute("href").replace("/", "");

        if (blockedList.has(bannedID) == true) {

            //not used.
            /*
            if (GetValue('enhancedBlockArticleAll', 'true') == 'false')
            {
                shared_content.style.display = 'none';
                continue;
            }
            */

            bundle_articles[i].style.display = 'none';
            /*
            comments[i].parentElement.remove();
            i -= 1; // only for remove()
            */
        }

    }
}

function GetBlockedUsers() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonBlocked = JSON.parse(xmlHttp.responseText);
            for (var i = 0; i < jsonBlocked.length; i ++) {
                blockedList.add(String(jsonBlocked[i]["id"]));
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

function ShowBlockStringPage() {
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "banStringLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('banStringLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="dim_ly cover_content cover_center" data-kant-group="msg.w"><div class="ly_con message" style="top:84px"><div class="_container box_writing"><fieldset><legend class="tit_message">문자열 차단</legend><div class="box_from _receiverWrap" data-model="c56736" data-part-name="receiver"><div class="_suggestionWrap friends_search" style="display: block;"><label class="_suggestionInputPlaceholder lab_from" for="messageReceiver">차단할 문자열을 한줄에 하나씩 입력하세요.</label></div></div><div class="box_write color_11" data-model="c56736" data-part-name="writing"><div class="editable"><span class="write_edit" style="top: 162px;"><textarea class="tf_write _texxtarea" id="textBlockString" style="font-size: 22px; line-height: 26px; height: 370px;"></textarea></span> <span class="edit_gap"></span></div></div><div class="box_media menu_on"><div class="bn_group"><a href="#" class="btn_com _sendMessage btn_or" id="enhancedBtnSaveBlockString" data-kant-id="574"><em>저장</em></a></div></div><a href="#" class="link_close _hideWritingView" id="enhancedBtnCancelBlockString"><span class="ico_ks ico_close">취소</span></a></fieldset></div></div></div></div>';
    document.getElementById("textBlockString").value = GetValue('enhancedBlockStringList', '');
}

function HideBlockStringArticle() {
    var articles = document.getElementsByClassName("txt_wrap");
    for (var i = 0; i < articles.length; i++) {
        var articleText = articles[i].innerText.toLowerCase();
        for (var j = 0; j < blockedStringList.length; j++) {
            if (articleText.includes(blockedStringList[j].toLowerCase())) {
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

function MoveKitty()
{
    var hasKitty = document.getElementById("enhancedKittyImage") != null;
    if (GetValue('enhancedKittyMode', 'none') == 'none')
    {
        if (hasKitty)
        {
            document.getElementById("enhancedKittyImage").remove();
        }
        return;
    }
    if (!hasKitty)
    {
        var kitty = document.createElement('img');
        kitty.id = 'enhancedKittyImage';
        kitty.className = 'enhanced_kitty';
        kitty.src = resourceURL + "images/cat.gif";
        document.getElementById("kakaoHead").insertBefore(kitty, document.getElementById("kakaoHead").firstChild);
        //document.getElementById("kakaoHead").appendChild(kitty);
    }
}

function GetValue(key, defaultValue) {
    var value = localStorage[key];
    if (value == "" || value == null) {
        SetValue(key, defaultValue);
        value = defaultValue;
    }
    return value;
}

function SetValue(key, value)
{
    return localStorage[key]=value;
}

function SetCSS(elID, cssText)
{
    //GM_addStyle(cssText);
    var elem = document.createElement('style');
    elem.id = elID;
    document.head.appendChild(elem);
    document.getElementById(elID).innerHTML = cssText;
}

function DownloadText(text, name, type) {
    var a = document.getElementById("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
}

function HideLogo()
{
    if (document.getElementsByTagName('title')[0].innerText == "NAVER")
    {
        return;
    }

    document.getElementsByTagName('title')[0].innerText = "NAVER"
    var link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = resourceURL + "images/naver.ico";
}

function AddPowerModeScoreElements()
{
    var header = document.querySelectorAll('[data-part-name="gnbMenu"]')[0];
    var scoreElement = document.createElement('div');
    scoreElement.id = 'enhancedPowerModeScore';
    scoreElement.className = 'enhanced_power_mode_score';
    scoreElement.innerText = 'COMBO 120';
    scoreElement.style.visibility = 'hidden';
    header.appendChild(scoreElement);
}

//enhancedDark2TestCSS
function SetCSS2(elID, cssText)
{
    //GM_addStyle(cssText);
    var elem = document.createElement('style');
    elem.id = elID;
    document.head.appendChild(elem);
    document.getElementById(elID).innerHTML = cssText;
}


(function() {
    InitEnhancedSettingsPage();
    LoadCommonEvents();
    GetBlockedUsers();

    SetEmoticonSelectorSize();

    setTimeout(() => AddEnhancedMenu(), 1000);
    setTimeout(() => MoveKitty(), 1000);
    setTimeout(() => GetMyID(), 3000); //for discord style mention feature
    setTimeout(() => HideChannelButton(), 500); //hide channel and teller buttons
    setTimeout(() => AddPowerModeScoreElements(), 1000); //power mode

    setInterval(function() {
        if (GetValue('enhancedNotify', 'false') == 'true')
        {
            notyTimeCount += 1;
            if (notyTimeCount >= parseInt(GetValue('enhancedNotifyTime', '20')) * 10)
            {
                notyTimeCount = 0;
                GetLatestNotify();
            }
        }
        if (GetValue("enhancedDiscordMention", 'false') == 'true')
        {
            HighlightCommentLikeDiscord();
        }

        if (GetValue('enhancedDownloadVideo', 'false') == 'true') {
            AddDownloadVideoButton();
        }

        if (GetValue('enhancedHideMemorize', 'true') == 'true') {
            HideMemorize();
        }

        if (GetValue('enhancedBlockUser', 'true') == 'true')
        {
            HideBlockedUserComment();
            HideBlockedUserArticle();
        }

        if (GetValue('enhancedHideRecommendFriend', 'false') == 'true')
        {
            HideRecommendFriend();
        }

        HideBlockStringArticle();

        ViewDetailNotFriendArticle();

        RemoveRecommendFeed();

        if (GetValue('enhancedHideLogo', 'false') == 'true')
        {
            setTimeout(() => HideLogo(), 750);
        }

        if (GetValue('enhancedEarthquake', 'false') == 'true')
        {
            powerComboTimeCnt += 1;
            if (powerComboTimeCnt > 50)
            {
                InvisibleEnhancedPowerModeCount();
            }
        }

    }, 100);
})();